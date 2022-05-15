import type { NextPage } from 'next';
import { Heading, Center } from '@chakra-ui/react';
import ConnectButton from '../components/ConnectButton';
import BatchTransfer from '../components/BatchTransfer';
import { useRecoilState } from 'recoil';
import { userAccountState } from '../store';

const Home: NextPage = () => {
  const [userAccount, setUserAccount] = useRecoilState(userAccountState);

  return (
    <div>
      <Center>{!userAccount ? <ConnectButton /> : <BatchTransfer />}</Center>
    </div>
  );
};

export default Home;
