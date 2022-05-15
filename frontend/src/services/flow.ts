const fcl = require('@onflow/fcl');
// import * as fcl from '@onflow/fcl';
import * as types from '@onflow/types';

fcl.config({
  'accessNode.api': 'https://rest-testnet.onflow.org',
  // "accessNode.api": "https://access-testnet.onflow.org", // Mainnet: "https://access-mainnet-beta.onflow.org"
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn', // Mainnet: "https://fcl-discovery.onflow.org/authn"
  'app.detail.title': 'Batch Token Transfer Tool',
  'app.detail.icon':
    'https://batch-token-transfer-tool-dev.vercel.app/favicon.ico',
});

const connectWallet = async () => {
  const account = await fcl.authenticate();
  if (!account.loggedIn) {
    return null;
  }
  return account;
};

const getBalances = async (address: string) => {
  return await fcl.query({
    // Mainnet
    // import FungibleToken from 0xf233dcee88fe0abe
    // import FlowToken from 0x1654653399040a61
    // import FUSD from 0x3c5959b568896393
    // Testnet
    cadence: `
        import FungibleToken from 0x9a0766d93b6608b7
        import FlowToken from 0x7e60df042a9c0868
        import FUSD from 0xe223d8a629e49c68

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

const sendFLOW = async (
  toAddresses: string[],
  amounts: string[]
): Promise<any> => {
  // import FungibleToken from 0xf233dcee88fe0abe
  // import FlowToken from 0x1654653399040a61
  const txCode = `
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(toAddresses: [Address], amounts: [UFix64]) {
    prepare(signer: AuthAccount) {
        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow Vault")

        var i = 0
        while i < toAddresses.length {
            let receiverRef =  getAccount(toAddresses[i])
                .getCapability(/public/flowTokenReceiver)
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

export { connectWallet, getBalances, sendFLOW, waitTx };
