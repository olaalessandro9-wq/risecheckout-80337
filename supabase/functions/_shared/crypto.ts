/**
 * Módulo de criptografia para tokens sensíveis
 * Utiliza AES-256-GCM para criptografia simétrica
 */

const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY");

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY não configurada nas variáveis de ambiente");
}

// Converte a chave base64 para Uint8Array (deve ter 32 bytes para AES-256)
function getKeyMaterial(): Uint8Array {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não configurada");
  }
  const keyData = Uint8Array.from(atob(ENCRYPTION_KEY), (c) => c.charCodeAt(0));
  
  // Garante que a chave tenha exatamente 32 bytes
  const key = new Uint8Array(32);
  key.set(keyData.slice(0, 32));
  
  return key;
}

/**
 * Criptografa um texto usando AES-256-GCM
 * @param plaintext Texto em claro para criptografar
 * @returns Texto criptografado em formato base64 (iv:ciphertext:tag)
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Gera um IV (Initialization Vector) aleatório de 12 bytes
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Importa a chave
    const keyMaterial = getKeyMaterial();
    const key = await crypto.subtle.importKey(
      "raw",
      keyMaterial as BufferSource,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    
    // Criptografa
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    // Combina IV + ciphertext em base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    throw new Error(`Erro ao criptografar: ${error}`);
  }
}

/**
 * Descriptografa um texto criptografado com AES-256-GCM
 * @param ciphertext Texto criptografado em formato base64
 * @returns Texto em claro
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    // Decodifica de base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extrai IV (primeiros 12 bytes) e dados criptografados
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Importa a chave
    const keyMaterial = getKeyMaterial();
    const key = await crypto.subtle.importKey(
      "raw",
      keyMaterial as BufferSource,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    // Descriptografa
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch (error) {
    throw new Error(`Erro ao descriptografar: ${error}`);
  }
}

/**
 * Gera uma chave de criptografia segura (32 bytes em base64)
 * Use esta função para gerar a ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}
