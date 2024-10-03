import { TronWeb } from 'tronweb'
import { WalletProvider } from '@/types/wallet'
import erc20 from '@/contracts/erc20.json'

export default class Wallet {
  neturl    = ''
  explorer  = ''
  network   = 'testnet'
  chainId   = '0x0'
  accounts?:[any]
  myaccount = ''
  wallet?:any = null
  provider?:WalletProvider

  constructor(provider:WalletProvider){
    this.provider = provider
  }

  async init(window:any, provider:any) {
    console.log('Wallet starting...', provider)
    if (window.tronWeb) {
      try {
        this.wallet = window.tronWeb || null
        this.setListeners()
        this.wallet.ready
        const res = await this.wallet?.request({method: 'tron_requestAccounts'})
        if(res?.code==200){
          this.accounts = [this.wallet.defaultAddress.base58]
        } else {
          this.accounts = [this.wallet.defaultAddress.base58]
        }
        console.log('Accounts', this.accounts)
        this.myaccount = this.accounts ? this.accounts[0] : ''
        //this.setNetwork(window.tronWeb.chainId)
        //this.loadWallet(window)
        console.log('TronLink current chain', parseInt(window.tronWeb.chainId), window.ethereum.chainId)
        if(provider.id !== window.ethereum.chainId){
          await this.changeNetwork(provider)
        }
        return {network:this.network, address:this.myaccount}
      } catch(ex:any) {
        console.error('Error', ex.message)
        return {network:null, address:null}
      }
    } else {
      console.log('TronLink not available')
      return {network:null, address:null}
    }
  }

  toHex(num:number){
    return '0x'+num.toString(16)
  }

  isConnected(window:any){
    return window.ethereum.isConnected() && window.ethereum.selectedAddress
  }

  setListeners() {
    this.wallet.on('connect', (info:any)=>{
      console.log('> onConnect', parseInt(info.chainId), info.chainId);
      this.setNetwork(info.chainId);
    });
    this.wallet.on('disconnect', (info:any)=>{
      console.log('> onDisconnect', info)
      console.log('Disconnected')
    });
    this.wallet.on('accountsChanged', (info:any)=>{
      console.log('> onAccounts', info)
      this.accounts = info;
      this.myaccount = info[0];
      console.log('My account', this.myaccount);
    });
    this.wallet.on('chainChanged', (chainId:string)=>{
      console.log('> onChainChanged', parseInt(chainId), chainId)
      if(chainId==this.chainId) { console.log('Already on chain', chainId); return; }
      this.setNetwork(chainId)
    })
    this.wallet.on('message', (info:any)=>{
      console.log('> onMessage', info)
    })
    console.log('Listeners set')
  }

  setNetwork(chainId:string) {
    console.log('SetNetwork', chainId)
    console.log('Network', this.network, this.chainId)
  }

  async changeNetwork(provider:WalletProvider){
    console.log('TronLink changing network to', provider.name, provider.id)
    const chainHex = this.toHex(provider.id)
    try {
      await this.wallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }]
      });
    } catch (err:any) {
      console.log('TronLink error', err)
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        console.log('TronLink adding network...')
        try {
          await this.wallet.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainHex,
                chainName: provider.name,
                nativeCurrency: { name: provider.coinSymbol, decimals: provider.decimals, coinSymbol: provider.coinSymbol },
                rpcUrls: [provider.rpcurl],
                blockExplorerUrls: [provider.explorer]
              }
            ]
          })
          console.log('Network added!')
        } catch(ex:any) {
          console.error('TronLink error adding network', ex)
        }
      }
    }
  }

  async loadWallet(window:any) {
    console.log('Loading wallet...', this.network);
  }



  // Methods
  getAccountHex(acts:[any]) {
    for (var i = 0; i < acts.length; i++) {
      if(acts[i].type=='eth'){ return acts[i].address }
    }
    return null
  }

  async getAccounts() {
    console.log('Get accounts...')
    this.wallet.request({method: 'trx_requestAccounts'}).then((accts:any)=>{
      this.accounts = accts
      this.myaccount = accts[0]
      console.log('Accounts:', accts)
      console.log('MyAccount:', this.myaccount)
      //onReady(this.myaccount, this.network)
    }).catch((err:any) => { 
      console.log('Error: User rejected')
      console.error(err) 
      //onReady(null, 'User rejected connection'
    });
  }

  async getAddress(oncall:any) {
    console.log('Get address...')
    this.wallet.request({method: 'trx_requestAccounts'}).then((res:any)=>{
      console.log('Account', res)
      this.myaccount = res[0]
      oncall(this.myaccount)
    }).catch((err:any) => { 
      console.log('Error: Wallet not connected')
      console.error(err) 
      oncall(null)
    });
  }

  async getBalance(adr:string) {
    console.log('Get balance...')
    const balance = await this.wallet.request({method:'trx_getBalance', params:[adr, 'latest']})
    console.log('Balance:', balance)
    return balance
  }

  async getGasPrice() {
    let gas = await this.wallet.request({method:'trx_gasPrice', params:[]})
    console.log('Average gas price:', parseInt(gas), gas)
    return gas
  }

  async getTransactionInfo(txid:string) {
    let info = await this.wallet.request({method:'trx_getTransactionByHash', params:[txid]})
    console.log('Transaction Info:', info)
    return info
  }

  async callContract(provider:any, abi:any, address:string, method:string, value:string) {
    console.log('Call', address, method)
  }

  async payment(destin:string, amount:string, memo?:string){
    try {
      const from = this.myaccount
      console.log(`Sending ${amount} TRX from ${from} to ${destin}...`)
      const sun = this.wallet.toSun(amount)
      console.log(`${sun} SUN`)
      const trx = await this.wallet.transactionBuilder.sendTrx(destin, sun, from)
      console.log('TRX', trx)
      const trs = await this.wallet.trx.sign(trx)
      console.log('TRS', trs)
      const sent = await this.wallet.trx.sendRawTransaction(trs)
      console.log('SENT', sent)
      const txid = sent.txid
      console.log('TXID', txid)
      return {success:true, txid, address:this.myaccount}
    } catch(ex:any) {
      console.error(ex)
      return {success:false, error:ex.message}
    }
  }

  async paytoken(destin:string, amount:string, token:string, contract:string, memo?:string){
    function numHex(num:number) { return '0x'+(num).toString(16) }
    function strHex(str:string) { return '0x'+Buffer.from(str.toString(), 'utf8').toString('hex') }
    console.log(`Sending ${amount} ${token} token to ${destin}...`)
    const ctr = await this.wallet.contract().at(contract)
    try {
      const result = await this.wallet.trx.send(destin, amount)
      console.log('TXID', result)
      return {success:true, txid:result.txid, address:this.myaccount}
    } catch(ex:any) {
      console.error(ex)
      return {success:false, error:ex.message}
    }
  }

}

// END