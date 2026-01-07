# 🚀 Windows Server Deployment Guide

## 📦 Build Completed Successfully!

Your application has been built and is ready for deployment to Windows Server.

**Build Output Location:** `/dist/` folder (45KB CSS, 362KB JS, 95KB images)

---

## 🎯 Deployment Options for Windows Server

### **Option 1: IIS (Internet Information Services) - Recommended**

#### Step 1: Install IIS on Windows Server
```powershell
# Run PowerShell as Administrator
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

#### Step 2: Upload Files to Server
1. Copy the entire `/dist/` folder to your Windows Server
2. Place it in: `C:\inetpub\wwwroot\btc-demo\`

#### Step 3: Configure IIS
1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Configure:
   - **Site name:** BTC-Demo
   - **Physical path:** `C:\inetpub\wwwroot\btc-demo`
   - **Port:** 80 (or 8080 for testing)
   - **Host name:** your-domain.com (or leave empty)

#### Step 4: Add URL Rewrite Rule (Important for React Router)
1. Install URL Rewrite Module: https://www.iis.net/downloads/microsoft/url-rewrite
2. In IIS Manager, select your site
3. Double-click **URL Rewrite**
4. Click **Add Rule** → **Blank Rule**
5. Configure:
   - **Name:** React Router
   - **Match URL:** `.*`
   - **Conditions:** Add condition → `{REQUEST_FILENAME}` is not a file
   - **Action:** Rewrite → URL: `/index.html`

#### Step 5: Configure MIME Types (if needed)
Ensure these MIME types are configured:
- `.js` → `application/javascript`
- `.css` → `text/css`
- `.mp3` → `audio/mpeg`

#### Step 6: Open Firewall
```powershell
New-NetFirewallRule -DisplayName "BTC Demo HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

---

### **Option 2: Node.js with Express (Static Server)**

#### Step 1: Install Node.js on Windows Server
Download from: https://nodejs.org/

#### Step 2: Create Server Script
Upload the `dist` folder and create `server.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

#### Step 3: Install Express
```bash
npm install express
```

#### Step 4: Run Server
```bash
node server.js
```

#### Step 5: Run as Windows Service (Optional)
Install PM2:
```bash
npm install -g pm2-windows-service
npm install -g pm2
pm2 start server.js --name btc-demo
pm2 save
pm2-service-install
```

---

### **Option 3: Apache HTTP Server**

#### Step 1: Install Apache for Windows
Download from: https://www.apachelounge.com/download/

#### Step 2: Upload Files
Place `dist` folder in: `C:\Apache24\htdocs\btc-demo\`

#### Step 3: Create .htaccess File
In the `dist` folder, create `.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /btc-demo/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /btc-demo/index.html [L]
</IfModule>
```

#### Step 4: Enable mod_rewrite
Edit `httpd.conf`:
```apache
LoadModule rewrite_module modules/mod_rewrite.so
AllowOverride All
```

#### Step 5: Start Apache
```bash
httpd.exe
```

---

## 📋 Pre-Deployment Checklist

- ✅ Build completed (`npm run build`)
- ⬜ SignalR WebSocket URL configured correctly
- ⬜ Audio files in `/public/audio/` folder included
- ⬜ CORS configured on backend API (if needed)
- ⬜ SSL certificate installed (for HTTPS)
- ⬜ Firewall ports opened (80, 443)
- ⬜ DNS A record pointing to server IP

---

## 🔧 Environment Configuration

### Current SignalR Connection
Your app connects to: `https://price-stream.theuniweb.shop/pricehub`

**If this needs to change for production:**
1. Update in `src/components/BTCChart.jsx` line ~1625
2. Rebuild: `npm run build`

---

## 🌐 Accessing Your Demo

After deployment, access via:
- **Local:** `http://localhost` or `http://localhost:8080`
- **Network:** `http://YOUR_SERVER_IP`
- **Domain:** `http://your-domain.com`

---

## 📱 Mobile Testing

Test on mobile devices using your server's IP:
- iPhone: `http://192.168.x.x` (same network)
- Android: `http://192.168.x.x`

---

## 🔐 Security Recommendations

1. **Use HTTPS:** Install SSL certificate (Let's Encrypt, Cloudflare)
2. **Enable CORS:** Configure backend API whitelist
3. **Set Security Headers:**
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   ```
4. **Rate Limiting:** Implement on backend
5. **Firewall Rules:** Only open necessary ports

---

## 📊 Performance Tips

1. **Enable Gzip Compression** in IIS/Apache
2. **Set Cache Headers** for static assets
3. **Use CDN** for audio files (optional)
4. **Monitor WebSocket connections** (SignalR)

---

## 🐛 Troubleshooting

### Issue: Blank page after deployment
**Solution:** Check browser console for errors. Usually:
- Incorrect base URL
- Missing URL rewrite rules
- MIME type not configured

### Issue: WebSocket connection fails
**Solution:** 
- Check firewall allows WebSocket
- Verify SignalR backend is accessible
- Check CORS settings

### Issue: Audio not playing
**Solution:**
- Verify `/audio/` folder is in `dist/`
- Check MIME types for `.mp3`
- Test on different browsers

### Issue: 404 on refresh
**Solution:** Configure URL rewrite to serve `index.html` for all routes

---

## 📞 Support

For issues, check:
1. Browser Developer Console (F12)
2. IIS/Apache error logs
3. Network tab for failed requests

---

## ✅ Quick Test Commands

After deployment, test these URLs:
```
http://your-server/                  # Main app
http://your-server/audio/bet-sound.mp3  # Audio files
```

**Expected Results:**
- Main page loads with BTC chart
- Audio files are accessible
- WebSocket connects (check console)
- Betting system works

---

## 🎉 Deployment Complete!

Your BTC trading demo is now live on Windows Server!

**Share the URL with stakeholders for testing.**

Good luck! 🚀
