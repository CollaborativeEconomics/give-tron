export async function getTransactionInfo(txid:string){
  try {
    const url = process.env.PROVIDER_URL || ''
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionByHash',
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
    const url = process.env.PROVIDER_URL || ''
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
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
