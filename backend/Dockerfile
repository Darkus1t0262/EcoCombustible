FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=development

EXPOSE 4000

CMD ["npm", "run", "dev"]
