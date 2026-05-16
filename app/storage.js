export async function uploadToOG(encryptedPayload, feeSignedTx) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encryptedPayload, feeSignedTx }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return { txHash: data.txHash, rootHash: data.rootHash };
}

export async function downloadFromOG(rootHash) {
  const response = await fetch("/api/download?root=" + rootHash);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.payload;
}