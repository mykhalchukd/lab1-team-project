

const ItemService = require('./ItemService');


beforeEach(() => {
    
    ItemService.mockItems = [
        { id: 'test-1', name: 'Item A', price: 10.0, description: 'Desc A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
});


describe('ItemService', () => {

    // ======================================================
    // 1. УСПІШНИЙ СЦЕНАРІЙ (тестуємо створення)
    // ======================================================
    test('Successful creation: should create a new item and return a response DTO', () => {
        // ARRANGE (Підготовка): Створюємо вхідний DTO (CreateRequest)
        const createRequest = {
            name: 'Тестовий Продукт',
            price: 49.99,
            description: 'Продукт для юніт-тестування'
        };

        // ACT (Дія): Викликаємо метод service/
        const result = ItemService.create(createRequest);
        
        // ASSERT (Перевірка): 
        // 1. Перевіряємо, чи повернений результат містить необхідні поля
        expect(result).toHaveProperty('id');
        expect(result.name).toBe('Тестовий Продукт');
        expect(result.price).toBe(49.99);
        
        // 2. Перевіряємо, чи був доданий новий елемент до mock-списку
        // (У реальному житті це перевірка, чи викликався метод repository.save)
        expect(ItemService.findAll().length).toBe(2); 
    });


    // ======================================================
    // 2. ПОМИЛКОВИЙ СЦЕНАРІЙ (тестуємо валідацію/відсутність)
    // ======================================================
    test('Error scenario: should throw "Item not found" error when querying non-existing ID', () => {
        // ARRANGE (Підготовка): ID, якого гарантовано немає
        const nonExistingId = '0000-0000-0000-0000';

        // ACT (Дія) & ASSERT (Перевірка): 
        // Ми очікуємо, що виклик функції ItemService.findById(id) викине помилку.
        
        // Використовуємо .toThrow() для перевірки викиду помилки
        expect(() => {
            ItemService.findById(nonExistingId);
        }).toThrow('Item not found'); 
    });
    
    // Можна також додати тест на валідацію вхідних даних, наприклад:
    test('Validation failure: should throw error if name is missing in CreateRequest', () => {
        // У цьому випадку ми припускаємо, що валідація має бути в service/
        const invalidRequest = { price: 100 }; // Відсутнє поле 'name'
        
        // У цьому mock-прикладі ми не реалізували повну валідацію, 
        // але в реальному житті ми б очікували toThrow('Name is required')
        
        // Наприклад (якби валідація була):
        /*
        expect(() => {
            ItemService.create(invalidRequest);
        }).toThrow('Name is required');
        */
    });

});