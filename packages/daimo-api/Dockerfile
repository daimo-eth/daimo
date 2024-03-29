# Use the official Node 21 image on Ubuntu as a base
FROM node:21

# Set the working directory in the container
WORKDIR /app

# Copy repo into the container
COPY . .

# Install dependencies
RUN ls -lha
RUN npm ci

# Build your application
RUN npm run build:api

# Set the default command to run your application
CMD ["sh", "-c", "cd packages/daimo-api && npm start"]

# Environment variables
ENV DAIMO_CHAIN=base
