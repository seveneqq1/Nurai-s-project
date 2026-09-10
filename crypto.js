const CryptoModule = (() => {

  // ── v2: CryptoJS AES-CBC + PBKDF2 (works on HTTP and HTTPS) ──────────────

  const CJS_ITERATIONS = 100000;
  const CJS_KEY_SIZE   = 256 / 32; // 8 words = 256 bits

  function randomWords(nBytes) {
    // crypto.getRandomValues works even on non-secure HTTP
    const arr = new Uint8Array(nBytes);
    crypto.getRandomValues(arr);
    return CryptoJS.lib.WordArray.create(arr);
  }

  function deriveKeyCJS(password, saltWords) {
    return CryptoJS.PBKDF2(password, saltWords, {
      keySize:    CJS_KEY_SIZE,
      iterations: CJS_ITERATIONS,
      hasher:     CryptoJS.algo.SHA256,
    });
  }

  function encryptCJS(password, plaintext) {
    const salt = randomWords(16);
    const iv   = randomWords(16);
    const key  = deriveKeyCJS(password, salt);
    const enc  = CryptoJS.AES.encrypt(plaintext, key, { iv });
    return {
      version: 2,
      salt: salt.toString(CryptoJS.enc.Base64),
      iv:   iv.toString(CryptoJS.enc.Base64),
      data: enc.ciphertext.toString(CryptoJS.enc.Base64),
    };
  }

  function decryptCJS(password, payload) {
    const salt = CryptoJS.enc.Base64.parse(payload.salt);
    const iv   = CryptoJS.enc.Base64.parse(payload.iv);
    const key  = deriveKeyCJS(password, salt);
    const cp   = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(payload.data),
    });
    const dec    = CryptoJS.AES.decrypt(cp, key, { iv });
    const result = dec.toString(CryptoJS.enc.Utf8);
    if (!result) throw new Error("wrong_password");
    return result;
  }

  // ── v1: Web Crypto AES-GCM (legacy, decrypt-only for migration) ───────────

  function base64ToBuffer(b64) {
    const bin   = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  async function decryptV1(password, payload) {
    if (!window.isSecureContext || !crypto.subtle) {
      throw new Error(
        "УСТАРЕВШИЙ ФОРМАТ\n\n" +
        "Ваши данные зашифрованы старым форматом, который работает только через HTTPS.\n\n" +
        "Что сделать:\n" +
        "1. Откройте BM Database на основном ПК (через файл или localhost)\n" +
        "2. Войдите с паролем — данные обновятся автоматически\n" +
        "3. Нажмите «Экспорт копии» и перенесите файл на это устройство\n" +
        "4. Импортируйте файл — всё заработает"
      );
    }
    const enc  = new TextEncoder();
    const salt = new Uint8Array(base64ToBuffer(payload.salt));
    const iv   = new Uint8Array(base64ToBuffer(payload.iv));
    const ct   = base64ToBuffer(payload.data);
    const km   = await crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const key  = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
      km,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(dec);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async function encrypt(password, plaintext) {
    return encryptCJS(password, plaintext);
  }

  async function decrypt(password, payload) {
    const version = payload.version || 1;
    if (version === 1) return decryptV1(password, payload);
    return decryptCJS(password, payload);
  }

  return { encrypt, decrypt };
})();
