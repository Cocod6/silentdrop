export const runtime = "nodejs";
import { Blob as ZgBlob, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

const INDEXER_RPC = "https://indexer-storage-turbo.0g.ai";
const RPC_URL = "https://evmrpc.0g.ai";
const FEE_RECIPIENT = "0x785eAb761be19B018fBad199555997edB94724DF";
const FEE_AMOUNT = "0.001";

export async function POST(request) {
  try {
    const body = await request.json();
    const { encryptedPayload, feeSignedTx } = body;

    if (!feeSignedTx) {
      return NextResponse.json({ error: "Fee transaction required" }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Broadcast the signed fee transaction
    const feeTx = await provider.broadcastTransaction(feeSignedTx);
    await feeTx.wait();

    // Verify fee went to correct address
    const receipt = await provider.getTransactionReceipt(feeTx.hash);
    if (!receipt) {
      return NextResponse.json({ error: "Fee transaction failed" }, { status: 400 });
    }

    // Now upload to 0G Storage
    const signer = new ethers.Wallet(process.env.UPLOADER_PRIVATE_KEY, provider);
    const jsonString = JSON.stringify(encryptedPayload);
    const encoder = new TextEncoder();
    const uint8 = encoder.encode(jsonString);

    const nativeBlob = new Blob([uint8], { type: "application/json" });
    const zgBlob = new ZgBlob(nativeBlob);

    const [tree, treeErr] = await zgBlob.merkleTree();
    if (treeErr) throw new Error("Merkle tree error: " + treeErr);

    const rootHash = tree.rootHash();

    const indexer = new Indexer(INDEXER_RPC);
    const [tx, err] = await indexer.upload(zgBlob, RPC_URL, signer);
    if (err) throw new Error("Upload failed: " + err);

    return NextResponse.json({ txHash: tx.txHash, rootHash: rootHash });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}