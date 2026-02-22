export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg',
  quality: number = 0.95
): void {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, quality);
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function scaleImageForProcessing(
  image: HTMLImageElement,
  maxSize: number
): { canvas: HTMLCanvasElement; scale: number } {
  const { naturalWidth, naturalHeight } = image;
  
  if (naturalWidth <= maxSize && naturalHeight <= maxSize) {
    const canvas = document.createElement('canvas');
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    return { canvas, scale: 1 };
  }
  
  const scale = maxSize / Math.max(naturalWidth, naturalHeight);
  const newWidth = Math.round(naturalWidth * scale);
  const newHeight = Math.round(naturalHeight * scale);
  
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, newWidth, newHeight);
  
  return { canvas, scale };
}

export function mmToPixels(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

export function inchesToPixels(inches: number, dpi: number): number {
  return Math.round(inches * dpi);
}
