import { Blob as ZgBlob, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

const INDEXER_RPC = "https://indexer-storage-turbo.0g.ai";
const RPC_URL = "https://evmrpc.0g.ai";

export async function POST(request) {
  try {
    const body = await request.json();
    const jsonString = JSON.stringify(body);
    const encoder = new TextEncoder();
    const uint8 = encoder.encode(jsonString);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(process.env.UPLOADER_PRIVATE_KEY, provider);

    const nativeBlob = new Blob([uint8], { type: "application/json" });
    const zgBlob = new ZgBlob(nativeBlob);

    const [tree, treeErr] = await zgBlob.merkleTree();
    if (treeErr) throw new Error("Merkle tree error: " + treeErr);

    const indexer = new Indexer(INDEXER_RPC);
    const [tx, err] = await indexer.upload(zgBlob, RPC_URL, signer);
    if (err) throw new Error("Upload failed: " + err);

    return NextResponse.json({ txHash: tx.txHash });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}