# TaskMaster Pro: Full-Stack Project Documentation

This project is a high-performance, aesthetic task management system featuring a **FastAPI** backend and a **React** frontend.

---

## 🛠️ Technology Stack

### **Backend (Python)**
- **FastAPI**: Modern, high-performance web framework.
- **SQLAlchemy**: ORM for database interactions.
- **SQLite**: Simple, local persistent storage.
- **Alembic**: Database versioning and migrations.
- **Pydantic**: Data validation and strict typing.

### **Frontend (TypeScript/React)**
- **React 19**: Modern UI library.
- **Vite**: Ultra-fast dev server and build tool.
- **Tailwind CSS 4.0**: Utility-first styling with custom "Glassmorphism" theme.
- **Lucide Icons**: Pixel-perfect icon set.
- **Axios**: Typed API client.

---

## 🏗️ Project Structure
- **/backend**: Contains the FastAPI app, database models, and migration scripts.
- **/frontend**: Contains the React app, styling, and API integration.
- **/docker-compose.yml**: Orchestrates the local services.

---

## 🧠 Core Features & Logic
1. **Dynamic Task Management**: Full CRUD support for tasks with titles, descriptions, and completion states.
2. **Priority & Dates**: Support for `Low/Medium/High` priorities and `Due Date` tracking with visual overdue indicators.
3. **Smart Sorting**: Backend-driven sorting logic allows organizing tasks by Date, Priority, or Title instantly.
4. **Premium UI**: Uses a custom-built "Glassmorphism" design system with blurred panels and modern gradients.
---

## 🚀 How to Run (Merged — Single Command)

> The React frontend is pre-built into `frontend/dist` and served by FastAPI.
> You only need **one server**.

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000** — done! ✅

---

## 🛠️ Development Workflow

### Hot-reload both servers separately

**Terminal 1 — Backend:**
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

**Terminal 2 — Frontend (Vite proxy → backend):**
```powershell
cd frontend
npm run dev
```
Frontend at **http://localhost:5173** (API auto-proxied to port 8000).

### Rebuild frontend after UI changes
```powershell
cd frontend
npm run build
```
Restart the backend — it picks up the new `frontend/dist/` automatically.
-

## 🚀 How to Run
### **Run Backend**
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

### **Run Frontend**
```powershell
cd frontend
npm run dev
```

*(Note: If you run `npm run dev` in the frontend, it will typically open at http://localhost:5173)*
