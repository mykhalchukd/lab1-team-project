// client_simulation.js

// Використовуємо CommonJS для сумісності з Node.js
const { fetchWithResilience } = require('./lib/http');
const { getOrReuseKey } = require('./lib/idempotency');
const { randomUUID } = require('crypto');

// Імітація localStorage для Node.js (потрібно для getOrReuseKey)
// У реальному браузерному середовищі цей крок не потрібен.
if (typeof global.localStorage === 'undefined') {
    global.localStorage = {
        store: {},
        getItem: function(key) { return this.store[key] },
        setItem: function(key, value) { this.store[key] = value },
        clear: function() { this.store = {} }
    };
}


let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3;
let isDegradedMode = false;

// Функція для імітації затримки
const sleep = (ms) => new Promise(r => setTimeout(r, ms));


// ----------------------------------------------------
// LOGIC: DEGRADED MODE (FRONTEND STATE)
// ----------------------------------------------------

/**
 * Оновлює стан користувацького інтерфейсу (імітація)
 */
const updateUI = () => {
    if (isDegradedMode) {
        console.warn("\n=======================================================");
        console.warn("❌ DEGRADED MODE: АКТИВОВАНО! (Кнопки форми заблоковано)");
        console.warn("❌ Причина: Послідовні збої сервера (5xx/Таймаут).");
        console.warn("=======================================================");
    } else {
        console.log("\n✅ UI STATE: Normal Mode (Форма доступна).");
    }
};


// ----------------------------------------------------
// CLIENT ACTION: SUBMIT ORDER
// ----------------------------------------------------

async function submitOrder(title, timeoutMs) {
    const payload = { title };
    
    // 1. Ідемпотентний ключ (створення/повторне використання)
    const idemKey = await getOrReuseKey(payload);
    
    // 2. Перевірка Degraded Mode перед відправкою
    if (isDegradedMode) {
        console.warn(`[Client] Запит "${title}" відхилено: Degraded Mode активовано.`);
        return;
    }

    try {
        console.log(`\n--- Спроба відправити замовлення: "${title}" (Timeout: ${timeoutMs}ms) ---`);
        
        // 3. Виклик хелпера з ретраями, backoff та таймаутом
        const res = await fetchWithResilience("http://localhost:8081/orders", {
            method: "POST",
            body: JSON.stringify(payload),
            idempotencyKey: idemKey,
            // Генеруємо новий RequestId для кожного основного запиту
            requestId: randomUUID(), 
            retry: { retries: 3, baseDelayMs: 200, timeoutMs: timeoutMs, jitter: true },
        });

        // 4. Обробка успішної відповіді (2xx)
        if (res.ok) {
            const data = await res.json();
            console.log(`[Success ${res.status}] ID: ${data.id}, RequestID: ${data.requestId}, Title: ${data.title}`);
            
            // 5. Скидання лічильника після успіху
            if (consecutiveFailures > 0 || isDegradedMode) {
                consecutiveFailures = 0;
                isDegradedMode = false;
                updateUI();
            }
            return data;
        } else {
            // 6. Обробка 4xx помилок (Bad Request, Rate Limit 429)
            // Примітка: 429 має бути оброблений у fetchWithResilience, але якщо ретраї вичерпані, 
            // або це 400/404/409, ми обробляємо тут.
            
            const data = await res.json();
            console.error(`[Failure ${res.status}] Error: ${data.error}, RequestID: ${data.requestId}`);
            // 4xx помилки (крім 429) не призводять до Degraded Mode, 
            // оскільки це помилки клієнта/валідації.
        }
        
    } catch (e) {
        // 7. Обробка Таймаутів (AbortError) та Мережевих Збоїв
        console.error(`[Failure] Невдача після всіх ретраїв: ${e.message}`);
        
        // 8. Активація Degraded Mode
        consecutiveFailures++;
        if (consecutiveFailures >= FAILURE_THRESHOLD) {
            isDegradedMode = true;
            updateUI();
        }
    }
}


// ----------------------------------------------------
// ДЕМОНСТРАЦІЯ
// ----------------------------------------------------

async function runDemonstration() {
    
    // 1. Тест на Таймаут / AbortController (Вимагає таймауту < 1500ms)
    console.log("=== Демонстрація 1: Тест на Таймаут (Аборт) ===");
    // Сервер має 15% ймовірності затримки > 1200мс. Встановимо таймаут 1000мс.
    await submitOrder("Test: AbortController", 1000); 
    await sleep(500);

    // 2. Тест на Ідемпотентність + Збій
    console.log("\n=== Демонстрація 2: Ідемпотентність + Стійкість ===");
    const payloadA = "Test: Idempotency with Failures";
    
    // Повторюємо 5 разів: має створитися 1 замовлення (ідемпотентність) та 
    // показати ретраї/збої/затримки.
    for (let i = 0; i < 5; i++) {
        await submitOrder(payloadA, 3000); // Довший таймаут для завершення ретраїв
        await sleep(200);
    }
    
    // 3. Тест на Degraded Mode (Послідовні Збої)
    console.log("\n=== Демонстрація 3: Активація Degraded Mode ===");
    const payloadB = "Test: Degraded Mode";
    
    // Запускаємо багато разів, щоб гарантувати 3 поспіль 5xx або таймаути.
    for (let i = 0; i < 6; i++) {
        if (isDegradedMode) {
             console.log(`[Client] Спроба ${i + 1}: Запит ігнорується через Degraded Mode.`);
        } else {
             await submitOrder(payloadB, 3000); 
        }
        await sleep(100);
    }
    
    // 4. Перевірка GET /health
    console.log("\n=== Демонстрація 4: GET /health з таймаутом ===");
    try {
        await fetchWithResilience("http://localhost:8081/health", { 
            method: "GET", 
            retry: { retries: 0, timeoutMs: 1000 } // Без ретраїв для перевірки таймауту
        });
        console.log("[Health] GET /health успішний.");
    } catch (e) {
        console.error(`[Health] GET /health FAIL (очікується, якщо спрацювала затримка > 1с): ${e.message}`);
    }
}

runDemonstration();