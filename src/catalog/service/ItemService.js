// src/catalog/service/ItemService.js

// Це заглушка даних, яка імітує базу даних
const mockItems = [
    { id: '1111-2222-3333-4444', name: 'Монітор Dell', price: 350.00, description: '27-дюймовий 4K монітор', createdAt: new Date().toISOString() },
    { id: '5555-6666-7777-8888', name: 'Клавіатура Logitech', price: 99.99, description: 'Механічна клавіатура', createdAt: new Date().toISOString() }
];

/**
 * Клас ItemService. Містить мінімальну бізнес-логіку (CRUD).
 * Тут має відбуватися валідація, робота з репозиторієм та мапінг DTO <-> Domain.
 */
class ItemService {
    
    // ------------------ CREATE ------------------
    create(createRequest) {
        // У реальному житті: валідація, створення об'єкта Domain (Item), збереження у БД.
        const newItem = {
            id: crypto.randomUUID(), // Імітуємо створення унікального ID
            name: createRequest.name,
            price: createRequest.price,
            description: createRequest.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        mockItems.push(newItem);
        console.log(`Item created: ${newItem.id}`);
        return newItem; // Повертаємо об'єкт, який імітує Response DTO
    }

    // ------------------ GET ALL ------------------
    findAll() {
        // У реальному житті: запит до репозиторію
        return mockItems;
    }

    // ------------------ GET BY ID ------------------
    findById(id) {
        // У реальному житті: запит до репозиторію
        const item = mockItems.find(i => i.id === id);
        
        // Тут має бути базова логіка валідації (наприклад, перевірка існування)
        if (!item) {
            // У реальному застосунку викидається Error, який ловиться на рівні API
            throw new Error('Item not found'); 
        }
        return item;
    }

    // ------------------ UPDATE ------------------
    update(id, updateRequest) {
        // У реальному житті: знаходимо, оновлюємо, зберігаємо.
        const itemIndex = mockItems.findIndex(i => i.id === id);
        if (itemIndex === -1) {
             throw new Error('Item not found');
        }

        const updatedItem = {
            ...mockItems[itemIndex],
            ...updateRequest,
            updatedAt: new Date().toISOString()
        };
        mockItems[itemIndex] = updatedItem;
        return updatedItem;
    }

    // ------------------ DELETE ------------------
    delete(id) {
        // У реальному житті: видалення через репозиторій
        const initialLength = mockItems.length;
        const newLength = mockItems.filter(i => i.id !== id).length;
        
        if (initialLength === newLength) {
            throw new Error('Item not found');
        }
        // Імітація видалення
        mockItems.splice(mockItems.findIndex(i => i.id === id), 1);
        console.log(`Item deleted: ${id}`);
        // DELETE повертає 204 No Content, тому ми повертаємо нічого.
    }
}

module.exports = new ItemService(); // Експортуємо єдиний екземпляр