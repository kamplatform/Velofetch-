import React, { useState, useEffect } from 'react';

// Monetization Direct Link / SmartLink URL
const MONETAG_DIRECT_LINK = "https://omg10.com"; 

function App() {
  const [url, setUrl] = useState('');
  const [downloadType, setDownloadType] = useState('video');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState('');

  useEffect(() => {
    let interval;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 95) return oldProgress;
          const increment = Math.floor(Math.random() * 5) + 2;
          return Math.min(oldProgress + increment, 95);
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!url) return;

    // MONETIZATION: Fire Monetag Pop-under on Main Download Interaction
    try {
      window.open(MONETAG_DIRECT_LINK, '_blank', 'noopener,noreferrer');
    } catch (adErr) {
      console.log("Ad window blocked or handled natively");
    }

    setLoading(true);
    setFileSize('Calculating media size metrics...');
    setMessage(`Connecting to secure stream channels...`);

    try {
      // 1. Fetch file size details AND video title via production proxied routing path
      const infoResponse = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const infoData = await infoResponse.json();
      
      if (infoData.sizeText) setFileSize(`Download size: ${infoData.sizeText}`);
      
      // Extract the real video title from the server response (fallback if missing)
      const targetTitle = infoData.videoTitle || "VeloFetch_Media";

      setMessage(`Movie link validated! Passing data stream directly to your phone...`);
      
      // 2. ⚡ FIXED: Append the verified & encoded dynamic title parameter to the streamUrl string
      const streamUrl = `/api/download?url=${encodeURIComponent(url)}&downloadType=${downloadType}&title=${encodeURIComponent(targetTitle)}`;
      
      // Open the streaming route safely
      window.location.href = streamUrl;

      setProgress(100);
      setMessage('🎉 Streaming initialized! Watch your browser system menu panel for file progress.');
      setUrl('');
      
    } catch (err) {
      setMessage('Network error processing large media files.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    bodyStyle: { backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' },
    container: { maxWidth: '480px', width: '100%', backgroundColor: '#1e293b', borderRadius: '16px', padding: '35px 25px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)', textAlign: 'center', border: '1px solid #334155', boxSizing: 'border-box' },
    logo: { fontSize: '3.5rem', marginBottom: '10px', display: 'inline-block' },
    title: { fontSize: '2rem', fontWeight: '800', margin: '0 0 5px 0', color: '#ffffff' },
    gradientText: { background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    tagline: { color: '#94a3b8', fontSize: '14px', margin: '0 0 30px 0' },
    input: { width: '100%', padding: '14px', boxSizing: 'border-box', backgroundColor: '#334155', border: '2px solid #475569', borderRadius: '8px', color: '#ffffff', fontSize: '16px', outline: 'none', marginBottom: '20px' },
    toggleGroup: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '25px' },
    label: { fontSize: '16px', fontWeight: '600', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' },
    button: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
    sizeBadge: { color: '#10b981', fontWeight: '700', fontSize: '16px', margin: '15px 0 5px 0', backgroundColor: '#064e3b', padding: '6px 12px', borderRadius: '20px', display: 'inline-block' },
    progressWrapper: { width: '100%', backgroundColor: '#334155', borderRadius: '20px', marginTop: '10px', overflow: 'hidden', border: '1px solid #475569' },
    progressBar: { width: `${progress}%`, height: '18px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.4s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold' },
    msgBox: { marginTop: '20px', padding: '12px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '14px', color: '#cbd5e1', borderLeft: '4px solid #3b82f6', wordBreak: 'break-word' },
    speedWrapper: { maxWidth: '480px', width: '100%', marginTop: '20px', boxSizing: 'border-box' },
    speedButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)', border: '1px solid #047857', textAlign: 'center', boxSizing: 'border-box' },
    footerText: { textTransform: 'uppercase', fontSize: '10px', color: '#475569', textAlign: 'center', marginTop: '6px', letterSpacing: '0.5px' }
  };

  return (
    <div style={styles.bodyStyle}>
      <div style={styles.container}>
        <div style={styles.logo}>⚡</div>
        <h1 style={styles.title}><span style={styles.gradientText}>VeloFetch</span> Pro</h1>
        <p style={styles.tagline}>Premium Universal Media Downloader</p>
        
        <form onSubmit={handleDownload}>
          <input type="text" placeholder="Paste video link here..." value={url} onChange={(e) => setUrl(e.target.value)} style={styles.input} />
          <div style={styles.toggleGroup}>
            <label style={styles.label}><input type="radio" name="type" checked={downloadType === 'video'} onChange={() => setDownloadType('video')} />🎬 Video MP4</label>
            <label style={styles.label}><input type="radio" name="type" checked={downloadType === 'audio'} onChange={() => setDownloadType('audio')} />🎵 Audio M4A / MP3</label>
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Processing...' : 'Download Now'}
          </button>
        </form>

        {fileSize && <div style={styles.sizeBadge}>{fileSize}</div>}
        {loading && <div style={styles.progressWrapper}><div style={styles.progressBar}>{progress}%</div></div>}
        {message && <div style={styles.msgBox}>{message}</div>}
      </div>

      <div style={styles.speedWrapper}>
        <a href={MONETAG_DIRECT_LINK} target="_blank" rel="noopener noreferrer" style={styles.speedButton}>
          🚀 Boost Download Speed (Server 2)
        </a>
        <p style={styles.footerText}>
          Sponsored Link • Supports our free service
         </p>
      </div>
    </div>
  );
}

export default App;




