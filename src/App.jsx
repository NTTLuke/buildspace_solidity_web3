import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";


export default function App() {

   /*
  * Just a state variable we use to store our user's public wallet.
  */
 const [currentAccount, setCurrentAccount] = useState("");
 const [allWaves, setAllWaves] = useState([]);
 const [waveMessage, setWaveMessage] = useState("");
 const [totalWaves, setTotalWaves] = useState(0);
 const [balance, setBalance] = useState(0);
  
 const contractAddress = "0x460991301F7d17f67279366cb8E093d2919Ca9A6";
 const contractABI = abi.abi;
  

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
 
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        
        setCurrentAccount(account);
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      
        
        //get all waves
        getAllWaves();
       
        
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);


       //get total waves
        let count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count.toNumber());

        //get the balance
        provider.getBalance(contractAddress).then((balance) => {
           // convert a currency unit from wei to ether
           const balanceInEth = ethers.utils.formatEther(balance)
           console.log(`balance: ${balanceInEth} ETH`)
        })
        
        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();
        console.log("All waves" ,  waves);

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.from,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
            isWinner : wave.isWinner
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }
  
 const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        
        const waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

       
        
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
}

  /**
 * Listen in for emitter events!
 */
useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message, isWinner) => {
    console.log("NewWave", from, timestamp, message, isWinner);
    getAllWaves();
    // setAllWaves(prevState => [
    //   ...prevState,
    //   {
    //     address: from,
    //     timestamp: new Date(timestamp * 1000),
    //     message: message,
    //   },
    // ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
}, []);

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
      
    } catch (error) {
      console.log(error)
    }
  }
  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  
  return (
    
    <div className="mainContainer">

      
      <div className="dataContainer">
        
        <div className="bio">
        [Made with ❤ by NTTLuke]
        </div>
        
        <div className="header" align="center">
          <img src="../img/jedi.png" width="60px"  /> 
        </div>
        <div className="header">
        May the force be with you 
        </div>

        
        
        
        {currentAccount && (

        <input type="text" onChange={e => setWaveMessage(e.target.value)}/>
          
        )}

        
        {currentAccount && (

        <button className="waveButton" onClick={wave}>
          WAVE AT ME
        </button>
        )}

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}    
        
        <br/>
        <br/>
        {currentAccount && totalWaves > 0 && (
            <div><h3>All Waves ({totalWaves}) </h3></div>
        )}
        
        {allWaves.map((wave, index) => {
          return (
            <div key={index} className={(wave.isWinner ? "waveListWon" : "waveList")}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
