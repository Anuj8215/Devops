const API_URL = 'http://localhost:5001/api';
let currentFilter = 'all';
let allTodos = [];

// DOM Elements
const todoTitle = document.getElementById('todoTitle');
const todoDescription = document.getElementById('todoDescription');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    todoTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });
}

// Load todos from backend
async function loadTodos() {
    try {
        const response = await fetch(`${API_URL}/todos`);
        if (!response.ok) throw new Error('Failed to load todos');
        allTodos = await response.json();
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error loading todos:', error);
        showError('Failed to load todos. Make sure the backend is running.');
    }
}

// Add new todo
async function addTodo() {
    const title = todoTitle.value.trim();
    const description = todoDescription.value.trim();

    if (!title) {
        alert('Please enter a todo title');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) throw new Error('Failed to add todo');
        const newTodo = await response.json();
        allTodos.unshift(newTodo);
        todoTitle.value = '';
        todoDescription.value = '';
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Failed to add todo');
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    try {
        const todo = allTodos.find(t => t.id === id);
        if (!todo) return;

        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...todo,
                completed: !todo.completed
            })
        });

        if (!response.ok) throw new Error('Failed to update todo');
        const updatedTodo = await response.json();
        const index = allTodos.findIndex(t => t.id === id);
        allTodos[index] = updatedTodo;
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error updating todo:', error);
        alert('Failed to update todo');
    }
}

// Delete todo
async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete todo');
        allTodos = allTodos.filter(t => t.id !== id);
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Failed to delete todo');
    }
}

// Render todos
function renderTodos() {
    todoList.innerHTML = '';

    let filteredTodos = allTodos;
    if (currentFilter === 'active') {
        filteredTodos = allTodos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = allTodos.filter(t => t.completed);
    }

    if (filteredTodos.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        const createdDate = new Date(todo.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        li.innerHTML = `
            <input 
                type="checkbox" 
                class="checkbox" 
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo(${todo.id})"
            >
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-desc">${escapeHtml(todo.description)}</div>` : ''}
                <div class="todo-date">${createdDate}</div>
            </div>
            <div class="todo-actions">
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
            </div>
        `;
        todoList.appendChild(li);
    });
}

// Update statistics
function updateStats() {
    const total = allTodos.length;
    const completed = allTodos.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = pending;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Show error message
function showError(message) {
    emptyState.innerHTML = `<p style="color: red;">${escapeHtml(message)}</p>`;
    emptyState.style.display = 'block';
}
