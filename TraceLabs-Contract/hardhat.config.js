require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: "0.8.13",
  networks: {
    hardhat: {
      gas: 1800000,
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/GeepTcW8EGQDN3DOp1sVbxoI6mCA0YTA",
      },
    },
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.RINKEBY_PRIVATE_KEY],
    },
  }
};
