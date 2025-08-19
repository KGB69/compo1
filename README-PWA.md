# VR Protein Viewer PWA

## Local PC Access

### Development
```bash
npm run dev
```
Access at: `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```
Access at: `http://localhost:4173`

## Oculus Quest Installation

### Method 1: Browser Installation
1. Open Oculus Browser on Quest
2. Navigate to your local IP: `http://[YOUR-PC-IP]:3000`
3. Click "Install" when prompted

### Method 2: SideQuest (Advanced)
1. Enable Developer Mode on Quest
2. Use SideQuest to install as Web App
3. Package the built `dist/` folder as an APK

### Method 3: WebXR Direct Access
1. Open Oculus Browser
2. Navigate directly to deployed URL
3. Use WebXR features natively

## PWA Features
- ✅ Offline support with service worker
- ✅ Install prompt on supported browsers
- ✅ WebXR integration for VR mode
- ✅ Responsive design for PC and mobile
- ✅ Fullscreen mode support
- ✅ Local network access (0.0.0.0:3000)

## Network Access
- **Local**: `http://localhost:3000`
- **Network**: `http://[YOUR-PC-IP]:3000`
- **Mobile**: Connect to same WiFi and use PC IP

## Oculus Quest Specific
- **WebXR**: Native support in Oculus Browser
- **Controllers**: Full VR controller support
- **Hand Tracking**: Enabled when available
- **Install**: Available as PWA from browser

## Testing on Quest
1. Ensure Quest and PC on same network
2. Find PC IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Open Oculus Browser
4. Navigate to `http://[PC-IP]:3000`
5. Test VR mode with controllers
