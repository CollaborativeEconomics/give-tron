import { useEffect, useState, useRef, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputWithContent } from '@/components/ui/input-with-content'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckboxWithText } from '@/components/ui/checkbox'
import { DonationFormSelect } from '@/components/DonationFormSelect'
import { Separator } from '@/components/ui/separator'
import { Dictionary, getChainWallets, getChainsList, getChainsMap } from '@/libs/chains/utils'
import { DonationContext } from '@/components/DonationView'
import Chains from '@/libs/chains/client/apis'
import sendReceipt from '@/libs/utils/receipt'
import { fetchApi, postApi, getUserByWallet, anonymousUser, newUser } from '@/libs/utils/api'
//import getRates from '@/libs/utils/rates'
import NotFound from '@/components/NotFound'
import { Initiative, Wallet } from '@/types/models'
import erc20 from "@/contracts/erc20.json"
import config from "@/app/config"

interface IForm {
  amount: string
  email: string
  receipt: boolean
}

interface IDonation {
  organization?: Dictionary
  initiative?: Dictionary
  sender: string
  chainName: string
  network: string
  coinValue: number
  usdValue: number
  currency: string
  user: Dictionary
}

interface IPayment {
  organization?: Dictionary
  initiative?: Dictionary
  chainName: string
  chainInfo: string
  wallet: string
  receiver: string
  currency: string
  amount: string
  name: string
  email: string
  receipt: boolean
}

export default function DonationForm(props:any) {
  //console.log('Props', props)
  const initiative = props.initiative
  const usdRate = props.rate
  const organization = initiative?.organization
  const {donation, setDonation} = useContext(DonationContext)
  const chainName = config.blockchain.chainName || ''
  const currency  = config.blockchain.coinSymbol || ''
  const chains = getChainsList()
  const chainLookup = getChainsMap()
  const chainWallets = getChainWallets(currency)
  const chainInfo = chainLookup[chainName]
  //console.log({currency})
  //console.log({chainName})
  //console.log({chains})
  //console.log({chainLookup})
  console.log('WALLETS', chainWallets)
  //console.log({chainInfo})
  const [showSYM, toggleShowSYM] = useState(false)
  const [currentChain, setCurrentChain] = useState(chainName)
  const [wallets, setWallets] = useState(chainWallets)
  const [currentWallet, setCurrentWallet] = useState(wallets[0])
  //const amountInputRef = useRef()
  const amountRef  = useRef<HTMLInputElement>(null)
  const nameRef    = useRef<HTMLInputElement>(null)
  const emailRef   = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLInputElement>(null)
  const [disabled, setDisabled] = useState(false)
  const [buttonText, setButtonText] = useState('Donate')
  const [message, setMessage] = useState('One wallet confirmation required')
  const [rateMessage, setRateMessage] = useState('USD conversion rate')

  useEffect(() => {
    console.log('SWITCH')
    recalc()
  }, [showSYM])

  if(!initiative || !organization){ return <NotFound /> }

  function $(id:string){ return document.getElementById(id) as HTMLInputElement }

  function validEmail(text:string){
    //return text.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)
    const emailSchema = z.string().email()
    return emailSchema.safeParse(text).success
  }

  function getWalletByChain(wallets:Wallet[], chain:string){
    for(let i=0; i<wallets.length; i++){
      if(wallets[i].chain.toString()==chain){
        return wallets[i]
      }
    }
    return null
  }

  function validForm({amount, email, receipt}:IForm){
    if(parseFloat(amount)<=0){
      setMessage('Enter a valid amount')
      return false
    }
    if(receipt && !validEmail(email)){
      setMessage('Enter a valid email')
      return false
    }
    return true
  }

  async function saveDonation({organization, initiative, sender, chainName, network, coinValue, usdValue, currency, user}:IDonation){
    const catId = initiative?.categoryId || organization?.categoryId 
    const donation = {
      organizationId: organization?.id,
      initiativeId:   initiative?.id,
      categoryId:     catId,
      userId:         user?.id,
      paytype:        'crypto',
      chain:          chainName,
      network:        network,
      wallet:         sender,
      amount:         coinValue,
      usdvalue:       usdValue,
      asset:          currency,
      status:         1
    }
    console.log('DONATION', donation)
    const donationResp = await postApi('donations', donation)
    console.log('SAVED DONATION', donationResp)
    if(!donationResp.success){
     setButtonText('ERROR')
     setDisabled(true)
     setMessage('Error saving donation')
     return false
    }
    const donationId = donationResp.data?.id
    return donationId
  }

  async function sendPayment({organization, initiative, chainName, chainInfo, wallet, receiver, currency, amount, name, email, receipt}:IPayment){
    console.log('SEND', {organization, initiative, chainName, chainInfo, wallet, receiver, currency, amount, name, email, receipt})
    setButtonText('WAIT')
    setDisabled(true)
    setMessage('Sending payment, wait a moment...')
    setMessage('Approve payment in your wallet')

    const sdk = Chains[chainName]
    if(!sdk){
      console.log('Error sending payment, blockchain not implemented', chainName)
      setMessage(chainName +' blockchain not implemented. Select an available blockchain')
      return false
    }
    const network = sdk.network
    const destinationTag = initiative?.tag

    // if amount in USD convert by coin rate
    console.log('RATE:', currency, usdRate)
    const amountNum = parseFloat(amount||'0')
    const coinValue = showSYM ? amountNum : (amountNum / usdRate)
    const usdValue  = showSYM ? (amountNum * usdRate) : amountNum
    const rateMsg   = showSYM 
      ? `USD ${usdValue.toFixed(4)} at ${usdRate.toFixed(4)} ${currency}/USD` 
      : `${coinValue.toFixed(4)} ${currency} at ${usdRate.toFixed(4)} ${currency}/USD`
    console.log('AMT', showSYM, coinValue, usdValue)
    const coinAmount = coinValue.toFixed(18)
    setRateMessage(rateMsg)
    console.log('PAY', coinValue, coinAmount, usdValue)

    sdk.sendPayment(receiver, coinAmount, destinationTag, async (result:any)=>{
      if(result?.error){
        console.log('Error sending payment:', result.error)
        setMessage('Error sending payment')
        return false
      }
      if(result?.success==false){
        console.log('Payment rejected')
        setMessage('Payment rejected by user')
        return false
      }
      const txid = result.txid
      const sender = result.address
      console.log('TXID', txid)
      console.log('SENDER', sender)

      const userResp = await getUserByWallet(sender)
      let user = userResp?.result
      if(!user){
        const anon = anonymousUser(sender, chainName)
        user = await newUser(anon)
        console.log('Anon', user)
        if(!user){
          console.log('Error creating anonymous user')
          setButtonText('ERROR')
          setMessage('Error saving user data, contact support')
          return false
        }
      }

      // Save donation to db
      const donationId = await saveDonation({organization, initiative, sender, chainName, network, coinValue, usdValue, currency, user})
      if(!donationId){
        setButtonText('ERROR')
        setMessage('Donation could not be saved to database, please contact support')
        return false
      }

      // Send receipt
      if(receipt){
        console.log('RECEIPT')
        setMessage('Sending receipt, wait a moment...')
        const data = {
          name:     name,
          email:    email,
          org:      organization?.name,
          address:  organization?.mailingAddress,
          ein:      organization?.EIN,
          currency: currency,
          amount:   coinValue.toFixed(4),
          usd:      usdValue.toFixed(4)
        }
        const receiptResp = await sendReceipt(data)
        console.log('Receipt sent', receiptResp)
      }

      const NFTData = {
        status: 'Claim',
        organization: {
          name: organization?.name,
          address: organization?.mailingAddress,
          ein: organization?.EIN
        },
        initiativeId: initiative?.id,
        tag: initiative?.tag,
        image: initiative?.defaultAsset,
        date: new Date(),
        amount: coinValue,
        ticker: currency,
        amountFiat: usdValue,
        fiatCurrencyCode: 'USD',
        donor: {
          name: name || user?.name || 'Anonymous',
          address: sender
        },
        receiver,
        chainName,
        rate: usdRate,
        txid: result.txid,
        donationId
      }
      setDonation(NFTData)
      setButtonText('DONE')
      setDisabled(true)
      setMessage('Thank you for your donation!')
    })
  }

  async function donate(){
    const wallet    = currentWallet.value
    const amount    = typeof(amountRef)=='object' ? (amountRef.current?.value || '0') : '0'
    const name      = typeof(nameRef)=='object' ? (nameRef.current?.value || '') : ''
    const email     = typeof(emailRef)=='object' ? (emailRef.current?.value || '') : ''
    const receipt   = typeof(receiptRef)=='object' ? (receiptRef.current?.dataset['state']=='checked' || false) : false

    console.log('FORM --------')
    console.log('Chain:',    chainName)
    console.log('Currency:', currency)
    console.log('Wallet:',   wallet)
    console.log('Amount:',   amount)
    console.log('Name:',     name)
    console.log('Email:',    email)
    console.log('Receipt:',  receipt)

    if(!validForm({amount, email, receipt})){ return }

    const orgWallet = getWalletByChain(organization?.wallets||[], chainName)
    console.log('Org wallet', orgWallet)
    if(!orgWallet || !orgWallet?.address){
      console.log('Error sending payment, no wallet found for chain', chainName)
      setMessage('Error: no wallet in this organization for ' + chainName)
      return false
    }
    const receiver = orgWallet.address
    
    sendPayment({organization, initiative, chainName, chainInfo, wallet, receiver, currency, amount, name, email, receipt})
  }

  function recalc(){
    console.log('--RECALC')
    //const amountInp = evt.target.value || '0'
    const amountInp = $('amount')?.value || '0'
    const amountNum = parseFloat(amountInp)
    const coinValue = showSYM ? amountNum : (amountNum / usdRate)
    const usdValue  = showSYM ? (amountNum * usdRate) : amountNum
    const rateMsg   = showSYM 
      ? `${usdValue.toFixed(4)} USD at ${usdRate.toFixed(4)} USD/${currency}` 
      : `${coinValue.toFixed(4)} ${currency} at ${usdRate.toFixed(4)} USD/${currency}`
    console.log('USD', usdValue, currency, coinValue, showSYM?'ON':'OFF')
    setRateMessage(rateMsg)
    console.log('Changed', amountInp)
    const data = {...donation, amount:coinValue, amountFiat:usdValue, ticker:currency}
    setDonation(data)
    console.log('DATA', data)
  }

  function refresh(){
    const name = $('name-input').value || 'Anonymous'
    console.log('NAME', name)
    const data = {...donation, donor:{address:donation.donor.address, name}}
    setDonation(data)
    console.log('DATA', data)
  }

  return (
    <div className="flex min-h-full w-full mt-4">
      <Card className="py-6 w-full shadow-xl">
        <div className="px-6">
          <Label htmlFor="currency-select" className="mb-2">
            Currency
          </Label>
          <DonationFormSelect
            id="currency-select"
            className="mb-6"
            options={chains}
            currentOption={currentChain ?? ''}
            handleChange={(chain: string) => {
              const coinSymbol = Object.keys(chainLookup).length>0 ? chainLookup[chain].coinSymbol : ''
              const listWallets = getChainWallets(coinSymbol)
              setCurrentChain(chain)
              setWallets(listWallets)
            }}
            placeHolderText="...select a cryptocurrency"
          />
          <Label htmlFor="wallet-select" className="mb-2">
            Wallet
          </Label>
          <DonationFormSelect
            id="wallet-select"
            className="mb-6"
            options={wallets}
            currentOption={currentWallet?.value ?? ''}
            handleChange={(wallet: { value: string; image: string }) =>
              setCurrentWallet(wallet)
            }
            placeHolderText="...select a cryptowallet"
          />
        </div>
        <Separator />
        <div className="px-6">
          <div className="w-full my-6">
            <div className="flex flex-row justify-between items-center mb-2">
              <Label>Amount</Label>{' '}
              <div className="flex flex-wrap">
                <Label htmlFor="show-usd-toggle">USD</Label>
                <Switch
                  id="show-usd-toggle"
                  valueBasis={showSYM}
                  handleToggle={() => {
                    toggleShowSYM(!showSYM)
                  }}
                />
                <Label>{chainLookup[currentChain].coinSymbol}</Label>
              </div>
            </div>
            <div className="my-auto">
              <InputWithContent
                className="pl-4"
                type="text"
                id="amount"
                text={ showSYM ? '| ' + chainLookup[currentChain].coinSymbol : '| USD' }
                ref={amountRef}
                divRef={amountRef}
                onChange={recalc}
              />
            </div>
            <Label className="block mt-2 text-right">{rateMessage}</Label>
          </div>
          <Label htmlFor="name-input" className="mb-2">Name (optional)</Label>
          <Input type="text" className="pl-4 mb-6" id="name-input" ref={nameRef} onChange={refresh} />
          <Label htmlFor="email-input" className="mb-2">Email address (optional)</Label>
          <Input type="text" className="pl-4 mb-6" id="email-input" ref={emailRef} />
          <CheckboxWithText id="receipt-check" text="I'd like to receive an emailed receipt" className="mb-2" ref={receiptRef} />
        </div>
        <Separator />
        <div className="flex flex-col items-center justify-center">
          <Button disabled={disabled} className="mt-6 mx-6 w-[250px] h-[50px] bg-blue-600 text-white text-lg outline outline-slate-300 outline-1 hover:bg-blue-700 hover:shadow-inner" onClick={donate}>
            {buttonText}
          </Button>
          <p className="mt-2 text-sm">{message}</p>
        </div>
      </Card>
    </div>
  )
}
