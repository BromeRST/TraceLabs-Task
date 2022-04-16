import { useEffect, useState } from "react";
import { ConnectButton } from "./components/ConnectButton";
import { ethers } from "ethers";
import abi from "./utils/traceLabsContractABI.json";
import erc20abi from "./utils/ERC20ABI.json";

const TOKEN_CONTRACT_ADDRESS = "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735"; //TODO: change token contract address (this is rinkeby DAI)
const MAIN_CONTRACT_ADDRESS = "0x04ddE0c47359112797d065707Baf694D7B68Bb2A"; //TODO: change contract address after deploy

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connected, setConnected] = useState(null);
  const [mainContract, setMainContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [amountN, setAmountN] = useState(null);
  const [approved, setApproved] = useState(false);
  const [depositTime, setDepositTime] = useState(null);
  const [R1WithdrawTime, setR1WithdrawTime] = useState(null);
  const [R2WithdrawTime, setR2WithdrawTime] = useState(null);
  const [R3WithdrawTime, setR3WithdrawTime] = useState(null);


  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      return;
    }

    setProvider(new ethers.providers.Web3Provider(ethereum))

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      setCurrentAccount(account);
      setConnected(true);
    }

    let chainId = await ethereum.request({ method: 'eth_chainId' });

    const rinkebyChainId = "0x4"; 
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      setProvider(new ethers.providers.Web3Provider(ethereum));

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      setCurrentAccount(accounts[0]);
      setConnected(true);
      
      let chainId = await ethereum.request({ method: 'eth_chainId' });

      const rinkebyChainId = "0x4"; 
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
      }

    } catch (error) {
      console.log(error)
    }
  }

  const approve = async (n) => {
    const amount = ethers.utils.parseEther(n);
    await tokenContract.approve(MAIN_CONTRACT_ADDRESS, amount);
    setApproved(true);
  }

  const deposit = async (n) => {
    const amount = ethers.utils.parseEther(n);
    await mainContract.deposit(amount);
  }

  const withdraw = async () => {
    await mainContract.withdraw();
  }

  const getTime = async () => {
    const depT = await mainContract.deployingTime();
    const depTUnits = ethers.utils.formatUnits(depT, 0);
    const perT = await mainContract.periodOfTime();
    const perTUnits = ethers.utils.formatUnits(perT, 0);
    setDepositTime(new Date(Number(depTUnits) * 1000 + perTUnits * 1000).toLocaleString("en-GB"))
    setR1WithdrawTime(new Date(Number(depTUnits) * 1000 + perTUnits * 1000 * 2).toLocaleString("en-GB"))
    setR2WithdrawTime(new Date(Number(depTUnits) * 1000 + perTUnits * 1000 * 3).toLocaleString("en-GB"))
    setR3WithdrawTime(new Date(Number(depTUnits) * 1000 + perTUnits * 1000 * 4).toLocaleString("en-GB"))
  }

  const handleAmount = (e) => {
    setAmountN(e.target.value);
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if(provider !== null) {
      setSigner(provider.getSigner());

      setMainContract(
        new ethers.Contract(
          MAIN_CONTRACT_ADDRESS,
          abi,
          signer || provider
        )
      )

      setTokenContract(
        new ethers.Contract(
          TOKEN_CONTRACT_ADDRESS,
          erc20abi,
          signer || provider
        )
      )

    }
  }, [currentAccount, provider])

  useEffect(() => {
    if (signer !== null) {
      getTime();
    }
  }, [signer])

  return (
    <div className="App">
      <div className="nav">
        <p className="app-name">TraceLabs Pool</p>
        <ConnectButton 
          connected={connected}
          setConnected={setConnected}
          currentAccount={currentAccount}
          connectWallet={connectWallet}
        />
      </div>
      <div className="deposit-input-div">
        <input type="text" placeholder="amount to deposit" onChange={handleAmount}/>
        { approved ? 
          <div>
            <button className="secondary-button" onClick={() => deposit(amountN)}>deposit</button>
            <button className="secondary-button" onClick={withdraw}>withdraw</button>
          </div> : 
          <div>
            <button className="secondary-button" onClick={() => approve(amountN)}>approve</button>
            <button className="secondary-button" onClick={withdraw}>withdraw</button>
          </div>
        }
      </div>
      <div className="time-div">
        <p className="timeWithdraw">DEPOSIT TIME WILL END FROM: {depositTime}</p>
        <p className="timeWithdraw">FIRST PERIOD OF WITHDRAW STARTING FROM: {R1WithdrawTime}</p>
        <p className="timeWithdraw">SECOND PERIOD OF WITHDRAW STARTING FROM: {R2WithdrawTime}</p>
        <p className="timeWithdraw">THIRD PERIOD OF WITHDRAW STARTING FROM: {R3WithdrawTime}</p>
      </div>
    </div>
  );
}

export default App;