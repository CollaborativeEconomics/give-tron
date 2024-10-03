import Chains from '@/libs/chains/client/apis'
import config from '@/app/config'

export type Dictionary = { [key:string]:any }

export function getChainName(currency:string){
  const chains:Dictionary = {
    'trx': 'Tron'
  }
  const name = chains[currency] || 'None'
  return name
}

export function getChainWallet(currency:string){
  const wallets:Dictionary = {
    'trx': 'TronLink'
  }
  const name = wallets[currency] || 'None'
  return name
}

export function getChainNetwork(chain:string){
  const networks:Dictionary = {
    'trx':  config.blockchain.network || ''
  }
  const name = networks[chain] || 'testnet'
  return name
}

const wallets: Dictionary = {
  tronlink:  { value: 'TronLink',  image: '/wallets/tronlink.png',  chainEnabled: true }
}

const chainWallets: Dictionary = {
  trx: [wallets['tronlink']]
}

export function getChainWallets(chain: string) {
  return chainWallets[chain.toLowerCase()] ?? [wallets['tronlink']]
}

export function getChainsList(){
  const chains = Object.values(Chains).map((chain) => {
    return {
      value:   chain?.chain,
      coinSymbol:  chain?.coinSymbol  || '???',
      image:   '/coins/' + (chain?.logo || 'none.png'),
      chainEnabled: chain?.chainEnabled || false
    }
  })
  return chains
}

export function getChainsMap(){
  let chains:Dictionary = {}
  Object.values(Chains).map((chain) => {
    chains[chain.chain] = {
      coinSymbol:  chain?.coinSymbol  || '???',
      image:   '/coins/' + (chain?.logo || 'none.png'),
      chainEnabled: chain?.chainEnabled || false
    }
  })
  return chains
}
