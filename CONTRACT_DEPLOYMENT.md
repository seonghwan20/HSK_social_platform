# Battle Contract Deployment Guide

This guide explains how to deploy the Battle game smart contracts to the Sepolia testnet.

## Prerequisites

- Node.js and npm installed
- MetaMask wallet with Sepolia ETH (obtain from a faucet like https://sepoliafaucet.com/)
- Infura account or another Ethereum node provider (optional)
- Etherscan API key for contract verification (optional)

## Setup

1. Create a `.env` file in the project root based on `.env.example`:

```
# Private key of the account used for deployment
PRIVATE_KEY=your_private_key_here

# Infura project ID or URL (optional - defaults to a public endpoint)
INFURA_API_KEY=your_infura_api_key

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. Install dependencies:

```bash
npm install
```

3. Compile the contracts:

```bash
npx hardhat compile
```

## Deploy to Sepolia testnet

Deploy the BattleFactory contract which will be used to create and manage battle games:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

After deployment, the contract address will be displayed in the console. Copy this address and update it in:

```javascript
// src/services/contracts/BattleFactoryService.ts
const BATTLE_FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed contract address
```

## Verify contract on Etherscan (optional)

If you have an Etherscan API key in your `.env` file, verification will be attempted automatically during deployment.

If you need to verify the contract manually:

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Contract Interactions

After deployment, you can use the application UI to:

1. Create new battles (deploys Faucet contracts)
2. Accept battles (deploys SideBetting contracts)
3. Join as committee members
4. Vote on battle results
5. Claim winnings

## Testing locally

To test the contracts in a local environment:

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## Contract Addresses

After deployment, store your contract addresses here for reference:

- BattleFactory: [TBD]

## Sepolia Testnet Information

- Network Name: Sepolia Test Network
- RPC URL: https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
- Chain ID: 11155111 (0xaa36a7 in hex)
- Currency Symbol: ETH
- Block Explorer URL: https://sepolia.etherscan.io