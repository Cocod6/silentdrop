export async function uploadToOG(encryptedPayload) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encryptedPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return { txHash: data.txHash };
}