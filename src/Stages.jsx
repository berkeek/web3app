import { useState } from 'react';
import { ethers } from 'ethers';
import './Stages.css'; 

const contractAddress = '0x42Cc0382f914895c4Cf56B6f722670A6D903b84e';

function Stages() {
  // -------- State variables for startRevealStageOrCancel --------
  const [startRevealData, setStartRevealData] = useState({
    lotteryNo: '',
  });
  const [startRevealTx, setStartRevealTx] = useState(null);

  // -------- State variables for decideWinners --------
  const [decideWinnersData, setDecideWinnersData] = useState({
    lotteryNo: '',
  });
  const [decideWinnersTx, setDecideWinnersTx] = useState(null);

  // Helper function to connect to MetaMask and get signer
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

  // Helper function to construct calldata (function selector + encoded args)
  const constructCalldata = (functionSignature, parameters = []) => {
    // functionSignature example: "startRevealStageOrCancel(uint256)"
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
    try {
      const { signer } = await getProviderAndSigner();
      const tx = await signer.sendTransaction({
        to: contractAddress,
        data: calldata,
      });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
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

  // --------------------- 1) startRevealStageOrCancel ---------------------
  const handleStartRevealStageOrCancel = async () => {
    try {
        const { lotteryNo } = startRevealData;

        // Basic validation
        if (!lotteryNo) {
            alert("Please enter the lottery number.");
            return;
        }

        // Define function signature exactly as in the facet
        const functionSignature = "startRevealStageOrCancel(uint256)";
        const parameters = [
            { type: 'uint256', value: lotteryNo },
        ];

        const calldata = constructCalldata(functionSignature, parameters);
        const tx = await sendTx(calldata);
        setStartRevealTx(tx);
        // Fetch the receipt to parse logs
        const { provider } = await getProviderAndSigner();
        const receipt = await provider.waitForTransaction(tx.hash);

        let stageFound = null;
        const iface = new ethers.Interface([
            "event StageChangedTo(uint256 lottery_no, uint256 stage)"
        ]);

        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog(log);
                if (parsed.name === "StageChangedTo") {
                    stageFound = parsed.args.stage.toString();
                    break;
                }
            } catch (err) {
                // Not an event from our diamond's facet
            }
        }

        // Alert based on the stage
        switch (stageFound) {
            case "1":
                alert("Reveal stage started successfully.");
                break;
            case "2":
                alert("Lottery ended successfully.");
                break;
            case "3":
                alert("Lottery is cancelled. If you bought a ticket, you can claim a refund.");
                break;
            default:
                alert("Stage change event not found in logs.");
        }
    } catch (error) {
        console.error("Error executing startRevealStageOrCancel:", error);
        const errorMessage = extractRevertReason(error);
        alert(errorMessage); // Display the revert reason in an alert
    }
};

const handleDecideWinners = async () => {
    try {
        const { lotteryNo } = decideWinnersData;

        // Basic validation
        if (!lotteryNo) {
            alert("Please enter the lottery number.");
            return;
        }

        // Define function signature exactly as in the facet
        const functionSignature = "decideWinners(uint256)";
        const parameters = [
            { type: 'uint256', value: lotteryNo },
        ];

        const calldata = constructCalldata(functionSignature, parameters);
        const tx = await sendTx(calldata);
        setDecideWinnersTx(tx);
        // Fetch the receipt to parse logs
        const { provider } = await getProviderAndSigner();
        const receipt = await provider.waitForTransaction(tx.hash);

        let stageFound = null;
        const iface = new ethers.Interface([
            "event StageChangedTo(uint256 lottery_no, uint256 stage)"
        ]);

        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog(log);
                if (parsed.name === "StageChangedTo") {
                    stageFound = parsed.args.stage.toString();
                    break;
                }
            } catch (err) {
                // Not an event from our diamond's facet
            }
        }

        // Alert based on the stage
        switch (stageFound) {
            case "1":
                alert("Reveal stage started successfully.");
                break;
            case "2":
                alert("Lottery ended successfully.");
                break;
            case "3":
                alert("Lottery is cancelled. If you bought a ticket, you can claim a refund.");
                break;
            default:
                alert("Stage change event not found in logs.");
        }
    } catch (error) {
        console.error("Error executing decideWinners:", error);
        const errorMessage = extractRevertReason(error);
        alert(errorMessage); // Display the revert reason in an alert
    }
};


  // Formatting a transaction hash for display
  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="stages-container">
      <h2>Lottery Stages</h2>

      <div className="sections">
        {/* ------------------ startRevealStageOrCancel ------------------ */}
        <div className="section">
          <h3>Start Reveal Stage or Cancel</h3>
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={startRevealData.lotteryNo}
              onChange={(e) =>
                setStartRevealData({ ...startRevealData, lotteryNo: e.target.value })
              }
              placeholder="e.g., 1"
              min="0"
            />
          </div>
          <button onClick={handleStartRevealStageOrCancel}>Execute Action</button>
          {startRevealTx && (
            <p>
              Tx Hash:
              <a
                href={`https://sepolia.etherscan.io/tx/${startRevealTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatHash(startRevealTx.hash)}
              </a>
            </p>
          )}
        </div>

        {/* ------------------ decideWinners ------------------ */}
        <div className="section">
          <h3>Decide Winners</h3>
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={decideWinnersData.lotteryNo}
              onChange={(e) =>
                setDecideWinnersData({ ...decideWinnersData, lotteryNo: e.target.value })
              }
              placeholder="e.g., 1"
              min="0"
            />
          </div>
          <button onClick={handleDecideWinners}>Decide Winners</button>
          {decideWinnersTx && (
            <p>
              Tx Hash:
              <a
                href={`https://sepolia.etherscan.io/tx/${decideWinnersTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatHash(decideWinnersTx.hash)}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>

  );
}

export default Stages;
