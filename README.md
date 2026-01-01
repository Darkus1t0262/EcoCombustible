# EcoCombustible Monorepo

Repositorio monorepo con:
- `mobile/`: app Expo (React Native)
- `backend/`: API y base de datos

## Requisitos
- Node.js LTS
- Git

## Instalacion
```bash
npm install --prefix mobile
npm install --prefix backend
```

## Ejecutar
```bash
npm run mobile:start
npm run backend:dev
```

## Configuracion
- Mobile: `mobile/.env.example`
- Backend: `backend/.env.example`

## Backend (Prisma)
```bash
npm run backend:prisma -- --version
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
```

## Postgres local (opcional)
```bash
docker compose -f backend/docker-compose.yml up -d
```
