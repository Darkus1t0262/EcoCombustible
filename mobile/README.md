# EcoCombustible Mobile

Aplicacion movil en React Native (Expo) para supervision regulatoria:
mapa de estaciones, auditorias, denuncias, reportes, vehiculos y transacciones.

## Requisitos
- Node.js LTS + npm
- Expo Go en el telefono o emulador Android
- (Opcional) Backend corriendo para usar API real

## Instalacion
```bash
npm install
```

## Configuracion de API (recomendado)
Crear `mobile/.env` con:
```
EXPO_PUBLIC_API_BASE_URL=http://TU_IP_LOCAL:4000
```
Si no defines la variable, la app funciona en modo local con SQLite.

## Ejecutar en desarrollo
```bash
npx expo start
```
Si hay cambios que no aparecen, limpia cache:
```bash
npx expo start -c
```

## Notas
- Con backend activo, la app usa API para estaciones, auditorias, denuncias, reportes, vehiculos y transacciones.
- Usuario demo: `admin` / `admin123`.

## Distribucion (EAS Build)
1. Verifica identificadores en `app.json` (android.package / ios.bundleIdentifier)
2. Inicia sesion en EAS:
```bash
npx eas login
```
3. Compila:
```bash
npx eas build -p android --profile production
npx eas build -p ios --profile production
```
