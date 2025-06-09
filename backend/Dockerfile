# Dockerfile for Strapi

# Use the official Node.js image as a base
FROM node:18-alpine

# Set the working directory
WORKDIR /opt/app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Strapi application
RUN npm run build

# Expose the port Strapi runs on
EXPOSE 1337

# Start the Strapi application
CMD ["npm", "run", "start"] 