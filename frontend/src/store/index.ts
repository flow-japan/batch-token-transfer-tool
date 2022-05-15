import { atom } from 'recoil';

type UserAccount = {
  address: string;
  dotFindName: string;
  balanceFLOW: string;
  balanceFUSD: string;
};

export const userAccountState = atom<UserAccount | null>({
  key: 'userAccount',
  default: null,
});
