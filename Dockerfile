FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY vendor/openintegration/package.json ./vendor/openintegration/package.json
COPY vendor/openintegration/dist ./vendor/openintegration/dist
COPY scripts/copy-openintegration-assets.mjs ./scripts/copy-openintegration-assets.mjs
RUN npm install --omit=dev

COPY . .
RUN npm run copy:assets

EXPOSE 3000

CMD ["npm", "start"]
