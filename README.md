# TraceLabs-Task
Project made as a task for Trace Labs.

## Hardhat Contract
-------------------

The smart-contract enable to deposit ERC20 tokens as staking to partecipate in the pool.
When the smart-contract is deployed, the "owner" has to insert some variables as constructor's parameters:
  * the duration of the period of time that is a constant (in seconds)
  * the amount in ERC20 tokens for the pool reward
  * the ERC20 token contract address to use in the pool

During the first period of time is possible to deposit.
After this deposit period, there is a minimum period of staking.
Then there are 3 different periods that allow the depositor to withdraw back his deposit, plus a percentage of pool reward.
This percentage depends by during which period the user withdraw, plus how many tokens he/she deposited in percentage with other users:
  * during the first period the percentage of the pool's reward is 20%
  * during the second period is of 30%
  * during the third and last period is of 50%
If all the users withdraw during the first or between the first and second periods, the owner can withdraw back what is left in the contract ERC20 token balance.

## Front-end
------------
The front-end is built in React, it has a basic UI design, and is made to interact with the smart-contract.
The user has to connect your wallet to the app with the appropriate button.
Once the user is connected is possible to write the ammount of the token that the user want to deposit (if the deposit period is up).
There is the approve button to let the user approve the contract to interact with his ERC20 token balance.
Once that the amount is approved in ERC20 token contract, the user can deposit that amount in the smart-contract.

After a certain period of time is possible to withdraw back.
