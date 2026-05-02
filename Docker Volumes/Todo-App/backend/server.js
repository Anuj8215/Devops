const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'todouser',
  password: process.env.DB_PASSWORD || 'todopass',
  database: process.env.DB_NAME || 'tododb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [todos] = await connection.query('SELECT * FROM todos ORDER BY created_at DESC');
    connection.release();
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get single todo
app.get('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [todos] = await connection.query('SELECT * FROM todos WHERE id = ?', [id]);
    connection.release();
    
    if (todos.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todos[0]);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// Create new todo
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const connection = await pool.getConnection();
    const result = await connection.query(
      'INSERT INTO todos (title, description, completed, created_at) VALUES (?, ?, ?, NOW())',
      [title, description || '', false]
    );
    connection.release();
    
    res.status(201).json({
      id: result[0].insertId,
      title,
      description: description || '',
      completed: false,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const connection = await pool.getConnection();
    
    // Check if todo exists
    const [existingTodos] = await connection.query('SELECT * FROM todos WHERE id = ?', [id]);
    if (existingTodos.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Update todo
    await connection.query(
      'UPDATE todos SET title = ?, description = ?, completed = ? WHERE id = ?',
      [title || existingTodos[0].title, description !== undefined ? description : existingTodos[0].description, completed !== undefined ? completed : existingTodos[0].completed, id]
    );
    
    const [updatedTodos] = await connection.query('SELECT * FROM todos WHERE id = ?', [id]);
    connection.release();
    
    res.json(updatedTodos[0]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    // Check if todo exists
    const [existingTodos] = await connection.query('SELECT * FROM todos WHERE id = ?', [id]);
    if (existingTodos.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Delete todo
    await connection.query('DELETE FROM todos WHERE id = ?', [id]);
    connection.release();
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
