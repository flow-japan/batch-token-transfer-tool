import React from 'react';
import { Box, Flex, Image } from '@chakra-ui/react';
import ConnectButton from './ConnectButton';
import styles from '../styles/Header.module.css';
import LanguageSwitch from './LanguageSwitch';

const Header = () => {
  return (
    <Box className={styles.box}>
      <Flex align={'center'}>
        <Flex flex={1} justify={'start'}>
          <Image className={styles.logo} src='/logo.png' alt='RAINDROP' />
        </Flex>
        <LanguageSwitch />
        <Box className={styles.connectButtonBox}>
          <ConnectButton />
        </Box>
      </Flex>
    </Box>
  );
};

export default Header;
