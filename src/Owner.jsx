import { useState } from 'react';
import { ethers } from 'ethers';
import './Owner.css';

const contractAddress = '0x42Cc0382f914895c4Cf56B6f722670A6D903b84e';

import MyTokenArtifact from "./artifacts/MyToken.json";

function Owner() {
  // -------- State variables for createLottery --------
  const [createLotteryData, setCreateLotteryData] = useState({
    unixbeg: '',
    nooftickets: '',
    noofwinners: '',
    minpercentage: '',
    ticketprice: '',
    htmlhash: '',
    url: '',
  });
  const [selectedDateTime, setSelectedDateTime] = useState(''); // state for datetime-local input
  const [createLotteryTx, setCreateLotteryTx] = useState(null);

  // -------- State variables for setPaymentToken --------
  const [paymentTokenAddr, setPaymentTokenAddr] = useState('');
  const [setPaymentTokenTx, setSetPaymentTokenTx] = useState(null);

  // -------- State variables for withdrawTicketProceeds --------
  const [withdrawLotteryNo, setWithdrawLotteryNo] = useState('');
  const [withdrawTx, setWithdrawTx] = useState(null);

  // -------- State variables for sendToken --------
  const [sendTokenAddr, setsendTokenAddr] = useState('');
  const [sendTokenTx, setSendTokenTx] = useState(null);

  // Helper function to connect to MetaMask and get provider + signer
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

  const fetchTokenAddress = async (lotteryNo) => {
    const functionSignature = "getPaymentToken(uint256)";
    const parameters = [{ type: "uint256", value: lotteryNo }];
    const calldata = constructCalldata(functionSignature, parameters);
    const rawResult = await callDiamond(calldata); // read-only fallback
    const abiCoder = new ethers.AbiCoder();
    const [tokenAddr] = abiCoder.decode(["address"], rawResult);
    return tokenAddr;
  };

  const callDiamond = async (calldata) => {
    const { provider } = await getProviderAndSigner();
    const rawResult = await provider.call({
      to: contractAddress, // your diamond
      data: calldata
    });
    return rawResult;
  };
  // Helper function to construct calldata (function selector + encoded args)
  const constructCalldata = (functionSignature, parameters = []) => {
    // functionSignature example: "createLottery(uint256,uint256,...)"
    // parameters example: [{ type: "uint256", value: 1 }, { type: "bytes32", value: "0x1234..." }, ...]
    const abiCoder = new ethers.AbiCoder();
    const functionSelector = ethers.keccak256(ethers.toUtf8Bytes(functionSignature)).substring(0, 10); 
    const encodedParameters = parameters.length > 0
      ? abiCoder.encode(
          parameters.map(p => p.type),
          parameters.map(p => p.value)
        ).substring(2)
      : '';

    return functionSelector + encodedParameters;
  };

  // Helper function to send transaction
  const sendTx = async (calldata) => {
    const { signer } = await getProviderAndSigner();
    const tx = await signer.sendTransaction({
      to: contractAddress,
      data: calldata,
    });
    await tx.wait();
    return tx;
  };

  // --------------------- 1) createLottery  ---------------------
  const handleCreateLottery = async () => {
    try {
      const functionSignature = 'createLottery(uint256,uint256,uint256,uint256,uint256,bytes32,string)';
      const parameters = [
        { type: 'uint256', value: createLotteryData.unixbeg },
        { type: 'uint256', value: createLotteryData.nooftickets },
        { type: 'uint256', value: createLotteryData.noofwinners },
        { type: 'uint256', value: createLotteryData.minpercentage },
        { type: 'uint256', value: createLotteryData.ticketprice },
        { type: 'bytes32', value: createLotteryData.htmlhash },
        { type: 'string', value: createLotteryData.url },
      ];

      const calldata = constructCalldata(functionSignature, parameters);
      const tx = await sendTx(calldata);
      setCreateLotteryTx(tx);
    } catch (error) {
      console.error("Error creating lottery:", error);
      const errorMessage = extractRevertReason(error);
      alert(errorMessage); // Display the revert reason in an alert
    }
  };

  // --------------------- 2) setPaymentToken  ---------------------
  const handleSetPaymentToken = async () => {
    try {
      const functionSignature = 'setPaymentToken(address)';
      const parameters = [{ type: 'address', value: paymentTokenAddr }];
      const calldata = constructCalldata(functionSignature, parameters);
      const tx = await sendTx(calldata);
      setSetPaymentTokenTx(tx);
    } catch (error) {
      console.error("Error setting payment token:", error);
      const errorMessage = extractRevertReason(error);
      alert(errorMessage); // Display the revert reason in an alert
    }
  };

  // --------------------- 3) withdrawTicketProceeds  ---------------------
  const handleWithdrawTicketProceeds = async () => {
    try {
      const functionSignature = 'withdrawTicketProceeds(uint256)';
      const parameters = [{ type: 'uint256', value: withdrawLotteryNo }];
      const calldata = constructCalldata(functionSignature, parameters);
      const tx = await sendTx(calldata);
      setWithdrawTx(tx);
    } catch (error) {
      console.error("Error withdrawing ticket proceeds:", error);
      const errorMessage = extractRevertReason(error);
      alert(errorMessage); // Display the revert reason in an alert
    }
  };

  // --------------------- 4) send 100 Tokens ---------------------
  const handleSendTokens = async () => {
    try {
      const {signer} = await getProviderAndSigner();
      const tokenAddress = await fetchTokenAddress(1);
      const tokenContract = new ethers.Contract(tokenAddress, MyTokenArtifact.abi, signer);
      //update below contract address should be input from user
      const tx = await tokenContract.transfer(sendTokenAddr, 100);
      setSendTokenTx(tx);
      //alert(`Sent 100 tokens to ${sendTokenAddr}`);
    } catch (error) {
      console.error("Error sending tokens:", error);
      const errorMessage = extractRevertReason(error);
      alert(errorMessage); // Display the revert reason in an alert
    }
  };

  // Formatting a transaction hash if needed
  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // Function to handle date and time selection and convert to Unix timestamp
  const handleDateTimeChange = (e) => {
    const selectedDateTime = e.target.value;
    setSelectedDateTime(selectedDateTime);

    if (selectedDateTime) {
      const timestamp = Math.floor(new Date(selectedDateTime).getTime() / 1000);
      setCreateLotteryData({ ...createLotteryData, unixbeg: timestamp.toString() });
    } else {
      setCreateLotteryData({ ...createLotteryData, unixbeg: '' });
    }
  };

  // --------------------- Helper Function to Extract Revert Reason ---------------------
  const extractRevertReason = (error) => {
    // Check if error has a 'reason' property
    if (error.reason) {
      return error.reason;
    }

    // For ethers.js v6, the error might have a 'cause' with a 'reason'
    if (error.cause && error.cause.reason) {
      return error.cause.reason;
    }

    // Attempt to parse the revert reason from the error message using regex
    const message = error.message;
    const match = message.match(/reverted with reason string "(.*)"/);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: Return a generic error message
    return "An unknown error occurred.";
  };

  return (
    <div className="owner-container">
      <h2>Owner Actions</h2>
      <div className="sections">
        {/* ------------------ createLottery ------------------ */}
        <div className="section">
          <h3>Create Lottery</h3>
          <div className="input-group">
            <label>Ending Date and Time:</label>
            <input
              type="datetime-local"
              value={selectedDateTime}
              onChange={handleDateTimeChange}
            />
          </div>
          <div className="input-group">
            <label>Number of Tickets:</label>
            <input
              type="number"
              value={createLotteryData.nooftickets}
              onChange={(e) =>
                setCreateLotteryData({ ...createLotteryData, nooftickets: e.target.value })
              }
              placeholder="e.g., 1000"
              min="1"
            />
          </div>
          <div className="input-group">
            <label>Number of Winners:</label>
            <input
              type="number"
              value={createLotteryData.noofwinners}
              onChange={(e) =>
                setCreateLotteryData({ ...createLotteryData, noofwinners: e.target.value })
              }
              placeholder="e.g., 10"
              min="1"
            />
          </div>
          <div className="input-group">
            <label>Min % of Tickets Needed:</label>
            <input
              type="number"
              value={createLotteryData.minpercentage}
              onChange={(e) =>
                setCreateLotteryData({ ...createLotteryData, minpercentage: e.target.value })
              }
              placeholder="e.g., 50"
              min="0"
              max="100"
            />
          </div>
          <div className="input-group">
            <label>Ticket Price:</label>
            <input
              type="number"
              value={createLotteryData.ticketprice}
              onChange={(e) =>
                setCreateLotteryData({ ...createLotteryData, ticketprice: e.target.value })
              }
              placeholder="e.g., 1000000000000000000 for 1 ETH"
              min="0"
            />
          </div>
          <div className="input-group">
            <label>HTML Hash:</label>
            <input
              type="text"
              value={createLotteryData.htmlhash}
              onChange={(e) =>
                setCreateLotteryData({ ...createLotteryData, htmlhash: e.target.value })
              }
              placeholder="0x..."
              maxLength="66"
            />
          </div>
          <div className="input-group">
            <label>URL:</label>
            <input
              type="text"
              value={createLotteryData.url}
              onChange={(e) =>
                setCreateLotteryData({ ...createLotteryData, url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <button onClick={handleCreateLottery}>Create Lottery</button>
          {createLotteryTx && (
            <p>
              Tx Hash: <a href={`https://sepolia.etherscan.io/tx/${createLotteryTx.hash}`} target="_blank" rel="noopener noreferrer">{formatHash(createLotteryTx.hash)}</a>
            </p>
          )}
        </div>

        {/* ------------------ setPaymentToken ------------------ */}
        <div className="section">
          <h3>Set Payment Token</h3>
          <div className="input-group">
            <label>ERC20 Token Address:</label>
            <input
              type="text"
              value={paymentTokenAddr}
              onChange={(e) => setPaymentTokenAddr(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <button onClick={handleSetPaymentToken}>Set Payment Token</button>
          {setPaymentTokenTx && (
            <p>
              Tx Hash: <a href={`https://sepolia.etherscan.io/tx/${setPaymentTokenTx.hash}`} target="_blank" rel="noopener noreferrer">{formatHash(setPaymentTokenTx.hash)}</a>
            </p>
          )}
        </div>

        {/* ------------------ withdrawTicketProceeds ------------------ */}
        <div className="section">
          <h3>Withdraw Ticket Proceeds</h3>
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={withdrawLotteryNo}
              onChange={(e) => setWithdrawLotteryNo(e.target.value)}
              placeholder="e.g., 0"
              min="0"
            />
          </div>
          <button onClick={handleWithdrawTicketProceeds}>Withdraw Proceeds</button>
          {withdrawTx && (
            <p>
              Tx Hash: <a href={`https://sepolia.etherscan.io/tx/${withdrawTx.hash}`} target="_blank" rel="noopener noreferrer">{formatHash(withdrawTx.hash)}</a>
            </p>
          )}
        </div>
        {/* ------------------ sendToken ------------------ */}
        <div className="section">
          <h3>Send 100 Test Tokens</h3>
          <div className="input-group">
            <label>Target Address:</label>
            <input
              type="text"
              value={sendTokenAddr}
              onChange={(e) => setsendTokenAddr(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <button onClick={handleSendTokens}>Send Tokens</button>
          {sendTokenTx && (
            <p>
              Tx Hash: <a href={`https://sepolia.etherscan.io/tx/${sendTokenTx.hash}`} target="_blank" rel="noopener noreferrer">{formatHash(sendTokenTx.hash)}</a>
            </p>
          )}
        </div>
      </div>
    </div>

  );
}

export default Owner;
