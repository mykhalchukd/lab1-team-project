// domain/Item.js

/**
 * Клас, що представляє товарну позицію (Item). 
 * Є коренем агрегата у контексті "Каталог" (Catalog Bounded Context).
 */
class Item {
    /**
     * Конструктор для створення нового об'єкта товару.
     * @param {number} id - Унікальний ідентифікатор товару.
     * @param {string} name - Назва товару.
     * @param {number} price - Ціна товару.
     * @param {string} description - Детальний опис.
     * @param {number} stockQuantity - Кількість на складі (отримана з Inventory Context).
     */
    constructor(id, name, price, description, stockQuantity) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.stockQuantity = stockQuantity; 
    }

    /**
     * Повертає ціну у форматованому вигляді з валютою.
     * Це приклад бізнес-логіки, що належить до цього класу.
     * @returns {string} Форматована ціна.
     */
    getFormattedPrice() {
        // Припускаємо, що валюта — українські гривні (грн.)
        return `${this.price.toFixed(2)} грн.`;
    }

    /**
     * Перевіряє, чи доступний товар для перегляду (кількість > 0).
     * @returns {boolean} True, якщо товар є на складі.
     */
    isAvailable() {
        return this.stockQuantity > 0;
    }
    
    // Приклад методу, який пізніше буде додано для адміністратора
    // updatePrice(newPrice) {
    //     if (newPrice > 0) this.price = newPrice;
    //     // Тут могла б бути логіка сповіщення інших систем про зміну ціни
    // }
}

module.exports = Item;