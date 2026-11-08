FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY scripts/copy-openintegration-assets.mjs ./scripts/copy-openintegration-assets.mjs
RUN npm ci --omit=dev

COPY . .
RUN npm run copy:assets

EXPOSE 3000

CMD ["npm", "start"]
