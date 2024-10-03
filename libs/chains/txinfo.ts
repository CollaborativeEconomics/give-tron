import config from '@/app/config'

async function fetchLedger(method:string, params:any){
  console.log('FETCH', method, params)
  const url = config.providers.chainRPC || ''
  console.log('URL', url)
  const data = {id: '1', jsonrpc: '2.0', method, params}
  const body = JSON.stringify(data)
  const opt  = {method:'POST', headers:{'Content-Type':'application/json'}, body}
  console.log('OPT', opt)
  try {
    const res = await fetch(url, opt)
    const inf = await res.json()
    console.log('INF', inf)
    return inf?.result
  } catch(ex:any) {
    console.error(ex)
    return {error:ex.message}
  }
}

function hexToStr(hex:string, encoding:BufferEncoding='utf8') {
  if(!hex){ return '' }
  return Buffer.from(hex.substr(2), 'hex').toString(encoding)
}

function fromWei(num:number){
  const wei = 10 ** config.blockchain.decimals
  return num / wei
}

export async function getTransactionInfo(txid:string){
  console.log('Get tx infox', txid)
  const info = await fetchLedger('trx_getTransactionByHash', [txid])
  if(!info || info?.error){ return {success:false, error:'Error fetching tx info'} }
  const result = {
    success: true,
    account: info?.from,
    destination: info?.to,
    destinationTag: hexToStr(info?.input),
    amount: fromWei(info?.value)
  }
  console.log('RES', result)
  return result
}

export async function getTransactionInfo_OLD(txid:string){
  try {
    const url = config.providers.chainRPC || ''
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'trx_getTransactionByHash',
      params: [txid]
    };
    console.log('TXINFO', url, payload)
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }

    // Wait for transaction
    const secs = 1000
    const wait = [2,2,2,3,3,3,4,4,4,5,5,5,6,6,6] // 60 secs / 15 loops
    let count = 0
    let info = null
    while(count < wait.length){
      console.log('Retry', count)
      await new Promise(res => setTimeout(res, wait[count]*secs))
      count++
      let result = await fetch(url, options)
      let info = await result.json()
      console.log('TXINFO', info)
      if(info?.error){
        if(info?.error?.code==29) {
          continue // Not ready in blockchain
        }
        console.log('TX FAILED')
        return { error:'Error getting transaction', extra:info }
      }
      return info
    }
  } catch (ex:any) {
    console.error(ex)
    return { error: ex.message }
  }
}

export async function getTransactionReceipt(txid:string){
  try {
    const url = config.providers.chainRPC || ''
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'trx_getTransactionReceipt',
      params: [txid]
    };
    console.log('TXREC', url, payload)
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
    let result = await fetch(url, options)
    let data = await result.json()
    return data
  } catch (ex:any) {
    console.error(ex)
    return { error: ex.message }
  }
}
