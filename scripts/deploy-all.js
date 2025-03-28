const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("Deploying all contracts...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Deploy the BattleFactory contract
    console.log("\nDeploying BattleFactory...");
    const BattleFactory = await ethers.getContractFactory("BattleFactory");
    const battleFactory = await BattleFactory.deploy();
    await battleFactory.waitForDeployment();
    
    const battleFactoryAddress = await battleFactory.getAddress();
    console.log("BattleFactory deployed to:", battleFactoryAddress);
    
    // Create an example battle to verify it works
    console.log("\nCreating an example battle...");
    const player1 = deployer.address;
    const betAmount = ethers.parseEther("0.01");
    const minimumCommittee = 3;
    const battleId = 1;
    
    const createBattleTx = await battleFactory.createBattle(
      battleId,
      player1,
      minimumCommittee,
      betAmount
    );
    
    console.log("Create battle transaction hash:", createBattleTx.hash);
    const createBattleReceipt = await createBattleTx.wait();
    console.log("Battle created successfully!");
    
    // Get the battle contract address from the event logs
    let battleAddress;
    if (createBattleReceipt.logs) {
      for (const log of createBattleReceipt.logs) {
        try {
          const parsedLog = battleFactory.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === "BattleCreated") {
            battleAddress = parsedLog.args.battleContract;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed as BattleCreated events
          continue;
        }
      }
    }
    
    console.log("Deployed Faucet contract address:", battleAddress);
    
    // Update the contracts/addresses.json file
    const fs = require("fs");
    const path = require("path");
    
    const addresses = {
      battleFactory: battleFactoryAddress,
      exampleBattle: battleAddress,
      network: network.name,
      chainId: network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };
    
    const addressesFilePath = path.join(__dirname, "../contracts/addresses.json");
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log(`\nContract addresses saved to ${addressesFilePath}`);
    
    // Display next steps
    console.log("\nNext steps:");
    console.log(`1. Update the BattleFactoryService.ts file with the deployed address: ${battleFactoryAddress}`);
    console.log("2. Update .env file with your private key for verification");
    console.log("3. Run npx hardhat verify --network sepolia " + battleFactoryAddress);
    
    // Verify on Etherscan if API key is provided
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("\nWaiting for block confirmations before verification...");
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for confirmations
      
      console.log("Verifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: battleFactoryAddress,
          constructorArguments: [],
        });
        console.log("Contract verified on Etherscan");
      } catch (error) {
        console.error("Error verifying contract:", error);
      }
    }
    
    return addresses;
  } catch (error) {
    console.error("Error deploying contracts:", error);
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