import { atom } from 'recoil';

type UserAccount = {
  address: string;
  dotFindName: string;
  balance: { [index: string]: string };
};

type Network = {
  network: string;
};

export const userAccountState = atom<UserAccount | null>({
  key: 'userAccount',
  default: null,
});

export const networkState = atom<Network | null>({
  key: 'network',
  default: null,
});
