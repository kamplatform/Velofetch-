import express from 'express';
import cors from 'cors';
import path from 'path';
import { spawn } from 'child_process'; 
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const localBinaryPath = path.join(__dirname, 'bin', 'yt-dlp');
const ytdlpCmd = fs.existsSync(localBinaryPath) ? localBinaryPath : 'yt-dlp';

// ENDPOINT 1: Fast Video Info Processing
app.post('/api/info', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    const infoProcess = spawn(ytdlpCmd, [
        '--print', 'title', 
        '--print', 'filesize,filesize_approx', 
        '-f', 'bv*[vcodec^=avc]+ba[ext=m4a]/b[vcodec^=avc]/b', 
        url
    ]);
    
    let stdoutData = '';
    infoProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });

    infoProcess.on('close', (code) => {
        let titleText = 'VeloFetch_Media';
        let sizeText = 'Calculating size...';

        if (code === 0 && stdoutData.trim()) {
            const lines = stdoutData.trim().split('\n');
            if (lines[0]) titleText = lines[0].trim();

            if (lines[1]) {
                const sizes = lines[1].trim().split(/[\s,]+/);
                const sizeInBytes = parseInt(sizes[0]) || parseInt(sizes[1]) || 0;
                
                if (sizeInBytes >= 1073741824) {
                    sizeText = `${(sizeInBytes / 1073741824).toFixed(2)} GB`;
                } else if (sizeInBytes > 0) {
                    sizeText = `${(sizeInBytes / 1048576).toFixed(1)} MB`;
                }
            }
        }
        return res.json({ videoTitle: titleText, sizeText: sizeText });
    });
});

// ENDPOINT 2: ANTI-TIMEOUT STREAMING PIPE ENGINE
app.get('/api/download', (req, res) => {
    const { url, downloadType, title } = req.query;
    if (!url) return res.status(400).json({ error: 'Please provide a valid URL' });

    const type = downloadType || 'video';
    
    req.setTimeout(0);
    res.setTimeout(0); 

    let cleanTitle = 'VeloFetch_Media';
    if (title) {
        cleanTitle = title.replace(/[^a-zA-Z0-9 \-_]/g, '').replace(/\s+/g, '_');
    }

    // Force Chunked Transfer Encoding to keep Render gateway alive
    res.writeHead(200, {
        'Content-Type': type === 'audio' ? 'audio/m4a' : 'video/mp4',
        'Content-Disposition': `attachment; filename="${cleanTitle}.${type === 'audio' ? 'm4a' : 'mp4'}"`,
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff'
    });

    // Heartbeat: Sends data every 15 seconds to prevent Render's 30s timeout
    const heartbeatInterval = setInterval(() => {
        if (!res.writableEnded) {
            res.write(''); 
        }
    }, 15000);

    let args = [
        '--http-chunk-size', '5M',       
        '--concurrent-fragments', '3',    
        '--no-check-certificates',        
        '-q', '--no-warnings'             
    ];

    if (type === 'audio') {
        args.push('-f', 'ba[ext=m4a]/ba');
    } else {
        // Fallback to pre-merged mp4 to protect free server RAM from crashing
        args.push('-f', 'b[ext=mp4]/bv*[vcodec^=avc]+ba[ext=m4a]/b'); 
    }
    
    args.push('-o', '-', url);

    console.log(`[VeloFetch Engine] Safe stream running: ${ytdlpCmd}`);
    const ytDlpProcess = spawn(ytdlpCmd, args);

    ytDlpProcess.stdout.on('data', (chunk) => {
        if (!res.writableEnded) {
            res.write(chunk);
        }
    });

    ytDlpProcess.stderr.on('data', (data) => {
        console.error(`[Engine Log]: ${data.toString().trim()}`);
    });

    const cleanUp = () => {
        clearInterval(heartbeatInterval);
        if (!ytDlpProcess.killed) {
            ytDlpProcess.kill('SIGKILL');
        }
    };

    res.on('close', () => {
        cleanUp();
    });

    ytDlpProcess.on('close', (code) => {
        cleanUp();
        res.end();
    });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`VeloFetch Server running dynamically on port ${PORT}`);
});
