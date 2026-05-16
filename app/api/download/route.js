export const runtime = "nodejs";
import { Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { NextResponse } from "next/server";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const INDEXER_RPC = "https://indexer-storage-turbo.0g.ai";
const RPC_URL = "https://evmrpc.0g.ai";

export async function GET(request) {
  const tmpFile = join(tmpdir(), "silentdrop-" + Date.now() + ".json");
  try {
    const { searchParams } = new URL(request.url);
    const rootHash = searchParams.get("root");

    if (!rootHash) {
      return NextResponse.json({ error: "No root hash provided" }, { status: 400 });
    }

    const indexer = new Indexer(INDEXER_RPC);
    const err = await indexer.download(rootHash, tmpFile, false);

    if (err !== null) throw new Error("Download failed: " + err);

    const text = readFileSync(tmpFile, "utf8");
    const payload = JSON.parse(text);

    return NextResponse.json({ payload });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}