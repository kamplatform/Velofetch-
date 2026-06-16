import express from 'express';
import cors from 'cors';
import path from 'path';
import { spawn } from 'child_process'; 
import { fileURLToPath } from 'url';
import fs from 'fs';
import YTDlpWrap from 'yt-dlp-wrap';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Automated background setup for cloud platforms
const localBinaryPath = path.join(__dirname, 'bin', 'yt-dlp');
let ytdlpCmd = fs.existsSync(localBinaryPath) ? localBinaryPath : 'yt-dlp';

const downloadBinary = async () => {
    if (!fs.existsSync(localBinaryPath)) {
        console.log('[VeloFetch Pro] Cloud detected. Initializing binary auto-download...');
        if (!fs.existsSync(path.join(__dirname, 'bin'))) {
            fs.mkdirSync(path.join(__dirname, 'bin'));
        }
        try {
            await YTDlpWrap.default.downloadFromGithub(localBinaryPath);
            fs.chmodSync(localBinaryPath, '755');
            ytdlpCmd = localBinaryPath;
            console.log('[VeloFetch Pro] Cloud binary setup successful!');
        } catch (err) {
            console.error('[VeloFetch Pro] Fallback active:', err.message);
        }
    }
};
await downloadBinary();

// ENDPOINT 1: Video Info Processing (Fetches Title & Size Simultaneously)
app.post('/api/info', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    const infoProcess = spawn(ytdlpCmd, [
        '--print', 'title', 
        '--print', 'filesize,filesize_approx', 
        '-f', 'bv*[vcodec^=avc]+ba[ext=m4a]/b[vcodec^=avc]', 
        url
    ]);
    
    let stdoutData = '';
    infoProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });

    infoProcess.on('close', (code) => {
        let titleText = 'VeloFetch_Media';
        let sizeText = 'Calculating size...';

        if (code === 0 && stdoutData.trim()) {
            const lines = stdoutData.trim().split('\n');
            if (lines[0] && lines[0].trim() !== '') {
                titleText = lines[0].trim();
            }
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

// ENDPOINT 2: UNIVERSAL HIGH-STABILITY DIRECT PIPE ENGINE
app.get('/api/download', (req, res) => {
    const { url, downloadType, title } = req.query; 
    if (!url) return res.status(400).json({ error: 'Please provide a valid URL' });

    const type = downloadType || 'video';
    req.setTimeout(0);
    res.setTimeout(0); 

    let cleanTitle = 'VeloFetch_Media';
    if (title && title !== 'undefined' && title.trim() !== '') {
        cleanTitle = decodeURIComponent(title).replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_');
    }

    if (!cleanTitle || cleanTitle.trim() === '') {
        cleanTitle = `VeloFetch_${Date.now()}`;
    }

    const encodedTitle = encodeURIComponent(cleanTitle);

    if (type === 'audio') {
        res.setHeader('Content-Type', 'audio/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.m4a"; filename*=UTF-8''${encodedTitle}.m4a`);
    } else {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp4"; filename*=UTF-8''${encodedTitle}.mp4`);
    }

    let args = [
        '--http-chunk-size', '10M',       
        '--concurrent-fragments', '4',    
        '--no-check-certificates',        
        '-q', '--no-warnings'             
    ];

    if (type === 'audio') {
        args.push('-f', 'ba[ext=m4a]/ba');
    } else {
        args.push('-f', 'bv*[vcodec^=avc]+ba[ext=m4a]/b[vcodec^=avc]/b'); 
    }
    
    args.push('-o', '-', url);

    const ytDlpProcess = spawn(ytdlpCmd, args);
    ytDlpProcess.stdout.pipe(res);

    res.on('close', () => {
        if (!ytDlpProcess.killed) {
            ytDlpProcess.kill('SIGKILL');
        }
    });

    ytDlpProcess.on('close', () => {
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
