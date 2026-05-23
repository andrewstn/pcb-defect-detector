# frontend/Dockerfile

# Build the React App 
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code and build the project
COPY . .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine

# Copy the built assets from the build stage into Nginx's public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]