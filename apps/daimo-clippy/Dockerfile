# Use the official Node.js 20 image.
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy app code
COPY apps/daimo-clippy/dist ./dist

# Expose the port the app runs on
EXPOSE 4200

# Start app
CMD ["node", "dist/index.js"]
