import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import Home from './Home'
import View from './View'
import Buy from './Buy';
import Owner from './Owner';
import Stages from './Stages';

function App() {
  const [count, setCount] = useState(0);

  if (window.ethereum) {
    return (
      <Router>
        <nav className="navbar">
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/view">View</Link></li>
            <li><Link to="/buy">Buy</Link></li>
            <li><Link to="/owner">Owner</Link></li>
            <li><Link to="/stages">Stages</Link></li>
            
          </ul>
        </nav>
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/view" element={<View />} />
            <Route path="/buy" element={<Buy />} />
            <Route path="/owner" element={<Owner />} />
            <Route path="/stages" element={<Stages />} />
          </Routes>
        </div>
      </Router>
    );
  } else {
    return <div>Please install MetaMask to use this application.</div>;
  }
}

export default App;