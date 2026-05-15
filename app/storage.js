import { Blob as ZgBlob, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { BrowserProvider } from "ethers";

const INDEXER_RPC = "https://indexer-storage-testnet-turbo.0g.ai";
const RPC_URL = "https://evmrpc-testnet.0g.ai";

export async function uploadToOG(encryptedPayload) {
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const jsonString = JSON.stringify(encryptedPayload);
  const nativeBlob = new window.Blob([jsonString], { type: "application/json" });
  const browserFile = new window.File([nativeBlob], "silentdrop.json", { type: "application/json" });

  const zgBlob = new ZgBlob(browserFile);
  const [tree, treeErr] = await zgBlob.merkleTree();
  if (treeErr) throw new Error("Merkle tree error: " + treeErr);

  const indexer = new Indexer(INDEXER_RPC);
  const [tx, err] = await indexer.upload(zgBlob, RPC_URL, signer);
  if (err) throw new Error("Upload failed: " + err);

  return tx;
}