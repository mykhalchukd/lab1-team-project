// lib/idempotency.js

// Потрібні у Node.js для криптографічних операцій
const crypto = require('crypto');
const { TextEncoder } = require('util'); // TextEncoder для Node.js

/**
 * Хешує корисне навантаження (payload) для створення стійкого ключа.
 * @param {unknown} obj - Об'єкт, який буде хешуватися (наприклад, тіло POST-запиту).
 * @returns {Promise<string>} - SHA-256 хеш.
 */
async function payloadHash(obj) {
    // Конвертуємо об'єкт у канонічний JSON-рядок і потім у байти
    const data = new TextEncoder().encode(JSON.stringify(obj));
    
    // Розрахунок SHA-256 хешу
    const digest = crypto.subtle.digest("sha-256", data);
    
    // Перетворюємо digest у шістнадцятковий рядок
    return Array.from(new Uint8Array(digest)).map(b =>
        b.toString(16).padStart(2,"0")).join("");
}

/**
 * Генерує або повторно використовує ключ ідемпотентності на основі хешу payload.
 * Використовує localStorage (у браузері) або імітує його.
 * @param {unknown} payload - Об'єкт корисного навантаження.
 * @returns {Promise<string>} - Ключ ідемпотентності.
 */
async function getOrReuseKey(payload) {
    const h = await payloadHash(payload);
    const storageKey = `idem:${h}`;
    
    // Імітація localStorage для Node.js (у браузері це працюватиме з localStorage)
    const existing = global.localStorage?.getItem(storageKey);

    if (existing) {
        console.log(`[Idem Helper] Reusing existing key for hash ${h.slice(0, 8)}...`);
        return existing;
    }
    
    // Генерація нового ключа
    const fresh = crypto.randomUUID();
    
    // Збереження нового ключа
    if (global.localStorage) {
         global.localStorage.setItem(storageKey, fresh);
    }
    console.log(`[Idem Helper] Generating fresh key for hash ${h.slice(0, 8)}...`);
    return fresh;
}

module.exports = {
    payloadHash,
    getOrReuseKey
};