import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, HStack, Text } from '@chakra-ui/react';
import styles from '../styles/Footer.module.css';
import { networkState } from '../store';
import { useRecoilState } from 'recoil';

const Footer = () => {
  const [network, setNetwork] = useRecoilState(networkState);

  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const network =
        router.query.network === 'testnet' ? router.query.network : 'mainnet';
      setNetwork({ network });
    }
  }, [router.query, router]);

  return (
    <Box className={styles.footerBox}>
      <Box className={styles.footerTextBox}>
        <HStack pb='8px'>
          <Text>
            NETWORK: {network?.network === 'mainnet' ? 'MAINNET' : 'TESTNET'}
          </Text>
        </HStack>
        <HStack pb='10px'>
          <Text>CREATED BY</Text>
          <Text as='u' color='brand.500'>
            <a
              href='https://github.com/flow-japan'
              target='_blank'
              rel='noopener noreferrer'
            >
              FLOW JP COMMUNITY
            </a>
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};

export default Footer;
