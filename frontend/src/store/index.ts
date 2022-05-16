import { atom } from 'recoil';

type UserAccount = {
  address: string;
  dotFindName: string;
  balance: { [index: string]: string }
};

export const userAccountState = atom<UserAccount | null>({
  key: 'userAccount',
  default: null,
});
