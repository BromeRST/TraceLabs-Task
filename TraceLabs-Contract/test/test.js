const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

let
  contract, 
  deployer, 
  signer1, 
  signer2, 
  signer3, 
  signer4, 
  firstSigner, 
  secondSigner, 
  thirdSigner, 
  fourthSigner, 
  daiContract, 
  deposit, 
  firstSignerDeposit, 
  secondSignerDeposit, 
  thirdSignerDeposit, 
  fourthSignerDeposit, 
  totalDeposited, 
  firstSignerInitialDeposit, 
  secondSignerInitialDeposit, 
  thirdSignerInitialDeposit, 
  R1, 
  R2,
  R3
;

const MONTH_IN_SECONDS = 2629743;
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

describe("TraceLabs", function () {
  before ("create contract", async function () {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x41eB686f881878c937ae18d387d5Ac7e15Fd97ff"]
    })
    deposit = ethers.utils.parseEther("1000");
    deployer = await ethers.provider.getSigner("0x41eB686f881878c937ae18d387d5Ac7e15Fd97ff")
    daiContract =  await ethers.getContractAt("IERC20", DAI_ADDRESS, deployer);

    const transactionCount = await deployer.getTransactionCount();
    
    const futureAddress = getContractAddress({
      from: deployer._address,
      nonce: transactionCount + 1,
    })
    
    await daiContract.approve(futureAddress, deposit);
    const TraceLabs = await ethers.getContractFactory("TraceLabs", deployer);
    contract = await TraceLabs.deploy(MONTH_IN_SECONDS, deposit, DAI_ADDRESS);
    
    await contract.deployed();

    R1 = parseInt(ethers.utils.formatUnits(deposit)) * 0.2;
    R2 = parseInt(ethers.utils.formatUnits(deposit)) * 0.3;
    R3 = parseInt(ethers.utils.formatUnits(deposit)) * 0.5;
    
    firstSignerDeposit = ethers.utils.parseEther("1000");
    secondSignerDeposit = ethers.utils.parseEther("4000");
    thirdSignerDeposit = ethers.utils.parseEther("2000");
    fourthSignerDeposit = ethers.utils.parseEther("1000");

    [signer1, signer2, signer3, signer4] = await ethers.provider.listAccounts();
    await daiContract.transfer(signer1, firstSignerDeposit);
    await daiContract.transfer(signer2, secondSignerDeposit);
    await daiContract.transfer(signer3, thirdSignerDeposit);
    await daiContract.transfer(signer4, fourthSignerDeposit);
  });

  it("TraceLabs contract should have same balance of deploy deposit", async function () {
    const contractBalance = parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(contract.deployTransaction.creates)));
    expect(contractBalance).to.be.equal(parseInt(ethers.utils.formatUnits(deposit)));
  });

  it("Should allow users deposit during first month, and deny deposit after", async function() {
    firstSigner = await ethers.provider.getSigner(signer1);
    await daiContract.connect(firstSigner).approve(contract.deployTransaction.creates, firstSignerDeposit);
    await contract.connect(firstSigner).deposit(firstSignerDeposit);

    secondSigner = await ethers.provider.getSigner(signer2);
    await daiContract.connect(secondSigner).approve(contract.deployTransaction.creates, secondSignerDeposit);
    await contract.connect(secondSigner).deposit(secondSignerDeposit);

    thirdSigner = await ethers.provider.getSigner(signer3);
    await daiContract.connect(thirdSigner).approve(contract.deployTransaction.creates, thirdSignerDeposit);
    await contract.connect(thirdSigner).deposit(thirdSignerDeposit);
    
    await network.provider.send("evm_increaseTime", [MONTH_IN_SECONDS]);
    await network.provider.send("evm_mine");

    fourthSigner = await ethers.provider.getSigner(signer4);
    await daiContract.connect(fourthSigner).approve(contract.deployTransaction.creates, fourthSignerDeposit);
    await expect(contract.connect(fourthSigner).deposit(fourthSignerDeposit)).to.be.revertedWith("deposit time is up")
  });

  it("should now allow withdraw before T2", async function() {
    await expect(contract.connect(firstSigner).withdraw()).to.be.revertedWith("you can't withdraw yet");
  });

  it("should allow firstSigner withdraw during T2 and receive back his deposit + R1 share", async function() {
    await network.provider.send("evm_increaseTime", [MONTH_IN_SECONDS]);
    await network.provider.send("evm_mine");

    firstSignerInitialDeposit = parseInt(ethers.utils.formatUnits(firstSignerDeposit));
    secondSignerInitialDeposit = parseInt(ethers.utils.formatUnits(secondSignerDeposit));
    thirdSignerInitialDeposit = parseInt(ethers.utils.formatUnits(thirdSignerDeposit));

    totalDeposited = firstSignerInitialDeposit + secondSignerInitialDeposit + thirdSignerInitialDeposit;

    await contract.connect(firstSigner).withdraw();

    const firstSignerR1Share = firstSignerInitialDeposit * (R1 / totalDeposited)

    expect(parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(signer1)))).to.be.equal(parseInt(firstSignerInitialDeposit + firstSignerR1Share))
  });

  it("should not allow firstSigner to withdraw a second time", async function() {
    await expect(contract.connect(firstSigner).withdraw()).to.be.revertedWith("your balance is 0");
  })

  it("should allow secondSigner withdraw during T3 and receive back his deposit + R1 share + R2 share", async function() {
    await network.provider.send("evm_increaseTime", [MONTH_IN_SECONDS]);
    await network.provider.send("evm_mine");

    await contract.connect(secondSigner).withdraw();
  
    const secondSignerR1Share = secondSignerInitialDeposit * (R1 / totalDeposited);
    const secondSignerR2Share = secondSignerInitialDeposit * (R2 / (totalDeposited - firstSignerInitialDeposit));

    expect(parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(signer2)))).to.be.equal(parseInt(secondSignerInitialDeposit + secondSignerR1Share + secondSignerR2Share));
  });

  it("should allow thirdSigner withdraw during T4 and receive back his deposit + R1 share + R2 share + R3", async function() {
    await network.provider.send("evm_increaseTime", [MONTH_IN_SECONDS]);
    await network.provider.send("evm_mine");

    await contract.connect(thirdSigner).withdraw();
  
    const thirdSignerR1Share = thirdSignerInitialDeposit * (R1 / totalDeposited);
    const thirdSignerR2Share = thirdSignerInitialDeposit * (R2 / (totalDeposited - firstSignerInitialDeposit));

    expect(parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(signer3)))).to.be.equal(parseInt(thirdSignerInitialDeposit + thirdSignerR1Share + thirdSignerR2Share + R3));
  });

});

describe("Second test to let owner withdraw back what is left in the contract", function() {
  before ("create contract", async function () {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x41eB686f881878c937ae18d387d5Ac7e15Fd97ff"]
    })

    daiContract =  await ethers.getContractAt("IERC20", DAI_ADDRESS, deployer);

    const transactionCount = await deployer.getTransactionCount();
    
    const futureAddress = getContractAddress({
      from: deployer._address,
      nonce: transactionCount + 1,
    })
    
    await daiContract.approve(futureAddress, deposit);
    const TraceLabs = await ethers.getContractFactory("TraceLabs", deployer);
    contract = await TraceLabs.deploy(MONTH_IN_SECONDS, deposit, DAI_ADDRESS);
    
    await contract.deployed();
  });

  it("should let withdraw to firstSigner his deposit + R1", async function() {
    
    await daiContract.connect(firstSigner).approve(contract.deployTransaction.creates, firstSignerDeposit);
    await contract.connect(firstSigner).deposit(firstSignerDeposit);
    
    await network.provider.send("evm_increaseTime", [MONTH_IN_SECONDS * 2]);
    await network.provider.send("evm_mine");
    
    const firstSignerBalanceAfterDeposit = parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(signer1)));
    totalDeposited = firstSignerInitialDeposit;
    const firstSignerR1Share = firstSignerInitialDeposit * (R1 / totalDeposited)

    await contract.connect(firstSigner).withdraw();

    expect(parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(signer1)))).to.be.equal(parseInt(firstSignerInitialDeposit + firstSignerBalanceAfterDeposit + firstSignerR1Share))
  });

  it("after T3 should let owner withdraw R2 + R3", async function() {
    
    await network.provider.send("evm_increaseTime", [MONTH_IN_SECONDS * 2]);
    await network.provider.send("evm_mine");
    
    const contractTokenBalanceBeforeOwnerWithdraw = parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(contract.deployTransaction.creates)));
    const ownerTokenBalanceBeforeWithdraw = parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(deployer._address)));

    await contract.withdrawRemaining();

    const contractTokenBalanceAfterOwnerWithdraw = parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(contract.deployTransaction.creates)));
    const ownerTokenBalanceAfterWithdraw = parseInt(ethers.utils.formatUnits(await daiContract.balanceOf(deployer._address)));

    expect(contractTokenBalanceAfterOwnerWithdraw).to.be.equal(0);
    expect(ownerTokenBalanceAfterWithdraw).to.be.equal(ownerTokenBalanceBeforeWithdraw + contractTokenBalanceBeforeOwnerWithdraw);
  });

});