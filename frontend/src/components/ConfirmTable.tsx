import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import styles from '../styles/ConfirmTable.module.css';
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

  useMemo(() => {
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
      if (err.index >= outputs.length) {
        return;
      }
      if (err.type == 'address') {
        outputs[err.index].addressError = err.message;
      } else {
        outputs[err.index].amountError = err.message;
      }
    }

    return outputs;
  }, [props.errors, props.toAddresses, props.amounts]);

  return (
    <table className={styles.table}>
      <tbody className={styles.tbody}>
        <tr className={styles.tr}>
          <th align='left' className={styles.th}>
            TOTAL
          </th>
          <td align='right' className={styles.td}>
            {props.totalAmount.toFormat() + ' ' + props.currencySymbol}
          </td>
        </tr>
        <tr className={styles.tr}>
          <th align='left' className={styles.th}>
            CURRENT BALANCE
          </th>
          <td align='right' className={styles.td}>
            {new BigNumber(
              userAccount?.balance[props.currencySymbol] || 0
            ).toFormat() +
              ' ' +
              props.currencySymbol}
          </td>
        </tr>
        <tr className={styles.tr}>
          <th align='left' className={styles.th}>
            BALANCE AFTER TRANSFER
          </th>
          <td align='right' className={styles.td}>
            {props.remaining.toFormat() + ' ' + props.currencySymbol}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default ConfirmTable;
