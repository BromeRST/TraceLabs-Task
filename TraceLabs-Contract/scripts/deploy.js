const hre = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

async function main() {

  const TEN_MINUTES_IN_SECONDS = 600; //TODO: change it to change contract periods of time
  const TOKEN_RINKEBY_ADDRESS = "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735"; //TODO: insert ERC20 token address (in this case is RINKEBY DAI)
  const deposit = ethers.utils.parseEther("1000");

  const deployer = await ethers.provider.getSigner("0x36c1BfF2BEB82Ec4383EE06C1Aca2E12CFC259a0") //TODO: insert deployer address
  const daiContract =  await ethers.getContractAt("IERC20", TOKEN_RINKEBY_ADDRESS, deployer);

  const transactionCount = await deployer.getTransactionCount();
    
  const futureAddress = getContractAddress({
    from: deployer._address,
    nonce: transactionCount + 1,
  })
    
  await daiContract.approve(futureAddress, deposit);

  const TraceLabs = await hre.ethers.getContractFactory("TraceLabs", deployer);
  const traceLabs = await TraceLabs.deploy(TEN_MINUTES_IN_SECONDS, deposit, TOKEN_RINKEBY_ADDRESS);

  await traceLabs.deployed();

  console.log("contract deployed to:", traceLabs.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});