//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title A token pool simulator
/// @author Massimiliano Albini
/// @notice You can use this contract to create a pool and let user deposit their tokens
///         (in this case DAI) to partecipate and receive back a share of the pool after a
///         certain period of time.
/// @dev All function are tested in the sample-test.js file

contract TraceLabs is Ownable {
    uint256 public immutable periodOfTime;
    uint256 public immutable deployingTime;
    uint256 public immutable reward;
    address public tokenAddress;
    uint256 public totalDepositorsLeft;

    uint256 private initialContractTokenBalance;
    uint256 private withdrawAtR1;
    uint256 private withdrawAtR2;

    mapping(address => uint256) addressBalance;

    IERC20 public token;

    /// @notice Contract constructor function
    /// @dev periodOfTime is used to store the time when the contract is deployed
    /// @param _T period of time to set. It is the constant to calculate every period in the contract
    /// @param _amount the amount of tokens that the owner put in the pool for users reward
    constructor(
        uint256 _T,
        uint256 _amount,
        address _tokenAddress
    ) {
        periodOfTime = _T;
        reward = _amount;
        tokenAddress = _tokenAddress;
        token = IERC20(tokenAddress);
        deployingTime = block.timestamp;

        token.transferFrom(msg.sender, address(this), _amount);
    }

    /// @notice function used to let user deposit an amount of token
    /// @dev The user has to approve the contract to move @param _amount in the token contract.
    ///      It should be possible to deposit just during the first period of time
    /// @param _amount is the amount of token to deposit
    function deposit(uint256 _amount) external {
        require(
            block.timestamp < deployingTime + periodOfTime,
            "deposit time is up"
        );
        totalDepositorsLeft++;
        token.transferFrom(msg.sender, address(this), _amount);
        addressBalance[msg.sender] += _amount;
        initialContractTokenBalance += _amount;
    }

    /// @notice function used to let user withdraw his deposit plus share of pool
    /// @dev There are 3 periods when the user can withdraw.
    ///      First period: the share is calculated on 20% of the reward total amount.
    ///                    If the user withdraw during this period, can take just this
    ///                    share.
    ///      Second period: the share is calculated on 30% of the reward total amount.
    ///                     If the user withdraw during this period, take his share of
    ///                     this period reward + share of the previous period reward.
    ///      Third period: the share is calculated on 50% of the reward total amount.
    ///                     If the user withdraw during this period, take his share of
    ///                     this period reward + share of the previous periods rewards.
    function withdraw() external {
        require(addressBalance[msg.sender] > 0, "your balance is 0");
        require(
            block.timestamp >= deployingTime + (periodOfTime * 2),
            "you can't withdraw yet"
        );
        uint256 R1 = (reward * 20) / 100;
        uint256 R2 = (reward * 30) / 100;
        uint256 R3 = (reward * 50) / 100;
        uint256 userBalance = addressBalance[msg.sender];
        uint256 userR1PoolShare = (userBalance * R1) /
            initialContractTokenBalance;
        uint256 userR2PoolShare = (userBalance * R2) /
            (initialContractTokenBalance - withdrawAtR1);
        uint256 userR3PoolShare = (userBalance * R3) /
            (initialContractTokenBalance - withdrawAtR1 - withdrawAtR2);
        if (block.timestamp < deployingTime + (periodOfTime * 3)) {
            addressBalance[msg.sender] = 0;
            token.transfer(msg.sender, userBalance + userR1PoolShare);
            withdrawAtR1 += userBalance;
        }
        if (
            block.timestamp > deployingTime + (periodOfTime * 3) &&
            block.timestamp < deployingTime + (periodOfTime * 4)
        ) {
            addressBalance[msg.sender] = 0;
            token.transfer(
                msg.sender,
                userBalance + userR1PoolShare + userR2PoolShare
            );
            withdrawAtR2 += userBalance;
        }
        if (block.timestamp > deployingTime + (periodOfTime * 4)) {
            addressBalance[msg.sender] = 0;
            token.transfer(
                msg.sender,
                userBalance +
                    userR1PoolShare +
                    userR2PoolShare +
                    userR3PoolShare
            );
        }
        totalDepositorsLeft--;
    }

    /// @dev only owner function to use just if some tokens are left in the contract
    ///         and there aren't anymore user that have to withdraw.
    function withdrawRemaining() external onlyOwner {
        require(
            block.timestamp > deployingTime + (periodOfTime * 4),
            "not time to withdraw yet"
        );
        require(totalDepositorsLeft == 0, "users have to withdraw yet");
        uint256 remainingBalance = token.balanceOf(address(this));
        token.transfer(owner(), remainingBalance);
    }
}
