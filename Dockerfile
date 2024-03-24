# ---- Base Node ----
FROM node:alpine AS base
WORKDIR /app
COPY package.json .

# ---- Dependencies ----
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---- Release ----
FROM base AS release
COPY --from=build /app .
RUN npm install --only=production

ENV HEREAPI_KEY=

VOLUME [ "/.location-resolver" ]

ENTRYPOINT ["node", "lib/cli.js", "--server", "--port", "3000"]

CMD []