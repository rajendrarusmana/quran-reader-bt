# Use official Node.js LTS image as the build environment
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the app source
COPY . .

# Build the app (if using Vite or similar, adjust as needed)
RUN npm run build || true

# --- Production image ---
FROM node:20-alpine AS prod
WORKDIR /app

# Copy only built files and minimal runtime deps
COPY --from=build /app /app

# Install a simple static file server for Node.js
RUN npm install -g serve

# Expose port (change if your app uses a different port)
EXPOSE 5173

# Start the app with the static server by default
CMD ["serve", "-s", "dist", "-l", "5173"]
# Alternative: Vite preview (uncomment to use)
# CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
