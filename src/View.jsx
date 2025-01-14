import { useState } from 'react';
import { ethers } from 'ethers';
import './View.css';
const contractAddress = '0x42Cc0382f914895c4Cf56B6f722670A6D903b84e';

function View() {
    // State variables for each function's response
    const [currentLotteryNo, setCurrentLotteryNo] = useState(null);
    const [numPurchaseTxs, setNumPurchaseTxs] = useState(null);
    const [ithPurchasedTicketTx, setIthPurchasedTicketTx] = useState(null);
    const [myTicketWon, setMyTicketWon] = useState(null);
    const [addrTicketWon, setAddrTicketWon] = useState(null);
    const [ithWinningTicket, setIthWinningTicket] = useState(null);
    const [lotteryInfo, setLotteryInfo] = useState(null);
    const [lotterySales, setLotterySales] = useState(null);
    
    // State Variables for getPaymentToken
    const [paymentToken, setPaymentToken] = useState(null);
    const [inputLotteryNoForPaymentToken, setInputLotteryNoForPaymentToken] = useState(0);

    // State variables for input parameters per function
    const [inputLotteryNoForNumTxs, setInputLotteryNoForNumTxs] = useState(0);
    const [inputILottNoForIthTx, setInputILottNoForIthTx] = useState({ i: 0, lotteryNo: 0 });
    const [inputLotteryNoForMyTicket, setInputLotteryNoForMyTicket] = useState(0);
    const [inputTicketNoForMyTicket, setInputTicketNoForMyTicket] = useState(1);
    const [inputLotteryNoForAddrTicket, setInputLotteryNoForAddrTicket] = useState(0);
    const [inputTicketNoForAddrTicket, setInputTicketNoForAddrTicket] = useState(1);
    const [inputAddressForAddrTicket, setInputAddressForAddrTicket] = useState('');
    const [inputILottNoForWinningTicket, setInputILottNoForWinningTicket] = useState({ i: 0, lotteryNo: 0 });
    const [inputLotteryNoForInfo, setInputLotteryNoForInfo] = useState(0);
    const [inputLotteryNoForSales, setInputLotteryNoForSales] = useState(0);

    const [lotteryURL, setLotteryURL] = useState({ htmlHash: '', url: '' });
    const [inputLotteryNoForURL, setInputLotteryNoForURL] = useState(0);  
    
    // Helper function to format hashes
    const formatHash = (hash) => {
      if (!hash) return '';
      return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
    };

    // Function to fetch the Lottery URL
    const fetchLotteryURL = async () => {
      try {
        const functionSignature = "getLotteryURL(uint256)";
        const parameters = [{ type: "uint256", value: inputLotteryNoForURL }];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);

        const abiCoder = new ethers.AbiCoder();
        const [htmlHash, url] = abiCoder.decode(["bytes32", "string"], rawResult);
        setLotteryURL({ htmlHash: htmlHash.toString(), url });
      } catch (error) {
        console.error("Error fetching lottery URL:", error);
      }
    };
    
    // Function to connect to MetaMask and get provider and signer
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
    
    // Function to construct calldata
    const constructCalldata = (functionSignature, parameters = []) => {
      const abiCoder = new ethers.AbiCoder();
      const functionSelector = ethers.keccak256(ethers.toUtf8Bytes(functionSignature)).substring(0, 10); // '0x' + first 8 chars
      const encodedParameters = parameters.length > 0
        ? abiCoder.encode(parameters.map(p => p.type), parameters.map(p => p.value)).substring(2)
        : '';
      const calldata = functionSelector + encodedParameters;
      return calldata;
    };
    
    // Function to send calldata and retrieve raw result
    const sendCalldata = async (calldata) => {
      const { provider, signer } = await getProviderAndSigner();
      // Call the contract to get the raw result
      const rawResult = await provider.call({
        to: contractAddress,
        data: calldata,
      });
    
      return rawResult;
    };
    
    // Function to get Current Lottery Number
    const fetchCurrentLotteryNo = async () => {
      try {
        const functionSignature = "getCurrentLotteryNo()";
        const calldata = constructCalldata(functionSignature);
        const rawResult = await sendCalldata(calldata);
        
        const abiCoder = new ethers.AbiCoder();
        const [lotteryNo] = abiCoder.decode(["uint256"], rawResult);
        setCurrentLotteryNo(lotteryNo.toString());
      } catch (error) {
        console.error("Error fetching current lottery number:", error);
      }
    };
    
    // Function to get Number of Purchase Transactions
    const fetchNumPurchaseTxs = async () => {
      try {
        const functionSignature = "getNumPurchaseTxs(uint256)";
        const parameters = [{ type: "uint256", value: inputLotteryNoForNumTxs }];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
        const abiCoder = new ethers.AbiCoder();
        const [numTxs] = abiCoder.decode(["uint256"], rawResult);
        setNumPurchaseTxs(numTxs.toString());
      } catch (error) {
        console.error("Error fetching number of purchase transactions:", error);
      }
    };
    
    // Function to get Ith Purchased Ticket Transaction
    const fetchIthPurchasedTicketTx = async () => {
      try {
        const functionSignature = "getIthPurchasedTicketTx(uint256,uint256)";
        const parameters = [
          { type: "uint256", value: inputILottNoForIthTx.i },
          { type: "uint256", value: inputILottNoForIthTx.lotteryNo }
        ];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
        const abiCoder = new ethers.AbiCoder();
        const [sticketno, quantity] = abiCoder.decode(["uint256", "uint256"], rawResult);
        setIthPurchasedTicketTx({ sTicketNo: sticketno.toString(), quantity: quantity.toString() });
      } catch (error) {
        console.error("Error fetching ith purchased ticket transaction:", error);
      }
    };
    
    // Function to check if my ticket won
    const fetchCheckIfMyTicketWon = async () => {
      try {
        const functionSignature = "checkIfMyTicketWon(uint256,uint256)";
        const parameters = [
          { type: "uint256", value: inputLotteryNoForMyTicket },
          { type: "uint256", value: inputTicketNoForMyTicket }
        ];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
        const abiCoder = new ethers.AbiCoder();
        const [won] = abiCoder.decode(["bool"], rawResult);
        setMyTicketWon(won);
      } catch (error) {
        console.error("Error checking if my ticket won:", error);
      }
    };
    
    // Function to check if address's ticket won
    const fetchCheckIfAddrTicketWon = async () => {
      try {
        const functionSignature = "checkIfAddrTicketWon(address,uint256,uint256)";
        const parameters = [
          { type: "address", value: inputAddressForAddrTicket },
          { type: "uint256", value: inputLotteryNoForAddrTicket },
          { type: "uint256", value: inputTicketNoForAddrTicket }
        ];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
        const abiCoder = new ethers.AbiCoder();
        const [won] = abiCoder.decode(["bool"], rawResult);
        setAddrTicketWon(won);
      } catch (error) {
        console.error("Error checking if address's ticket won:", error);
      }
    };
    
    // Function to get Ith Winning Ticket
    const fetchIthWinningTicket = async () => {
      try {
        const functionSignature = "getIthWinningTicket(uint256,uint256)";
        const parameters = [
          { type: "uint256", value: inputILottNoForWinningTicket.lotteryNo },
          { type: "uint256", value: inputILottNoForWinningTicket.i }
        ];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
        const abiCoder = new ethers.AbiCoder();
        const [ticketNo] = abiCoder.decode(["uint256"], rawResult);
        setIthWinningTicket(ticketNo.toString());
      } catch (error) {
        console.error("Error fetching ith winning ticket:", error);
      }
    };
    
    // Function to get Lottery Info
    const fetchLotteryInfo = async () => {
      try {
        const functionSignature = "getLotteryInfo(uint256)";
        const parameters = [{ type: "uint256", value: inputLotteryNoForInfo }];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
  
        const abiCoder = new ethers.AbiCoder();
        // decode the 5 values
        const [unixbeg, nooftickets, noofwinners, minpercentage, ticketprice] =
          abiCoder.decode(["uint256", "uint256", "uint256", "uint256", "uint256"], rawResult);
  
        // Convert unixbeg to a local date/time string
        const endTime = new Date(Number(unixbeg) * 1000).toLocaleString();
  
        setLotteryInfo({
          endTime:endTime.toString(),                // store the readable date
          nooftickets: nooftickets.toString(),
          noofwinners: noofwinners.toString(),
          minpercentage: minpercentage.toString(),
          ticketprice: ticketprice.toString() // plain integer, e.g. "10"
        });
      } catch (error) {
        console.error("Error fetching lottery info:", error);
      }
    };
  
    // Function to get Lottery Sales
    const fetchLotterySales = async () => {
      try {
        const functionSignature = "getLotterySales(uint256)";
        const parameters = [{ type: "uint256", value: inputLotteryNoForSales }];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
        const abiCoder = new ethers.AbiCoder();
        const [numsold] = abiCoder.decode(["uint256"], rawResult);
        setLotterySales(numsold.toString());
      } catch (error) {
        console.error("Error fetching lottery sales:", error);
      }
    };
    
    // **New Fetch Function for getPaymentToken**
    const fetchPaymentToken = async () => {
      try {
        const functionSignature = "getPaymentToken(uint256)";
        const parameters = [{ type: "uint256", value: inputLotteryNoForPaymentToken }];
        const calldata = constructCalldata(functionSignature, parameters);
        const rawResult = await sendCalldata(calldata);
        const abiCoder = new ethers.AbiCoder();
        const [erctokenaddr] = abiCoder.decode(["address"], rawResult);
        setPaymentToken(erctokenaddr);
      } catch (error) {
        console.error("Error fetching payment token address:", error);
      }
    };
  
    return (
    <div className="view-container">
      <h2>Lottery View</h2>

      {/* Sections Wrapper */}
      <div className="sections">
        {/* Get Current Lottery Number */}
        <div className="section">
          <button onClick={fetchCurrentLotteryNo}>Get Current Lottery Number</button>
          {currentLotteryNo !== null && <p>Current Lottery No: {currentLotteryNo}</p>}
        </div>

        {/* Get Number of Purchase Transactions */}
        <div className="section">
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputLotteryNoForNumTxs}
              onChange={(e) => setInputLotteryNoForNumTxs(parseInt(e.target.value))}
              min="0"
            />
          </div>
          <button onClick={fetchNumPurchaseTxs}>Get Number of Purchase Transactions</button>
          {numPurchaseTxs !== null && <p>Number of Purchase Transactions: {numPurchaseTxs}</p>}
        </div>

        {/* Get Ith Purchased Ticket Transaction */}
        <div className="section">
          <div className="input-group">
            <label>I (Index):</label>
            <input
              type="number"
              value={inputILottNoForIthTx.i}
              onChange={(e) =>
                setInputILottNoForIthTx({
                  ...inputILottNoForIthTx,
                  i: parseInt(e.target.value),
                })
              }
              min="0"
            />
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputILottNoForIthTx.lotteryNo}
              onChange={(e) =>
                setInputILottNoForIthTx({
                  ...inputILottNoForIthTx,
                  lotteryNo: parseInt(e.target.value),
                })
              }
              min="0"
            />
          </div>
          <button onClick={fetchIthPurchasedTicketTx}>Get Ith Purchased Ticket Transaction</button>
          {ithPurchasedTicketTx && (
            <div>
              <p>STicketNo: {ithPurchasedTicketTx.sTicketNo}</p>
              <p>Quantity: {ithPurchasedTicketTx.quantity}</p>
            </div>
          )}
        </div>

        {/* Check If My Ticket Won */}
        <div className="section">
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputLotteryNoForMyTicket}
              onChange={(e) => setInputLotteryNoForMyTicket(parseInt(e.target.value))}
              min="0"
            />
            <label>Ticket Number:</label>
            <input
              type="number"
              value={inputTicketNoForMyTicket}
              onChange={(e) => setInputTicketNoForMyTicket(parseInt(e.target.value))}
              min="0"
            />
          </div>
          <button onClick={fetchCheckIfMyTicketWon}>Check If My Ticket Won</button>
          {myTicketWon !== null && <p>{myTicketWon ? 'Yes' : 'No'}</p>}
        </div>

        {/* Check If Address's Ticket Won */}
        <div className="section">
          <div className="input-group">
            <label>Address:</label>
            <input
              type="text"
              value={inputAddressForAddrTicket}
              onChange={(e) => setInputAddressForAddrTicket(e.target.value)}
              placeholder="0x..."
            />
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputLotteryNoForAddrTicket}
              onChange={(e) => setInputLotteryNoForAddrTicket(parseInt(e.target.value))}
              min="0"
            />
            <label>Ticket Number:</label>
            <input
              type="number"
              value={inputTicketNoForAddrTicket}
              onChange={(e) => setInputTicketNoForAddrTicket(parseInt(e.target.value))}
              min="0"
            />
          </div>
          <button onClick={fetchCheckIfAddrTicketWon}>Check If Address's Ticket Won</button>
          {addrTicketWon !== null && <p>Did the ticket win? {addrTicketWon ? 'Yes' : 'No'}</p>}
        </div>

        {/* Get Ith Winning Ticket */}
        <div className="section">
          <div className="input-group">
            <label>I (Index):</label>
            <input
              type="number"
              value={inputILottNoForWinningTicket.i}
              onChange={(e) =>
                setInputILottNoForWinningTicket({
                  ...inputILottNoForWinningTicket,
                  i: parseInt(e.target.value),
                })
              }
              min="0"
            />
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputILottNoForWinningTicket.lotteryNo}
              onChange={(e) =>
                setInputILottNoForWinningTicket({
                  ...inputILottNoForWinningTicket,
                  lotteryNo: parseInt(e.target.value),
                })
              }
              min="0"
            />
          </div>
          <button onClick={fetchIthWinningTicket}>Get Ith Winning Ticket</button>
          {ithWinningTicket !== null && (
            <div>
              <p>Winning Ticket No: {ithWinningTicket}</p>
            </div>
          )}
        </div>

        {/* Get Lottery Info */}
        <div className="section">
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputLotteryNoForInfo}
              onChange={(e) => setInputLotteryNoForInfo(parseInt(e.target.value))}
              min="0"
            />
          </div>
          <button onClick={fetchLotteryInfo}>Get Lottery Info</button>
          {lotteryInfo && (
            <div>
              <p>End Time: {lotteryInfo.endTime}</p>
              <p>Number of Tickets: {lotteryInfo.nooftickets}</p>
              <p>Number of Winners: {lotteryInfo.noofwinners}</p>
              <p>Minimum Percentage: {lotteryInfo.minpercentage}%</p>
              <p>
                Ticket Price: {lotteryInfo.ticketprice} TKN{" "}
              </p>
            </div>
          )}
        </div>

        {/* Get Lottery Sales */}
        <div className="section">
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputLotteryNoForSales}
              onChange={(e) => setInputLotteryNoForSales(parseInt(e.target.value))}
              min="0"
            />
          </div>
          <button onClick={fetchLotterySales}>Get Lottery Sales</button>
          {lotterySales !== null && (
            <div>
              <p>
                Number Sold: {lotterySales}{" "}
              </p>
            </div>
          )}
        </div>

        {/* **New Section: Get Payment Token** */}
        <div className="section">
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputLotteryNoForPaymentToken}
              onChange={(e) => setInputLotteryNoForPaymentToken(parseInt(e.target.value))}
              min="0"
            />
          </div>
          <button onClick={fetchPaymentToken}>Get Payment Token</button>
          {paymentToken && (
            <div>
              <p>Payment Token Address: {paymentToken}</p>
            </div>
          )}
        </div>

        {/* Get Lottery URL */}
        <div className="section">
          <div className="input-group">
            <label>Lottery Number:</label>
            <input
              type="number"
              value={inputLotteryNoForURL}
              onChange={(e) => setInputLotteryNoForURL(parseInt(e.target.value))}
              min="0"
            />
          </div>
          <button onClick={fetchLotteryURL}>Get Lottery URL</button>
          {lotteryURL.url && (
            <div>
              <p>HTML Hash: {lotteryURL.htmlHash}</p>
              <p>
                URL:{" "}
                <a href={lotteryURL.url} target="_blank" rel="noopener noreferrer">
                  {lotteryURL.url}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  }
  
  export default View;
