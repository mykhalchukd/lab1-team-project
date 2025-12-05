const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;
const DB_SOURCE = 'catalog.sqlite';


const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to SQLite database.');
        
        db.run(`CREATE TABLE items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, 
            price REAL
        )`, (err) => {
            if (err) {
                
            } else {
                
                const insert = 'INSERT INTO items (name, price) VALUES (?,?)';
                db.run(insert, ["Ноутбук Legion 5", 35000]);
                db.run(insert, ["Бездротові навушники", 2500]);
                db.run(insert, ["Механічна клавіатура", 4100]);
            }
        });
    }
});

app.use(cors()); 


app.get('/items', (req, res) => {
    const sql = "SELECT * FROM items ORDER BY id";
    const params = [];

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});


app.listen(port, () => {
    console.log(`Server running on port ${port}. Endpoint: http://localhost:${port}/items`);
});