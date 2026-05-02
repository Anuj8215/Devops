# Docker Volumes Todo App

A full-stack Todo application demonstrating Docker volumes, networking, and multi-container orchestration with Docker Compose. This project shows how to persist data using **named volumes** and **bind mounts**.

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │   MySQL DB   │  │
│  │  (Nginx)     │    │  (Node.js)   │    │  (MySQL 8.0) │  │
│  │  :3000       │    │  :5000       │    │  :3306       │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│        │                    │                    │            │
│        └────────────────────┴────────────────────┘            │
│                   todo-network (bridge)                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Docker Volumes & Mounts                 │   │
│  │  • Named Volume: todo_db_data (MySQL persistence)   │   │
│  │  • Bind Mount: ./backend (Live code reloading)      │   │
│  │  • Bind Mount: ./frontend (Static files)            │   │
│  │  • Bind Mount: ./db-init (DB initialization)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
Todo-App/
├── docker-compose.yml       # Docker orchestration configuration
├── .env                     # Environment variables
├── .gitignore
├── nginx.conf              # Nginx configuration for frontend
├── backend/                # Node.js backend application
│   ├── Dockerfile          # Backend container image
│   ├── server.js           # Express server & API endpoints
│   ├── package.json        # Node.js dependencies
│   └── node_modules/       # Dependencies (git-ignored)
├── frontend/               # React/HTML frontend
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styling
│   └── script.js           # JavaScript logic
└── db-init/                # Database initialization
    └── 01-init.sql         # SQL scripts for DB setup
```

## 🐳 Docker Volumes Explained

### 1. **Named Volumes** (Production-Safe)
Used for database data persistence:
```yaml
todo_db_data:
  driver: local
```
**Location**: Stored in Docker's managed directory
**Use Case**: Databases, important application data
**Characteristics**: 
- Managed by Docker
- Can be shared between containers
- Survives container deletion
- Not tracked in git

### 2. **Bind Mounts** (Development & Configuration)
Used for live code reloading and initialization:
```yaml
- ./backend:/app              # Live code changes during development
- ./db-init:/docker-entrypoint-initdb.d  # DB initialization scripts
- ./frontend:/usr/share/nginx/html       # Static frontend files
```
**Location**: Local file system
**Use Case**: Development, configuration, dynamic content
**Characteristics**:
- Direct connection to host filesystem
- Excellent for development
- Can impact performance on Mac/Windows

## 🚀 Quick Start

### Prerequisites
- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- macOS, Linux, or Windows with Docker Desktop

### Installation & Running

1. **Clone and navigate to project**
   ```bash
   cd /path/to/Todo-App
   ```

2. **Build and start containers**
   ```bash
   docker-compose up -d
   ```
   This command will:
   - Pull MySQL 8.0 image
   - Build the backend Node.js image
   - Pull Nginx image
   - Create the `todo_db_data` named volume
   - Create the `todo-network` bridge network
   - Start all three services

3. **Verify services are running**
   ```bash
   docker-compose ps
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MySQL: localhost:3306

5. **Stop containers (data persists!)**
   ```bash
   docker-compose down
   ```
   The MySQL data remains in the `todo_db_data` volume

6. **Restart and verify data persistence**
   ```bash
   docker-compose up -d
   ```
   Your todos are still there! This demonstrates the power of volumes.

## 🔍 Understanding Docker Volumes in This Project

### How Data Persists

**Without Volumes:**
```
Container A (has data) 
    → Stops/Deleted → Data Lost ❌
```

**With Named Volumes:**
```
Container A (has data)
    ↓
Named Volume (todo_db_data)
    ↓
Container B (new) ← Accesses same data ✅
```

### Testing Volume Persistence

1. **Create some todos** in the web interface
2. **Stop containers:**
   ```bash
   docker-compose down
   ```
3. **Start containers again:**
   ```bash
   docker-compose up -d
   ```
4. **Refresh browser** - Your todos are still there! 🎉

### Inspecting Volumes

```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect todo_db_data

# View volume contents (Linux/Mac)
docker run -v todo_db_data:/data alpine ls /data
```

### Bind Mounts in Action

**Frontend Changes:**
1. Edit `frontend/styles.css`
2. Refresh browser - Changes appear immediately (Nginx serves from bind mount)

**Backend Changes:**
1. Edit `backend/server.js`
2. Container auto-restarts (nodemon watches bind mount)

**Database Init:**
- `db-init/` is mounted into MySQL container
- SQL scripts run automatically on first startup

## 📊 API Endpoints

### GET /api/health
Health check endpoint
```bash
curl http://localhost:5000/api/health
```

### GET /api/todos
Get all todos
```bash
curl http://localhost:5000/api/todos
```

### POST /api/todos
Create new todo
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Docker","description":"Master volumes and networking"}'
```

### GET /api/todos/:id
Get specific todo
```bash
curl http://localhost:5000/api/todos/1
```

### PUT /api/todos/:id
Update todo
```bash
curl -X PUT http://localhost:5000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Docker Volumes","completed":true}'
```

### DELETE /api/todos/:id
Delete todo
```bash
curl -X DELETE http://localhost:5000/api/todos/1
```

## 🔧 Docker Compose Configuration Details

### Services

**MySQL Service:**
- Image: `mysql:8.0`
- Volumes:
  - Named: `todo_db_data:/var/lib/mysql` (persistent data)
  - Bind: `./db-init:/docker-entrypoint-initdb.d` (init scripts)
- Health check: Pings MySQL every 20s

**Backend Service:**
- Build: From `./backend/Dockerfile`
- Volumes:
  - Bind: `./backend:/app` (live code)
  - Bind: `/app/node_modules` (prevent overwrite)
- Depends on: MySQL (waits for health check)
- Environment: Database credentials, Node env

**Frontend Service:**
- Image: `nginx:alpine`
- Volumes:
  - Bind: `./frontend:/usr/share/nginx/html`
  - Bind: `./nginx.conf:/etc/nginx/nginx.conf:ro`

### Network

**todo-network (bridge):**
- Enables inter-container communication
- Services accessible by name: `mysql`, `backend`, `frontend`

## 🧹 Volume Management

### Clean Up Volumes
```bash
# Remove unused volumes
docker volume prune

# Remove specific volume (data lost!)
docker volume rm todo_db_data

# Remove everything (containers + volumes)
docker-compose down -v
```

### Backup Volume Data
```bash
# Create backup
docker run --rm -v todo_db_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/todo_db_backup.tar.gz /data

# Restore backup
docker run --rm -v todo_db_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/todo_db_backup.tar.gz -C /data
```

## 📈 Performance Tips

### Optimize Bind Mounts on Mac/Windows
Add to docker-compose.yml:
```yaml
volumes:
  - ./backend:/app:cached      # Read-heavy
  - ./frontend:/app:delegated  # Write-heavy
```

### Use Named Volumes for Databases
Always use named volumes for databases instead of bind mounts:
```yaml
volumes:
  mysql:
    ✅ todo_db_data:/var/lib/mysql  # Good
    ❌ ./mysql-data:/var/lib/mysql  # Slower on Mac
```

## 🐛 Troubleshooting

### MySQL Connection Refused
```bash
# Check if MySQL is ready
docker-compose logs mysql

# Wait for health check
docker-compose exec mysql mysqladmin ping -h localhost
```

### Port Already in Use
```bash
# Change port in docker-compose.yml
# Or find process using port
lsof -i :3306  # MySQL
lsof -i :5000  # Backend
lsof -i :3000  # Frontend
```

### Volume Not Mounting
```bash
# Verify volume
docker volume ls
docker volume inspect todo_db_data

# Check container mounts
docker inspect <container-id> | grep -A 20 "Mounts"
```

### Changes Not Reflecting
```bash
# For bind mounts, rebuild
docker-compose up -d --build

# For volumes, ensure correct path
docker-compose down && docker-compose up -d
```

## 📚 Learning Resources

### Key Concepts Demonstrated
1. **Named Volumes**: Database persistence
2. **Bind Mounts**: Development workflow
3. **Docker Networking**: Service-to-service communication
4. **Health Checks**: Container readiness
5. **Dependency Management**: Service startup order
6. **Environment Variables**: Configuration management

### Next Steps
- Modify volume mount options (`:ro`, `:cached`, `:delegated`)
- Implement volume drivers (e.g., NFS, local-persist)
- Create backup/restore workflows
- Implement multi-host storage solutions
- Study container orchestration with Kubernetes

## 📝 License

MIT License - Feel free to modify and use for learning!

---

**Happy Learning with Docker Volumes! 🐳📦**
