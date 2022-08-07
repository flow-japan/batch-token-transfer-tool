import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Tabs, Tab, TabList } from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { networkState, userAccountState } from '../store';
import { logout } from '../services/flow';

const NetworkSwitchTab = () => {
  const [, setNetwork] = useRecoilState(networkState);
  const [, setUserAccount] = useRecoilState(userAccountState);
  const networks = ['testnet', 'mainnet'];

  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const network =
        router.query.network === 'mainnet' ? router.query.network : 'testnet';
      setNetwork({ network });
    }
  }, [router.query, router]);

  const onChange = (index) => {
    router.push({
      pathname: '/',
      query: { network: networks[index] },
    });
    logout();
    setUserAccount(null);
  };

  return (
    <Tabs
      variant='soft-rounded'
      mb={4}
      colorScheme='blue'
      size='md'
      onChange={onChange}
    >
      <TabList>
        <Tab>Testnet</Tab>
        <Tab>Mainnet</Tab>
      </TabList>
    </Tabs>
  );
};

export default NetworkSwitchTab;
