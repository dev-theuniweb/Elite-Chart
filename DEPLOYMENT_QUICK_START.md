# 🚀 Quick Deployment Guide - Windows Server

## ✅ Build Complete!

Your production files are ready in the `dist` folder.

## 📦 What's in the dist folder?

```
dist/
├── index.html          # Main HTML file
├── vite.svg           # Logo
├── web.config         # IIS configuration (already included!)
├── assets/            # Compiled JS, CSS, images
│   ├── bitcoin-4sWBzKTo.png
│   ├── index-D4tB9xcj.css (45.79 KB)
│   └── index-D6pHNYgQ.js  (362.14 KB)
└── audio/             # Sound effects
    ├── bet-sound.mp3
    ├── Big Dreams.mp3
    ├── Billionaire.mp3
    ├── Good luck to you.mp3
    ├── lose-sound.mp3
    ├── Sit Back & Relax.mp3
    ├── To the Moon.mp3
    └── win-sound.mp3
```

## 🎯 Simple Deployment Steps (IIS - Recommended)

### 1. Copy Files to Server
- Copy the entire `dist` folder to your Windows Server
- Suggested location: `C:\inetpub\wwwroot\btc-chart\`

### 2. Configure IIS
1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Fill in:
   - **Site name**: `BTC-Chart`
   - **Physical path**: `C:\inetpub\wwwroot\btc-chart`
   - **Port**: `80` (or your choice)
4. Click **OK**

### 3. Enable WebSocket (Required for real-time prices!)
1. Open **Server Manager**
2. **Add Features** → Check **WebSocket Protocol**
3. Install and restart IIS

### 4. Start Your Website
- In IIS Manager, select your site
- Click **Start** in the Actions panel

### 5. Access Your App
- Local: `http://localhost:80`
- Network: `http://YOUR_SERVER_IP:80`

## ⚡ That's it! Your app is live!

---

## 🔍 Verify Everything Works

Open your browser and check:
- [ ] Website loads
- [ ] Bitcoin price updates in real-time
- [ ] Connection status shows "Connected"
- [ ] Can place bets
- [ ] Audio plays (win/lose sounds)
- [ ] Mobile responsive

---

## 🆘 Troubleshooting

**Problem**: Blank page
- **Fix**: Check browser console (F12). Clear browser cache.

**Problem**: Connection status shows "Disconnected"
- **Fix**: Enable WebSocket in IIS Features

**Problem**: 404 error when refreshing
- **Fix**: web.config is already included! Make sure IIS URL Rewrite module is installed.

**Problem**: Audio not playing
- **Fix**: MIME types are configured in web.config. Just restart IIS.

---

## 📁 Files Location

Your deployment files are here:
```
/Users/peterfong/my-react-app/BBB/dist/
```

Simply copy this entire folder to your Windows Server!

---

## 📖 Need More Details?

See the full guide: `WINDOWS_DEPLOYMENT_INSTRUCTIONS.md`

---

**Build Date**: October 9, 2025
**Build Time**: ~636ms
**Total Size**: ~450 KB (compressed)
**Status**: ✅ Production Ready

🎉 Happy Deploying!
