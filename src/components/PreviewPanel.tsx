import { useEffect, useRef } from 'react';
import type { SizePreset } from '../types';

interface PreviewPanelProps {
  finalImage: HTMLCanvasElement | null;
  selectedPreset: SizePreset;
  isProcessing: boolean;
  processingStep: string;
}

export function PreviewPanel({
  finalImage,
  selectedPreset,
  isProcessing,
  processingStep,
}: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !finalImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = finalImage.width;
    canvas.height = finalImage.height;
    ctx.drawImage(finalImage, 0, 0);
  }, [finalImage]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
        <p className="text-sm text-gray-600">{processingStep || 'Processing...'}</p>
      </div>
    );
  }

  if (!finalImage) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-500">Upload a photo to see preview</p>
      </div>
    );
  }

  const maxPreviewHeight = 500;
  const aspectRatio = selectedPreset.widthPx / selectedPreset.heightPx;
  const previewHeight = Math.min(maxPreviewHeight, selectedPreset.heightPx);
  const previewWidth = previewHeight * aspectRatio;

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative bg-gray-100 rounded-lg overflow-hidden shadow-lg"
        style={{ 
          width: previewWidth,
          height: previewHeight,
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
        
        <div className="absolute inset-0 pointer-events-none border border-gray-200 rounded-lg"></div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-700">
          {selectedPreset.name}
        </p>
        <p className="text-xs text-gray-500">
          {selectedPreset.widthPx} × {selectedPreset.heightPx} px @ {selectedPreset.dpi} DPI
        </p>
      </div>
    </div>
  );
}
