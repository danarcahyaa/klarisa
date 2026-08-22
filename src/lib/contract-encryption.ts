import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const key = process.env.CONTRACT_ENCRYPTION_KEY;
  if (!key || !/^[a-f\d]{64}$/i.test(key)) {
    throw new Error("CONTRACT_ENCRYPTION_KEY harus berupa 64 karakter heksadesimal.");
  }
  return Buffer.from(key, "hex");
}

export function encryptContractContent(plainText: string) {
  if (!plainText) throw new Error("Isi kontrak tidak boleh kosong.");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptContractContent(payload: string) {
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Format isi kontrak tidak valid.");
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return decipher.update(encryptedHex, "hex", "utf8") + decipher.final("utf8");
}
