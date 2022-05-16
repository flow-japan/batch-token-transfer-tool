const fcl = require('@onflow/fcl'); // Using import causes an error.
import * as types from '@onflow/types';

fcl.config({
  'accessNode.api': process.env.NEXT_PUBLIC_NETWORK == 'mainnet' ? 'https://rest-mainnet.onflow.org' : 'https://rest-testnet.onflow.org',
  'discovery.wallet': process.env.NEXT_PUBLIC_NETWORK == 'mainnet' ? "https://fcl-discovery.onflow.org/authn" : 'https://fcl-discovery.onflow.org/testnet/authn',
  'app.detail.title': 'Batch Token Transfer Tool',
  'app.detail.icon':
    'https://batch-token-transfer-tool-dev.vercel.app/logo.png',
});

const fungibleTokenAddress =
  process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
    ? '0xf233dcee88fe0abe'
    : '0x9a0766d93b6608b7';

const flowTokenAddress =
  process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
    ? '0x1654653399040a61'
    : '0x7e60df042a9c0868';

const fusdAddress =
  process.env.NEXT_PUBLIC_NETWORK == 'mainnet'
    ? '0x3c5959b568896393'
    : '0xe223d8a629e49c68';

const connectWallet = async () => {
  const account = await fcl.authenticate();
  if (!account.loggedIn) {
    return null;
  }
  return account;
};

const logout = async () => {
  fcl.unauthenticate();
};

const getBalances = async (address: string) => {
  return await fcl.query({
    cadence: `
        import FungibleToken from ${fungibleTokenAddress}
        import FlowToken from ${flowTokenAddress}
        import FUSD from ${fusdAddress}

        pub fun main(address: Address): [UFix64] {
            let acct = getAccount(address)

            let flowVaultRef = acct.getCapability(/public/flowTokenBalance).borrow<&FlowToken.Vault{FungibleToken.Balance}>()
                ?? panic("Could not borrow FLOW Vault")
            let flowBalance = flowVaultRef.balance

            let fusdVaultRef = acct.getCapability(/public/fusdBalance)!.borrow<&FUSD.Vault{FungibleToken.Balance}>()
                ?? nil

            return [
                flowBalance,
                fusdVaultRef == nil ? 0.0 : fusdVaultRef!.balance
            ]
        }`,
    args: (arg: any) => [arg(address, types.Address)],
  });
};

const sendTx = async (txCode: string, args: any) => {
  const authz = fcl.currentUser().authorization;
  return await fcl.send([
    fcl.transaction(txCode),
    fcl.args(args),
    fcl.proposer(authz),
    fcl.authorizations([authz]),
    fcl.payer(authz),
    fcl.limit(9999),
  ]);
};

const waitTx = async (tx: any) => {
  await fcl.tx(tx).onceSealed();
};

const sendFT = async (
  toAddresses: string[],
  amounts: string[],
  currencyContractName: string,
  currencyAddress: string,
  currencyVaultStoragePath: string,
  currencyVaultPublicPath: string,
): Promise<any> => {
  const txCode = `
import FungibleToken from ${fungibleTokenAddress}
import ${currencyContractName} from ${currencyAddress}

transaction(toAddresses: [Address], amounts: [UFix64]) {
    prepare(signer: AuthAccount) {
        let vaultRef = signer.borrow<&${currencyContractName}.Vault>(from: ${currencyVaultStoragePath})
            ?? panic("Could not borrow Vault")

        var i = 0
        while i < toAddresses.length {
            let receiverRef =  getAccount(toAddresses[i])
                .getCapability(${currencyVaultPublicPath})
                .borrow<&{FungibleToken.Receiver}>()
            if receiverRef != nil {
                let sentVault <- vaultRef.withdraw(amount: amounts[i])
                receiverRef!.deposit(from: <-sentVault)
            }
            i = i + 1 as Int
        }
    }
}`;
  const args = [
    fcl.arg(toAddresses, types.Array(types.Address)),
    fcl.arg(amounts, types.Array(types.UFix64)),
  ];
  return await sendTx(txCode, args);
};

export { connectWallet, logout, getBalances, sendFT, waitTx };
