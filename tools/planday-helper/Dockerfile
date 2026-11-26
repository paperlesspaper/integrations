FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends chromium tini ca-certificates fonts-liberation && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && mkdir /state && chown node:node /state && chmod 700 /state
COPY --chown=node:node *.mjs login ./
USER node
ENTRYPOINT ["/usr/bin/tini","-g","--"]
CMD ["node","server.mjs"]
