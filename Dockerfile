# 1. Use a standard full Node.js runtime instead of the stripped-down slim version
FROM node:18

# 2. Update packages and install Python3 and FFmpeg binaries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 3. Securely install yt-dlp globally
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp || pip3 install --no-cache-dir yt-dlp

# 4. Create and set the app workspace directory
WORKDIR /usr/src/app

# 5. Copy package configuration files and install npm modules
COPY package*.json ./
RUN npm install

# 6. Copy the remaining server code files
COPY . .

# 7. Expose the server communications port
EXPOSE 5000

# 8. Start your application
CMD ["npm", "start"]
