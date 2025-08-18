# Protein Visualization Explorer

A lightweight, modern web application for visualizing 3D protein structures from the Protein Data Bank (PDB) using Molstar for molecular visualization and React Three Fiber for interactive 3D UI navigation.

## Features

- **Accurate Protein Visualization**: Uses Molstar for high-quality 3D molecular rendering
- **Interactive 3D Navigation**: React Three Fiber (R3F) powered 3D UI for protein selection
- **Real-time Search**: Search proteins by name, ID, or organism from the Protein Data Bank
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Quick Access**: Pre-loaded popular proteins for immediate exploration
- **Modern UI**: Clean, dark-themed interface optimized for scientific visualization

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **3D Visualization**: Molstar for molecular structures
- **3D UI**: React Three Fiber (@react-three/fiber) + Three.js
- **Styling**: CSS3 with responsive design
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd protein-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Searching for Proteins

1. Use the search bar to find proteins by name, ID, or organism
2. Results appear in real-time as you type
3. Click on any result to load the 3D structure

### 3D Navigation

- **Interactive 3D Scene**: Use the 3D navigation panel with clickable protein spheres
- **Mouse Controls**: 
  - Left click + drag: Rotate view
  - Right click + drag: Pan view
  - Scroll: Zoom in/out
- **Touch Controls**: Pinch to zoom, drag to rotate on mobile devices

### Quick Load

Popular proteins are available for immediate loading:
- **1A1U**: Insulin
- **2LYZ**: Lysozyme
- **1UBQ**: Ubiquitin
- **4HHB**: Hemoglobin
- **1BNA**: DNA

## Development

### Project Structure

```
src/
├── components/
│   ├── ProteinViewer.tsx      # Molstar protein visualization
│   ├── NavigationControls.tsx # 3D R3F navigation
│   └── ProteinSearch.tsx      # Search interface
├── services/
│   └── proteinService.ts      # PDB API integration
├── App.tsx                    # Main application
└── App.css                    # Styling
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

#### Adding Custom Proteins

1. Update the `recentProteins` array in `NavigationControls.tsx`
2. Add protein data to the search service if needed

#### Customizing Visualization

The Molstar viewer can be customized in `ProteinViewer.tsx`:
- Change representation styles (cartoon, ball-and-stick, surface)
- Modify color schemes
- Add custom annotations

## API Integration

### Protein Data Bank (PDB) APIs

- **Structure Download**: `https://files.rcsb.org/download/{PDB_ID}.pdb`
- **Search API**: `https://search.rcsb.org/rcsbsearch/v2/query`
- **Metadata**: `https://data.rcsb.org/rest/v1/core/entry/{PDB_ID}`

### Error Handling

The application includes comprehensive error handling for:
- Network connectivity issues
- Invalid PDB IDs
- API rate limiting
- Missing protein data

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimizations

- **Lazy Loading**: Molstar library is loaded dynamically
- **Code Splitting**: Components are code-split for faster initial load
- **Responsive Images**: Optimized for different screen sizes
- **Efficient Rendering**: 3D scenes use hardware acceleration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [RCSB Protein Data Bank](https://www.rcsb.org/) for providing protein structure data
- [Molstar](https://molstar.org/) for molecular visualization
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for 3D web graphics

# 🧬 Protein Viewer VR

An immersive 3D protein visualization application with full VR support for Oculus Quest and WebXR-compatible devices.

## 🚀 Features

- **3D Protein Visualization** with NGL Viewer
- **VR Mode** with Oculus Quest support
- **PC 3D World** with keyboard/mouse controls
- **Interactive Controls** for protein manipulation
- **Multiple View Modes** (ball-and-stick, cartoon, ribbon, surface)
- **Real-time PDB Loading** from RCSB database
- **WebXR Compatible** for VR headsets

## 🎯 Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod
```

## 🥽 VR Usage (Oculus Quest)

1. **Connect Oculus Quest** to your browser
2. **Click "VR World"** button
3. **Allow WebXR permissions** when prompted
4. **Walk around** the 20x20 meter virtual space
5. **Interact with proteins** using hand controllers or hand tracking

## 🖥️ PC 3D World Usage

1. **Click "PC World"** button
2. **Use WASD** to move around
3. **Mouse look** with pointer lock
4. **Spacebar** to jump

## 🧪 Supported Protein Formats

- **PDB files** from RCSB database
- **Real-time loading** via PDB ID (e.g., 1A1U, 1CRN)
- **Multiple visualization modes**:
  - Ball & Stick
  - Cartoon
  - Ribbon
  - Surface
  - Spacefill

## 🛠️ Technical Stack

- **Frontend**: React 19 + TypeScript
- **3D Engine**: Three.js + React Three Fiber
- **VR Framework**: @react-three/xr
- **Protein Visualization**: NGL Viewer
- **Build Tool**: Vite
- **Deployment**: Netlify-ready

## 📁 Project Structure

```
src/
├── components/
│   ├── ImmersiveProteinViewer.tsx  # Main protein viewer
│   ├── VRWorld.tsx                 # VR environment
│   ├── PCFallbackWorld.tsx         # PC 3D world
│   └── ProteinInWorld.tsx          # 3D protein component
├── services/
│   └── proteinService.ts           # Protein data handling
├── App.tsx                         # Main application
└── main.tsx                       # Entry point
```

## 🌐 Deployment

### Netlify (Recommended)
1. **Connect GitHub repository** to Netlify
2. **Build command**: `npm run build`
3. **Publish directory**: `dist`
4. **Enable WebXR** in site settings

### Alternative Platforms
- **Vercel**: Import from GitHub
- **GitHub Pages**: Manual deployment
- **Custom Server**: Static file hosting

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
