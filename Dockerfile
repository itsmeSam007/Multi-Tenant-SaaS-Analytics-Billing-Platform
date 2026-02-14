FROM node:22-alpine
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build
RUN ls -la dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
