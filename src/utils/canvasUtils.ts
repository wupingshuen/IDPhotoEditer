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

export function refineMaskEdges(
  maskData: ImageData,
  erodeRadius: number = 1,
  blurRadius: number = 8
): HTMLCanvasElement {
  const { width, height } = maskData;
  
  const erodedMask = erodeMask(maskData, erodeRadius);
  
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
  
  const erodeRadius = Math.max(1, Math.round(Math.min(width, height) / 500));
  const blurRadius = Math.max(featherRadius, Math.round(Math.min(width, height) / 150));
  
  const refinedMaskCanvas = refineMaskEdges(processedMask, erodeRadius, blurRadius);
  const refinedMaskCtx = getContext2D(refinedMaskCanvas);
  const refinedMaskData = refinedMaskCtx.getImageData(0, 0, width, height);
  
  const fgCanvas = createCanvas(width, height);
  const fgCtx = getContext2D(fgCanvas);
  fgCtx.drawImage(foreground, 0, 0);
  const fgData = fgCtx.getImageData(0, 0, width, height);
  
  const bgData = ctx.getImageData(0, 0, width, height);
  const resultData = ctx.createImageData(width, height);
  
  for (let i = 0; i < fgData.data.length; i += 4) {
    let alpha = refinedMaskData.data[i + 3] / 255;
    
    alpha = alpha * alpha * (3 - 2 * alpha);
    
    const fgR = fgData.data[i];
    const fgG = fgData.data[i + 1];
    const fgB = fgData.data[i + 2];
    const bgR = bgData.data[i];
    const bgG = bgData.data[i + 1];
    const bgB = bgData.data[i + 2];
    
    if (alpha > 0.02 && alpha < 0.98) {
      const edgeBrightness = (fgR + fgG + fgB) / 3;
      
      if (edgeBrightness < 100) {
        const darkenFactor = 1 - (alpha * 0.3 * (1 - edgeBrightness / 100));
        resultData.data[i] = fgR * alpha * darkenFactor + bgR * (1 - alpha);
        resultData.data[i + 1] = fgG * alpha * darkenFactor + bgG * (1 - alpha);
        resultData.data[i + 2] = fgB * alpha * darkenFactor + bgB * (1 - alpha);
      } else {
        resultData.data[i] = fgR * alpha + bgR * (1 - alpha);
        resultData.data[i + 1] = fgG * alpha + bgG * (1 - alpha);
        resultData.data[i + 2] = fgB * alpha + bgB * (1 - alpha);
      }
    } else {
      resultData.data[i] = fgR * alpha + bgR * (1 - alpha);
      resultData.data[i + 1] = fgG * alpha + bgG * (1 - alpha);
      resultData.data[i + 2] = fgB * alpha + bgB * (1 - alpha);
    }
    resultData.data[i + 3] = 255;
  }
  
  ctx.putImageData(resultData, 0, 0);
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
