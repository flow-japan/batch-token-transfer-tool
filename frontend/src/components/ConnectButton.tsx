import { useRecoilState } from 'recoil';
import { userAccountState, networkState } from '../store';
import { connectWallet, logout, getBalances } from '../services/flow';
import styles from '../styles/ConnectButton.module.css';

const ConnectButton = () => {
  const [userAccount, setUserAccount] = useRecoilState(userAccountState);
  const [network] = useRecoilState(networkState);

  const connect = async () => {
    await logout();
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

  const disconnect = async () => {
    await logout();
    setUserAccount(null);
  };

  return (
    <button
      className={styles.connectButton}
      onClick={!userAccount ? connect : disconnect}
    >
      {!userAccount ? 'CONNECT' : 'DISCONNECT'}
    </button>
  );
};

export default ConnectButton;
