# EcoCombustible Monorepo

Repositorio monorepo para supervision del subsidio de diesel. Incluye app movil, API backend, worker de colas y un microservicio de IA para riesgo de transacciones.

## Contenido
- `mobile/`: app Expo (React Native) para supervision, mapa, denuncias, auditorias, reportes, vehiculos y transacciones.
- `backend/`: API Fastify + Prisma + worker BullMQ.
- `backend/docker-compose.yml`: stack local (API + worker + Postgres + Redis + MinIO + ML).
- `ml/`: microservicio de IA (FastAPI + scikit-learn).
- `docs/EXPLICACION.md`: guia de explicacion del proyecto.

## Requisitos
- Node.js LTS + npm
- Git
- Docker Desktop (para el stack local)
- Expo Go en el telefono o emulador Android/iOS
- Python 3.11+ (solo si ejecutas el servicio ML en local)

## Instalacion de dependencias
Desde la raiz:
```bash
npm install
```
Alternativa por carpeta:
```bash
npm install --prefix mobile
npm install --prefix backend
```

## Configuracion de entorno (.env)
Los `.env` no se versionan. Copia los ejemplos y completa valores.

```bash
# Windows PowerShell
Copy-Item backend\.env.example backend\.env
Copy-Item mobile\.env.example mobile\.env

# macOS/Linux
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env
```

### backend/.env
Basicos
- `NODE_ENV`: development/test/production.
- `PORT`: puerto del API (default 4000).
- `HOST`: host de escucha (default 0.0.0.0).
- `DATABASE_URL`: URL de PostgreSQL (obligatorio).
- `PUBLIC_BASE_URL`: base publica del API; en produccion es obligatorio y debe ser https.
- `FILES_BASE_URL`: base para URLs de archivos (reportes/denuncias). Si no se define, usa `PUBLIC_BASE_URL`. Es obligatorio cuando `STORAGE_DRIVER=s3`.

Seguridad y CORS
- `JWT_SECRET`: secreto JWT (obligatorio). En produccion debe tener al menos 32 caracteres.
- `JWT_ISSUER`: issuer opcional para validar tokens.
- `JWT_EXPIRES_IN`: expiracion de JWT (ej. `1d`).
- `CORS_ORIGIN`: lista separada por comas de origenes permitidos (obligatorio en produccion).
- `TRUST_PROXY`: `true` si hay reverse proxy.
- `RATE_LIMIT_MAX`: max requests por ventana.
- `RATE_LIMIT_WINDOW`: ventana (ej. `1 minute`).

Colas y Redis
- `REDIS_URL`: conexion a Redis (obligatorio para reportes y notificaciones).

Notificaciones push (Expo)
- `EXPO_ACCESS_TOKEN`: token de Expo (opcional, recomendado para envio).
- `EXPO_PUSH_URL`: endpoint de Expo (default `https://exp.host/--/api/v2/push/send`).

Storage local o S3/MinIO
- `STORAGE_DRIVER`: `local` o `s3`. En `local` guarda en `backend/storage`.
- `S3_ENDPOINT`: endpoint S3 (para MinIO local usar `http://localhost:9000`).
- `S3_REGION`: region (default `us-east-1`).
- `S3_BUCKET`: bucket (default `ecocombustible`).
- `S3_ACCESS_KEY`: acceso S3 (obligatorio si `STORAGE_DRIVER=s3`).
- `S3_SECRET_KEY`: secreto S3 (obligatorio si `STORAGE_DRIVER=s3`).
- `S3_FORCE_PATH_STYLE`: `true` para MinIO (path-style).

Observabilidad
- `METRICS_ENABLED`: `true` para habilitar `/metrics`.
- `METRICS_PATH`: ruta de metricas (default `/metrics`).

Servicio ML (opcional)
- `ML_ENABLED`: `true` para usar el microservicio de IA.
- `ML_API_URL`: URL del ML (obligatorio si `ML_ENABLED=true`).
- `ML_TIMEOUT_MS`: timeout de llamada al ML.
- `ML_FALLBACK_LABEL`: `low|medium|high|unknown` si ML falla.

### mobile/.env
- `EXPO_PUBLIC_API_BASE_URL`: URL base del API accesible desde el dispositivo.
  - Ejemplo: `http://192.168.1.50:4000`
  - Si no se define, la app usa SQLite local con datos de ejemplo.

## Arranque rapido con Docker (recomendado)
```bash
docker compose -f backend/docker-compose.yml up -d --build
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
npm run mobile:start -- -c
```

Servicios locales:
- API: `http://localhost:4000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `http://localhost:9000` (console `http://localhost:9001`)
- ML: `http://localhost:8001`

Credenciales demo: `admin` / `admin123`.

## Desarrollo backend sin Docker
Necesitas Postgres y Redis en local (y MinIO/ML si quieres esas funciones).

```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
npm run backend:dev
```

Worker (reportes y notificaciones):
```bash
npm --prefix backend run worker
```

## Frontend (Expo)
```bash
npm run mobile:start
```
Usa modo LAN. Verifica en el telefono:
`http://TU_IP_LOCAL:4000/health`

## Servicio ML en local (opcional)
```bash
pip install -r ml/requirements.txt
python ml/train.py --model-path ml/models/tx_model.joblib
uvicorn ml.app:app --reload --port 8001
```
Asegura en `backend/.env`:
`ML_ENABLED=true` y `ML_API_URL=http://localhost:8001`.

## Notificaciones push
- Registrar el dispositivo con `POST /devices/register` (requiere JWT).
- En Expo Go las notificaciones remotas no funcionan (requiere dev build).

## Storage S3/MinIO
Por defecto se usa almacenamiento local (`backend/storage`). Para S3/MinIO:
```env
STORAGE_DRIVER=s3
FILES_BASE_URL=http://TU_IP_LOCAL:9000/ecocombustible
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=ecocombustible
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_FORCE_PATH_STYLE=true
```

## Comandos utiles
```bash
# Limpiar cache de Expo
npm run mobile:start -- -c

# Apagar stack
docker compose -f backend/docker-compose.yml down
```

## Documentacion
- Explicacion general y detalles tecnicos: `docs/EXPLICACION.md`
