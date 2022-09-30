import { useState, useEffect, useMemo } from 'react';
import { useRecoilState } from 'recoil';
import { userAccountState, networkState, localeState } from '../store';
import { connectWallet, logout, getBalances } from '../services/flow';
import styles from '../styles/ConnectButton.module.css';
import { getLocale } from 'locale/locale';

type User = {
  loggedIn: boolean;
  addr: string;
};

const ConnectButton = () => {
  const [user, setUser] = useState<User>({ loggedIn: false, addr: '' });
  const [userAccount, setUserAccount] = useRecoilState(userAccountState);
  const [network] = useRecoilState(networkState);
  const [lang] = useRecoilState(localeState);

  const t = useMemo(() => {
    return getLocale(lang);
  }, [lang]);

  const connect = async () => {
    await logout();
    await connectWallet(network?.network, setUser);
  };

  const disconnect = async () => {
    await logout();
    setUserAccount(null);
  };

  useEffect(() => {
    if (!user.loggedIn) {
      return;
    }
    const balances = getBalances(user.addr);
    setUserAccount({
      address: user.addr,
      dotFindName: '', // TODO:
      balance: {
        FLOW: Number(balances[0]).toFixed(8),
        FUSD: Number(balances[1]).toFixed(8),
      },
    });
  }, [user]);

  return (
    <button
      className={styles.connectButton}
      onClick={!userAccount ? connect : disconnect}
    >
      {!userAccount ? t.CONNECT : t.DISCONNECT}
    </button>
  );
};

export default ConnectButton;
