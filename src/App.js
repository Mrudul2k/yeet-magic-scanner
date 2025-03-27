import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

const YEET_ADDRESS = '0x08A38Caa631DE329FF2DAD1656CE789F31AF3142';
const AIRDROP_ADDRESS = '0x1d6bbc466bbd0150a5e91bf337fa696a8f3fa3d7';
const RPC_URL = 'https://rpc.berachain.com';
const COLLECTION_SYMBOL = 'yeetard-nfts';
const LISTING_API = `https://api-mainnet.magiceden.dev/v2/collections/${COLLECTION_SYMBOL}/listings?offset=0&limit=50`;

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
  const [loading, setLoading] = useState(false);
  const [yeetUsd, setYeetUsd] = useState(null);

  const fetchYEETPrice = async () => {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${YEET_ADDRESS}`);
      const data = await res.json();
      const pair = data.pairs?.[0];
      if (pair?.priceUsd) {
        setYeetUsd(parseFloat(pair.priceUsd));
      }
    } catch (err) {
      console.error('Dexscreener price fetch error:', err);
    }
  };

  const scanListings = async () => {
    setLoading(true);
    setResults([]);
    await fetchYEETPrice();

    try {
      const listingRes = await fetch(LISTING_API);
      const listingData = await listingRes.json();

      const listedNFTs = listingData.slice(0, 50); // First 50 NFTs
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, provider);

      const allResults = [];

      for (const item of listedNFTs) {
        const tokenId = parseInt(item.tokenId); // Correct field
        const price = item.price;

        try {
          const claimedRaw = await contract.claimed(tokenId);
          const claimableRaw = await contract.claimable(tokenId);
          const claimed = parseFloat(ethers.formatUnits(claimedRaw, 18));
          const claimable = parseFloat(ethers.formatUnits(claimableRaw, 18));
          const total = claimed + claimable;
          const usdValue = yeetUsd ? claimable * yeetUsd : null;

          allResults.push({
            tokenId,
            claimed,
            claimable,
            total,
            price,
            usdValue
          });
        } catch (err) {
          console.error(`Error fetching token ${tokenId}`, err);
        }
      }

      setResults(allResults);
    } catch (err) {
      console.error('Failed to fetch Magic Eden listings', err);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'monospace' }}>
      <h1>🧠 YEET NFT Tracker + Magic Eden Listings</h1>

      <button onClick={scanListings} style={{ marginTop: 10, padding: '10px 20px' }}>
        🔍 Scan Magic Eden Listings
      </button>

      {loading && <p>Loading listings + chain data...</p>}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {results.map((r, i) => (
            <div key={i} style={{ borderBottom: '1px solid #ccc', marginBottom: 15, paddingBottom: 10 }}>
              <p><strong>Token ID:</strong> {r.tokenId}</p>
              <p>💸 Listed at: {r.price} BERA</p>
              <p>🟢 Claimed: {r.claimed.toFixed(2)} YEET</p>
              <p>🟡 Claimable: {r.claimable.toFixed(2)} YEET {r.usdValue ? `($${r.usdValue.toFixed(2)} USD)` : ''}</p>
              <p>💰 Total Accrued: {r.total.toFixed(2)} YEET</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
