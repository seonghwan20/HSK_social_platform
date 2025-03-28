const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("Deploying BattleFactory contract...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Deploy the BattleFactory contract
    const BattleFactory = await ethers.getContractFactory("BattleFactory");
    const battleFactory = await BattleFactory.deploy();
    await battleFactory.waitForDeployment();
    
    const address = await battleFactory.getAddress();
    console.log("BattleFactory deployed to:", address);
    
    // Verify on Etherscan if API key is provided
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("Waiting for block confirmations...");
      await battleFactory.deploymentTransaction().wait(6);
      
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    }
    
    return address;
  } catch (error) {
    console.error("Error deploying contract:", error);
    process.exit(1);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });