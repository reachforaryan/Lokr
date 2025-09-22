// Keep-alive script for Render free tier
// Pings the service every 10 minutes to prevent sleeping

const https = require('https');
const http = require('http');

// Your service URLs (update after deployment)
const services = [
  'https://lokr-backend.onrender.com/health',
  'https://lokr-frontend.onrender.com'
];

function pingService(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    https.get(url, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ ${url} - Status: ${res.statusCode} - Time: ${duration}ms`);
      resolve({ url, status: res.statusCode, duration });
    }).on('error', (err) => {
      console.log(`❌ ${url} - Error: ${err.message}`);
      reject({ url, error: err.message });
    });
  });
}

async function keepAlive() {
  console.log(`🚀 Keep-alive ping at ${new Date().toISOString()}`);

  try {
    const promises = services.map(url => pingService(url));
    await Promise.all(promises);
    console.log('✨ All services pinged successfully\n');
  } catch (error) {
    console.error('❌ Error pinging services:', error);
  }
}

// Create a simple HTTP server for Render port binding requirement
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Keep-alive service is running\n');
  } else if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'active',
      lastPing: new Date().toISOString(),
      services: services.length
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🔄 Lokr Keep-Alive Service\nKeeping services active every 10 minutes\n');
  }
});

// Start the HTTP server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🌐 Keep-alive HTTP server listening on port ${port}`);
});

// Run keep-alive immediately
keepAlive();

// Run every 10 minutes (600,000 milliseconds)
setInterval(keepAlive, 10 * 60 * 1000);

console.log('🔄 Keep-alive service started - pinging every 10 minutes');