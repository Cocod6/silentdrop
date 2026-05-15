import { Blob as ZgBlob, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { BrowserProvider } from "ethers";

const INDEXER_RPC = "https://indexer-storage-turbo.0g.ai";
const RPC_URL = "https://evmrpc.0g.ai";
const MAINNET_CHAIN_ID = "0x4115";

export async function uploadToOG(encryptedPayload) {
  const provider = new BrowserProvider(window.ethereum);

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MAINNET_CHAIN_ID }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: MAINNET_CHAIN_ID,
          chainName: "0G Mainnet",
          nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: ["https://chainscan.0g.ai"],
        }],
      });
    } else {
      throw switchError;
    }
  }

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