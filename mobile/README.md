# EcoCombustible

Aplicacion movil en React Native (Expo) para supervisar estaciones de combustible, auditorias, reportes y quejas.

## Requisitos
- Node.js LTS
- Git
- Expo CLI (opcional)

## Instalacion
```bash
npm install
```

## Ejecutar en desarrollo
```bash
npx expo start
```

## Configuracion opcional de API
Si vas a usar autenticacion remota, define la variable:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

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

## Notas
- Con backend activo, la app usa la API para estaciones, auditorias, quejas y reportes.
- Los reportes locales se generan como archivo y se comparten con el sistema.
