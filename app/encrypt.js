import nacl from "tweetnacl";

// Convert a wallet address into a 32-byte encryption key
function walletToKey(walletAddress) {
  const str = walletAddress.toLowerCase().padEnd(32, "0").slice(0, 32);
  return new TextEncoder().encode(str);
}

// Encrypt a file for a recipient wallet
export async function encryptFile(file, recipientWallet) {
  const fileBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileBuffer);
  const key = walletToKey(recipientWallet);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const encrypted = nacl.secretbox(fileBytes, nonce, key);

  return {
    encrypted: Buffer.from(encrypted).toString("base64"),
    nonce: Buffer.from(nonce).toString("base64"),
    fileName: file.name,
    fileType: file.type,
  };
}

// Decrypt a file using your own wallet
export function decryptFile(encryptedData, walletAddress) {
  const key = walletToKey(walletAddress);
  const encrypted = Buffer.from(encryptedData.encrypted, "base64");
  const nonce = Buffer.from(encryptedData.nonce, "base64");
  const decrypted = nacl.secretbox.open(encrypted, nonce, key);

  if (!decrypted) {
    throw new Error("Decryption failed — wrong wallet?");
  }

  return new Blob([decrypted], { type: encryptedData.fileType });
}