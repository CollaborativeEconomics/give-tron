'use client';
import { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProviders, signIn } from 'next-auth/react';
import { ConfigContext } from '@/components/config';
import ButtonWallet from '@/components/ButtonWallet';
import Chains from '@/libs/chains/client/apis';
import { fetchApi, postApi } from '@/libs/utils/api';
import appConfig from '@/app/config';

export default function Signin() {
  const chainName = appConfig.blockchain.chainName || '';
  const chainid = appConfig.blockchain.chainId || '';
  const network = appConfig.blockchain.network || '';
  const currency = appConfig.blockchain.coinSymbol || '';
  const { config: userConfig, setConfig } = useContext(ConfigContext);
  console.log('CONFIG INDEX', userConfig);
  const router = useRouter();
  const [loginText, setLoginText] = useState(
    !userConfig?.user
      ? 'LOGIN'
      : 'PROFILE ' + userConfig?.wallet?.substr(0, 10),
  );
  const [logged, setLogged] = useState(userConfig?.user !== '');
  const [userId, setUserId] = useState(userConfig?.user);

  async function checkUser(address: string) {
    const data = await fetchApi('users?wallet=' + address);
    const user = data?.result;
    console.log('User', user?.id);
    if (user) {
      // Redirect to profile
      console.log('UserId', user.id);
      setUserId(user.id);
      setConfig({ ...userConfig, wallet: address, user: user.id });
      const callbackUrl = '/profile/' + user.id;
      await signIn(chainName, {
        callbackUrl,
        address,
        chainName,
        chainid,
        network,
        currency,
      });
      router.push('/profile/' + user.id);
    } else {
      // Create new user
      const body = {
        name: 'Anonymous',
        wallet: address,
        wallets: {
          create: {
            address: address,
            chain: chainName,
          },
        },
      };
      const newUser = await postApi('users', body);
      const userInfo = newUser?.data;
      console.log('NEWUSER', userInfo);
      if (!userInfo) {
        console.log('Error creating user');
      } else {
        const callbackUrl = '/profile/' + userInfo.id;
        await signIn(chainName, {
          callbackUrl,
          address,
          chainName,
          chainid,
          network,
          currency,
        });
        router.push('/profile/' + userInfo.id);
      }
    }
  }

  async function onLogin() {
    console.log('--LOGIN');
    if (logged && userId) {
      router.push('/profile/' + userId);
      return;
    }

    const chain = Chains[chainName];
    console.log('CHAIN', chain);
    try {
      chain.connect(async (data: any) => {
        console.log('SignIn', data);
        //console.log('RetUrl', url)
        const address = data?.address || '';
        const chainid = data?.chainid || '';
        const network = data?.network || '';
        const currency = data?.currency || '';
        setLogged(true);
        setLoginText('WALLET ' + address?.substr(0, 10) + '...');
        checkUser(address);
      });
    } catch (ex) {
      console.error(ex);
      setLoginText('Could not connect to wallet, try again');
    }
  }

  return (
    <div className="w-[500px] mt-48 p-12 mx-auto rounded-xl border">
      <div className="mt-5">
        <div className="text-center flex flex-col justify-center items-center">
          <ButtonWallet
            text="TronLink"
            icon="tronlink.png"
            href="https://tronlink.org"
            className="w-[200px]"
          />
          <li className="list-none my-4">
            <p className="text-xl mt-4">
              We use TronLink wallet for Tron Network
            </p>
            <p>
              <Link href={'https://tronlink.org'} target="_blank">
                Download TronLink wallet
              </Link>
            </p>
          </li>
          <div className="mt-5 w-full">
            <button
              className="w-full py-3 rounded border bg-blue-600 hover:bg-blue-500 text-white"
              onClick={onLogin}
            >
              {loginText}
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-8">
            You will need to have TRX in a wallet that supports Tron Network,
            such as TronLink. TronLink is a secure, non-custodial, end-to-end
            encrypted, blockchain wallet. You can learn more in their{' '}
            <a href="https://tronlink.org">website</a>
          </p>
        </div>
      </div>
    </div>
  );
}
