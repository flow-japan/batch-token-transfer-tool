import { Button } from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { userAccountState } from '../store';
import { connectWallet, getBalances } from '../services/flow';

const ConnectButton = () => {
  const [, setUserAccount] = useRecoilState(userAccountState);

  const connect = async () => {
    const account = await connectWallet();
    const balances = await getBalances(account.addr);
    setUserAccount({
      address: account.addr,
      dotFindName: '', // TODO:
      balanceFLOW: Number(balances[0]).toFixed(8),
      balanceFUSD: Number(balances[1]).toFixed(8),
    });
  };

  return (
    <Button mt={4} colorScheme='blue' size='lg' onClick={connect}>
      Connect Wallet
    </Button>
  );
};

export default ConnectButton;
