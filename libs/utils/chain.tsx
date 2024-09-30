function coinFromChain(chain:string){
  return {'Tron': 'trx'}[chain] || ''
}

function chainFromCoin(coin:string){
  return {'trx': 'Tron'}[coin] || ''
}

export { coinFromChain, chainFromCoin }