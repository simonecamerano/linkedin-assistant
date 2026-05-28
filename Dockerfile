FROM mcr.microsoft.com/playwright:v1.49.0-noble

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/data

CMD ["node", "bot.js"]
