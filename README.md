# Gestión App - Prototype

A management application prototype built with React (frontend), FastAPI (backend), and PostgreSQL (database), fully containerized with Docker.

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Building the Project

To build all Docker images for the project:

```bash
docker-compose build
```

This will build:
- **Backend**: FastAPI application (Python 3.11)
- **Frontend**: React + Vite application (Node 20)

### Running the Project

To start the entire application stack:

```bash
docker-compose up
```

Or to run in detached mode (background):

```bash
docker-compose up -d
```

This will start all services:
- **PostgreSQL** on port `5432` - Database server
- **Backend** on port `8000` - FastAPI REST API
- **Frontend** on port `5173` - React application
- **Adminer** on port `8080` - Database management interface

### Accessing the Application

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`
- **Adminer**: `http://localhost:8080`

### Database Connection Details

- **Host**: `postgres` (inside Docker network) or `localhost` (from host machine)
- **Port**: `5432`
- **Database**: `gestionapp`
- **Username**: `gestionuser`
- **Password**: `gestionpass`

### Stopping the Project

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (including database data):

```bash
docker-compose down -v
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
