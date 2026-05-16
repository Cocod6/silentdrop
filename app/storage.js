export async function uploadToOG(encryptedPayload) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encryptedPayload),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return { txHash: data.txHash };
}

export async function downloadFromOG(txHash) {
  const response = await fetch("/api/download?tx=" + txHash);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.payload;
}