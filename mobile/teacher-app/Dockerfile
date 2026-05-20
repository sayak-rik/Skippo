FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY . .

EXPOSE 8081

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV CI=1

CMD ["sh", "-c", "npm install --prefer-offline && npx expo start --web --port 8081 --clear"]
