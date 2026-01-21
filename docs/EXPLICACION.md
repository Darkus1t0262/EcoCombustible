# EcoCombustible - Guia de explicacion (presentacion)

Esta guia describe todo el proyecto para que puedas defenderlo y explicarlo: que tiene, como funciona y por que se eligieron las tecnologias.

## 1) Objetivo y problema que resuelve
EcoCombustible es un sistema para supervisar el subsidio de diesel: estaciones, transacciones, auditorias, denuncias, reportes y notificaciones.
El objetivo es dar trazabilidad, detectar patrones anormales y mejorar la gestion operativa con evidencia auditable.

## 2) Arquitectura general (vista rapida)
Monorepo con tres componentes principales:
- `backend/`: API + worker + base de datos.
- `mobile/`: app movil (Expo React Native).
- `ml/`: microservicio de IA (FastAPI).

Diagrama de componentes (alto nivel):
```
           +------------------+                 +--------------------+
           |  Mobile (Expo)   | <---JWT-------> |  Backend API        |
           |  iOS/Android     |                 |  Fastify + Prisma   |
           +---------+--------+                 +-----+--------+-----+
                     |                                |        |
                     |                                |        |
                     |                                |        v
                     |                                |   +----+----+
                     |                                |   | Redis   |
                     |                                |   | BullMQ  |
                     |                                |   +----+----+
                     |                                |        |
                     |                                |        v
                     |                                |   +----+----+
                     |                                |   | Worker  |
                     |                                |   +----+----+
                     |                                |
                     |                                v
                     |                          +-----+------+
                     |                          | PostgreSQL |
                     |                          +-----+------+
                     |                                |
                     |                                v
                     |                          +-----+------+
                     |                          | Storage    |
                     |                          | Local/S3   |
                     |                          +------------+
                     |
                     v
           +------------------+
           | ML Service       |
           | FastAPI + SKL    |
           +------------------+
```

## 3) Flujo funcional (end-to-end)
Diagrama de flujo de datos:
```
Mobile -> POST /auth/login ---------------> Backend (JWT)
Mobile -> CRUD estaciones/transacciones -> Backend -> PostgreSQL
Mobile -> POST /reports ------------------> Backend -> Queue (Redis)
Worker -> genera PDF/CSV -> Storage -> URL -> Mobile
Mobile -> POST /transactions -> Backend -> ML -> guarda riesgo
```

## 4) Backend (API + Worker)
### 4.1 Stack y por que se usa
- Fastify: servidor rapido, simple y con buena performance para APIs.
- Prisma + PostgreSQL: ORM tipado y DB relacional confiable para auditoria.
- BullMQ + Redis: colas para tareas pesadas con reintentos y control de fallos.
- Zod: validacion de payloads y parametros de forma declarativa.
- PDFKit: generacion de reportes PDF.
- AWS SDK S3: subir archivos a S3/MinIO cuando se usa storage remoto.
- Prom-client: metricas para Prometheus.

### 4.2 Estructura del backend (archivos clave)
```
backend/
  src/
    app.ts                 # registro de plugins y rutas
    server.ts              # bootstrap de Fastify
    worker.ts              # procesos en background (BullMQ)
    config/
      env.ts               # validacion de variables de entorno
      storage.ts           # rutas locales y helpers
    lib/
      auth.ts              # auth y roles
      queue.ts             # conexion Redis + colas
      prisma.ts            # cliente Prisma
    modules/               # rutas por dominio
    services/              # logica de negocio
  prisma/
    schema.prisma          # modelo de datos
    seed.ts                # datos demo
```

### 4.3 Modulos funcionales (API)
- `auth`: login, refresh, cambio de password.
- `users`: gestion de usuarios y roles.
- `stations`: estaciones y analisis basico.
- `vehicles`: alta y consulta de vehiculos.
- `transactions`: registro y listados (con riesgo IA).
- `audits`: auditorias de estaciones.
- `complaints`: denuncias con adjuntos.
- `reports`: generacion y descarga de reportes.
- `notifications`: notificaciones push a dispositivos.

### 4.4 Por que Redis y BullMQ
- Reportes PDF/CSV pueden tardar y no deben bloquear el request.
- Notificaciones push requieren reintentos y control de fallos.
- Redis actua como backend de colas, BullMQ gestiona workers y reintentos.

### 4.5 Por que S3/MinIO
- Se almacenan archivos generados (reportes) y adjuntos de denuncias.
- En local se usa `backend/storage` y se sirven por `/files/...`.
- MinIO simula S3 en local; en produccion se puede usar AWS S3 u otro compatible.

### 4.6 Seguridad y validaciones
- JWT en rutas privadas.
- Rate limiting global para evitar abuso.
- Zod valida payloads y parametros.
- Usuarios activos/inactivos para control de acceso.

### 4.7 Observabilidad
Si `METRICS_ENABLED=true`, el backend expone `/metrics` para Prometheus.

### 4.8 Flujos clave del backend
Flujo de reporte:
1) App envia `POST /reports`.
2) API crea registro y encola trabajo en Redis.
3) Worker genera PDF/CSV/Excel y guarda en storage.
4) Se actualiza el registro con `fileUrl` y estado `ready`.

Flujo de transacciones con IA:
1) App envia `POST /transactions`.
2) Backend valida con Zod.
3) Si `ML_ENABLED=true`, consulta `ml/` para `riskScore` y `riskLabel`.
4) Guarda la transaccion con riesgo en PostgreSQL.

### 4.9 Variables de entorno (backend)
Ejemplo minimo:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecocombustible
JWT_SECRET=change_me
REDIS_URL=redis://localhost:6379
PUBLIC_BASE_URL=http://localhost:4000
```
Variables importantes:
- `DATABASE_URL`: DB principal (obligatorio).
- `JWT_SECRET`: secreto JWT (obligatorio, 32+ chars en prod).
- `REDIS_URL`: colas y notificaciones.
- `PUBLIC_BASE_URL`: base publica del API.
- `FILES_BASE_URL`: base para archivos (si no se define, usa PUBLIC).
- `STORAGE_DRIVER`: `local` o `s3`.
- `S3_*`: credenciales y endpoint cuando `STORAGE_DRIVER=s3`.
- `ML_ENABLED` y `ML_API_URL`: integracion con microservicio ML.

## 5) Worker (procesos en background)
El worker corre separado del API y consume colas:
- `reports`: genera archivos PDF/CSV/Excel.
- `notifications`: envia push a dispositivos.

Beneficios:
- No bloquea requests.
- Permite reintentos con backoff.
- Escalable horizontalmente.

## 6) Servicio ML (IA)
Microservicio opcional en `ml/`:
- FastAPI + scikit-learn.
- Entrena modelo con datos sinteticos.
- Endpoint `/predict` devuelve `risk_score` y `risk_label`.
Se integra desde el backend solo si `ML_ENABLED=true`.

Diagrama de integracion ML:
```
Transaction -> Backend -> POST /predict -> ML
                     <- risk_score/label -
```

## 7) Frontend (app movil)
### 7.1 Stack y por que se usa
- Expo + React Native: desarrollo rapido en Android/iOS.
- React Navigation: navegacion por stacks/tabs.
- Expo Location + Maps: ubicacion y mapa de estaciones.
- Expo SQLite: modo offline con datos demo.
- Expo Notifications: registro de token push.
- Expo File System / Print / Sharing: reportes y exportaciones.

### 7.2 Pantallas principales
- Login y Dashboard.
- Estaciones + mapa.
- Auditorias.
- Denuncias.
- Vehiculos.
- Transacciones (incluye riesgo IA).
- Reportes y notificaciones.

### 7.3 Modo local sin backend
Si `EXPO_PUBLIC_API_BASE_URL` no esta definido:
- La app usa SQLite local.
- Se cargan datos demo para navegar sin API.

### 7.4 Variables de entorno (mobile)
```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:4000
```
Debe ser accesible desde el dispositivo (IP local + puerto del API).

## 8) Base de datos (modelo resumido)
Entidades clave:
- User: usuarios y roles.
- Station: estaciones de servicio.
- Vehicle: vehiculos registrados.
- Transaction: transacciones con `riskScore`, `riskLabel`, `mlVersion`.
- Audit: auditorias.
- Complaint: denuncias con adjuntos.
- Report: reportes generados y su `fileUrl`.
- DeviceToken / Notification: push y estado.

## 9) Docker y despliegue local
`backend/docker-compose.yml` levanta todo:
- API + worker
- PostgreSQL
- Redis
- MinIO
- ML

Diagrama de despliegue local:
```
Docker Compose
  - api (Fastify)
  - worker (BullMQ)
  - db (PostgreSQL)
  - redis
  - minio
  - ml
```

Comandos demo:
```
docker compose -f backend/docker-compose.yml up -d --build
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
npm run mobile:start -- -c
```

## 10) Secciones de codigo (ejemplos)
Validacion de entorno (backend):
```ts
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});
```

Encolar un reporte (backend):
```ts
await reportQueue.add('generate-report', { reportId }, { attempts: 3 });
```

Guardar archivo (storage local o S3):
```ts
if (STORAGE_DRIVER === 's3') {
  await uploadToS3(filePath, key, contentType);
} else {
  return { fileUrl: `${FILES_BASE_URL}/files/${category}/${filename}` };
}
```

## 11) Puntos fuertes para vender el proyecto
- Arquitectura clara: API + worker + ML + app movil.
- Escalable: colas y procesos en background.
- Trazabilidad: DB relacional y reportes descargables.
- Observabilidad: metricas para monitoreo.
- Modo demo: front funciona sin backend.

## 12) Limitaciones conocidas
- Push remoto no funciona en Expo Go (requiere dev build).
- En produccion se deben asegurar secretos, TLS y CORS.

## 13) Como defender la eleccion de tecnologias
- Fastify: rendimiento, plugins maduros, facil de mantener.
- Prisma: tipado fuerte y migraciones faciles.
- PostgreSQL: solido para auditorias y relaciones complejas.
- Redis + BullMQ: asincronia confiable y reintentos.
- MinIO/S3: almacenamiento escalable de archivos.
- Expo: acelera desarrollo movil con un solo codebase.
- FastAPI + scikit-learn: ML simple y directo para el caso de uso.
