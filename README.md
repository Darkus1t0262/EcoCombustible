# EcoCombustible Monorepo

Repositorio monorepo con:
- `mobile/`: app Expo (React Native) para supervision, mapa, denuncias, auditorias, reportes, vehiculos y transacciones.
- `backend/`: API Fastify + Prisma.
- `backend/docker-compose.yml`: Postgres local para desarrollo.

## Requisitos
- Node.js LTS + npm
- Git
- Docker Desktop (para Postgres local)
- Expo Go en el telefono (o emulador Android)

## Instalacion de dependencias
Desde la raiz del repo:
```bash
npm install
```
Alternativa (por carpeta):
```bash
npm install --prefix mobile
npm install --prefix backend
```

## Configuracion inicial (.env)
Crear archivos `.env` desde los ejemplos:
```bash
# Windows PowerShell
Copy-Item backend\.env.example backend\.env
Copy-Item mobile\.env.example mobile\.env

# macOS/Linux
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env
```
Luego ajustar:
- `backend/.env`: `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_BASE_URL`, `CORS_ORIGIN` (y opcional `FILES_BASE_URL`).
- `mobile/.env`: `EXPO_PUBLIC_API_BASE_URL=http://TU_IP_LOCAL:4000` (con esquema `http://`).

## Levantar base de datos (Postgres con Docker)
```bash
docker compose -f backend/docker-compose.yml up -d
```

## Migraciones y seed (backend)
```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
```

## Ejecutar backend
```bash
npm run backend:dev
```

## Ejecutar mobile
```bash
npm run mobile:start
```
En Expo, usar modo LAN. En el telefono, verificar que abre:
```
http://TU_IP_LOCAL:4000/health
```
Usuario demo: `admin` / `admin123`.

## Modo local sin backend
Si no defines `EXPO_PUBLIC_API_BASE_URL`, la app usa SQLite local con datos de prueba.

## Comandos utiles
```bash
# Limpiar cache de Expo
npm run mobile:start -- -c

# Apagar Postgres
docker compose -f backend/docker-compose.yml down
```
