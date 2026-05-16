export const runtime = "nodejs";
import { Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

const INDEXER_RPC = "https://indexer-storage-turbo.0g.ai";
const RPC_URL = "https://evmrpc.0g.ai";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get("tx");

    if (!txHash) {
      return NextResponse.json({ error: "No transaction hash provided" }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const rootHash = receipt.logs[0]?.topics[1];

    if (!rootHash) {
      return NextResponse.json({ error: "Root hash not found in transaction" }, { status: 404 });
    }

    const indexer = new Indexer(INDEXER_RPC);
    const [data, err] = await indexer.download(rootHash, undefined, false);

    if (err) throw new Error("Download failed: " + err);

    const text = new TextDecoder().decode(data);
    const payload = JSON.parse(text);

    return NextResponse.json({ payload });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}