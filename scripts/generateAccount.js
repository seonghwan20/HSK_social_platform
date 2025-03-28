const { ethers } = require("hardhat");

async function main() {
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("New test account generated:");
  console.log("-----------------------------------");
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey);
  console.log("-----------------------------------");
  console.log("To use this account:");
  console.log("1. Add the private key to your .env file (without 0x prefix)");
  console.log("2. Get Sepolia ETH from a faucet: https://sepoliafaucet.com/");
  console.log("   - Enter the address above");
  console.log("   - Complete captcha/verification");
  console.log("   - Wait for ETH to arrive (may take a few minutes)");
  console.log("3. Try deploying again with your funded account");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });