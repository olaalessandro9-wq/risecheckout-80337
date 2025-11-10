// Chave de criptografia (deve ser a mesma usada para criptografar)
const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY") || "default-encryption-key-change-in-production";

export async function decrypt(encryptedBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Decodifica de base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  // Separa IV e dados criptografados
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // Deriva a chave
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  // Descriptografa
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  
  return decoder.decode(decrypted);
}
