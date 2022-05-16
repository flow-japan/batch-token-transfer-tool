import { BigNumber } from 'bignumber.js';
import React from 'react';
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
} from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { userAccountState } from '../store';

const ConfirmTable: React.FC<{
  toAddresses: string[];
  amounts: string[];
  totalAmount: BigNumber;
  remaining: BigNumber;
  currencySymbol: string;
}> = (props) => {
  const [userAccount] = useRecoilState(userAccountState);

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
          {props.toAddresses.length > 0 ? (
            props.toAddresses.map((toAddress, index) => {
              return (
                <Tr key={index}>
                  <Td>{toAddress}</Td>
                  <Td textAlign='right'>{props.amounts[index]}</Td>
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
