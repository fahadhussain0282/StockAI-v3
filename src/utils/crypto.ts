export async function getClientCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // Generate a stable 256-bit key from a fixed string for local storage encryption
  const rawKey = await window.crypto.subtle.digest('SHA-256', enc.encode('stockai-enterprise-storage-key-v1.1'));
  return window.crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptData(plaintext: string): Promise<string> {
  try {
    const key = await getClientCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );
    
    // Convert to base64 for storage
    const ivB64 = btoa(String.fromCharCode(...iv));
    const encB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    
    return `${ivB64}:${encB64}`;
  } catch (err) {
    console.error('[StockAI] Encryption failed:', err);
    return '';
  }
}

export async function decryptData(encryptedStr: string): Promise<string> {
  try {
    if (!encryptedStr || !encryptedStr.includes(':')) {
      // Fallback for migration from older btoa format
      try {
        return atob(encryptedStr);
      } catch {
        return '';
      }
    }
    
    const [ivB64, encB64] = encryptedStr.split(':');
    const key = await getClientCryptoKey();
    
    const ivStr = atob(ivB64);
    const iv = new Uint8Array(ivStr.length);
    for (let i = 0; i < ivStr.length; i++) iv[i] = ivStr.charCodeAt(i);
    
    const encStr = atob(encB64);
    const encrypted = new Uint8Array(encStr.length);
    for (let i = 0; i < encStr.length; i++) encrypted[i] = encStr.charCodeAt(i);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error('[StockAI] Decryption failed:', err);
    return '';
  }
}
