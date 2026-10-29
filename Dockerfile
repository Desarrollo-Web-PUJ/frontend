# ---------------------------------------------------------------
# Etapa 1: compilación de la SPA
# Angular 22 exige Node >= 22.22.3 o >= 24.15
# ---------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

# Dependencias primero para aprovechar la caché de Docker
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------------------------------------------------------------
# Etapa 2: servidor web nginx con los archivos estáticos
# ---------------------------------------------------------------
FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
