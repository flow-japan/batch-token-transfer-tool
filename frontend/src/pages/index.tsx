import type { NextPage } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BatchTransfer from '../components/BatchTransfer';
import Landing from '../components/Landing';

import { useRecoilState } from 'recoil';
import { userAccountState } from '../store';

const Home: NextPage = () => {
  const [userAccount] = useRecoilState(userAccountState);

  return (
    <div>
      <Header />
      {!userAccount ? <Landing /> : <BatchTransfer />}
      <Footer />
    </div>
  );
};

export default Home;
