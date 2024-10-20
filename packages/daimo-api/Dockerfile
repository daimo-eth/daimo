# Use the standard Node.js image.
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy app code
COPY daimo/packages/daimo-api/dist ./dist
COPY node_modules/geoip-lite/data ./data

# Expose the port the app runs on
EXPOSE 4000

# Run the server
CMD ["node", "--max-old-space-size=7000", "dist/server.js"]
