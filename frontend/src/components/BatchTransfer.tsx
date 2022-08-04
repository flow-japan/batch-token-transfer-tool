import { BigNumber } from 'bignumber.js';
import React, { useState, useEffect, useCallback } from 'react';
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
import { logout, sendFT, getTxChannel, getBalances, hasFlowVault, hasVault } from '../services/flow';
import ConfirmTable from '../components/ConfirmTable';
import SendButton from './SendButton';
import { ValidationError } from 'types/error';
import { CustomCurrency, FLOWCurrency, FUSDCurrency } from 'types/currency';
import { Output } from 'types/transaction';

const explorerUrl =
  process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
    ? 'https://flowscan.org/transaction/'
    : 'https://testnet.flowscan.org/transaction/';

const isValidAddress = (address: string): boolean => {
  if (!address) {
    return false;
  }
  return !!address.match(/^0x[0-9a-f]{16}$/);
};

const BatchTransfer = () => {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [userAccount, setUserAccount] = useRecoilState(userAccountState);
  const [currency, setCurrency] = useState(FLOWCurrency);
  const [outputsTemplate, setOutputsTemplate] = useState(''); // text area
  const [outputs, setOutputs] = useState<Output[]>([]);

  const [totalAmount, setTotalAmount] = useState<BigNumber>(new BigNumber(0.0));

  const [remaining, setRemaining] = useState<BigNumber>(new BigNumber(0.0));
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState(-1);

  const [errorText, setErrorText] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [checkDone, setCheckDone] = useState(false);

  const resetConfirm = () => {
    setOutputs([]);
    setTotalAmount(new BigNumber(0.0));
    setRemaining(new BigNumber(userAccount?.balance[currency.symbol] || 0));
  };

  const loadToAddressesAndAmounts = (recipientsAndAmountsStr: string) => {
    const outputs: Output[] = [];
    recipientsAndAmountsStr
      .split(/\r\n|\n/)
      .filter((v) => !!v)
      .map((recipientsAndAmount) => {
        const [toAddress, amountStr] = recipientsAndAmount
          .split(/[ ,]+/)
          .filter((v) => !!v);

        const amount = Number(amountStr || 0);
        const output: Output = {
          address: toAddress,
          amount: amount,
          amountStr: amount.toFixed(8).toString(),
        };
        outputs.push(output);
      });
    setOutputs(outputs);

    const totalAmount = outputs
      .map((x) => x.amount)
      .reduce(
        (sum, amount) => sum.plus(new BigNumber(amount)),
        new BigNumber(0.0)
      );
    setTotalAmount(totalAmount);

    const remaining = new BigNumber(
      userAccount?.balance[currency.symbol] || 0
    ).minus(totalAmount);
    setRemaining(remaining);

    const addressErrors: ValidationError[] = [];
    for (let i = 0; i < outputs.length; i++) {
      if (!isValidAddress(outputs[i].address)) {
        addressErrors.push({
          index: i,
          type: 'address',
          message: 'invalid address',
        });
      }
      if (outputs[i].amount < 0) {
        addressErrors.push({
          index: i,
          type: 'amount',
          message: 'negative amount',
        });
      }
      if (outputs[i].amountStr == 'NaN') {
        addressErrors.push({
          index: i,
          type: 'amount',
          message: 'not number',
        });
      }
    }

    setValidationErrors(addressErrors);
    if (addressErrors.length > 0) {
      setErrorText(
        `${addressErrors.length} error${
          addressErrors.length == 1 ? '' : 's'
        } found`
      );
      return;
    }

    if (remaining.lt(0)) {
      setErrorText('Total exceeds balance');
    }
  };

  const validateOutputsOnChain = useCallback(async () => {
    const addressErrors: ValidationError[] = [];

    const exists = await hasFlowVault(outputs.map(x => x.address))
    console.log('exists', exists)
    exists.map((ok, i) => {
      if(!ok) {
        addressErrors.push({
          index: i,
          type: 'address',
          message: 'address not exist'
        })
      }
    })

    if(currency.symbol !== FLOWCurrency.symbol) {
      const pathIdentifier = currency.vaultPublicPath.split('/')[2]
      if(!pathIdentifier) {
        setErrorText(`Token's vault public path is wrong`);
        return false
      }
      const hasReceivers = await hasVault(outputs.map(x => x.address), currency.address, currency.contractName, pathIdentifier)
      hasReceivers.map((ok, i) => {
        if(!ok) {
          if(addressErrors.filter(x => x.index == i).length == 0) {
            addressErrors.push({
              index: i,
              type: 'address',
              message: `doesn't have vault for ${currency.symbol}`
            })
          }
        }
      })
    }

    setValidationErrors(addressErrors);
    if (addressErrors.length > 0) {
      setErrorText(
        `${addressErrors.length} error${
          addressErrors.length == 1 ? '' : 's'
        } found`
      );
      return false;
    }
    return true
  }, [outputs, currency])

  const onSubmit = async () => {
    if (!checkDone) {
      if (totalAmount.eq(0)) {
        setErrorText('Total is zero');
        return;
      }

      const receiverCheck = await validateOutputsOnChain()
      if(!receiverCheck) {
        return
      }

      setCheckDone(true);
    } else {
      try {
        setErrorText('');
        const tx = await sendFT(
          outputs.map((x) => x.address),
          outputs.map((x) => x.amountStr),
          currency.contractName,
          currency.address,
          currency.vaultStoragePath,
          currency.vaultPublicPath
        );
        setTxHash(tx.transactionId);
        setTxStatus(0); // reset to 0
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
    if (!outputsTemplate) {
      resetConfirm();
      return;
    }
    loadToAddressesAndAmounts(outputsTemplate);
  }, [outputsTemplate, userAccount]);

  //  on txHash changed
  useEffect(() => {
    if (!txHash) {
      return;
    }
    getTxChannel(txHash).subscribe((x: any) => {
      if (!x.status) {
        return;
      }
      console.log(`tx status[${x.status}]:`, x);
      setTxStatus(x.status);
    });
  }, [txHash]);

  // on currency changed or tx status changed
  useEffect(() => {
    if (!userAccount) {
      return;
    }
    const syncAccount = async () => {
      const balances = await getBalances(userAccount?.address);
      setUserAccount({
        address: userAccount.address,
        dotFindName: '', // TODO:
        balance: {
          FLOW: Number(balances[0]).toFixed(8),
          FUSD: Number(balances[1]).toFixed(8),
        },
      });
    };
    syncAccount();
  }, [currency, txStatus]);

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
                  setOutputsTemplate(e.target.value);
                }}
              />
            </FormControl>
            <Divider />
            <Heading as='h5' size='sm'>
              Confirm
            </Heading>{' '}
            <Box as='div'>
              <ConfirmTable
                toAddresses={outputs.map((x) => x.address)}
                amounts={outputs.map((x) => x.amountStr)}
                totalAmount={totalAmount}
                remaining={remaining}
                currencySymbol={currency.symbol}
                errors={validationErrors}
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
