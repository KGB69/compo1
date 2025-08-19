# VR Protein Viewer - GitHub Deployment Guide

## 🚀 GitHub Pages Deployment

### Automatic Deployment
Every push to `main` branch automatically deploys to GitHub Pages via GitHub Actions.

### Manual Steps
1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial VR Protein Viewer PWA"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vr-protein-viewer.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source
   - Wait for Actions to complete (≈2-3 minutes)

## 🥽 Oculus Quest Access

### Method 1: Direct Browser (Recommended)
1. Open **Oculus Browser** on Quest
2. Navigate to: `https://YOUR_USERNAME.github.io/vr-protein-viewer`
3. Click **"Install"** when prompted
4. App appears in Quest library as standalone PWA

### Method 2: Manual Installation
1. Open Oculus Browser
2. Navigate to GitHub Pages URL
3. Click **⋮ Menu** → **Install App**
4. Confirm installation

### Method 3: URL Bar Direct
1. Type full GitHub Pages URL in Oculus Browser
2. Press Enter
3. Use VR mode directly without installation

## 🔗 GitHub Pages URLs
- **Main**: `https://YOUR_USERNAME.github.io/vr-protein-viewer`
- **Branch**: `https://YOUR_USERNAME.github.io/vr-protein-viewer/branch-name`

## 📱 Cross-Platform Access

### PC/Mac/Linux
- **Browser**: Any modern browser
- **VR**: WebXR supported browsers (Chrome, Firefox, Edge)

### Mobile
- **iOS Safari**: WebXR not supported, but PWA works
- **Android Chrome**: Full WebXR support
- **Quest Browser**: Native WebXR + PWA installation

## 🎯 Testing Checklist

### Before Pushing to GitHub
```bash
npm run build
npm run preview
# Test on localhost:4173
```

### After GitHub Deployment
- [ ] Check GitHub Actions pass
- [ ] Verify GitHub Pages loads
- [ ] Test on Oculus Browser
- [ ] Test PWA installation
- [ ] Test VR mode functionality

## 🚀 Quick Start Commands

```bash
# Local development
npm run dev

# Build and preview (like GitHub Pages)
npm run build
npm run preview

# Deploy to GitHub
# Just push to main branch - automatic!
```

## 🌐 Network Access
- **Local**: `http://localhost:3000`
- **Network**: `http://[YOUR-PC-IP]:3000`
- **GitHub**: `https://YOUR_USERNAME.github.io/vr-protein-viewer`

## 📋 Repository Setup Checklist
- [ ] Repository created on GitHub
- [ ] GitHub Pages enabled
- [ ] GitHub Actions workflow present
- [ ] PWA manifest configured
- [ ] Base URL set for GitHub Pages
- [ ] WebXR permissions included
