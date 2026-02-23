export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  return ctx;
}

export function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = getContext2D(canvas);
  ctx.drawImage(image, 0, 0);
  return canvas;
}

export function rotateCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  angleDegrees: number
): HTMLCanvasElement {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));
  
  const newWidth = Math.ceil(width * cos + height * sin);
  const newHeight = Math.ceil(height * cos + width * sin);
  
  const canvas = createCanvas(newWidth, newHeight);
  const ctx = getContext2D(canvas);
  
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(angleRad);
  ctx.drawImage(source, -width / 2, -height / 2);
  
  return canvas;
}

export function applyGaussianBlurCanvas(
  canvas: HTMLCanvasElement,
  radius: number
): HTMLCanvasElement {
  const result = createCanvas(canvas.width, canvas.height);
  const ctx = getContext2D(result);
  
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  
  return result;
}

export function erodeMask(
  imageData: ImageData,
  radius: number
): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minAlpha = 255;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const px = Math.min(Math.max(x + dx, 0), width - 1);
            const py = Math.min(Math.max(y + dy, 0), height - 1);
            const idx = (py * width + px) * 4 + 3;
            minAlpha = Math.min(minAlpha, data[idx]);
          }
        }
      }
      
      const idx = (y * width + x) * 4;
      result[idx + 3] = minAlpha;
    }
  }
  
  return new ImageData(result, width, height);
}

export function dilateMask(
  imageData: ImageData,
  radius: number
): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxAlpha = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const px = Math.min(Math.max(x + dx, 0), width - 1);
            const py = Math.min(Math.max(y + dy, 0), height - 1);
            const idx = (py * width + px) * 4 + 3;
            maxAlpha = Math.max(maxAlpha, data[idx]);
          }
        }
      }
      
      const idx = (y * width + x) * 4;
      result[idx + 3] = maxAlpha;
    }
  }
  
  return new ImageData(result, width, height);
}

export function detectEdgeRegion(
  maskData: ImageData,
  edgeWidth: number = 5
): Uint8Array {
  const { data, width, height } = maskData;
  const isEdge = new Uint8Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4 + 3;
      const alpha = data[idx];
      
      if (alpha > 10 && alpha < 245) {
        isEdge[y * width + x] = 1;
        continue;
      }
      
      let hasLow = false;
      let hasHigh = false;
      
      for (let dy = -edgeWidth; dy <= edgeWidth && !(hasLow && hasHigh); dy++) {
        for (let dx = -edgeWidth; dx <= edgeWidth && !(hasLow && hasHigh); dx++) {
          const px = Math.min(Math.max(x + dx, 0), width - 1);
          const py = Math.min(Math.max(y + dy, 0), height - 1);
          const neighborAlpha = data[(py * width + px) * 4 + 3];
          if (neighborAlpha < 50) hasLow = true;
          if (neighborAlpha > 200) hasHigh = true;
        }
      }
      
      if (hasLow && hasHigh) {
        isEdge[y * width + x] = 1;
      }
    }
  }
  
  return isEdge;
}

export function isGrayish(r: number, g: number, b: number, tolerance: number = 30): boolean {
  const avg = (r + g + b) / 3;
  return Math.abs(r - avg) < tolerance && 
         Math.abs(g - avg) < tolerance && 
         Math.abs(b - avg) < tolerance;
}

export function colorAwareMatting(
  fgData: ImageData,
  maskData: ImageData,
  bgColor: { r: number; g: number; b: number }
): ImageData {
  const { width, height } = fgData;
  const result = new ImageData(new Uint8ClampedArray(maskData.data), width, height);
  const edgeRegion = detectEdgeRegion(maskData, 5);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const idx = pixelIdx * 4;
      
      const fgR = fgData.data[idx];
      const fgG = fgData.data[idx + 1];
      const fgB = fgData.data[idx + 2];
      const currentAlpha = maskData.data[idx + 3] / 255;
      
      const brightness = (fgR + fgG + fgB) / 3;
      
      const colorDist = Math.sqrt(
        Math.pow(fgR - bgColor.r, 2) +
        Math.pow(fgG - bgColor.g, 2) +
        Math.pow(fgB - bgColor.b, 2)
      ) / 441.67;
      
      let refinedAlpha = currentAlpha;
      
      if (brightness > 180 && colorDist < 0.2) {
        const factor = colorDist / 0.2;
        refinedAlpha = currentAlpha * factor * factor;
      }
      
      if (brightness > 140 && brightness < 220 && isGrayish(fgR, fgG, fgB, 25)) {
        if (currentAlpha < 0.85) {
          refinedAlpha = refinedAlpha * 0.3;
        }
      }
      
      if (edgeRegion[pixelIdx]) {
        if (brightness > 160 && isGrayish(fgR, fgG, fgB, 35) && currentAlpha < 0.9) {
          refinedAlpha = Math.min(refinedAlpha, 0.1);
        }
        
        if (brightness < 70 && currentAlpha > 0.2) {
          const darkBoost = (70 - brightness) / 70;
          refinedAlpha = Math.min(1, currentAlpha + darkBoost * 0.5 * (1 - currentAlpha));
        }
      }
      
      if (brightness < 50 && currentAlpha > 0.4) {
        refinedAlpha = Math.min(1, currentAlpha + 0.3 * (1 - currentAlpha));
      }
      
      result.data[idx + 3] = Math.round(refinedAlpha * 255);
    }
  }
  
  return result;
}

export function multiPassRefine(
  maskData: ImageData,
  passes: number = 2
): ImageData {
  let current = maskData;
  
  for (let i = 0; i < passes; i++) {
    const eroded = erodeMask(current, 1);
    const dilated = dilateMask(eroded, 1);
    current = dilated;
  }
  
  return current;
}

export function refineMaskEdges(
  maskData: ImageData,
  erodeRadius: number = 1,
  blurRadius: number = 8
): HTMLCanvasElement {
  const { width, height } = maskData;
  
  const refined = multiPassRefine(maskData, 2);
  const erodedMask = erodeMask(refined, erodeRadius);
  
  const maskCanvas = createCanvas(width, height);
  const maskCtx = getContext2D(maskCanvas);
  maskCtx.putImageData(erodedMask, 0, 0);
  
  const blurredCanvas = applyGaussianBlurCanvas(maskCanvas, blurRadius);
  
  return blurredCanvas;
}

export function applyGaussianBlur(
  imageData: ImageData,
  radius: number
): ImageData {
  const { width, height } = imageData;
  
  const canvas = createCanvas(width, height);
  const ctx = getContext2D(canvas);
  ctx.putImageData(imageData, 0, 0);
  
  const blurred = applyGaussianBlurCanvas(canvas, radius);
  const blurredCtx = getContext2D(blurred);
  
  return blurredCtx.getImageData(0, 0, width, height);
}

export function removeColorSpill(
  fgR: number, fgG: number, fgB: number,
  bgColor: { r: number; g: number; b: number },
  alpha: number
): { r: number; g: number; b: number } {
  if (alpha > 0.95 || alpha < 0.05) {
    return { r: fgR, g: fgG, b: fgB };
  }
  
  const spillStrength = (1 - alpha) * 0.5;
  
  const avgBg = (bgColor.r + bgColor.g + bgColor.b) / 3;
  const spillR = (fgR - avgBg) * spillStrength;
  const spillG = (fgG - avgBg) * spillStrength;
  const spillB = (fgB - avgBg) * spillStrength;
  
  return {
    r: Math.max(0, Math.min(255, fgR - spillR * (bgColor.r / 255))),
    g: Math.max(0, Math.min(255, fgG - spillG * (bgColor.g / 255))),
    b: Math.max(0, Math.min(255, fgB - spillB * (bgColor.b / 255)))
  };
}

export function compositeWithMask(
  foreground: HTMLCanvasElement | HTMLImageElement,
  mask: ImageData,
  backgroundColor: string = '#FFFFFF',
  featherRadius: number = 6
): HTMLCanvasElement {
  const width = foreground instanceof HTMLImageElement 
    ? foreground.naturalWidth 
    : foreground.width;
  const height = foreground instanceof HTMLImageElement 
    ? foreground.naturalHeight 
    : foreground.height;
  
  const canvas = createCanvas(width, height);
  const ctx = getContext2D(canvas);
  
  const bgColor = { r: 255, g: 255, b: 255 };
  
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  let processedMask = mask;
  if (mask.width !== width || mask.height !== height) {
    const maskCanvas = createCanvas(mask.width, mask.height);
    const maskCtx = getContext2D(maskCanvas);
    maskCtx.putImageData(mask, 0, 0);
    
    const scaledMaskCanvas = createCanvas(width, height);
    const scaledMaskCtx = getContext2D(scaledMaskCanvas);
    scaledMaskCtx.imageSmoothingEnabled = true;
    scaledMaskCtx.imageSmoothingQuality = 'high';
    scaledMaskCtx.drawImage(maskCanvas, 0, 0, width, height);
    processedMask = scaledMaskCtx.getImageData(0, 0, width, height);
  }
  
  const fgCanvas = createCanvas(width, height);
  const fgCtx = getContext2D(fgCanvas);
  fgCtx.drawImage(foreground, 0, 0);
  const fgData = fgCtx.getImageData(0, 0, width, height);
  
  const colorAwareMask = colorAwareMatting(fgData, processedMask, bgColor);
  
  const erodeRadius = Math.max(2, Math.round(Math.min(width, height) / 350));
  const blurRadius = Math.max(featherRadius, Math.round(Math.min(width, height) / 100));
  
  const refinedMaskCanvas = refineMaskEdges(colorAwareMask, erodeRadius, blurRadius);
  const refinedMaskCtx = getContext2D(refinedMaskCanvas);
  const refinedMaskData = refinedMaskCtx.getImageData(0, 0, width, height);
  
  const edgeRegion = detectEdgeRegion(refinedMaskData, 4);
  
  const bgData = ctx.getImageData(0, 0, width, height);
  const resultData = ctx.createImageData(width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const i = pixelIdx * 4;
      
      let alpha = refinedMaskData.data[i + 3] / 255;
      
      alpha = alpha * alpha * (3 - 2 * alpha);
      
      let fgR = fgData.data[i];
      let fgG = fgData.data[i + 1];
      let fgB = fgData.data[i + 2];
      const bgR = bgData.data[i];
      const bgG = bgData.data[i + 1];
      const bgB = bgData.data[i + 2];
      
      const brightness = (fgR + fgG + fgB) / 3;
      const isGray = isGrayish(fgR, fgG, fgB, 30);
      const isEdge = edgeRegion[pixelIdx] === 1;
      
      if (isGray && brightness > 130 && brightness < 245 && alpha < 0.92 && alpha > 0.03) {
        alpha = alpha * 0.08;
      }
      
      if (isEdge && alpha > 0.03 && alpha < 0.97) {
        const despilled = removeColorSpill(fgR, fgG, fgB, bgColor, alpha);
        fgR = despilled.r;
        fgG = despilled.g;
        fgB = despilled.b;
        
        if (brightness < 50) {
          const boost = Math.min(0.5, (50 - brightness) / 100);
          alpha = Math.min(1, alpha + boost * (1 - alpha));
        }
        
        if (brightness > 200 && isGray) {
          alpha = alpha * 0.1;
        } else if (brightness > 180) {
          const reduce = Math.min(0.4, (brightness - 180) / 187);
          alpha = alpha * (1 - reduce);
        }
      }
      
      if (alpha < 0.08) {
        alpha = 0;
      } else if (alpha > 0.92) {
        alpha = 1;
      }
      
      resultData.data[i] = Math.round(fgR * alpha + bgR * (1 - alpha));
      resultData.data[i + 1] = Math.round(fgG * alpha + bgG * (1 - alpha));
      resultData.data[i + 2] = Math.round(fgB * alpha + bgB * (1 - alpha));
      resultData.data[i + 3] = 255;
    }
  }
  
  ctx.putImageData(resultData, 0, 0);
  
  const finalCanvas = cleanupGrayArtifacts(canvas, fgData);
  return finalCanvas;
}

export function cleanupGrayArtifacts(
  composited: HTMLCanvasElement,
  originalFg: ImageData
): HTMLCanvasElement {
  const { width, height } = composited;
  const canvas = createCanvas(width, height);
  const ctx = getContext2D(canvas);
  
  ctx.drawImage(composited, 0, 0);
  let data = ctx.getImageData(0, 0, width, height);
  
  for (let pass = 0; pass < 3; pass++) {
    const newData = new Uint8ClampedArray(data.data);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        const r = data.data[i];
        const g = data.data[i + 1];
        const b = data.data[i + 2];
        
        const origR = originalFg.data[i];
        const origG = originalFg.data[i + 1];
        const origB = originalFg.data[i + 2];
        
        const brightness = (r + g + b) / 3;
        
        if (brightness > 252) continue;
        if (brightness < 100) continue;
        
        const isCurrentGray = isGrayish(r, g, b, 25);
        const wasOrigGray = isGrayish(origR, origG, origB, 30);
        
        let whiteCount = 0;
        let darkCount = 0;
        let totalNeighbors = 0;
        const searchRadius = 4 + pass;
        
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
          for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (dx * dx + dy * dy > searchRadius * searchRadius) continue;
            
            const px = Math.min(Math.max(x + dx, 0), width - 1);
            const py = Math.min(Math.max(y + dy, 0), height - 1);
            const ni = (py * width + px) * 4;
            const nb = (data.data[ni] + data.data[ni + 1] + data.data[ni + 2]) / 3;
            totalNeighbors++;
            if (nb > 248) whiteCount++;
            if (nb < 70) darkCount++;
          }
        }
        
        const whiteRatio = whiteCount / totalNeighbors;
        const darkRatio = darkCount / totalNeighbors;
        
        if ((isCurrentGray || wasOrigGray) && brightness > 140 && brightness < 252) {
          if (whiteRatio > 0.3 && darkRatio < 0.15) {
            const distanceToWhite = 255 - brightness;
            const blendStrength = Math.min(1, (whiteRatio - 0.3) / 0.4) * 
                                  Math.min(1, (brightness - 140) / 60);
            
            newData[i] = Math.round(r + distanceToWhite * blendStrength * 0.95);
            newData[i + 1] = Math.round(g + distanceToWhite * blendStrength * 0.95);
            newData[i + 2] = Math.round(b + distanceToWhite * blendStrength * 0.95);
          }
        }
        
        if (isCurrentGray && brightness > 180 && brightness < 240 && whiteRatio > 0.5) {
          newData[i] = 255;
          newData[i + 1] = 255;
          newData[i + 2] = 255;
        }
      }
    }
    
    data = new ImageData(newData, width, height);
  }
  
  const finalData = new Uint8ClampedArray(data.data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data.data[i];
      const g = data.data[i + 1];
      const b = data.data[i + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness > 240 && brightness < 255 && isGrayish(r, g, b, 15)) {
        finalData[i] = 255;
        finalData[i + 1] = 255;
        finalData[i + 2] = 255;
      }
    }
  }
  
  ctx.putImageData(new ImageData(finalData, width, height), 0, 0);
  return canvas;
}

export function cropAndResize(
  source: HTMLCanvasElement,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  outputWidth: number,
  outputHeight: number
): HTMLCanvasElement {
  const canvas = createCanvas(outputWidth, outputHeight);
  const ctx = getContext2D(canvas);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(
    source,
    cropX, cropY, cropWidth, cropHeight,
    0, 0, outputWidth, outputHeight
  );
  
  return canvas;
}
