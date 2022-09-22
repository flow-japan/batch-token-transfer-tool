import { atom } from 'recoil';
import { Lang } from 'types/locale';

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

export const localeState = atom<Lang>({
  key: 'lang',
  default: 'en'
})
