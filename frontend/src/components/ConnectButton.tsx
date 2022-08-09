import { Button } from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { userAccountState, networkState } from '../store';
import { connectWallet, getBalances } from '../services/flow';

const ConnectButton = () => {
  const [, setUserAccount] = useRecoilState(userAccountState);
  const [network] = useRecoilState(networkState);

  const connect = async () => {
    const account = await connectWallet(network?.network);
    if (!account) {
      return;
    }
    const balances = await getBalances(account.addr);
    setUserAccount({
      address: account.addr,
      dotFindName: '', // TODO:
      balance: {
        FLOW: Number(balances[0]).toFixed(8),
        FUSD: Number(balances[1]).toFixed(8),
      },
    });
  };

  return (
    <Button mt={4} colorScheme='blue' size='lg' onClick={connect}>
      Connect Wallet
    </Button>
  );
};

export default ConnectButton;
