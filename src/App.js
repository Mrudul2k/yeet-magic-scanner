import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

const AIRDROP_ADDRESS = '0x1d6Bbc466BBd0150a5E91BF337fa696A8f3Fa3D7';
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

const provider = new ethers.JsonRpcProvider("https://rpc.berachain.com");

function App() {
  const [tokenId, setTokenId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [result, setResult] = useState(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [highClaimables, setHighClaimables] = useState([]);
  const [loading, setLoading] = useState(false);

  const contract = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, provider);

  const checkSingle = async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const claimedRaw = await contract.claimed(tokenId);
      const claimableRaw = await contract.claimable(tokenId);
      const claimed = parseFloat(ethers.formatUnits(claimedRaw, 18));
      const claimable = parseFloat(ethers.formatUnits(claimableRaw, 18));
      setResult({ tokenId, claimed, claimable });
    } catch (error) {
      console.error("Error fetching data for token:", tokenId, error);
      setResult(null);
    }
    setLoading(false);
  };

  const checkBulk = async () => {
    const ids = bulkInput.split(",").map(id => id.trim()).filter(id => id !== "");
    const results = [];
    const highClaims = [];
    setLoading(true);
    for (const id of ids) {
      try {
        const claimableRaw = await contract.claimable(id);
        const claimable = parseFloat(ethers.formatUnits(claimableRaw, 18));
        results.push({ tokenId: id, claimable });
        if (claimable > 2000) {
          highClaims.push({ tokenId: id, claimable });
        }
      } catch (error) {
        console.error("Error checking token:", id, error);
      }
    }
    setBulkResults(results);
    setHighClaimables(highClaims);
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>YEET NFT Airdrop Checker</h2>

      <div style={{ marginBottom: 20 }}>
        <h3>🔍 Single Token Checker</h3>
        <input
          type="text"
          placeholder="Enter token ID"
          value={tokenId}
          onChange={e => setTokenId(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <button onClick={checkSingle}>Check</button>
        {loading && <p>Loading...</p>}
        {result && (
          <div style={{ marginTop: 10 }}>
            <p>🎯 Token ID: {result.tokenId}</p>
            <p>✅ Claimed: {result.claimed} YEET</p>
            <p>💰 Claimable: {result.claimable} YEET</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>📦 Bulk Token Checker</h3>
        <textarea
          rows="4"
          cols="60"
          placeholder="Enter comma-separated token IDs"
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
        />
        <br />
        <button onClick={checkBulk}>Check Bulk</button>
        {loading && <p>Loading bulk results...</p>}
        {bulkResults.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <h4>🔎 Results</h4>
            {bulkResults.map((r, i) => (
              <div key={i}>
                <p>Token ID: {r.tokenId} — 💰 Claimable: {r.claimable.toFixed(2)} YEET</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>🔥 High Claimables (2000+ YEET)</h3>
        {highClaimables.map((r, i) => (
          <p key={i}>
            Token ID: {r.tokenId} — 💰 Claimable: {r.claimable.toFixed(2)} YEET
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
