FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Vite usa el puerto 5173 por defecto
EXPOSE 5173

# Necesitamos exponer el host para que Docker lo vea
CMD ["npm", "run", "dev"]