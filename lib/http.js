// lib/http.js
const { randomUUID } = require('crypto');

/**
 * Функція-заглушка для асинхронної затримки.
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Розрахунок експоненційного backoff з джитером.
 * @param {number} base - Базова затримка (наприклад, 250 мс).
 * @param {number} attempt - Поточна спроба ретраю (починаючи з 0).
 * @param {boolean} jitter - Чи додавати випадкову затримку (джитер).
 * @returns {number} - Час затримки в мс.
 */
const backoff = (base, attempt, jitter) =>
    base * 2 ** attempt + (jitter ? Math.floor(Math.random() * 100) : 0);

// Типи для опцій (для розуміння, якщо ви працюєте з TypeScript)
// export type RetryOpts = { retries?: number; baseDelayMs?: number; timeoutMs?: number; jitter?: boolean };

/**
 * Здійснює запит із ретраями, backoff, обробкою Retry-After та таймаутом.
 */
async function fetchWithResilience(
    url,
    opts = {}
) {
    const { retry = {}, idempotencyKey, requestId, ...init } = opts;
    const { retries = 2, baseDelayMs = 250, timeoutMs = 3000, jitter = true } = retry;

    // 1. Налаштування Заголовків
    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", "application/json");
    // Встановлюємо ключі ідемпотентності та кореляції
    if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
    // Використовуємо наданий requestId або генеруємо новий
    headers.set("X-Request-Id", requestId ?? randomUUID()); 
    
    // 2. Таймаут Клієнта (AbortController)
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { ...init, headers, signal: controller.signal });

        // 3. Обробка 429 Too Many Requests (Rate Limit)
        if (res.status === 429 && retries >= 1) {
            // Отримуємо час очікування з заголовка Retry-After
            const ra = Number(res.headers.get("Retry-After") || 1) * 1000;
            console.warn(`[HTTP Helper] Received 429. Retrying after ${ra}ms (Retry-After).`);
            await sleep(ra);
            // Рекурсивний виклик з зменшеною кількістю ретраїв
            return fetchWithResilience(url, { ...opts, retry: { ...retry, retries: retries - 1 } });
        }

        // 4. Обробка 5xx помилок (Unavailable, Gateway Timeout)
        if ([502, 503, 504].includes(res.status) && retries >= 1) {
            const attempt = (opts.__a ?? 0);
            const delay = backoff(baseDelayMs, attempt, jitter);
            console.warn(`[HTTP Helper] Received ${res.status}. Retrying (Attempt ${attempt + 1}) after ${delay}ms (Backoff).`);
            await sleep(delay);
            // Рекурсивний виклик з оновленою спробою та зменшеною кількістю ретраїв
            return fetchWithResilience(url, { ...opts, __a: attempt + 1, retry: { ...retry, retries: retries - 1 } });
        }

        return res;

    } catch (e) {
        // 5. Обробка Мережевих Помилок або AbortController (Таймаут)
        if (retries >= 1 && (e.name === 'AbortError' || e instanceof TypeError)) {
            const attempt = (opts.__a ?? 0);
            const delay = backoff(baseDelayMs, attempt, jitter);
            
            if (e.name === 'AbortError') {
                 console.error(`[HTTP Helper] Request timed out after ${timeoutMs}ms. Retrying...`);
            } else {
                 console.error(`[HTTP Helper] Network error occurred. Retrying...`);
            }
            
            await sleep(delay);
            // Рекурсивний виклик
            return fetchWithResilience(url, { ...opts, __a: attempt + 1, retry: { ...retry, retries: retries - 1 } });
        }
        
        // Викидаємо помилку, якщо ретраї вичерпано
        throw e;

    } finally {
        // Завжди очищаємо таймаут, щоб уникнути витоків пам'яті
        clearTimeout(t);
    }
}

module.exports = {
    fetchWithResilience,
    backoff // Експортуємо для можливого тестування
};