import { BigNumber } from 'bignumber.js';
import React, { useState, useEffect } from 'react';
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
  Select,
  Divider,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useRecoilState } from 'recoil';
import { userAccountState } from '../store';
import { logout, sendFT, getTxChannel, getBalances } from '../services/flow';
import ConfirmTable from '../components/ConfirmTable';
import SendButton from './SendButton';

type Currency = {
  symbol: string;
  contractName: string;
  address: string;
  vaultStoragePath: string;
  vaultPublicPath: string;
};

const FLOWCurrency: Currency = {
  symbol: 'FLOW',
  contractName: 'FlowToken',
  address:
    process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
      ? '0x1654653399040a61'
      : '0x7e60df042a9c0868',
  vaultStoragePath: '/storage/flowTokenVault',
  vaultPublicPath: '/public/flowTokenReceiver',
};

const CustomCurrency: Currency = {
  symbol: '',
  contractName: '',
  address: '',
  vaultStoragePath: '',
  vaultPublicPath: '',
};

const FUSDCurrency: Currency = {
  symbol: 'FUSD',
  contractName: 'FUSD',
  address:
    process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
      ? '0x3c5959b568896393'
      : '0xe223d8a629e49c68',
  vaultStoragePath: '/storage/fusdVault',
  vaultPublicPath: '/public/fusdReceiver',
};

const explorerUrl =
  process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
    ? 'https://flowscan.org/transaction/'
    : 'https://testnet.flowscan.org/transaction/';

const BatchTransfer = () => {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [userAccount, setUserAccount] = useRecoilState(userAccountState);
  const [currency, setCurrency] = useState(FLOWCurrency);
  const [recipientTemplate, setRecipientTemplate] = useState(''); // text area
  
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState<BigNumber>(new BigNumber(0.0));
  
  const [remaining, setRemaining] = useState<BigNumber>(new BigNumber(0.0));
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState(-1)
  
  const [errorText, setErrorText] = useState('');
  const [checkDone, setCheckDone] = useState(false);

  const resetConfirm = () => {
    setToAddresses([]);
    setAmounts([]);
    setTotalAmount(new BigNumber(0.0));
    setRemaining(new BigNumber(userAccount?.balance[currency.symbol] || 0));
  };

  const loadToAddressesAndAmounts = (recipientsAndAmountsStr: string) => {
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
    const remaining = new BigNumber(
      userAccount?.balance[currency.symbol] || 0
    ).minus(totalAmount);
    setRemaining(remaining);

    if (remaining.lt(0)) {
      setErrorText('Total exceeds balance');
    }
  };

  const onSubmit = async () => {
    if (!checkDone) {
      // TODO: Check if the address exists and has Vault.
      if (totalAmount.eq(0)) {
        setErrorText('Total is zero');
        return;
      }
      setCheckDone(true);
    } else {
      try {
        setErrorText('');
        const tx = await sendFT(
          toAddresses,
          amounts,
          currency.contractName,
          currency.address,
          currency.vaultStoragePath,
          currency.vaultPublicPath
        );
        setTxHash(tx.transactionId);
        setTxStatus(0)  // reset to 0
      } catch (e) {
        console.log('error:', e);
        setErrorText(String(e));
      }
    }
  };

  // on userAccount changed or textArea's text is modified
  useEffect(() => {
    setErrorText('');
    setCheckDone(false);
    if (!recipientTemplate) {
      resetConfirm();
      return;
    }
    loadToAddressesAndAmounts(recipientTemplate);
  }, [recipientTemplate, userAccount]);

  //  on txHash changed
  useEffect(() => {
    if (!txHash) {
      return
    }
    getTxChannel(txHash).subscribe((x: any) => {
      if(!x.status){
        return
      }
      console.log(`tx status[${x.status}]:`, x)
      setTxStatus(x.status)
    })
  }, [txHash])

  // on currency changed or tx status changed
  useEffect(() => {
    if (!userAccount) {
      return
    }
    const syncAccount = async () => {
      const balances = await getBalances(userAccount?.address)
      console.log(balances)
      setUserAccount({
        address: userAccount.address,
        dotFindName: '', // TODO:
        balance: {
          FLOW: Number(balances[0]).toFixed(8),
          FUSD: Number(balances[1]).toFixed(8),
        },
      })
    }
    syncAccount()
  }, [currency, txStatus])

  return (
    <Box p={4} bg={'white'} shadow='md' rounded='md'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Center>
          <Stack spacing={4} padding={4} width={[320, 400, 500]}>
            {userAccount ? (
              <>
                <Box>
                  <Heading as='h5' size='sm'>
                    Address
                  </Heading>{' '}
                  {userAccount.address}
                </Box>
                <Box>
                  <Heading as='h5' size='sm'>
                    Balance
                  </Heading>{' '}
                  {Number(userAccount.balance['FLOW'])} FLOW,{' '}
                  {Number(userAccount.balance['FUSD'])} FUSD
                  <Box>
                    <Button
                      marginTop={4}
                      colorScheme='gray'
                      size={'md'}
                      variant='link'
                      onClick={() => {
                        logout();
                        setUserAccount(null);
                      }}
                    >
                      Use another account
                    </Button>
                  </Box>
                </Box>
                <Box as='p'></Box>
              </>
            ) : null}
            <FormControl isInvalid={errors.email} className='mt-10'>
              <FormLabel htmlFor='currency'>
                <Heading as='h5' size='sm'>
                  Currency
                </Heading>{' '}
              </FormLabel>
              <Select
                id='currency'
                mb={6}
                size={'md'}
                onChange={(e) => {
                  const currencySymbol = e.target.value;
                  setCurrency(
                    currencySymbol === 'FLOW'
                      ? { ...FLOWCurrency }
                      : currencySymbol === 'FUSD'
                      ? { ...FUSDCurrency }
                      : { ...CustomCurrency }
                  );
                  setRemaining(
                    new BigNumber(
                      userAccount?.balance[currencySymbol] || 0
                    ).minus(totalAmount)
                  );
                }}
              >
                <option value='FLOW'>FLOW</option>
                <option value='FUSD'>FUSD</option>
              </Select>
              <FormLabel htmlFor='addresses'>
                <Heading as='h5' size='sm'>
                  Recipients & Amounts in {currency.symbol}
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
                  setRecipientTemplate(e.target.value);
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
                currencySymbol={currency.symbol}
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
              <SendButton
                status={txStatus}
                txid={txHash}
                isLoading={isSubmitting}
                disabled={!!errorText}
                checkDone={checkDone}
                symbol={currency.symbol}
                explorerUrl={explorerUrl}
                />
            </Center>
          </Stack>
        </Center>
      </form>
    </Box>
  );
};

export default BatchTransfer;
