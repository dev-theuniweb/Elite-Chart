# Windows Server Deployment Instructions

## 📦 Files Ready for Deployment

Your production build is complete! The `dist` folder contains all the files you need to deploy.

## 📁 Dist Folder Contents

```
dist/
├── index.html              # Main HTML file
├── vite.svg               # Vite logo
├── assets/                # Compiled JS, CSS, and images
│   ├── bitcoin-4sWBzKTo.png
│   ├── index-D4tB9xcj.css (45.79 KB)
│   └── index-D6pHNYgQ.js  (362.14 KB)
└── audio/                 # Audio files
    ├── bet-sound.mp3
    ├── Big Dreams.mp3
    ├── Billionaire.mp3
    ├── Good luck to you.mp3
    ├── lose-sound.mp3
    ├── Sit Back & Relax.mp3
    ├── To the Moon.mp3
    └── win-sound.mp3
```

## 🚀 Deployment Steps for Windows Server

### Option 1: IIS (Internet Information Services) - Recommended

1. **Copy the dist folder to your Windows Server**
   - Copy the entire `dist` folder to your server (e.g., `C:\inetpub\wwwroot\btc-chart\`)

2. **Install IIS (if not already installed)**
   - Open Server Manager
   - Add Roles and Features → Web Server (IIS)
   - Install

3. **Configure IIS**
   - Open IIS Manager
   - Right-click "Sites" → "Add Website"
   - Site name: `BTC-Chart`
   - Physical path: `C:\inetpub\wwwroot\btc-chart` (where you copied the dist files)
   - Binding: HTTP, Port 80 (or your preferred port)
   - Click OK

4. **Configure URL Rewrite (Important for React Router)**
   - Install URL Rewrite Module: https://www.iis.net/downloads/microsoft/url-rewrite
   - Create `web.config` in the dist folder (see below)

5. **Start the website**
   - In IIS Manager, select your site and click "Start"

### web.config file for IIS

Create this file in your `dist` folder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="React Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".mp3" mimeType="audio/mpeg" />
        </staticContent>
        <httpProtocol>
            <customHeaders>
                <add name="Access-Control-Allow-Origin" value="*" />
                <add name="Access-Control-Allow-Methods" value="GET, POST, PUT, DELETE, OPTIONS" />
                <add name="Access-Control-Allow-Headers" value="Content-Type" />
            </customHeaders>
        </httpProtocol>
    </system.webServer>
</configuration>
```

---

### Option 2: Simple HTTP Server with Node.js

1. **Copy the dist folder to your Windows Server**

2. **Install Node.js on Windows Server** (if not already installed)
   - Download from: https://nodejs.org/
   - Install LTS version

3. **Create a simple server script**
   - Create `server.js` in the same directory as the `dist` folder:

```javascript
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to the app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Access from network: http://YOUR_SERVER_IP:${PORT}`);
});
```

4. **Install dependencies and run**
```bash
npm install express
node server.js
```

5. **Run as Windows Service (to keep it running)**
   - Install pm2: `npm install -g pm2-windows-service`
   - Run: `pm2 start server.js --name btc-chart`
   - Save: `pm2 save`
   - Startup: `pm2 startup`

---

### Option 3: Apache HTTP Server

1. **Copy dist folder to Apache directory**
   - Default: `C:\Apache24\htdocs\btc-chart\`

2. **Configure .htaccess** (for React routing)
   Create `.htaccess` in dist folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /btc-chart/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /btc-chart/index.html [L]
</IfModule>
```

3. **Enable mod_rewrite** in Apache config
4. **Restart Apache**

---

## 🔧 Important Configuration

### WebSocket Configuration (for SignalR)

Since your app uses SignalR for real-time Bitcoin price updates, ensure:

1. **Firewall allows WebSocket connections**
   - Port 80/443 should be open
   - WebSocket upgrade requests should be allowed

2. **IIS WebSocket Support**
   - In Server Manager → Features → Add Features
   - Select "WebSocket Protocol"
   - Restart IIS

3. **CORS Configuration**
   - If your API is on a different domain, configure CORS properly
   - The web.config above includes basic CORS headers

---

## 📊 Testing Your Deployment

After deployment, test:

1. ✅ Open the website in a browser
2. ✅ Check browser console for errors (F12)
3. ✅ Verify SignalR connection (look for connection status)
4. ✅ Test betting functionality
5. ✅ Check audio playback
6. ✅ Test on mobile devices

---

## 🔐 Security Recommendations

1. **Use HTTPS** (SSL certificate)
   - Get free SSL from Let's Encrypt
   - Configure in IIS or Apache

2. **Update Web.config** for production
   - Remove development CORS settings
   - Add specific allowed origins

3. **Set proper file permissions**
   - Read-only for web files
   - IIS_IUSRS should have read access

---

## 📝 Quick Deployment Checklist

- [ ] Build completed (`npm run build`)
- [ ] Copy `dist` folder to Windows Server
- [ ] Configure IIS/Apache/Node.js server
- [ ] Add `web.config` or `.htaccess`
- [ ] Enable WebSocket support
- [ ] Configure firewall
- [ ] Test the website
- [ ] Set up SSL certificate (optional but recommended)
- [ ] Configure monitoring/logging

---

## 🆘 Troubleshooting

### Issue: Blank page after deployment
**Solution**: Check browser console. Usually a path issue. Ensure `base` in `vite.config.js` matches your deployment path.

### Issue: WebSocket connection fails
**Solution**: 
- Check firewall settings
- Ensure WebSocket protocol is enabled in IIS
- Verify SignalR hub URL is correct

### Issue: 404 errors on refresh
**Solution**: URL rewrite is not configured. Add `web.config` or `.htaccess`

### Issue: Audio files not playing
**Solution**: Check MIME types are configured in IIS/Apache for `.mp3` files

---

## 📞 Support

If you encounter issues, check:
1. Browser console (F12)
2. IIS logs: `C:\inetpub\logs\LogFiles\`
3. Windows Event Viewer

---

## ✅ Your deployment is ready!

The `dist` folder contains everything you need. Just upload it to your Windows Server and follow the steps above.

**Location**: `/Users/peterfong/my-react-app/BBB/dist/`
**Size**: ~450 KB (compressed)
**Files**: 12 total (HTML, CSS, JS, images, audio)

Good luck with your deployment! 🚀
