import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

const YEET_ADDRESS = '0x08A38Caa631DE329FF2DAD1656CE789F31AF3142';
const AIRDROP_ADDRESS = '0x1d6bbc466bbd0150a5e91bf337fa696a8f3fa3d7';
const RPC_URL = 'https://rpc.berachain.com';

const AIRDROP_ABI = [
  {
    name: "claimable",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    name: "claimed",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  }
];

function App() {
  const [results, setResults] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async (tokenIds) => {
    setLoading(true);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, provider);
    const allResults = [];

    for (let tokenId of tokenIds) {
      try {
        const claimedRaw = await contract.claimed(tokenId);
        const claimableRaw = await contract.claimable(tokenId);
        const claimed = parseFloat(ethers.formatUnits(claimedRaw, 18));
        const claimable = parseFloat(ethers.formatUnits(claimableRaw, 18));
        const total = claimed + claimable;

        allResults.push({ tokenId, claimed, claimable, total });
      } catch (err) {
        allResults.push({ tokenId, error: true });
      }
    }

    setResults(allResults);
    setLoading(false);
  };

  const handleSingleCheck = () => {
    const tokenId = input.trim();
    if (tokenId) {
      fetchData([tokenId]);
    }
  };

  const handleBulkCheck = () => {
    const tokenIds = input.split(',').map(id => id.trim()).filter(id => id);
    if (tokenIds.length) {
      fetchData(tokenIds);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'monospace' }}>
      <h1>🧠 YEET NFT Airdrop Checker</h1>
      <input
        type="text"
        placeholder="Enter token ID(s) (e.g., 123 or 123,456,789)"
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{ padding: '10px', width: '400px', marginBottom: '10px' }}
      />
      <br />
      <button onClick={handleSingleCheck} style={{ padding: '10px 20px', marginRight: '10px' }}>
        🔍 Check Single
      </button>
      <button onClick={handleBulkCheck} style={{ padding: '10px 20px' }}>
        📦 Check Bulk
      </button>

      {loading && <p>Loading...</p>}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {results.map((r, i) => (
            <div key={i} style={{ borderBottom: '1px solid #ccc', marginBottom: 15 }}>
              <p><strong>Token ID:</strong> {r.tokenId}</p>
              {r.error ? (
                <p style={{ color: 'red' }}>⚠️ Error fetching data</p>
              ) : (
                <>
                  <p>🟢 Claimed: {r.claimed.toFixed(4)} YEET</p>
                  <p>🟡 Claimable: {r.claimable.toFixed(4)} YEET</p>
                  <p>💰 Total: {r.total.toFixed(4)} YEET</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
