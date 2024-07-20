# Run this file from the project root.
# docker build -t daimo-api -f packages/daimo-api/Dockerfile .

# Use the official Node.js 20 image.
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy app code, except node_modules
COPY . .

# Install dependencies
RUN npm ci

# Build your application
RUN npm run build:api

# Expose the port the app runs on
EXPOSE 3000

# Set the path to include node_modules/.bin for easier script execution
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

# Run the app using tsx
CMD ["tsx", "--max-old-space-size=7000", "packages/daimo-api/src/server/server.ts"]
