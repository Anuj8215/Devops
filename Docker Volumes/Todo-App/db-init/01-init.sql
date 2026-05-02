-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better query performance
CREATE INDEX idx_completed ON todos(completed);
CREATE INDEX idx_created_at ON todos(created_at);

-- Insert sample todos (optional - for testing)
INSERT INTO todos (title, description, completed) VALUES
('Learn Docker Volumes', 'Understand how Docker volumes work with persistent storage', FALSE),
('Build Todo App', 'Create a full-stack todo application with Docker', FALSE),
('Test with data persistence', 'Verify that data persists after container restart', FALSE);
