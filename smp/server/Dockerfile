FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "start"]