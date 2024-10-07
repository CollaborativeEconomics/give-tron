import { TronWeb } from 'tronweb'
import { WalletProvider } from '@/types/wallet'
import { getContract } from '@/libs/utils/registry'
//import erc721 from '@/contracts/ntf721-abi.json'
import config from '@/app/config'

type Dictionary = { [key:string]:any }
type Callback = (data:Dictionary)=>void

class TronServer {
  chain = 'Tron'
  coinSymbol = 'TRX'
  network  = config.blockchain.network || ''
  provider:WalletProvider
  mainnet  = {
    id: 1000,
    name: 'Tron Mainnet',
    coinSymbol: 'TRX',
    decimals: 6,
    gasprice: '1500000000',
    explorer: 'https://tronscan.org',
    rpcurl: 'https://rpc.trongrid.io',
    wssurl: ''
  }
  testnet = {
    id: 1001,
    name: 'Tron Testnet',
    coinSymbol: 'TRX',
    decimals: 6,
    gasprice: '1500000000',
    explorer: 'https://shasta.tronscan.org',
    rpcurl: 'https://api.shasta.trongrid.io',
    wssurl: ''
  }
  sdk: TronWeb

  constructor(){
    const secret = process.env.ADMIN_WALLET_KEY || ''
    this.provider = this.network=='mainnet' ? this.mainnet : this.testnet
    this.sdk = new TronWeb({
      fullHost: this.provider.rpcurl,
      headers: { "TRON-PRO-API-KEY": process.env.RPC_PROVIDER_API_KEY },
      privateKey: secret // for signing transactions
    })
  }

  toHex(str:string){
    return '0x'+parseInt(str).toString(16)
  }

  toWei(num:number){
    const wei = 10 ** this.provider.decimals
    return num * wei
  }

  fromWei(num:number){
    const wei = 10 ** this.provider.decimals
    return num / wei
  }

  strToHex(str:string) {
    if(!str){ return '' }
    return '0x'+Buffer.from(str.toString(), 'utf8').toString('hex')
  }

  hexToStr(hex:string, encoding:BufferEncoding='utf8') {
    if(!hex){ return '' }
    return Buffer.from(hex.substr(2), 'hex').toString(encoding)
  }

  addressToHex(address:string){
    return this.sdk.address.toHex(address)
  }

  addressFromHex(address:string){
    return this.sdk.address.fromHex(address)
  }

  async fetchLedger(method:string, params:any){
    console.log('FETCH', method, params)
    console.log('URL', this.provider.rpcurl)
    let data = {id: '1', jsonrpc: '2.0', method, params}
    let body = JSON.stringify(data)
    let opt  = {method:'POST', headers:{'Content-Type':'application/json'}, body}
    console.log('OPT', opt)
    try {
      let res = await fetch(this.provider.rpcurl, opt)
      let inf = await res.json()
      console.log('INF', inf)
      return inf?.result
    } catch(ex:any) {
      console.error(ex)
      return {error:ex.message}
    }
  }

  async sendPayment(destin:string, amount:string, destinTag:string, callback:any){
    console.log(`Sending ${amount} TRX to ${destin}`)
    const secret = process.env.ADMIN_WALLET_KEY || ''
    const from = this.sdk.address.fromPrivateKey(secret) || ''
    const sun = this.sdk.toSun(parseFloat(amount)).toString()
    console.log(`${sun} SUN`)
    const trx = await this.sdk.transactionBuilder.sendTrx(destin, parseInt(sun), from)
    console.log('TRX', trx)
    const trs = await this.sdk.trx.sign(trx, secret)
    console.log('SIGN', trs)
    const result = await this.sdk.trx.sendRawTransaction(trs)
    //const txHash = await this.fetchLedger({method: 'trx_sendTransaction', params: [tx]})
    //console.log({txHash});
    //const result = await this.sdk.trx.sendTransaction(destin, Number(sun), secret)
    //const result = await this.sdk.trx.send(destin, sun) // client
    console.log('RESULT', result)
    if(callback){
      callback(result)
    } else {
      return result
    }
  }

  async mintNFT(contract:string, address: string, uri: string){
    try {
      console.log(this.chain, 'server minting NFT to', address, uri)
      const secret   = process.env.ADMIN_WALLET_KEY || ''
      const minter   = this.sdk.address.fromPrivateKey(secret)
      console.log('MINTER', minter)
      const instance = await this.sdk.contract().at(contract)
      const op = {
        callValue: 0,
        feeLimit: 100_000_000,
        shouldPollResponse: false
      }
      console.log('Minting...')
      const txId = await instance.mint(address, uri).send(op)  
      console.log('MINTED', txId)
      const tkId = await instance.totalSupply().call()  
      console.log('TOKENID', tkId)
      //const tokenId = this.sdk.toDecimal(tkId).toString()
      const tokenId = tkId.toString()
      return {success:true, tokenId, txId}
    } catch(ex:any) {
      console.error(ex)
      return {success:false, error:ex.message}
    }
  }

  async getTransactionInfo(txid:string){
    console.log('Get tx infoy', txid)
    try {
      const info = await this.sdk.trx.getTransaction(txid)
      console.log('INFO', info)
      //console.log('INFO', JSON.stringify(info,null,2))
      if(!info){ return {success:false, error:'Error fetching tx info'} }
      // @ts-ignore: Typescript sucks donkey balls
      const from   = this.sdk.address.fromHex(info.raw_data.contract[0].parameter.value.owner_address)
      // @ts-ignore: Typescript sucks donkey balls
      const destin = this.sdk.address.fromHex(info.raw_data.contract[0].parameter.value.to_address)
      // @ts-ignore: Typescript sucks donkey balls
      const amount = info.raw_data.contract[0].parameter.value.amount
      const result = {
        success: true,
        account: from,
        destination: destin,
        destinationTag: '',
        amount: this.fromWei(amount)
      }
      console.log('RES', result)
      return result
    } catch(ex:any) {
      console.error(ex)
      return {success:false, error:ex.message}
    }
  }
}

const Tron = new TronServer()

export default Tron