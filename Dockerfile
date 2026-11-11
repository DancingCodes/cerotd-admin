FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NUXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080
COPY --from=build /app/.output ./.output
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
