"use client";
import { useState } from "react";
import { encryptFile } from "./encrypt";

export default function Home() {
  const [tab, setTab] = useState("send");
  const [wallet, setWallet] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [encryptedPayload, setEncryptedPayload] = useState(null);

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not found! Please install it.");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setWallet(accounts[0]);
  }

  async function handleSend() {
    if (!wallet) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!recipient || !file) {
      alert("Please fill in recipient address and select a file!");
      return;
    }

    try {
      setStatus("Encrypting file...");
      const payload = await encryptFile(file, recipient);
      setEncryptedPayload(payload);
      setStatus("File encrypted successfully! Ready to upload to 0G.");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">

      {/* Header */}
      <div className="mb-6 text-center w-full max-w-md flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-purple-400">SilentDrop</h1>
          <p className="text-gray-400 text-sm">Private encrypted file transfer on 0G</p>
        </div>
        <button
          onClick={connectWallet}
          className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-full"
        >
          {wallet ? wallet.slice(0, 6) + "..." + wallet.slice(-4) : "Connect Wallet"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setTab("send")}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            tab === "send"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Send File
        </button>
        <button
          onClick={() => setTab("receive")}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            tab === "receive"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Receive File
        </button>
      </div>

      {/* Send Panel */}
      {tab === "send" && (
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-purple-300">Send a File</h2>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Recipient Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Select File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="bg-gray-800 text-white rounded-lg px-4 py-2"
            />
          </div>

          <button
            onClick={handleSend}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Encrypt & Send
          </button>

          {status && (
            <div className="text-sm text-center text-purple-300 bg-purple-950 rounded-lg px-4 py-2">
              {status}
            </div>
          )}

          {encryptedPayload && (
            <div className="text-xs text-gray-500 bg-gray-800 rounded-lg p-3 break-all">
              <p className="text-gray-300 mb-1 font-semibold">Encrypted payload preview:</p>
              {encryptedPayload.encrypted.slice(0, 80)}...
            </div>
          )}
        </div>
      )}

      {/* Receive Panel */}
      {tab === "receive" && (
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-purple-300">Receive Files</h2>

          <button
            onClick={connectWallet}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"
          >
            {wallet ? "Wallet Connected ✓" : "Connect Wallet to View Files"}
          </button>

          <div className="text-gray-500 text-sm text-center">
            {wallet
              ? `Showing files for ${wallet.slice(0, 6)}...${wallet.slice(-4)}`
              : "Connect your wallet to see files sent to your address"}
          </div>
        </div>
      )}

    </main>
  );
}