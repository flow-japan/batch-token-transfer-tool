import { BigNumber } from 'bignumber.js';
import React, { useState } from 'react';
import {
  Center,
  Heading,
  Textarea,
  Button,
  Box,
  Stack,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Divider,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useRecoilState } from 'recoil';
import { userAccountState } from '../store';
import { sendFLOW, waitTx } from '../services/flow';
import ConfirmTable from '../components/ConfirmTable';

const BatchTransfer = () => {
  // TODO:
  // const explorerUrl = 'https://flowscan.org/transaction/';
  const explorerUrl = 'https://testnet.flowscan.org/transaction/';

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [userAccount] = useRecoilState(userAccountState);
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState<BigNumber>(new BigNumber(0.0));
  const [remaining, setRemaining] = useState<BigNumber>(new BigNumber(0.0));
  const [txHash, setTxHash] = useState('');
  const [errorText, setErrorText] = useState('');
  const [checkDone, setCheckDone] = useState(false);

  const loadToAddressesAndAmounts = (recipientsAndAmountsStr: string) => {
    setErrorText('');
    setCheckDone(false);
    if (!recipientsAndAmountsStr) {
      return;
    }
    const toAddresses: string[] = [];
    const amounts: string[] = [];
    recipientsAndAmountsStr
      .split(/\r\n|\n/)
      .filter((v) => !!v)
      .map((recipientsAndAmount) => {
        const [toAddress, amount] = recipientsAndAmount
          .split(/[ ,]+/)
          .filter((v) => !!v);
        toAddresses.push(toAddress);
        amounts.push(
          Number(amount || 0)
            .toFixed(8)
            .toString()
        );
        return [toAddress, Number(amount).toFixed(8).toString()];
      });
    setToAddresses(toAddresses);
    setAmounts(amounts);

    const totalAmount = amounts.reduce(
      (sum, amount) => sum.plus(new BigNumber(Number(amount) || 0)),
      new BigNumber(0.0)
    );
    setTotalAmount(totalAmount);
    const remaining = new BigNumber(userAccount?.balanceFLOW || 0).minus(
      totalAmount
    );
    setRemaining(remaining);

    if (remaining.lt(0)) {
      setErrorText('Total exceeds balance');
    }
  };

  const onSubmit = async () => {
    if (!checkDone) {
      // TODO: Check if the address exists and has Vault.
      setCheckDone(true);
    } else {
      try {
        setErrorText('');
        const tx = await sendFLOW(toAddresses, amounts);
        setTxHash(tx.transactionId);
        await waitTx(tx);
      } catch (e) {
        console.log('error:', e);
        setErrorText(String(e));
      }
    }
  };

  return (
    <Box p={4} bg={'white'} shadow='md' rounded='md'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Center>
          <Stack spacing={4} padding={4} width={'400px'}>
            {userAccount ? (
              <>
                <Box as='p'>
                  <Heading as='h5' size='sm'>
                    Address
                  </Heading>{' '}
                  {userAccount.address}
                </Box>
                <Box as='abbr'>
                  <Heading as='h5' size='sm'>
                    Balance
                  </Heading>{' '}
                  {Number(userAccount.balanceFLOW)} FLOW,{' '}
                  {Number(userAccount.balanceFUSD)} FUSD
                </Box>
                <Box as='kbd'></Box>
              </>
            ) : null}
            <FormControl isInvalid={errors.email} className='mt-10'>
              <FormLabel htmlFor='addresses'>
                <Heading as='h5' size='sm'>
                  Recipients & Amounts (FLOW)
                </Heading>{' '}
              </FormLabel>
              <Textarea
                id='addresses'
                placeholder={
                  '0x74c8be713d59bc63, 0.01\n0x12c8be713d59bc63, 0.02'
                }
                mb={2}
                size={'md'}
                onChange={(e) => {
                  loadToAddressesAndAmounts(e.target.value);
                }}
              />
            </FormControl>
            <Divider />
            <Heading as='h5' size='sm'>
              Confirm
            </Heading>{' '}
            <Box as='div'>
              <ConfirmTable
                toAddresses={toAddresses}
                amounts={amounts}
                totalAmount={totalAmount}
                remaining={remaining}
              />
            </Box>
            <Divider />
            <VStack>
              {errorText && (
                <Center>
                  <Text textColor='gray' fontWeight='700'>
                    {errorText}
                  </Text>
                </Center>
              )}
            </VStack>
            <Center>
              <Button
                mt={4}
                colorScheme='blue'
                size={'lg'}
                isLoading={isSubmitting}
                disabled={!!errorText}
                type='submit'
              >
                {checkDone ? 'Send FLOW' : 'Check'}
              </Button>
            </Center>
            <VStack>
              {txHash && (
                <>
                  <Box m={6}>
                    <a
                      href={explorerUrl + txHash}
                      target='_blank'
                      rel='noreferrer'
                    >
                      <Text as='u'>View Tx on Flowscan</Text>
                    </a>
                  </Box>
                </>
              )}
            </VStack>
          </Stack>
        </Center>
      </form>
    </Box>
  );
};

export default BatchTransfer;
