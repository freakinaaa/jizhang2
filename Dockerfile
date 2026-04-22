FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get -o Acquire::Retries=5 update \
  && apt-get -o Acquire::Retries=5 install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/freakinaaa/jizhang2"
LABEL org.opencontainers.image.description="React + Node + SQLite integrated bookkeeping system"

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3133
ENV HOST=0.0.0.0

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

EXPOSE 3133

CMD ["npm", "start"]
