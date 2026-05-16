"use client";
import { useState, useEffect } from "react";
import { BrowserProvider, parseEther } from "ethers";
import { encryptFile, decryptFile } from "./encrypt";
import { uploadToOG, downloadFromOG } from "./storage";

const OG_CHAIN_ID = "0x4115";
const OG_CHAIN_PARAMS = {
  chainId: "0x4115",
  chainName: "0G Mainnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: ["https://evmrpc.0g.ai"],
  blockExplorerUrls: ["https://chainscan.0g.ai"],
};

export default function Home() {
  const [tab, setTab] = useState("send");
  const [wallet, setWallet] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [rootHash, setRootHash] = useState(null);
  const [receiveTx, setReceiveTx] = useState("");
  const [receiveStatus, setReceiveStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("silentdrop_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  function saveToHistory(entry) {
    const updated = [entry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem("silentdrop_history", JSON.stringify(updated));
  }

  async function switchToOG() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: OG_CHAIN_ID }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [OG_CHAIN_PARAMS],
        });
      }
    }
  }

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not found!");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setWallet(accounts[0]);
    await switchToOG();
  }

  function disconnectWallet() {
    setWallet(null);
  }

  async function handleSend() {
    if (!wallet) { alert("Please connect your wallet first!"); return; }
    if (!recipient || !file) { alert("Please fill in recipient address and select a file!"); return; }
    try {
      await switchToOG();
      setStatus("Encrypting file...");
      const payload = await encryptFile(file, recipient);

      setStatus("Requesting fee payment of 0.001 OG...");
      const feeHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: wallet,
          to: "0x785eAb761be19B018fBad199555997edB94724DF",
          value: "0x38D7EA4C68000",
          gas: "0x5208",
        }],
      });

      setStatus("Confirming fee...");
      setStatus("Uploading to 0G Storage...");
      const tx = await uploadToOG(payload, feeHash);
      setTxHash(tx.txHash);
      setRootHash(tx.rootHash);
      setStatus("File sent successfully on 0G!");

      saveToHistory({
        type: "sent",
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        recipient: recipient.slice(0, 6) + "..." + recipient.slice(-4),
        rootHash: tx.rootHash,
        txHash: tx.txHash,
        date: new Date().toLocaleString(),
      });
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  async function handleReceive() {
    if (!wallet) { alert("Please connect your wallet first!"); return; }
    if (!receiveTx) { alert("Please enter a root hash!"); return; }
    try {
      setReceiveStatus("Fetching from 0G Storage...");
      const payload = await downloadFromOG(receiveTx);
      setReceiveStatus("Decrypting file...");
      const decrypted = decryptFile(payload, wallet);
      const url = URL.createObjectURL(decrypted);
      const a = document.createElement("a");
      a.href = url;
      a.download = payload.fileName || "silentdrop-file";
      a.click();
      URL.revokeObjectURL(url);
      setReceiveStatus("File downloaded successfully!");

      saveToHistory({
        type: "received",
        fileName: payload.fileName || "Unknown file",
        rootHash: receiveTx,
        date: new Date().toLocaleString(),
      });
    } catch (err) {
      setReceiveStatus("Error: " + err.message);
    }
  }

  function getExplorerLink() {
    return "https://chainscan.0g.ai/tx/" + txHash;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("silentdrop_history");
  }

  const tabs = ["send", "receive", "history"];

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #080810 0%, #0d0a1f 40%, #080810 100%)",
      color: "white",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px"
    }}>

      <div style={{
        position: "fixed", top: "10%", left: "20%",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "fixed", bottom: "10%", right: "20%",
        width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* Header */}
      <div style={{
        width: "100%", maxWidth: "500px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "40px", position: "relative", zIndex: 1
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a78bfa"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d="M20 2L5 9v11c0 9 6.5 15.5 15 18 8.5-2.5 15-9 15-18V9L20 2z"
              fill="url(#g1)" opacity="0.12" stroke="url(#g1)" strokeWidth="1.2"/>
            <path d="M20 11C20 11 14 18 14 21.8C14 25.2 16.7 28 20 28C23.3 28 26 25.2 26 21.8C26 18 20 11 20 11Z"
              fill="url(#g1)" filter="url(#glow)"/>
          </svg>
          <div>
            <h1 style={{
              fontSize: "26px", fontWeight: "700",
              background: "linear-gradient(90deg, #c4b5fd, #7c3aed)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              margin: 0, letterSpacing: "-0.5px"
            }}>SilentDrop</h1>
            <p style={{ color: "#4b5563", fontSize: "12px", margin: "2px 0 0 0" }}>
              Private file transfer · 0G Storage
            </p>
          </div>
        </div>

        <button onClick={wallet ? disconnectWallet : connectWallet} style={{
          background: wallet
            ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.1))"
            : "rgba(124,58,237,0.1)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: "100px",
          color: wallet ? "#c4b5fd" : "#8b5cf6",
          fontSize: "13px", padding: "9px 18px",
          cursor: "pointer", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", gap: "6px"
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: wallet ? "#a78bfa" : "#4b5563",
            display: "inline-block"
          }}/>
          {wallet ? wallet.slice(0, 6) + "..." + wallet.slice(-4) : "Connect Wallet"}
        </button>
      </div>

      {/* Main Card */}
      <div style={{
        width: "100%", maxWidth: "500px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "28px", padding: "36px",
        backdropFilter: "blur(24px)",
        position: "relative", zIndex: 1,
        boxShadow: "0 0 60px rgba(124,58,237,0.07), inset 0 1px 0 rgba(255,255,255,0.05)"
      }}>

        {/* Tabs */}
        <div style={{
          display: "flex",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "14px", padding: "4px",
          marginBottom: "36px",
          border: "1px solid rgba(255,255,255,0.04)"
        }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "11px",
              borderRadius: "11px", border: "none",
              cursor: "pointer", fontSize: "13px", fontWeight: "500",
              transition: "all 0.25s",
              background: tab === t
                ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.2))"
                : "transparent",
              color: tab === t ? "#c4b5fd" : "#4b5563",
              boxShadow: tab === t ? "0 0 20px rgba(124,58,237,0.15)" : "none"
            }}>
              {t === "send" ? "↑ Send" : t === "receive" ? "↓ Receive" : "⏱ History"}
            </button>
          ))}
        </div>

        {/* Send Panel */}
        {tab === "send" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <label style={{ color: "#6b7280", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recipient Wallet</label>
              <input
                type="text" placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{
                  width: "100%", marginTop: "8px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px", padding: "13px 16px",
                  color: "white", fontSize: "13px", outline: "none",
                  boxSizing: "border-box", fontFamily: "monospace"
                }}
              />
            </div>

            <div>
              <label style={{ color: "#6b7280", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>File</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById("fileInput").click()}
                style={{
                  marginTop: "8px",
                  border: dragging ? "1px dashed #7c3aed" : "1px dashed rgba(255,255,255,0.08)",
                  borderRadius: "14px", padding: "28px",
                  textAlign: "center", cursor: "pointer",
                  background: dragging ? "rgba(124,58,237,0.06)" : "rgba(0,0,0,0.2)",
                  transition: "all 0.2s"
                }}
              >
                <input id="fileInput" type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }} />
                {file ? (
                  <div>
                    <p style={{ color: "#a78bfa", margin: "0 0 4px 0", fontSize: "14px", fontWeight: "500" }}>✓ {file.name}</p>
                    <p style={{ color: "#4b5563", margin: 0, fontSize: "12px" }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: "#374151", margin: "0 0 4px 0", fontSize: "24px" }}>↑</p>
                    <p style={{ color: "#4b5563", margin: 0, fontSize: "13px" }}>Drop file here or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: "rgba(124,58,237,0.05)",
              border: "1px solid rgba(124,58,237,0.12)",
              borderRadius: "12px", padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ color: "#4b5563", fontSize: "13px" }}>Service fee</span>
              <span style={{
                color: "#a78bfa", fontSize: "13px", fontWeight: "600",
                background: "rgba(124,58,237,0.1)",
                padding: "2px 10px", borderRadius: "100px"
              }}>0.001 OG</span>
            </div>

            <button onClick={handleSend} style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: "14px", padding: "15px",
              color: "white", fontSize: "15px", fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
            }}>
              Encrypt & Send
            </button>

            {status && (
              <div style={{
                background: status.includes("Error") ? "rgba(239,68,68,0.08)" : "rgba(124,58,237,0.08)",
                border: status.includes("Error") ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(124,58,237,0.15)",
                borderRadius: "12px", padding: "13px 16px",
                fontSize: "13px",
                color: status.includes("Error") ? "#f87171" : "#a78bfa",
                textAlign: "center"
              }}>
                {status.includes("Error") ? "⚠ " : "⟳ "}{status}
              </div>
            )}

            {txHash && (
              <div style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "14px", padding: "16px"
              }}>
                <p style={{ color: "#4b5563", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px 0" }}>Transaction</p>
                <a href={getExplorerLink()} target="_blank" style={{
                  color: "#7c3aed", fontSize: "12px",
                  wordBreak: "break-all", textDecoration: "none"
                }}>{txHash}</a>
              </div>
            )}

            {rootHash && (
              <div style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(109,40,217,0.05))",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: "14px", padding: "18px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Root Hash</p>
                  <button onClick={() => copyToClipboard(rootHash)} style={{
                    background: "rgba(124,58,237,0.2)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "8px", color: "#a78bfa",
                    fontSize: "11px", padding: "4px 10px", cursor: "pointer"
                  }}>Copy</button>
                </div>
                <p style={{ color: "#c4b5fd", fontSize: "12px", wordBreak: "break-all", margin: "0 0 8px 0", fontFamily: "monospace" }}>{rootHash}</p>
                <p style={{ color: "#4b5563", fontSize: "11px", margin: 0 }}>Share this with your recipient to download the file</p>
              </div>
            )}
          </div>
        )}

        {/* Receive Panel */}
        {tab === "receive" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <label style={{ color: "#6b7280", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>Root Hash</label>
              <input
                type="text" placeholder="0x..."
                value={receiveTx}
                onChange={(e) => setReceiveTx(e.target.value)}
                style={{
                  width: "100%", marginTop: "8px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px", padding: "13px 16px",
                  color: "white", fontSize: "13px", outline: "none",
                  boxSizing: "border-box", fontFamily: "monospace"
                }}
              />
            </div>

            <div style={{
              background: "rgba(0,0,0,0.15)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: "12px", padding: "14px 16px"
            }}>
              <p style={{ color: "#4b5563", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
                Make sure your wallet matches the recipient address the sender used. The file was encrypted specifically for your wallet.
              </p>
            </div>

            <button onClick={handleReceive} style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: "14px", padding: "15px",
              color: "white", fontSize: "15px", fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
            }}>
              Decrypt & Download
            </button>

            {receiveStatus && (
              <div style={{
                background: receiveStatus.includes("Error") ? "rgba(239,68,68,0.08)" : "rgba(124,58,237,0.08)",
                border: receiveStatus.includes("Error") ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(124,58,237,0.15)",
                borderRadius: "12px", padding: "13px 16px",
                fontSize: "13px",
                color: receiveStatus.includes("Error") ? "#f87171" : "#a78bfa",
                textAlign: "center"
              }}>
                {receiveStatus.includes("Error") ? "⚠ " : "✓ "}{receiveStatus}
              </div>
            )}
          </div>
        )}

        {/* History Panel */}
        {tab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                {history.length} transfer{history.length !== 1 ? "s" : ""}
              </p>
              {history.length > 0 && (
                <button onClick={clearHistory} style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: "8px", color: "#f87171",
                  fontSize: "11px", padding: "4px 10px", cursor: "pointer"
                }}>Clear</button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "40px 20px",
                background: "rgba(0,0,0,0.2)",
                border: "1px dashed rgba(255,255,255,0.06)",
                borderRadius: "14px"
              }}>
                <p style={{ color: "#374151", fontSize: "24px", margin: "0 0 8px 0" }}>⏱</p>
                <p style={{ color: "#4b5563", fontSize: "13px", margin: 0 }}>No transfers yet</p>
              </div>
            ) : (
              history.map((item, i) => (
                <div key={i} style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "14px", padding: "16px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{
                      background: item.type === "sent" ? "rgba(124,58,237,0.15)" : "rgba(16,185,129,0.15)",
                      border: item.type === "sent" ? "1px solid rgba(124,58,237,0.2)" : "1px solid rgba(16,185,129,0.2)",
                      borderRadius: "100px", padding: "2px 10px",
                      fontSize: "11px", fontWeight: "600",
                      color: item.type === "sent" ? "#a78bfa" : "#34d399"
                    }}>
                      {item.type === "sent" ? "↑ Sent" : "↓ Received"}
                    </span>
                    <span style={{ color: "#374151", fontSize: "11px" }}>{item.date}</span>
                  </div>

                  <p style={{ color: "white", fontSize: "13px", fontWeight: "500", margin: "0 0 4px 0" }}>{item.fileName}</p>

                  {item.fileSize && (
                    <p style={{ color: "#4b5563", fontSize: "11px", margin: "0 0 8px 0" }}>{item.fileSize}</p>
                  )}

                  {item.recipient && (
                    <p style={{ color: "#4b5563", fontSize: "11px", margin: "0 0 8px 0" }}>To: {item.recipient}</p>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: "#4b5563", fontSize: "11px", fontFamily: "monospace", margin: 0, wordBreak: "break-all", flex: 1, marginRight: "8px" }}>
                      {item.rootHash.slice(0, 20)}...
                    </p>
                    <button onClick={() => copyToClipboard(item.rootHash)} style={{
                      background: "rgba(124,58,237,0.15)",
                      border: "1px solid rgba(124,58,237,0.2)",
                      borderRadius: "8px", color: "#a78bfa",
                      fontSize: "11px", padding: "4px 10px",
                      cursor: "pointer", whiteSpace: "nowrap"
                    }}>Copy Hash</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      <div style={{ marginTop: "32px", zIndex: 1, textAlign: "center" }}>
        <p style={{ color: "#1f2937", fontSize: "12px", margin: 0 }}>
          End-to-end encrypted · Powered by 0G Storage
        </p>
      </div>

    </main>
  );
}