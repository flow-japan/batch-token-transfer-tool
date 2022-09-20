const fcl = require('@onflow/fcl'); // Using import causes an error.
import * as types from '@onflow/types';

fcl.config({
  'app.detail.title': 'Batch Token Transfer Tool',
  'app.detail.icon': 'https://batch-token-transfer-tool.vercel.app/logo.png',
});

const fungibleTokenAddresses = {
  mainnet: '0xf233dcee88fe0abe',
  testnet: '0x9a0766d93b6608b7'
}

const flowTokenAddresses = {
  mainnet: '0x1654653399040a61',
  testnet: '0x7e60df042a9c0868'
}

const fusdAddresses = {
  mainnet: '0x3c5959b568896393',
  testnet: '0xe223d8a629e49c68'
}

const connectWallet = async (network: string = 'testnet', setter: any) => {
  fcl.config()
    .put('accessNode.api', network === 'mainnet'
      ? 'https://rest-mainnet.onflow.org'
      : 'https://rest-testnet.onflow.org')
    .put('discovery.wallet', network === 'mainnet'
      ? 'https://fcl-discovery.onflow.org/authn'
      : 'https://fcl-discovery.onflow.org/testnet/authn')
    .put('0xFUNGIBLETOKEN', fungibleTokenAddresses[network])
    .put('0xFLOWTOKEN', flowTokenAddresses[network])
    .put('0xFUSD', fusdAddresses[network])
  try {
    await fcl.authenticate();
  } catch (e) {
    console.log(e);
    return null;
  }
  fcl.currentUser().subscribe(setter);
};

const logout = async () => {
  fcl.unauthenticate();
};

const getBalances = async (address: string) => {
  return await fcl.query({
    cadence: `
        import FungibleToken from 0xFUNGIBLETOKEN
        import FlowToken from 0xFLOWTOKEN
        import FUSD from 0xFUSD

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

const getTxChannel = (txid: string) => {
  return fcl.tx(txid);
};

const sendFT = async (
  toAddresses: string[],
  amounts: string[],
  currencyContractName: string,
  currencyAddress: string,
  currencyVaultStoragePath: string,
  currencyVaultPublicPath: string
): Promise<any> => {
  const txCode = `
import FungibleToken from 0xFUNGIBLETOKEN
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

const hasVault = async (
  addresses: string[],
  currencyContractAddress: string,
  currencyContractName: string,
  currenctBlancePathName: string,
): Promise<boolean[]> => {
  const script = `
import FungibleToken from 0xFUNGIBLETOKEN
import ${currencyContractName} from ${currencyContractAddress}

pub fun main(addresses: [Address]): [Bool] {
  let res: [Bool] = []

  for address in addresses {
    let acct = getAccount(address)
    if acct == nil {
      res.append(false)
      continue
    }

    let cap = acct.getCapability(/public/${currenctBlancePathName})
    if cap == nil {
      res.append(false)
      continue
    }

    let vaultRef = cap.borrow<&${currencyContractName}.Vault{FungibleToken.Balance}>()
    res.append(vaultRef != nil)
  }
  
  return res
}`;

  const res = await fcl.query({
    cadence: script,
    args: (arg: any) => [arg(addresses, types.Array(types.Address))],
  });

  return res;
}

const hasFlowVault = async (
  addresses: string[],
  network: string = 'testnet',
): Promise<boolean[]> => {
  return await hasVault(addresses, flowTokenAddresses[network], 'FlowToken', 'flowTokenBalance');
}

const hasFusdVault = async (
  addresses: string[],
  network: string = 'testnet',
): Promise<boolean[]> => {
  return await hasVault(addresses, fusdAddresses[network], 'FUSD', 'fusdBalance');
}

export { connectWallet, logout, getBalances, sendFT, getTxChannel, hasVault, hasFlowVault, hasFusdVault };
