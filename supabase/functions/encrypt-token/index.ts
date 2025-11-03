import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleOptions, withCorsError, withCorsJson } from "../_shared/cors.ts";

serve(async (req) => {
  // 1) Tratar preflight OPTIONS
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  // 2) Validar método
  if (req.method !== "POST") {
    return withCorsError(req, "Method not allowed", 405);
  }

  try {
    // 3) Extrair e validar dados
    const { token } = await req.json();
    if (!token) {
      return withCorsError(req, "Missing token", 422);
    }

    // 4) Obter chave de criptografia
    const keyB64 = Deno.env.get("ENCRYPTION_KEY");
    if (!keyB64) {
      return withCorsError(req, "Encryption key not configured", 500);
    }

    // 5) Importar chave AES-GCM
    const keyData = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      "AES-GCM",
      false,
      ["encrypt"]
    );

    // 6) Gerar IV aleatório (12 bytes)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 7) Criptografar token
    const enc = new TextEncoder().encode(token);
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc
    );

    // 8) Combinar IV + ciphertext e converter para base64
    const combined = new Uint8Array([...iv, ...new Uint8Array(cipher)]);
    const encrypted = btoa(String.fromCharCode(...combined));

    // 9) Retornar sucesso
    return withCorsJson(req, { encrypted });
  } catch (e) {
    console.error("Encrypt error:", e);
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
    return withCorsError(
      req,
      `Encrypt error: ${errorMsg}`,
      500
    );
  }
});
