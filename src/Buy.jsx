import { useState } from 'react';
import { ethers } from 'ethers';
import './Buy.css';
const contractAddress = '0x42Cc0382f914895c4Cf56B6f722670A6D903b84e';

import MyTokenArtifact from "./artifacts/MyToken.json";

const TokenAbi = MyTokenArtifact.abi;

function Buy() {
  // State for Buy Tickets
  const [lotteryNoBuy, setLotteryNoBuy] = useState('');
  const [quantityBuy, setQuantityBuy] = useState('1');
  const [hashRndNumberBuy, setHashRndNumberBuy] = useState('');
  // State for Reveal Random Numbers
  const [lotteryNoReveal, setLotteryNoReveal] = useState('');
  const [quantityReveal, setQuantityReveal] = useState('1');
  const [sticketNoReveal, setSticketNoReveal] = useState('');
  const [randomNumberReveal, setRandomNumberReveal] = useState('');

  const [message, setMessage] = useState('');

  const [hashInput, setHashInput] = useState('');
  const [hashedOutput, setHashedOutput] = useState('');

  // State for Refund Tickets
  const [lotteryNoRefund, setLotteryNoRefund] = useState('');
  const [sticketNoRefund, setSticketNoRefund] = useState('');
  
  
  // Connect to Metamask, get a provider + signer
  const getProviderAndSigner = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      throw new Error("MetaMask not installed");
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return { provider, signer };
  };
  
  async function approveDiamondToSpendTokens(tokenAddress, diamondAddress, amount) {
    const { signer } = await getProviderAndSigner();

    // Create contract instance for the external token
    const tokenContract = new ethers.Contract(tokenAddress, TokenAbi, signer);
    
    // Approve diamond
    const tx = await tokenContract.approve(diamondAddress, amount);
    await tx.wait();
    console.log("Approved the diamond to spend", amount.toString(), "tokens");
  }
  
  const generateHash = async () => {
    try {
      if (!hashInput) {
        alert("Please enter a uint256 random number.");
        return;
      }
      // Validate uint256 format (simple numeric check)
      if (!/^\d+$/.test(hashInput)) {
        alert("Invalid uint256 format. It should be a non-negative integer.");
        return;
      }

      const { signer } = await getProviderAndSigner();
      const signerAddress = await signer.getAddress();

      // Convert input to uint256 using BigNumber to handle large integers
      const randomNumberUint = BigInt(hashInput);
      console.log("Random Number (uint256):", randomNumberUint);
      // Encode uint256 random number and signer address

      const encodedData = ethers.solidityPacked(["uint256", "address"], [randomNumberUint, signerAddress]);
      // Hash the encoded data
      const hashed = ethers.keccak256(encodedData);
      setHashedOutput(hashed);
    } catch (error) {
      console.error("Error generating hash:", error);
      alert("Failed to generate hash.");
    }
  };  

  const copyToClipboard = () => {
    if (!hashedOutput) return;
    navigator.clipboard.writeText(hashedOutput).then(() => {
      alert("Hash copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy: ", err);
      alert("Failed to copy hash.");
    });
  };

  // Helper function to extract revert reason from an error
  const extractRevertReason = (error) => {
    // Check if error has a reason property
    if (error.reason) {
      return error.reason;
    }
    
    // For ethers.js v6, the error might have a shortMessage or cause
    if (error.cause && error.cause.reason) {
      return error.cause.reason;
    }
    
    // Fallback: try to parse the revert reason from the message
    const message = error.message;
    const match = message.match(/reverted with reason string "(.*)"/);
    if (match && match[1]) {
      return match[1];
    }
    
    // If all else fails, return a generic error message
    return "An unknown error occurred.";
  };

  // Given a function signature like "getPaymentToken(uint256)"
  // and an array of parameters [{type: 'uint256', value: 5}], build the calldata
  const constructCalldata = (functionSignature, parameters = []) => {
    const abiCoder = new ethers.AbiCoder();
    const functionSelector = ethers.keccak256(
      ethers.toUtf8Bytes(functionSignature)
    ).substring(0, 10); // '0x' + first 8 chars
    const encodedParameters =
      parameters.length > 0
        ? abiCoder.encode(
            parameters.map((p) => p.type),
            parameters.map((p) => p.value)
          ).substring(2)
        : "";
    return functionSelector + encodedParameters;
  };

  // Call the diamond with "call" (READ-ONLY). 
  // This does not create a transaction, just a .call to get results.
  const callDiamond = async (calldata) => {
    const { provider } = await getProviderAndSigner();
    const rawResult = await provider.call({
      to: contractAddress, // your diamond
      data: calldata
    });
    return rawResult;
  };

  // Send a state-changing transaction to the diamond (fallback).
  // This *modifies* state if the function signature indicates a write.
  const sendDiamondTx = async (calldata) => {
    const { signer } = await getProviderAndSigner();
    const tx = await signer.sendTransaction({
      to: contractAddress,
      data: calldata
    });
    return await tx.wait();
  };
    
  // Function to send calldata and retrieve raw result
  const sendCalldata = async (calldata) => {
    const { signer } = await getProviderAndSigner();

    // Send the transaction
    const tx = await signer.sendTransaction({
      to: contractAddress,
      data: calldata,
    });
    const receipt = await tx.wait();

    // Now parse logs for the event to confirm the same sticketNo:
    const event = receipt.events?.find(e => e.event === "TicketPurchased");
    if (event) {
       const sticketNo = event.args?.[2];
       console.log("sticketNo from logs:", sticketNo.toString());
    }

    return receipt;
  };

  // Retrieve the token address from the diamond fallback
  // `lotteryNo` is the argument you pass
  const fetchTokenAddress = async (lotteryNo) => {
    const functionSignature = "getPaymentToken(uint256)";
    const parameters = [{ type: "uint256", value: lotteryNo }];
    const calldata = constructCalldata(functionSignature, parameters);
    const rawResult = await callDiamond(calldata); // read-only fallback
    const abiCoder = new ethers.AbiCoder();
    const [tokenAddr] = abiCoder.decode(["address"], rawResult);
    return tokenAddr;
  };

  const buyTickets = async () => {
    try {
      const { provider, signer } = await getProviderAndSigner();
      // const address = await signer.getAddress(); // e.g., 0x3C44...
      // console.log("MetaMask signer address:", address);
      // const network = await provider.getNetwork();
      // console.log("network.chainId:", network.chainId);
      
      // const tokenContract = new ethers.Contract(
      //   "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e",
      //   TokenAbi,
      //   signer
      // );
      // const balance = await tokenContract.balanceOf(address);
      // console.log("My token balance is:", balance.toString());
      // const allowance = await tokenContract.allowance(address, contractAddress);
      // console.log("Current allowance:", allowance.toString());
  
      setMessage(''); // Clear any existing messages
  
      // ----------- 1. Check Lottery Stage -----------
      // Define the function signature and parameters for getLotterySales
      const functionSignatureSales = "getLotteryStage(uint256)";
      const parametersSales = [{ type: "uint256", value: lotteryNoBuy }];
      const calldataSales = constructCalldata(functionSignatureSales, parametersSales);
      
      // Call the getLotterySales function (view)
      const rawResultSales = await callDiamond(calldataSales);
      
      // Decode the response to get the stage
      const abiCoderSales = new ethers.AbiCoder();
      const [stage] = abiCoderSales.decode(["uint256"], rawResultSales);
      console.log("Current stage:", stage);
      
      // Check if the stage is not 1 (buying stage)
      if (stage != 0) {
        alert("Lottery is not in buying stage");
        return; // Exit the function early
      }
  
      // ----------- 2. Fetch Lottery Info -----------
      // Define the function signature and parameters for getLotteryInfo
      const functionSignatureInfo = "getLotteryInfo(uint256)";
      const parametersInfo = [{ type: "uint256", value: lotteryNoBuy }];
      const calldataInfo = constructCalldata(functionSignatureInfo, parametersInfo);
      
      // Call the getLotteryInfo function (view)
      const rawResultInfo = await callDiamond(calldataInfo);
      
      // Decode the response to get ticketprice
      const abiCoderInfo = new ethers.AbiCoder();
      const [unixbeg, nooftickets, noofwinners, minpercentage, ticketprice] =
        abiCoderInfo.decode(
          ["uint256", "uint256", "uint256", "uint256", "uint256"],
          rawResultInfo
        );
      console.log("Ticket price:", ticketprice.toString());
  
      // ----------- 3. Compute and Approve Token Spending -----------
      // Convert ticketprice and quantityBuy to BigInt for multiplication
      const quantity = BigInt(quantityBuy);
      const ticketPriceBN = BigInt(ticketprice.toString());
      const totalPrice = ticketPriceBN * quantity;
      console.log("Total price to approve:", totalPrice.toString());
  
      // Fetch the token address from the diamond
      const tokenAddr = await fetchTokenAddress(lotteryNoBuy);
      if (tokenAddr === ethers.ZeroAddress) {
        throw new Error('Token not set for this lottery');
      }
      console.log('Token address:', tokenAddr);
  
      // Approve the diamond to spend the calculated totalPrice
      await approveDiamondToSpendTokens(tokenAddr, contractAddress, totalPrice.toString());
  
      // ----------- 4. Proceed with Existing Steps -----------
      // Call buyTicketTx(...) via fallback
      const functionSignature = "buyTicketTx(uint256,uint256,bytes32)";
      const parameters = [
        { type: "uint256", value: lotteryNoBuy },
        { type: "uint256", value: quantityBuy },
        { type: "bytes32", value: hashRndNumberBuy }
      ];
      const calldata = constructCalldata(functionSignature, parameters);
  
      const txReceipt = await sendCalldata(calldata);
  
      // Parse the logs to find `TicketPurchased` event
      let sticketNoFound = null;
      const iface = new ethers.Interface([
        "event TicketPurchased(address indexed buyer, uint256 lottery_no, uint256 startTicketNo, uint256 quantity)"
      ]);
      for (const log of txReceipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed.name === "TicketPurchased") {
            sticketNoFound = parsed.args.startTicketNo.toString();
            break;
          }
        } catch (err) {
          // Not an event from our diamond's facet
        }
      }
  
      if (sticketNoFound) {
        setMessage(`Purchase successful! Starting ticket #${sticketNoFound}`);
      } else {
        setMessage(`Purchase successful! (No event found)`);
      }
  
    } catch (err) {
      console.error(err);
      const errorMessage = extractRevertReason(err);
      alert(errorMessage); // Display only the revert reason in an alert
      setMessage(''); // Clear any existing messages
    }
  };
  
  const refundTickets = async () => {
    try {
      if (!lotteryNoRefund || !sticketNoRefund) {
        alert("Please enter both Lottery Number and Starting Ticket Number.");
        return;
      }

      const functionSignature = "withdrawTicketRefund(uint256,uint256)";
      const parameters = [
        { type: "uint256", value: lotteryNoRefund },
        { type: "uint256", value: sticketNoRefund },
      ];

      const calldata = constructCalldata(functionSignature, parameters);

      const receipt = await sendCalldata(calldata);

      setMessage("Refund successful!");
      console.log("Transaction receipt:", receipt);
    } catch (err) {
      console.error("Error refunding tickets:", err);
      const errorMessage = extractRevertReason(err);
      alert(errorMessage);
      setMessage("");
    }
  };


  const revealRandomNumbers = async () => {
    try {
      // Validate randomNumberReveal is a valid uint256
      if (!/^\d+$/.test(randomNumberReveal)) {
        alert("Invalid uint256 format for Random Number. It should be a non-negative integer.");
        return;
      }

      const functionSignatureSales = "getLotteryStage(uint256)";
      const parametersSales = [{ type: "uint256", value: lotteryNoReveal }];
      const calldataSales = constructCalldata(functionSignatureSales, parametersSales);
      
      // Call the getLotterySales function (view)
      const rawResultSales = await callDiamond(calldataSales);
      
      // Decode the response to get the stage
      const abiCoderSales = new ethers.AbiCoder();
      const [stage] = abiCoderSales.decode(["uint256"], rawResultSales);
      console.log("Current stage:", stage);
      
      // Check if the stage is not 1 (buying stage)
      if (stage != 1) {
        alert("Lottery is not in reveal stage");
        return; // Exit the function early
      }


      // Convert string to uint256 using BigNumber to handle large integers
      const randomNumberUint = BigInt(randomNumberReveal);
      console.log("Random Number (uint256):", randomNumberUint);
      const functionSignature = "revealRndNumberTx(uint256,uint256,uint256,uint256)";
      const parameters = [
          { type: "uint256", value: lotteryNoReveal },
          { type: "uint256", value: sticketNoReveal },
          { type: "uint256", value: quantityReveal },
          { type: "uint256", value: randomNumberUint }, // Already a BigNumber
      ];
      const calldata = constructCalldata(functionSignature, parameters);
      const rawResult = await sendCalldata(calldata);
      // Handle result if needed
    } catch (error) {
      console.error("Error revealing random numbers:", error);
      const errorMessage = extractRevertReason(error);
      alert(errorMessage); // Display the revert reason in an alert
      setMessage(''); // Clear any existing messages
    }
  };

  return (
    <div className="buy-container">
      <h2>Buy & Reveal & Refund</h2>

      <div className="sections">
        {/* ------------------ Hash Generator ------------------ */}
        <div className="section">
          <h3>Hash Generator</h3>
          <div className="input-group">
            <label>Random Number (uint256):</label>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Enter a non-negative integer"
              pattern="\d+"
              title="Please enter a non-negative integer."
            />
          </div>
          <button className="generate-button" onClick={generateHash}>Generate Hash</button>
          {hashedOutput && (
            <div className="output-group">
              <p>
                Hashed Value: <span>{hashedOutput}</span>
              </p>
              <button className="copy-button" onClick={copyToClipboard}>Copy to Clipboard</button>
            </div>
          )}
        </div>

        {/* Buy Tickets Section */}
        <div className="section">
          <h3>Buy Tickets</h3>
          <div className="input-group">
            <label>Lottery Number: </label>
            <input
              type="number"
              value={lotteryNoBuy}
              onChange={(e) => setLotteryNoBuy(e.target.value)}
              min="0"
            />
          </div>
          <div className="input-group">
            <label>Quantity: </label>
            <input
              type="number"
              value={quantityBuy}
              onChange={(e) => setQuantityBuy(e.target.value)}
              min="1"
              max="30"
            />
          </div>
          <div className="input-group">
            <label>Hash Random Number: </label>
            <input
              type="text"
              value={hashRndNumberBuy}
              onChange={(e) => setHashRndNumberBuy(e.target.value)}
              placeholder="0x..."
              maxLength="66"
            />
          </div>
          <button className="buy-button" onClick={buyTickets}>Buy Tickets</button>
        </div>

        {/* Reveal Random Numbers Section */}
        <div className="section">
          <h3>Reveal Random Numbers</h3>
          <div className="input-group">
            <label>Lottery Number: </label>
            <input
              type="number"
              value={lotteryNoReveal}
              onChange={(e) => setLotteryNoReveal(e.target.value)}
              min="0"
            />
          </div>
          <div className="input-group">
            <label>Quantity: </label>
            <input
              type="number"
              value={quantityReveal}
              onChange={(e) => setQuantityReveal(e.target.value)}
              min="1"
              max="30"
            />
          </div>
          <div className="input-group">
            <label>Starting Ticket No: </label>
            <input
              type="number"
              value={sticketNoReveal}
              onChange={(e) => setSticketNoReveal(e.target.value)}
              min="0"
            />
          </div>
          <div className="input-group">
            <label>Random Number (uint256): </label>
            <input
              type="text"
              value={randomNumberReveal}
              onChange={(e) => setRandomNumberReveal(e.target.value)}
              placeholder="Enter the original random number"
              pattern="\d+"
              title="Please enter a non-negative integer."
            />
          </div>
          <button className="reveal-button" onClick={revealRandomNumbers}>Reveal Random Numbers</button>
        </div>
        <div className="section">
          <h3>Refund Tickets</h3>
          <div className="input-group">
            <label>Lottery Number: </label>
            <input
              type="number"
              value={lotteryNoRefund}
              onChange={(e) => setLotteryNoRefund(e.target.value)}
              min="0"
            />
          </div>
          <div className="input-group">
            <label>Starting Ticket No: </label>
            <input
              type="number"
              value={sticketNoRefund}
              onChange={(e) => setSticketNoRefund(e.target.value)}
              min="0"
            />
          </div>
          <button className="refund-button" onClick={refundTickets}>Refund Tickets</button>
        </div>
      </div>




      {/* Message Display */}
      {message && (
        <div className="message">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}

export default Buy;
