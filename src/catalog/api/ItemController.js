// src/catalog/api/ItemController.js

const ItemService = require('../service/ItemService');

/**
 * Controller Layer. Відповідає за обробку HTTP-запитів.
 */
class ItemController {

    // ------------------ GET /health ------------------
    // Додаємо GET /health, як вимагається у завданні
    getHealth(req, res) {
        // Відповідь згідно з вимогою
        res.status(200).send('ok');
    }

    // ------------------ POST /items (201) ------------------
    async createItem(req, res) {
        try {
            // 1. Отримання DTO з тіла запиту (req.body)
            const createRequest = req.body; 
            
            // 2. Виклик бізнес-логіки (Service Layer)
            const itemResponse = ItemService.create(createRequest);
            
            // 3. Відповідь згідно з контрактом (201 Created)
            res.status(201).json(itemResponse); 
        
        } catch (error) {
            // Обробка помилок (наприклад, валідації)
            res.status(400).json({ 
                error: 'ValidationError', 
                code: 'INVALID_REQUEST', 
                message: error.message 
            });
        }
    }

    // ------------------ GET /items (200) ------------------
    async getItems(req, res) {
        // 1. Виклик сервісу
        const items = ItemService.findAll();
        
        // 2. Відповідь (200 OK)
        res.status(200).json(items);
    }

    // ------------------ GET /items/{id} (200/404) ------------------
    async getItemById(req, res) {
        try {
            const itemId = req.params.id; // Отримання ID з URL
            
            // 1. Виклик сервісу
            const item = ItemService.findById(itemId);
            
            // 2. Відповідь (200 OK)
            res.status(200).json(item);
        
        } catch (error) {
            // Обробка помилки "Item not found"
            res.status(404).json({ 
                error: 'NotFoundError', 
                code: 'ITEM_NOT_FOUND', 
                message: error.message 
            });
        }
    }
    
    // ------------------ PUT /items/{id} (200/404) ------------------
    async updateItem(req, res) {
         try {
            const itemId = req.params.id;
            const updateRequest = req.body;
            
            // 1. Виклик сервісу
            const updatedItem = ItemService.update(itemId, updateRequest);
            
            // 2. Відповідь (200 OK)
            res.status(200).json(updatedItem);
        
        } catch (error) {
            // Обробка помилки "Item not found"
             res.status(404).json({ 
                error: 'NotFoundError', 
                code: 'ITEM_NOT_FOUND', 
                message: error.message 
            });
        }
    }

    // ------------------ DELETE /items/{id} (204/404) ------------------
    async deleteItem(req, res) {
        try {
            const itemId = req.params.id;
            
            // 1. Виклик сервісу
            ItemService.delete(itemId);
            
            // 2. Відповідь згідно з контрактом (204 No Content)
            res.status(204).send(); // send() без тіла
        
        } catch (error) {
             res.status(404).json({ 
                error: 'NotFoundError', 
                code: 'ITEM_NOT_FOUND', 
                message: error.message 
            });
        }
    }
}

module.exports = new ItemController();