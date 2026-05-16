"use client";
import { useState } from "react";
import { encryptFile, decryptFile } from "./encrypt";
import { uploadToOG, downloadFromOG } from "./storage";

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

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not found!");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setWallet(accounts[0]);
  }

  async function handleSend() {
    if (!wallet) { alert("Please connect your wallet first!"); return; }
    if (!recipient || !file) { alert("Please fill in recipient address and select a file!"); return; }
    try {
      setStatus("Encrypting file...");
      const payload = await encryptFile(file, recipient);
      setStatus("Uploading to 0G Storage...");
      const tx = await uploadToOG(payload);
      setTxHash(tx.txHash);
      setRootHash(tx.rootHash);
      setStatus("File sent successfully on 0G!");
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
    } catch (err) {
      setReceiveStatus("Error: " + err.message);
    }
  }

  function getExplorerLink() {
    return "https://chainscan.0g.ai/tx/" + txHash;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #0d0a1a 50%, #0a0a0f 100%)",
      color: "white",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px"
    }}>

      {/* Glow background */}
      <div style={{
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "48px",
        position: "relative",
        zIndex: 1
      }}>
        <div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            background: "linear-gradient(90deg, #a78bfa, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
            letterSpacing: "-0.5px"
          }}>SilentDrop</h1>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 0 0" }}>
            Private file transfer on 0G Storage
          </p>
        </div>
        <button onClick={connectWallet} style={{
          background: wallet ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: "100px",
          color: wallet ? "#a78bfa" : "#7c3aed",
          fontSize: "13px",
          padding: "8px 16px",
          cursor: "pointer",
          backdropFilter: "blur(10px)"
        }}>
          {wallet ? "● " + wallet.slice(0, 6) + "..." + wallet.slice(-4) : "Connect Wallet"}
        </button>
      </div>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: "480px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "24px",
        padding: "32px",
        backdropFilter: "blur(20px)",
        position: "relative",
        zIndex: 1,
        boxShadow: "0 0 40px rgba(139,92,246,0.05)"
      }}>

        {/* Tabs */}
        <div style={{
          display: "flex",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "32px"
        }}>
          {["send", "receive"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
              background: tab === t ? "rgba(139,92,246,0.2)" : "transparent",
              color: tab === t ? "#a78bfa" : "#6b7280",
              boxShadow: tab === t ? "0 0 20px rgba(139,92,246,0.1)" : "none"
            }}>
              {t === "send" ? "↑ Send File" : "↓ Receive File"}
            </button>
          ))}
        </div>

        {/* Send Panel */}
        {tab === "send" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Recipient Wallet
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div>
              <label style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                File
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
                style={{
                  marginTop: "8px",
                  border: dragging ? "1px dashed #7c3aed" : "1px dashed rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragging ? "rgba(139,92,246,0.05)" : "rgba(255,255,255,0.02)",
                  transition: "all 0.2s"
                }}
                onClick={() => document.getElementById("fileInput").click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
                {file ? (
                  <p style={{ color: "#a78bfa", margin: 0, fontSize: "14px" }}>✓ {file.name}</p>
                ) : (
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
                    Drop file here or click to browse
                  </p>
                )}
              </div>
            </div>

            <button onClick={handleSend} style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(139,92,246,0.3)",
              transition: "all 0.2s"
            }}>
              Encrypt & Send
            </button>

            {status && (
              <div style={{
                background: status.includes("Error") ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)",
                border: status.includes("Error") ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(139,92,246,0.2)",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "13px",
                color: status.includes("Error") ? "#f87171" : "#a78bfa",
                textAlign: "center"
              }}>
                {status}
              </div>
            )}

            {txHash && (
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "16px"
              }}>
                <p style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0" }}>Transaction</p>
                <a href={getExplorerLink()} target="_blank" style={{
                  color: "#7c3aed",
                  fontSize: "12px",
                  wordBreak: "break-all",
                  textDecoration: "none"
                }}>{txHash}</a>
              </div>
            )}

            {rootHash && (
              <div style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: "12px",
                padding: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <p style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Root Hash — Share with recipient</p>
                  <button onClick={() => copyToClipboard(rootHash)} style={{
                    background: "rgba(139,92,246,0.2)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#a78bfa",
                    fontSize: "11px",
                    padding: "4px 8px",
                    cursor: "pointer"
                  }}>Copy</button>
                </div>
                <p style={{ color: "#a78bfa", fontSize: "12px", wordBreak: "break-all", margin: 0, fontFamily: "monospace" }}>{rootHash}</p>
              </div>
            )}
          </div>
        )}

        {/* Receive Panel */}
        {tab === "receive" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Root Hash
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={receiveTx}
                onChange={(e) => setReceiveTx(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <button onClick={handleReceive} style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(139,92,246,0.3)"
            }}>
              Decrypt & Download
            </button>

            {receiveStatus && (
              <div style={{
                background: receiveStatus.includes("Error") ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)",
                border: receiveStatus.includes("Error") ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(139,92,246,0.2)",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "13px",
                color: receiveStatus.includes("Error") ? "#f87171" : "#a78bfa",
                textAlign: "center"
              }}>
                {receiveStatus}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <p style={{ color: "#374151", fontSize: "12px", marginTop: "32px", zIndex: 1 }}>
        Powered by 0G Storage • End-to-end encrypted
      </p>

    </main>
  );
}