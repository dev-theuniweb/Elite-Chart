# Windows Server Deployment Guide

## 📦 Deployment Package Contents

This package contains the built Bitcoin Trading Chart application ready for Windows server deployment.

### Files Included:
- `dist/` - Production build files
- `WINDOWS_DEPLOYMENT_GUIDE.md` - This deployment guide
- `package.json` - Project configuration
- `vercel.json` - Server configuration (can be adapted for Windows)

## 🚀 Windows Server Deployment Options

### Option 1: IIS (Internet Information Services)

1. **Install IIS** on your Windows Server
2. **Copy the `dist` folder** to `C:\inetpub\wwwroot\btc-chart\`
3. **Configure IIS Site**:
   - Open IIS Manager
   - Create new website pointing to `C:\inetpub\wwwroot\btc-chart\`
   - Set port (default 80 or 443 for HTTPS)

4. **Configure URL Rewriting** (for React Router):
   ```xml
   <!-- Create web.config in dist folder -->
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
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

### Option 2: Apache HTTP Server

1. **Install Apache** on Windows Server
2. **Copy dist folder** to Apache's `htdocs` directory
3. **Configure .htaccess** (create in dist folder):
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QR,L]
   ```

### Option 3: Nginx on Windows

1. **Install Nginx** for Windows
2. **Configure nginx.conf**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root C:/path/to/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

### Option 4: Node.js Server (Express)

1. **Install Node.js** on Windows Server
2. **Create a simple Express server**:
   ```javascript
   const express = require('express');
   const path = require('path');
   const app = express();
   
   app.use(express.static(path.join(__dirname, 'dist')));
   
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
   });
   
   const port = process.env.PORT || 3000;
   app.listen(port, () => {
     console.log(`Server running on port ${port}`);
   });
   ```

## 🔧 Configuration Requirements

### Environment Variables (if needed):
- No backend environment variables required for this frontend-only app
- SignalR connections are configured in the frontend code

### HTTPS Configuration:
- **Recommended** for production
- Configure SSL certificate in your web server
- Update SignalR connection URLs to use `wss://` instead of `ws://`

### Cross-Origin Resource Sharing (CORS):
- If your SignalR hub is on a different domain, ensure CORS is properly configured
- The app connects to external price data APIs

## 🌐 DNS and Firewall Configuration

1. **DNS**: Point your domain to the Windows Server IP
2. **Firewall**: Open ports 80 (HTTP) and 443 (HTTPS)
3. **Windows Defender**: Allow web server through firewall

## 📊 Performance Optimization

### For Production:
- **Enable Gzip compression** in your web server
- **Set proper cache headers** for static assets
- **Use CDN** if serving global users
- **Monitor server resources** (CPU, RAM, Network)

## 🔍 Troubleshooting

### Common Issues:

1. **Blank Page**: Check browser console for errors, ensure all assets are loading
2. **Routing Issues**: Verify URL rewriting is configured correctly
3. **WebSocket Connection**: Check if SignalR can connect (network/firewall issues)
4. **CORS Errors**: Configure your SignalR hub to allow your domain

### Health Check:
- Access `/` to see the main chart
- Check browser console for any JavaScript errors
- Verify WebSocket connection status in the UI

## 📞 Support

For deployment issues:
1. Check browser developer console
2. Check web server error logs
3. Verify all files are in the correct directory
4. Test with a simple HTML file first

## 🔄 Updates

To update the application:
1. Build new version locally: `npm run build`
2. Stop web server
3. Replace contents of dist folder
4. Restart web server
5. Clear browser cache

---

**Application Features:**
- ✅ Real-time Bitcoin price chart
- ✅ Safari compatibility fixed
- ✅ Responsive design (mobile/desktop)
- ✅ WebSocket price updates
- ✅ Interactive betting interface
- ✅ Battle timer system
- ✅ Price history and trends

**Last Updated:** October 1, 2025