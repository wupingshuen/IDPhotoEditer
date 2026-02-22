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

export function applyGaussianBlur(
  imageData: ImageData,
  radius: number
): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  const kernelSize = Math.ceil(radius * 2) * 2 + 1;
  const kernel: number[] = [];
  const sigma = radius / 2;
  let sum = 0;
  
  for (let i = 0; i < kernelSize; i++) {
    const x = i - Math.floor(kernelSize / 2);
    const g = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(g);
    sum += g;
  }
  
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }
  
  const halfKernel = Math.floor(kernelSize / 2);
  const temp = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let k = -halfKernel; k <= halfKernel; k++) {
        const px = Math.min(Math.max(x + k, 0), width - 1);
        const idx = (y * width + px) * 4;
        const weight = kernel[k + halfKernel];
        
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
      }
      
      const idx = (y * width + x) * 4;
      temp[idx] = r;
      temp[idx + 1] = g;
      temp[idx + 2] = b;
      temp[idx + 3] = a;
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let k = -halfKernel; k <= halfKernel; k++) {
        const py = Math.min(Math.max(y + k, 0), height - 1);
        const idx = (py * width + x) * 4;
        const weight = kernel[k + halfKernel];
        
        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        a += temp[idx + 3] * weight;
      }
      
      const idx = (y * width + x) * 4;
      result[idx] = r;
      result[idx + 1] = g;
      result[idx + 2] = b;
      result[idx + 3] = a;
    }
  }
  
  return new ImageData(result, width, height);
}

export function compositeWithMask(
  foreground: HTMLCanvasElement | HTMLImageElement,
  mask: ImageData,
  backgroundColor: string = '#FFFFFF',
  featherRadius: number = 3
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
    scaledMaskCtx.drawImage(maskCanvas, 0, 0, width, height);
    processedMask = scaledMaskCtx.getImageData(0, 0, width, height);
  }
  
  const blurredMask = applyGaussianBlur(processedMask, featherRadius);
  
  const fgCanvas = createCanvas(width, height);
  const fgCtx = getContext2D(fgCanvas);
  fgCtx.drawImage(foreground, 0, 0);
  const fgData = fgCtx.getImageData(0, 0, width, height);
  
  const bgData = ctx.getImageData(0, 0, width, height);
  const resultData = ctx.createImageData(width, height);
  
  for (let i = 0; i < fgData.data.length; i += 4) {
    const alpha = blurredMask.data[i + 3] / 255;
    
    resultData.data[i] = fgData.data[i] * alpha + bgData.data[i] * (1 - alpha);
    resultData.data[i + 1] = fgData.data[i + 1] * alpha + bgData.data[i + 1] * (1 - alpha);
    resultData.data[i + 2] = fgData.data[i + 2] * alpha + bgData.data[i + 2] * (1 - alpha);
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
