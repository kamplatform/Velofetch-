# 1. Use an official Node.js runtime as the base image
FROM node:18-slim

# 2. Install Python3 and FFmpeg (Required for yt-dlp to work)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 3. Install yt-dlp globally inside the cloud container
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# 4. Create and set the working app directory
WORKDIR /usr/src/app

# 5. Copy package configuration files and install npm modules
COPY package*.json ./
RUN npm install --production

# 6. Copy the rest of your server code files
COPY . .

# 7. Expose the port your server listens on
EXPOSE 5000

# 8. Start your application
CMD ["npm", "start"]
