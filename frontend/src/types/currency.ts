export type Currency = {
  symbol: string;
  contractName: string;
  address: string;
  vaultStoragePath: string;
  vaultPublicPath: string;
};

export const FLOWCurrency: Currency = {
  symbol: 'FLOW',
  contractName: 'FlowToken',
  address:
    process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
      ? '0x1654653399040a61'
      : '0x7e60df042a9c0868',
  vaultStoragePath: '/storage/flowTokenVault',
  vaultPublicPath: '/public/flowTokenReceiver',
};

export const CustomCurrency: Currency = {
  symbol: '',
  contractName: '',
  address: '',
  vaultStoragePath: '',
  vaultPublicPath: '',
};

export const FUSDCurrency: Currency = {
  symbol: 'FUSD',
  contractName: 'FUSD',
  address:
    process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
      ? '0x3c5959b568896393'
      : '0xe223d8a629e49c68',
  vaultStoragePath: '/storage/fusdVault',
  vaultPublicPath: '/public/fusdReceiver',
};
