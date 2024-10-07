import Chains from '@/libs/chains/server/apis'
import uploadToIPFS from '@/libs/utils/uploadToIPFS'
import { getOrganizationById, getInitiativeById, getUserByWallet, getContract, createNFT } from '@/libs/utils/registry'
import { getTransactionInfo } from '@/libs/chains/txinfo'
import config from '@/app/config'

interface transactionInfo {
  success?: boolean
  error?: string
  account?: string
  destination?: string
  destinationTag?: string
  amount?: string
}

// POST /api/nft/mint {paymentId}
// On donation:
//   Upload metadata to permanent storage
//   Mint nft with uri:metadata and get token Id
//   Send tokenId, offerId to client
export async function POST(request: Request) {
  console.log('API MINTING...')

  try {
    const body:any = await request.json()
    const {txid, initid, donationId, donor, destin, amount, rate} = body
    console.log('TXID', txid)
    console.log('INIT', initid)
    console.log('DONID', donationId)
    console.log('DONOR', donor)
    console.log('DESTIN', destin)
    console.log('AMOUNT', amount)
    console.log('RATE', rate)

    if(!txid){
      return Response.json({ error: 'Required txid is missing' }, {status:400})
    }

    // Get tx info
    const chain = config.blockchain.chainName || ''
    const txInfo = await Chains[chain].getTransactionInfo(txid)
    console.log('TXINFO', txInfo)
    if(!txInfo){
      return Response.json({ error: 'Transaction not found' }, {status:404})
    }
    if ('error' in txInfo) {
      console.log('ERROR', txInfo.error)
      return Response.json({ error: txInfo.error }, {status:500})
    }

    // Form data
    const created = new Date().toJSON().replace('T', ' ').substring(0, 19)
    const donorAddress = txInfo.account || ''
    const user = await getUserByWallet(donorAddress)
    const userId = user?.id || ''
  
    //return Response.json({ success: true, image: 'uriImage', metadata: 'uriMeta', tokenId: '123456', offerId: '123457'})

    // Get initiative info
    const initiative = await getInitiativeById(initid)
    //console.log('INITIATIVE', initiative)
    if(!initiative || initiative?.error) {
      console.log('ERROR', 'Initiative not found')
      return Response.json({ error: 'Initiative info not found' }, {status:500})
    }
    const initiativeId = initiative?.id || ''
    const initiativeName = initiative?.title || 'Direct Donation'

    // Get organization info
    const organization = await getOrganizationById(initiative?.organizationId)
    //console.log('ORGANIZATION', organization)
    if(!organization || organization?.error) {
      console.log('ERROR', 'Organization not found')
      return Response.json({ error: 'Organization info not found' }, {status:500})
    }
    const organizationId = organization?.id
    console.log(organizationId);
    const organizationName = organization?.name

    const network   = config.blockchain.network || ''
    const chainName = config.blockchain.chainName || ''
    const currency  = config.blockchain.coinSymbol || ''
    const amountNum = parseFloat(amount) ||  0.0
    const amountCUR = amountNum.toFixed(4)
    const amountUSD = (amountNum * rate).toFixed(4)
    const uriImage  = initiative?.imageUri || 'ipfs:QmZWgvsGUGykGyDqjL6zjbKjtqNntYZqNzQrFa6UnyZF1n'

    // Save metadata
    const metadata = {
      mintedBy: 'CFCE via Give Tron',
      created: created,
      donorAddress: donorAddress,
      organization: organizationName,
      initiative: initiativeName,
      image: uriImage,
      blockchain: chainName,
      network,
      currency,
      amount: amountCUR,
      usdValue: amountUSD
    }
    console.log('META', metadata)
    const fileId = 'meta-' + txid // unique file id
    const bytes = Buffer.from(JSON.stringify(metadata, null, 2))
    const cidMeta = await uploadToIPFS(fileId, bytes, 'text/plain')
    console.log('CID', cidMeta)
    if (!cidMeta || cidMeta.error) {
      return Response.json({ error: 'Error uploading metadata' }, {status:500})
    }
    const cid = cidMeta?.result
    const uriMeta = 'ipfs:' + cid
    console.log('URI', uriMeta)

    // Get contract
    const entity_id = initiativeId
    const chainLower = chainName.toLowerCase()
    const contract_type = 'NFTReceipt'
    const contract = await getContract(entity_id, chainLower, network, contract_type)
    console.log('CTR', contract)
    if(!contract){
      return Response.json({ error:'NFT contract not found for this organization' }, {status:500})
    }
    const contractAddress = contract[0].contract_address
    console.log('CID', contractAddress)

    // Mint NFT
    const okMint = await Chains[chain].mintNFT(contractAddress, donorAddress, uriMeta)
    console.log('Mint result', okMint)
    //return Response.json(okMint)
    
    if (!okMint || okMint.error) {
      return Response.json({ error: 'Error minting NFT' }, {status:500})
    }
    const tokenId = okMint?.tokenId

    // Save NFT data to Prisma
    const data = {
      created: new Date(),
      userId,
      donorAddress,
      organizationId,
      initiativeId,
      donationId,
      metadataUri: uriMeta,
      imageUri: uriImage,
      coinLabel: chainName,
      coinNetwork: network,
      coinSymbol: currency,
      coinValue: amountCUR,
      usdValue: amountUSD,
      tokenId: tokenId,
      status: 0
    }
    console.log('NftData', data)
    const saved = await createNFT(data)
    console.log('Saved', saved?.success)
    if (saved.success) {
      console.log('NFT saved in DB!')
    } else {
      console.error('Error saving NFT in DB!')
    }

    // Success
    console.log('Minting completed')
    console.log('RESULT', {
      success: true,
      image: uriImage,
      metadata: uriMeta,
      tokenId: tokenId
    })
    return Response.json({
      success: true,
      image: uriImage,
      metadata: uriMeta,
      tokenId: tokenId
    })

  } catch (ex:any) {
    console.error(ex)
    return Response.json({ error: ex.message }, {status:500})
  }
}
