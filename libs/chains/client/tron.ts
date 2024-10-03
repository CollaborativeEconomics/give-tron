import Wallet from '@/libs/wallets/tronlink'
import { WalletProvider } from '@/types/wallet'
import config from '@/app/config'

type Dictionary = { [key: string]: any }
type Callback = (data: Dictionary) => void

class TronSDK {
  chainEnabled = true
  chain = 'Tron'
  coinSymbol = 'TRX'
  logo = 'trx.png'
  network = config.blockchain.network || ''
  provider: WalletProvider
  mainnet = {
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
    name: 'Tron Testnet', // Shasta
    coinSymbol: 'TRX',
    decimals: 6,
    gasprice: '1500000000',
    explorer: 'https://shasta.tronscan.org',
    rpcurl: 'https://api.shasta.trongrid.io',
    wssurl: ''
  }
  wallet: Wallet

  constructor() {
    this.provider = this.network == 'mainnet' ? this.mainnet : this.testnet
    this.wallet = new Wallet(this.provider)
  }

  toWei(num: number) {
    const sats = 10 ** this.provider.decimals
    return num / sats
  }

  async connect(callback: Callback) {
    console.log(this.chain, 'connecting...')
    const result = await this.wallet.init(window, this.provider)
    console.log('TronLink session:', result)
    if (result?.address) {
      const data = {
        wallet: 'tronlink',
        address: result.address,
        chainid: this.provider.id,
        chain: this.chain,
        currency: this.provider.coinSymbol,
        decimals: this.provider.decimals,
        network: this.network,
        token: '',
        topic: ''
      }
      callback(data)
    } else {
      callback(result)
    }
  }

  async sendPayment(address: string, amount: string, destinTag: string, callback: any) {
    console.log(this.chain, 'Sending payment...')
    try {
      this.connect(async (data) => {
        console.log('Pay connect', data)
        const result = await this.wallet.payment(address, amount, destinTag)
        callback(result)
      })
    } catch (ex: any) {
      console.error(ex)
      callback({ error: ex.message })
    }
  }

  async sendToken(address: string, amount: string, token: string, contract: string, destinTag: string, callback: any) {
    console.log(this.chain, 'Sending token...')
    this.connect(async (data) => {
      console.log('Pay connect', data)
      const result = await this.wallet.paytoken(address, amount, token, contract, destinTag)
      callback(result)
    })
  }

  async getTransactionInfo(txid: string) {
    console.log('Get tx info by txid', txid)
    const info = await this.wallet.getTransactionInfo(txid)
    return info
  }
}

const Tron = new TronSDK()

export default Tron