# ID Photo Editor

A fully in-browser web app that converts a user-uploaded portrait into an official ID photo with a pure white background (#FFFFFF).

## Features

- **Drag & Drop Upload**: Easy image upload with drag-and-drop or click-to-browse
- **Automatic Face Detection**: Uses MediaPipe Face Mesh to detect face landmarks
- **Auto Eye Alignment**: Automatically rotates image so eyes are level
- **Background Removal**: Uses MediaPipe Selfie Segmentation for accurate person segmentation (including hair)
- **White Background**: Replaces background with solid white (#FFFFFF) with edge feathering for clean results
- **Adjustable Controls**: Fine-tune zoom, vertical position, and rotation
- **Multiple Size Presets**:
  - US Passport (2x2 inches @ 300 DPI = 600x600 px)
  - EU/Schengen (35x45 mm @ 300 DPI = 413x531 px)
  - China Visa (33x48 mm @ 300 DPI = 390x567 px)
  - Custom size with selectable units (mm or inches) and DPI
- **Export Options**: PNG (lossless) or JPEG with quality slider

## Requirements

- **Node.js 18.0.0 or higher** (required for Vite 5)
- npm or yarn

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

### 1. Face Detection Pipeline
- Uses MediaPipe Face Mesh (468 landmarks) for accurate face detection
- Extracts eye positions to calculate rotation angle
- Computes face bounding box from face oval landmarks

### 2. Auto-Alignment Algorithm
- Calculates angle between left and right eye centers
- Rotates image to make eyes perfectly horizontal
- Re-detects face landmarks on rotated image for accurate cropping

### 3. Background Removal
- Uses MediaPipe Selfie Segmentation (model 1 - landscape)
- Downscales large images to max 1024px for processing performance
- Generates segmentation mask, scales back to original resolution
- Applies Gaussian blur to mask edges for smooth feathering

### 4. Crop & Head Size Algorithm
The algorithm ensures the head occupies approximately 60% of the frame height (adjustable via zoom):

```
headToFrameRatio = 0.6 (60% of frame height)
frameHeight = headHeight / headToFrameRatio
frameWidth = frameHeight * targetAspectRatio
topPadding = headHeight * 0.35 (35% padding above head)
```

This ensures the face is properly centered with appropriate padding for shoulders.

### 5. Compositing
- Creates white (#FFFFFF) background canvas
- Applies feathered mask using alpha blending
- Crops and resizes to target output dimensions

## Size Preset Calculations

| Preset | Physical Size | DPI | Pixel Size |
|--------|---------------|-----|------------|
| US Passport | 2 × 2 inches | 300 | 600 × 600 px |
| EU/Schengen | 35 × 45 mm | 300 | 413 × 531 px |
| China Visa | 33 × 48 mm | 300 | 390 × 567 px |

Formula: `pixels = (mm / 25.4) * DPI` or `pixels = inches * DPI`

## Common Failure Modes & Solutions

### 1. Face Not Detected
**Cause**: Poor lighting, face not visible, extreme angles, or occluded face
**Solution**: Use a well-lit, front-facing photo with clear facial features

### 2. Poor Background Removal (Hair Edges)
**Cause**: Hair similar color to background, very fine/flyaway hair
**Solutions**:
- Use photo with contrasting background
- Increase feather radius in code (default: 3px)
- For production: consider using a more advanced model like MODNet or SAM

### 3. Incorrect Crop Position
**Cause**: Unusual face proportions or pose
**Solution**: Use adjustment controls (zoom, vertical position) to fine-tune

### 4. Low Quality Output
**Cause**: Source image too small
**Solution**: Upload higher resolution images (recommended: at least 1000px on shortest side)

### 5. Processing Slow on Large Images
**Cause**: Browser memory/CPU limitations
**Solution**: Images are automatically downscaled for segmentation, but very large images (>4000px) may still be slow

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MediaPipe Face Mesh** - Face landmark detection
- **MediaPipe Selfie Segmentation** - Background removal
- **HTML5 Canvas** - Image processing

## Project Structure

```
src/
├── App.tsx                    # Main app component
├── main.tsx                   # Entry point
├── index.css                  # Tailwind imports
├── components/
│   ├── ImageUploader.tsx      # Drag/drop upload
│   ├── ControlPanel.tsx       # Adjustment sliders
│   ├── PreviewPanel.tsx       # Live preview
│   ├── SizePresets.tsx        # Size selection
│   └── ExportPanel.tsx        # Download options
├── hooks/
│   ├── useFaceDetection.ts    # Face Mesh integration
│   ├── useBackgroundRemoval.ts # Selfie Segmentation
│   └── useImageProcessing.ts  # Main processing pipeline
├── utils/
│   ├── canvasUtils.ts         # Canvas operations
│   ├── faceUtils.ts           # Face geometry calculations
│   └── imageUtils.ts          # Image loading/export
└── types/
    ├── index.ts               # App type definitions
    └── mediapipe.d.ts         # MediaPipe type declarations
```

## Privacy

All image processing happens entirely in the browser. No images are uploaded to any server.

## License

MIT
