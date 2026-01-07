import express from 'express';
import path from 'path';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5173;

// Enable gzip compression
app.use(compression());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y', // Cache static assets for 1 year
  etag: false
}));

// Handle React Router - serve index.html for all non-API routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Something went wrong!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Bitcoin Trading Chart server running on port ${port}`);
  console.log(`📱 Local: http://localhost:${port}`);
  console.log(`🌐 Network: http://YOUR_SERVER_IP:${port}`);
  console.log(`📊 Application: Bitcoin Price Chart with Real-time Updates`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});