import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

const AirdropABI = [
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

const CONTRACT_ADDRESS = "0x1d6bbc466bbd0150a5e91bf337fa696a8f3fa3d7";
const RPC = "https://rpc.berachain.com";

function App() {
  const [tokenId, setTokenId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const provider = new ethers.JsonRpcProvider(RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AirdropABI, provider);

      const claimableRaw = await contract.claimable(tokenId);
      const claimedRaw = await contract.claimed(tokenId);

      const claimable = parseFloat(ethers.formatUnits(claimableRaw, 18));
      const claimed = parseFloat(ethers.formatUnits(claimedRaw, 18));

      setData({
        tokenId,
        claimable,
        claimed,
        total: claimable + claimed,
        ready: claimable >= 10000,
        neverClaimed: claimed === 0
      });
    } catch (err) {
      setError("Invalid token ID or contract error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30, fontFamily: 'Arial' }}>
      <h1>🧠 YEET NFT Claim Checker</h1>
      <input
        type="number"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        placeholder="Enter Token ID"
        style={{ padding: 10, fontSize: 16, marginTop: 20 }}
      />
      <br />
      <button
        onClick={fetchData}
        style={{ marginTop: 10, padding: '10px 20px', fontSize: 16 }}
      >
        Check Claim Status
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && (
        <div style={{ marginTop: 20 }}>
          <p>Token ID: <strong>{data.tokenId}</strong></p>
          <p>Claimed: {data.claimed.toFixed(4)} YEET</p>
          <p>Claimable: {data.claimable.toFixed(4)} YEET</p>
          <p>Total Accrued: {data.total.toFixed(4)} YEET</p>
          <p>Ready to Claim: {data.ready ? '✅ YES' : '❌ Not yet'}</p>
          <p>Ever Claimed: {data.neverClaimed ? '❌ No' : '✅ Yes'}</p>
        </div>
      )}
    </div>
  );
}

export default App;
