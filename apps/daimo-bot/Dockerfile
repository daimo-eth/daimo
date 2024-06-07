# Use the official Node.js 20 image.
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy app code
COPY . .

# Install dependencies
RUN npm ci

# Build app
RUN npm run build:bot

# Expose the port the app runs on
EXPOSE 4000

# Start app
CMD ["npm", "start", "--prefix", "./apps/daimo-bot"]
