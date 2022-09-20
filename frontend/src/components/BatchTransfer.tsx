import { BigNumber } from 'bignumber.js';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  SimpleGrid,
  Flex,
  Spinner,
  Text,
  FormControl,
  Select,
  Input,
  Link,
  useMediaQuery,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useRecoilState } from 'recoil';
import { userAccountState, networkState } from '../store';
import {
  logout,
  sendFT,
  getTxChannel,
  getBalances,
  hasFlowVault,
  hasVault,
} from '../services/flow';
import ConfirmTable from './ConfirmTable';
import styles from '../styles/BatchTransfer.module.css';
import { ValidationError } from 'types/error';
import { CustomCurrency, FLOWCurrency, FUSDCurrency } from 'types/currency';
import { Output } from 'types/transaction';

const explorerUrls = {
  mainnet: 'https://flowscan.org/transaction/',
  // testnet: 'https://testnet.flowscan.org/transaction/',
  testnet: 'https://flow-view-source.com/testnet/tx/',
};

const isValidAddress = (address: string): boolean => {
  if (!address) {
    return true;
  }
  return !!address.match(/^0x[0-9a-f]{16}$/);
};

const BatchTransfer = () => {
  const emptyOutput = {
    address: '',
    amount: 0,
    amountStr: '',
  };
  const [isSmallerThan768] = useMediaQuery('(max-width: 768px)');
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();
  const [userAccount, setUserAccount] = useRecoilState(userAccountState);
  const [network] = useRecoilState(networkState);
  const [currency, setCurrency] = useState(FLOWCurrency);
  const [outputs, setOutputs] = useState<Output[]>([emptyOutput]);

  const [totalAmount, setTotalAmount] = useState<BigNumber>(new BigNumber(0.0));

  const [remaining, setRemaining] = useState<BigNumber>(new BigNumber(0.0));
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState(-1);

  const [errorText, setErrorText] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  const addRecipientAndAmount = () => {
    setOutputs([...outputs, emptyOutput]);
  };

  const removeRecipientAndAmount = (index: number) => {
    const newOutputs = [...outputs];
    newOutputs.splice(index, 1);
    setOutputs(newOutputs);
  };

  const updateRecipient = (index: number, address: string) => {
    if (address.match(/.+[, \t].+/)) {
      // Support batch pasting of CSV text
      const csvStr = address;
      const newOutputs: Output[] = [];

      const chunkArray = ([...array], size = 1) => {
        return array.reduce(
          (acc, _value, index) =>
            index % size ? acc : [...acc, array.slice(index, index + size)],
          []
        );
      };

      chunkArray(
        csvStr.split(/,| |\t|\r\n|\n/).filter((v) => !!v),
        2
      ).map((recipientsAndAmount) => {
        const [toAddress, amountStr] = recipientsAndAmount;
        newOutputs.push({
          address: toAddress,
          amount: Number(amountStr || 0),
          amountStr,
        });
      });
      const temp = [...outputs];
      temp.splice(index, temp.length);
      setOutputs([...temp, ...newOutputs]);
    } else {
      const newOutputs = [...outputs];
      newOutputs[index].address = address;
      setOutputs(newOutputs);
    }
  };

  const updateAmount = (index: number, amountStr: string) => {
    const amount = Number(amountStr || 0);
    const newOutputs = [...outputs];
    newOutputs[index].amount = amount;
    newOutputs[index].amountStr = amountStr;
    setOutputs(newOutputs);
  };

  const updateTransactionDetails = (outputs) => {
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
      if (isNaN(outputs[i].amountStr)) {
        addressErrors.push({
          index: i,
          type: 'amount',
          message: 'not number',
        });
      }
    }

    setErrorText('');
    setValidationErrors(addressErrors);
    // MEMO: A little less visually pleasing, so off-chain validation is not shown in the error message
    // if (addressErrors.length > 0) {
    //   setErrorText(
    //     `${addressErrors.length} error${
    //       addressErrors.length == 1 ? '' : 's'
    //     } found`
    //   );
    //   return;
    // }

    if (remaining.lt(0)) {
      setErrorText('Error: Total exceeds balance');
    }
  };

  const validateOutputsOnChain = useCallback(async () => {
    const addressErrors: ValidationError[] = [];

    const addresses = outputs.map((x) => x.address);
    if (addresses.includes('')) {
      addresses.map((address, i) => {
        if (address === '') {
          addressErrors.push({
            index: i,
            type: 'address',
            message: 'invalid address',
          });
        }
      });
      setValidationErrors(addressErrors);
      return;
    }

    const exists = await hasFlowVault(addresses, network?.network);
    exists.map((ok, i) => {
      if (!ok) {
        addressErrors.push({
          index: i,
          type: 'address',
          message: 'address not exist',
        });
      }
    });

    if (currency.symbol !== FLOWCurrency.symbol) {
      const pathIdentifier = currency.vaultPublicPath.split('/')[2];
      if (!pathIdentifier) {
        setErrorText(`Error: Token's vault public path is wrong`);
        return false;
      }
      const hasReceivers = await hasVault(
        outputs.map((x) => x.address),
        currency.addresses[network?.network || 'testnet'],
        currency.contractName,
        pathIdentifier
      );
      hasReceivers.map((ok, i) => {
        if (!ok) {
          if (addressErrors.filter((x) => x.index == i).length == 0) {
            addressErrors.push({
              index: i,
              type: 'address',
              message: `doesn't have vault for ${currency.symbol}`,
            });
          }
        }
      });
    }

    setErrorText('');
    setValidationErrors(addressErrors);
    if (addressErrors.length > 0) {
      setErrorText(
        `${addressErrors.length} error${
          addressErrors.length == 1 ? '' : 's'
        } found`
      );
      return false;
    }
    return true;
  }, [outputs, currency]);

  const onSubmit = async () => {
    if (totalAmount.eq(0)) {
      setErrorText('Error: Total is zero');
      return;
    }

    const receiverCheck = await validateOutputsOnChain();
    if (!receiverCheck) {
      return;
    }

    try {
      setErrorText('');
      const tx = await sendFT(
        outputs.map((x) => x.address),
        outputs.map((x) => x.amountStr),
        currency.contractName,
        currency.addresses[network?.network || 'testnet'],
        currency.vaultStoragePath,
        currency.vaultPublicPath
      );
      setTxHash(tx.transactionId);
      setTxStatus(0); // reset to 0
    } catch (e) {
      console.log('error:', e);
      setErrorText(String(e));
    }
  };

  useEffect(() => {
    setTxHash('');
    setTxStatus(-1);
    updateTransactionDetails(outputs);
  }, [outputs]);

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
    <>
      <VStack align={'center'}>
        <Box className={styles.box}>
          <Text className={styles.h1}>Tranfer Flow</Text>
          <Text className={styles.h2}>
            The Flow Token Transfer Tool allows for a user to easily set up and
            automate transfers to multiple Flow wallet addresses from a single
            Flow wallet address.
          </Text>
          <Text className={styles.h2}>
            Useful to anyone who manages a community or works with multiple
            collaborators, this tool saves users the time required to initiate
            transfers individually to large groups of people, by enabling you to
            do them all at once.
          </Text>

          <Text className={styles.h1}>Your Wallet</Text>

          <table className={styles.table}>
            <tbody className={styles.tbody}>
              <tr className={styles.tr}>
                <th align='left' className={styles.th}>
                  ADDRESS
                </th>
                <td align='right' className={styles.td}>
                  {userAccount?.address}
                </td>
              </tr>
              <tr className={styles.tr}>
                <th align='left' className={styles.th}>
                  BALANCE
                </th>
                <td align='right' className={styles.td}>
                  {Number(userAccount ? userAccount?.balance['FLOW'] : '-')}{' '}
                  FLOW{isSmallerThan768 ? <br /> : ', '}
                  {Number(
                    userAccount ? userAccount?.balance['FUSD'] : '-'
                  )}{' '}
                  FUSD
                </td>
              </tr>
            </tbody>
          </table>

          <Text className={styles.h1}>Transaction</Text>
          <FormControl>
            <table className={styles.table}>
              <tbody className={styles.tbody}>
                <tr className={styles.tr}>
                  <th align='left' className={styles.th}>
                    TOKEN
                  </th>
                </tr>
                <tr className={styles.tr}>
                  <th align='left' className={styles.th}>
                    <div className='tokenSelect'>
                      <Select
                        id='currency'
                        size={isSmallerThan768 ? 'sm' : 'lg'}
                        rounded={'md'}
                        focusBorderColor={'brand.500'}
                        borderWidth={'1.5px'}
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
                    </div>
                  </th>
                </tr>
                <tr className={styles.tr}>
                  <th align='left' className={styles.th}>
                    {'RECIPIENTS & AMOUNTS'}
                  </th>
                </tr>
                {outputs.map((output, index) => {
                  let err: ValidationError | undefined;
                  if (validationErrors.length > 0) {
                    err = validationErrors.find(
                      (err) => err.type === 'address' && err.index === index
                    );
                  }
                  return (
                    <tr className={styles.tr} key={index}>
                      <th align='left' className={styles.recipientsTh}>
                        <SimpleGrid
                          columns={2}
                          spacing={5}
                          alignItems={'start'}
                          key={index}
                        >
                          <VStack align={'left'}>
                            <Input
                              className={styles.recipientInput}
                              placeholder={'0x74c8be713d59bc63'}
                              size={isSmallerThan768 ? 'sm' : 'lg'}
                              rounded={'md'}
                              focusBorderColor={'brand.500'}
                              borderWidth={'1.5px'}
                              value={output.address}
                              onChange={(e) => {
                                updateRecipient(index, e.target.value);
                              }}
                            />

                            {err ? (
                              <Text className={styles.recipientErrorMessage}>
                                {err?.message}
                              </Text>
                            ) : null}
                          </VStack>
                          {index === 0 ? (
                            <Input
                              className={styles.recipientInput}
                              // type={'number'} // Prevent accidental changes with up/down keys
                              placeholder={'0.01'}
                              size={isSmallerThan768 ? 'sm' : 'lg'}
                              rounded={'md'}
                              focusBorderColor={'brand.500'}
                              borderWidth={'1.5px'}
                              value={output.amountStr}
                              onChange={(e) => {
                                updateAmount(index, e.target.value);
                              }}
                            />
                          ) : (
                            <Flex alignItems={'center'} gap={5}>
                              <Input
                                className={styles.recipientInput}
                                // type={'number'} // Prevent accidental changes with up/down keys
                                placeholder={'0.01'}
                                size={isSmallerThan768 ? 'sm' : 'lg'}
                                rounded={'md'}
                                focusBorderColor={'brand.500'}
                                borderWidth={'1.5px'}
                                value={output.amountStr}
                                onChange={(e) => {
                                  updateAmount(index, e.target.value);
                                }}
                              />
                              <button
                                className={styles.removeRecipientButton}
                                onClick={() => removeRecipientAndAmount(index)}
                              >
                                {'-'}
                              </button>
                            </Flex>
                          )}
                        </SimpleGrid>
                      </th>
                    </tr>
                  );
                })}
                <tr className={styles.tr}>
                  <th align='left' className={styles.recipientsTh}>
                    <button
                      className={styles.addRecipientButton}
                      onClick={addRecipientAndAmount}
                    >
                      ADD RECIPIENT +
                    </button>
                  </th>
                </tr>
              </tbody>
            </table>
          </FormControl>

          <Text className={styles.h1}>Transaction Details</Text>
          <ConfirmTable
            toAddresses={outputs.map((x) => x.address)}
            amounts={outputs.map((x) => x.amountStr)}
            totalAmount={totalAmount}
            remaining={remaining}
            currencySymbol={currency.symbol}
            errors={validationErrors}
          />

          {!txHash ? (
            <Box className={styles.sendButtonsBox}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <SimpleGrid columns={2} spacing={5}>
                  <button
                    className={styles.switchAccountButton}
                    onClick={() => {
                      logout();
                      setUserAccount(null);
                    }}
                  >
                    SWITCH ACCOUNT
                  </button>

                  <button
                    className={styles.sendTokenButton}
                    type='submit'
                    disabled={validationErrors.length > 0 || isSubmitting}
                  >
                    {!isSubmitting ? 'SEND TOKENS' : <Spinner />}
                  </button>
                </SimpleGrid>
              </form>
            </Box>
          ) : null}

          {!!txHash && txStatus == 4 ? (
            <Box
              className={`${styles.messageBox} ${styles.txCompletedMessage}`}
            >
              <Text>YOUR TRANSACTION WAS COMPLETED.</Text>
              <Link
                href={explorerUrls[network?.network || 'testnet'] + txHash}
                isExternal
              >
                VIEW ON FLOWSCAN{' '}
                <span style={{ fontSize: '80%', fontWeight: '700' }}>↗</span>
              </Link>
            </Box>
          ) : txHash ? (
            <Box
              className={`${styles.messageBox} ${styles.txSubmittedMessage}`}
            >
              <Text>YOUR TRANSACTION IS IN PROGRESS.</Text>
              <Text>THIS PROCESS CAN TAKE UP TO A MINUTE.</Text>
            </Box>
          ) : null}

          {errorText ? (
            <Box className={`${styles.messageBox} ${styles.errorMessage}`}>
              {errorText}
            </Box>
          ) : null}

          <div className={styles.bottomMargin} />
        </Box>
      </VStack>
    </>
  );
};

export default BatchTransfer;
