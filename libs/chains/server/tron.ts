//import { TronWeb } from 'tronweb'
import { TronWeb, utils as TronWebUtils, Trx, TransactionBuilder, Contract, Event, Plugin } from 'tronweb'
import { WalletProvider } from '@/types/wallet'
import erc721 from '@/contracts/ntf721-abi.json'
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
    decimals: 18,
    gasprice: '250000000',
    explorer: 'https://tronscan.org',
    rpcurl: 'https://rpc.trongrid.io',
    wssurl: ''
  }
  testnet = {
    id: 1001,
    name: 'Tron Testnet',
    coinSymbol: 'TRX',
    decimals: 18,
    gasprice: '100000000',
    explorer: 'https://shasta.tronscan.org',
    rpcurl: 'https://api.shasta.trongrid.io',
    wssurl: ''
  }
  sdk: TronWeb

  constructor(){
    this.provider = this.network=='mainnet' ? this.mainnet : this.testnet
    this.tronWeb = new TronWeb({
      fullHost: this.provider.rpcurl
      headers: { "TRON-PRO-API-KEY": process.env.RPC_PROVIDER_API_KEY },
      //privateKey: 'your private key' // for signing transactions
    })
  }

  toHex(str:string){
    return '0x'+parseInt(str).toString(16)
  }

  toWei(num:number){
    const wei = 10**this.provider.decimals
    return num * wei
  }

  fromWei(num:number){
    const wei = 10**this.provider.decimals
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

  addressToHex(address){
    return this.tronWeb.address.toHex(address)
  }

  addressFromHex(address){
    return this.tronWeb.address.fromHex(address)
  }

  async fetchLedger(method:string, params:any){
    let data = {id: '1', jsonrpc: '2.0', method, params}
    let body = JSON.stringify(data)
    let opt  = {method:'POST', headers:{'Content-Type':'application/json'}, body}
    try {
      let res = await fetch(this.provider.rpcurl, opt)
      let inf = await res.json()
      return inf?.result
    } catch(ex:any) {
      console.error(ex)
      return {error:ex.message}
    }
  }

  async sendPayment(address:string, amount:string, destinTag:string, callback:any){
    console.log('Sending payment...')
    const value = this.toWei(parseFloat(amount))
    const secret = process.env.MINTER_PRIVATE || ''
    const acct = this.sdk.trx.accounts.privateKeyToAccount(secret)
    const source = acct.address
    const nonce = await this.sdk.trx.getTransactionCount(source, 'latest')
    const memo = this.strToHex(destinTag)
    const tx = {
      from: source, // minter wallet
      to: address,  // receiver
      value: value, // value in wei to send
      data: memo    // memo initiative id
    }
    console.log('TX', tx)
    const signed = await this.sdk.trx.sign(tx, secret)
    const result = await this.sdk.trx.sendTransaction(signed)
    console.log('RESULT', result)
    //const txHash = await this.fetchLedger({method: 'eth_sendTransaction', params: [tx]})
    //console.log({txHash});
  }

  async mintNFT(address: string, uri: string){
    console.log(this.chain, 'server minting NFT to', address, uri)
    const secret   = process.env.MINTER_PRIVATE || ''
    const acct     = this.sdk.trx.accounts.privateKeyToAccount(secret)
    const minter   = acct.address
    //const contract = process.env.MINTER_CONTRACT || ''
    const contract = getContract() // TODO: pass params
    const instance = new this.sdk.trx.contract(erc721, contract)
    const noncex   = await this.sdk.trx.getTransactionCount(minter, 'latest')
    const nonce    = Number(noncex)
    console.log('MINTER', minter)
    console.log('NONCE', nonce)
    //const data = instance.methods.mintNFT(address, uri).encodeABI()
    const data = instance.mint(address, uri).encodeABI()
    console.log('DATA', data)
    const gasHex = await this.fetchLedger('eth_gasPrice', [])
    const gasPrice = parseInt(gasHex,16)
    console.log('GAS', gasPrice, gasHex)
    const checkGas = await this.fetchLedger('eth_estimateGas', [{from:minter, to:contract, data}])
    const gasLimit = Math.floor(parseInt(checkGas,16) * 1.20)
    console.log('EST', gasLimit, checkGas)
    const gas = { gasPrice, gasLimit }

    const tx = {
      from: minter, // minter wallet
      to: contract, // contract address
      value: '0',   // this is the value in wei to send
      data: data,   // encoded method and params
      gas: gas.gasLimit,
      gasPrice: gas.gasPrice,
      nonce
    }
    console.log('TX', tx)

    //const op = {
    //  feeLimit:100_000_000,
    //  callValue:0,
    //  tokenId: 0,
    //  tokenValue: 1,
    //  shouldPollResponse:true
    //}
    //const result = await instance.mint(address,uri).send(op)
    const sign = await this.sdk.trx.sign(tx, secret)
    const info = await this.sdk.trx.sendTransaction(sign)
    console.log('INFO', info)
    const hasLogs = info.logs.length>0
    let tokenNum = ''
    if(hasLogs){
      //console.log('LOGS.0', JSON.stringify(info?.logs[0].topics,null,2))
      //console.log('LOGS.1', JSON.stringify(info?.logs[1].topics,null,2))
      tokenNum = ' #'+parseInt((info.logs[0] as any).topics[3] || '0', 16)
    }
    if(info.status==1){
      const tokenId = contract+tokenNum
      const result = {success:true, txid:info?.transactionHash, tokenId}
      console.log('RESULT', result)
      return result
    }
    return {success:false, error:'Something went wrong'}
  }

  async getTransactionInfo(txid:string){
    console.log('Get tx info', txid)
    const info = await this.fetchLedger('eth_getTransactionByHash', [txid])
    if(!info || info?.error){ return {success:false, error:'Error fetching tx info'} }
    const result = {
      success: true,
      account: info?.from,
      destination: info?.to,
      destinationTag: this.hexToStr(info?.input),
      amount: this.fromWei(info?.value)
    }
    return result
  }
}

const Tron = new TronServer()

export default Tron