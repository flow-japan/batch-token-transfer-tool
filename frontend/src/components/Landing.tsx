import React from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import styles from '../styles/Landing.module.css';

const Landing = () => {
  return (
    <Box className={styles.box}>
      <VStack>
        <Text className={styles.heading}>
          Easily transfer Flow tokens to multiple addresses.
        </Text>
        <Text className={styles.subHeading}>
          Useful to anyone who manages a community or works with multiple
          collaborators, this tool saves users the time required to initiate
          transfers individually to large groups of people, by enabling you to
          do them all at once.
        </Text>
      </VStack>
    </Box>
  );
};

export default Landing;
