import './Home.css'; // Import a CSS file for additional styling if needed

function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to Lottery DApp!</h1>
      <p>This is a Web3-based lottery application built on the Sepolia Testnet. Engage with secure and decentralized lottery games powered by smart contracts!</p>

      <div className="info-section">
        <h2>How the Lottery Works</h2>
        <ul>
          <li>🎟️ From the creation until halftime, the lottery is in the <strong>Buying Stage</strong>.</li>
          <li>🕒 After halftime, anyone can call the <strong>Start Reveal Stage</strong> to move it to the <strong>Reveal Stage</strong>, lasting until the end time.</li>
          <li>🏆 Once the lottery ends, anyone can call the <strong>Decide Winners</strong> function to randomly select winners.</li>
          <li>❌ If not enough tickets are bought, or if no one transitions the stages in time, the lottery is <strong>Cancelled</strong>. Refunds will be available for cancelled lotteries.</li>
        </ul>
      </div>

      <div className="page-guide">
        <h2>Explore the Pages</h2>
        <ul>
          <li><strong>View :</strong> Browse and view the details of all lotteries.</li>
          <li><strong>Buy :</strong> Buy tickets, reveal your random numbers, and claim refunds if applicable.</li>
          <li><strong>Owner :</strong> Exclusive to the owner, this page contains management functions for lotteries.</li>
          <li><strong>Stages :</strong> Transition lotteries through their stages. Open to the public for interacting with smart contract stages.</li>
        </ul>
      </div>

      <p className="closing-note">We hope you enjoy this decentralized lottery experience. May luck be on your side! 🍀</p>
    </div>
  );
}

export default Home;