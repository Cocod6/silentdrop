export const runtime = "nodejs";
import { Indexer } from "@0gfoundation/0g-storage-ts-sdk";
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

    const indexer = new Indexer(INDEXER_RPC);
    const [data, err] = await indexer.download(txHash, undefined, false);

    if (err) throw new Error("Download failed: " + err);

    const text = new TextDecoder().decode(data);
    const payload = JSON.parse(text);

    return NextResponse.json({ payload });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}