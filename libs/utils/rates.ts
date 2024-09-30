// SERVER CALL ONLY - SHOULD NOT EXPOSE API KEY

export default async function getRates(coinSymbol:string){
  console.warn('Getting CMC ticker for symbol', coinSymbol)
  try {
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol='+coinSymbol
    const opt = {
      method: 'GET', 
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'X-CMC_PRO_API_KEY': process.env.TICKER_API_KEY||''
      }
    }
    const res = await fetch(url, opt)
    const tkr = await res.json()
    //console.warn('Ticker:', tkr)
    const usd = tkr?.data[coinSymbol]?.quote?.USD?.price
    console.warn('Rate:', usd)
    return usd
  } catch(ex:any) {
    console.error('Error in CMC ticker:', ex)
    return 0
  }
}

/*
export default async function getRates(coinSymbol:string){
  console.warn('Getting CMC ticker for symbol', coinSymbol)
  const url = '/api/rates?coin='+coinSymbol
  try {
    const res = await fetch(url)
    const tkr = await res.json()
    //console.warn('Ticker:', tkr)
    const usd = tkr?.success ? tkr.rate : 0
    console.warn('Rate:', usd)
    return usd
  } catch(ex:any) {
    console.error('Error in CMC ticker:', ex)
    return 0
  }
}
*/