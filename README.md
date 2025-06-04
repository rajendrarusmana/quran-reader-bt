# Qur'an Reader with Bluetooth controls

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Run with Docker

You can also build and run this app using Docker:

1. Build the Docker image:
   ```sh
   docker build -t quran-reader-bt .
   ```
2. Run the container (default: serves on port 4173):
   ```sh
   docker run -p 4173:4173 quran-reader-bt
   ```

The app will be available at [http://localhost:4173](http://localhost:4173).
