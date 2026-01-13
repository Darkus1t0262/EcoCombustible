# EcoCombustible Monorepo

Repositorio monorepo con:
- `mobile/`: app Expo (React Native) para supervision, mapa, denuncias, auditorias, reportes, vehiculos y transacciones.
- `backend/`: API Fastify + Prisma.
- `backend/docker-compose.yml`: stack local (API + Postgres + Redis + MinIO).

## Requisitos
- Node.js LTS + npm
- Git
- Docker Desktop (para stack local)
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
- `backend/.env`: `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_BASE_URL`, `CORS_ORIGIN`, `REDIS_URL` (y opcional `FILES_BASE_URL`).
- `mobile/.env`: `EXPO_PUBLIC_API_BASE_URL=http://TU_IP_LOCAL:4000` (con esquema `http://`).

## Levantar stack local (API + DB + Redis + MinIO)
```bash
docker compose -f backend/docker-compose.yml up -d
```
Servicios locales:
- API: http://localhost:4000
- Postgres: localhost:5432
- Redis: localhost:6379
- MinIO: http://localhost:9000 (console: http://localhost:9001)

## Migraciones y seed (backend)
```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
```

## Ejecutar backend
```bash
npm run backend:dev
```

## Ejecutar worker (cola de reportes y notificaciones)
```bash
npm --prefix backend run worker
```
Si usas el `docker compose` del backend, el worker ya corre como servicio.

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

## Notificaciones push (local)
- Registrar el dispositivo en el backend con `POST /devices/register` (requiere JWT).
- Variables recomendadas en `backend/.env`: `EXPO_ACCESS_TOKEN` y `EXPO_PUSH_URL`.
- Prueba rapida: `POST /notifications/test` (rol supervisor).

## Paginacion (backend)
Los listados soportan `?page=` y `?limit=` y responden con headers `X-Total-Count`, `X-Page`, `X-Limit`.

## Storage S3/MinIO (opcional)
Por defecto se usa storage local (`storage/`). Si quieres simular cloud con MinIO:
- En `backend/.env`:
```
STORAGE_DRIVER=s3
FILES_BASE_URL=http://TU_IP_LOCAL:9000/ecocombustible
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=ecocombustible
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_FORCE_PATH_STYLE=true
```
Luego levanta el stack con Docker. MinIO expone el bucket en `http://TU_IP_LOCAL:9000/ecocombustible`.

## Comandos utiles
```bash
# Limpiar cache de Expo
npm run mobile:start -- -c

# Apagar stack
docker compose -f backend/docker-compose.yml down
```
