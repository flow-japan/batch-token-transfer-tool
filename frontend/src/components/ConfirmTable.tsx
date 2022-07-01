import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { userAccountState } from '../store';
import { ValidationError } from 'types/error';

type OutputWithError = {
  address: string;
  amount: string;
  addressError?: string;
  amountError?: string;
};

const ConfirmTable: React.FC<{
  toAddresses: string[];
  amounts: string[];
  totalAmount: BigNumber;
  remaining: BigNumber;
  currencySymbol: string;
  errors: ValidationError[];
}> = (props) => {
  const [userAccount] = useRecoilState(userAccountState);

  const outputs = useMemo(() => {
    const outputs: OutputWithError[] = [];

    if (props.toAddresses.length != props.amounts.length) {
      return outputs;
    }

    if (props.toAddresses.length == 0) {
      return outputs;
    }

    for (let i = 0; i < props.toAddresses.length; i++) {
      outputs.push({
        address: props.toAddresses[i],
        amount: props.amounts[i],
      });
    }

    for (const err of props.errors) {
      if (err.type == 'address') {
        outputs[err.index].addressError = err.message;
      } else {
        outputs[err.index].amountError = err.message;
      }
    }

    return outputs;
  }, [props.errors, props.toAddresses, props.amounts]);

  return (
    <TableContainer>
      <Table variant='unstyled' size='sm'>
        <Thead>
          <Tr>
            <Th>address</Th>
            <Th textAlign='right'>amount</Th>
          </Tr>
        </Thead>
        <Tbody>
          {outputs.length > 0 ? (
            outputs.map((output, index) => {
              return (
                <Tr key={index}>
                  <Tooltip
                    label={output.addressError ?? ''}
                    placement='left'
                    isOpen
                    bg='red.500'
                    hasArrow
                  >
                    <Td
                      color={output.addressError ? 'red' : 'black'}
                      fontWeight={output.addressError ? 'bold' : 'normal'}
                    >
                      {output.address}
                    </Td>
                  </Tooltip>
                  <Tooltip
                    label={output.amountError ?? ''}
                    placement='right'
                    isOpen
                    bg='red.500'
                    hasArrow
                  >
                    <Td
                      color={output.amountError ? 'red' : 'black'}
                      textAlign='right'
                      fontWeight={output.amountError ? 'bold' : 'normal'}
                    >
                      {output.amount}
                    </Td>
                  </Tooltip>
                </Tr>
              );
            })
          ) : (
            <Tr>
              <Td>―</Td>
              <Td textAlign='right'>―</Td>
            </Tr>
          )}
        </Tbody>
        <Tfoot>
          <Tr>
            <Th>Total</Th>
            <Th>
              <Flex justifyContent={'right'}>
                <Text fontSize='sm'>{props.totalAmount.toString()}</Text>
                <Text fontSize='xs' paddingLeft={1}>
                  {props.currencySymbol}
                </Text>
              </Flex>
            </Th>
          </Tr>
          <Tr>
            <Th>Your Balance</Th>
            <Th>
              <Flex justifyContent={'right'}>
                <Text fontSize='sm'>
                  {new BigNumber(
                    userAccount?.balance[props.currencySymbol] || 0
                  ).toString()}
                </Text>
                <Text fontSize='xs' paddingLeft={1}>
                  {props.currencySymbol}
                </Text>
              </Flex>
            </Th>
          </Tr>
          <Tr>
            <Th>Remaining</Th>
            <Th>
              <Flex justifyContent={'right'}>
                <Text fontSize='sm'>{props.remaining.toString()}</Text>
                <Text fontSize='xs' paddingLeft={1}>
                  {props.currencySymbol}
                </Text>
              </Flex>
            </Th>
          </Tr>
        </Tfoot>
      </Table>
    </TableContainer>
  );
};

export default ConfirmTable;
