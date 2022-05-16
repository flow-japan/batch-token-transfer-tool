import Head from 'next/head';
import { ReactNode } from 'react';
import { Center } from '@chakra-ui/react';
import styles from '../styles/Layout.module.css';

type Props = {
  children?: ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Batch Token Transfer Tool</title>
        <meta
          name='description'
          content='The Batch Token Transfer Tool allows for a user to easily set up and automate transfers to multiple Flow wallet addresses from a single Flow wallet address.'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <header className={styles.header}>
        <Center>
          <div className={styles.heading}>Batch Token Transfer Tool</div>
        </Center>
      </header>

      <div className={styles.main}>{children}</div>

      <footer className={styles.footer}>
        <a
          href='https://github.com/flow-japan'
          target='_blank'
          rel='noopener noreferrer'
        >
          Created by Flow JP Community
        </a>
      </footer>
    </div>
  );
};

export default Layout;
