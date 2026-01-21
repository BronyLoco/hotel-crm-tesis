# Usamos una versión ligera de Node
FROM node:22-alpine

# Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las librerías
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto (esto es informativo)
EXPOSE 3001

# Comando para iniciar
CMD ["node", "index.js"]