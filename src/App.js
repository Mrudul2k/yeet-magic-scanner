import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

const YEET_ADDRESS = '0x08A38Caa631DE329FF2DAD1656CE789F31AF3142';
const AIRDROP_ADDRESS = '0x1d6bbc466bbd0150a5e91bf337fa696a8f3fa3d7';
const RPC_URL = 'https://rpc.berachain.com';
const MAGICEDEN_API = 'https://api-mainnet.magiceden.dev/v3/rtp/berachain/collections/yeetard-nfts-36/listings?limit=50';

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
      const price = parseFloat(data.pairs?.[0]?.priceUsd);
      if (price) setYeetUsd(price);
    } catch (err) {
      console.error('Failed to fetch YEET price', err);
    }
  };

  const scanListings = async () => {
    setLoading(true);
    setResults([]);
    await fetchYEETPrice();

    try {
      const listingsRes = await fetch(MAGICEDEN_API);
      const listings = await listingsRes.json();

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, provider);

      const listingData = listings?.results || listings;

      const data = await Promise.all(listingData.map(async (item) => {
        const tokenId = parseInt(item.token.tokenId);
        const price = parseFloat(item.price.amount.native);

        try {
          const claimed = parseFloat(ethers.formatUnits(await contract.claimed(tokenId), 18));
          const claimable = parseFloat(ethers.formatUnits(await contract.claimable(tokenId), 18));
          const total = claimed + claimable;
          const usdValue = yeetUsd ? (claimable * yeetUsd).toFixed(2) : null;

          return {
            tokenId,
            price,
            claimed,
            claimable,
            total,
            usdValue,
            image: item.token.image,
          };
        } catch (err) {
          console.error(`Error fetching for token ${tokenId}`, err);
          return null;
        }
      }));

      setResults(data.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch listings', err);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 30, fontFamily: 'monospace' }}>
      <h1>🧠 YEET NFT Tracker + Magic Eden</h1>
      <button onClick={scanListings} style={{ padding: 10, fontSize: 16 }}>
        🔍 Scan Magic Eden Listings
      </button>

      {loading && <p>Loading listings + chain data...</p>}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {results.map((r, idx) => (
            <div key={idx} style={{ border: '1px solid #ccc', padding: 15, marginBottom: 15 }}>
              <img src={r.image} alt={`NFT ${r.tokenId}`} width={100} style={{ borderRadius: 10 }} />
              <p><strong>Token ID:</strong> {r.tokenId}</p>
              <p>💸 Listed at: {r.price} BERA</p>
              <p>🟢 Claimed: {r.claimed.toFixed(2)} YEET</p>
              <p>🟡 Claimable: {r.claimable.toFixed(2)} YEET {r.usdValue && `(≈ $${r.usdValue} USD)`}</p>
              <p>💰 Total Earned: {r.total.toFixed(2)} YEET</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
