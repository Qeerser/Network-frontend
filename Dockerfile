# Stage 1: Build the Vite React application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first for optimal caching
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy the rest of your application code
COPY . .

# Build the Vite app (outputs to 'dist' by default)
RUN npm run build

# Stage 2: Serve the static files with Nginx (or a lightweight Node.js server)
FROM nginx:alpine AS runner

# Copy the built assets from the builder stage to Nginx's html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default Nginx configuration (optional, but good for clean setup)
RUN rm /etc/nginx/conf.d/default.conf

# Add a custom Nginx configuration (example below)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx will listen on
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]

# Optional: Stage 2 using a lightweight Node.js server (e.g., `serve`)
# FROM node:22-alpine AS runner-node
# WORKDIR /app
# COPY --from=builder /app/dist ./dist
# RUN npm install -g serve # Install a global static file server
# EXPOSE 3000 # Or your desired port
# CMD ["serve", "-s", "dist", "-l", "3000"]