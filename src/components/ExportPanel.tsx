import { useState, useCallback } from 'react';
import type { ExportSettings } from '../types';
import { downloadCanvas } from '../utils/imageUtils';

interface ExportPanelProps {
  finalImage: HTMLCanvasElement | null;
  disabled?: boolean;
}

export function ExportPanel({ finalImage, disabled }: ExportPanelProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'jpeg',
    quality: 0.95,
  });

  const handleDownload = useCallback(() => {
    if (!finalImage) return;
    
    const filename = `id-photo-${Date.now()}`;
    downloadCanvas(finalImage, filename, settings.format, settings.quality);
  }, [finalImage, settings]);

  const canExport = finalImage && !disabled;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Export</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Format</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSettings(s => ({ ...s, format: 'jpeg' }))}
              disabled={disabled}
              className={`
                flex-1 px-3 py-2 text-sm rounded-lg transition-all
                ${settings.format === 'jpeg'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              JPEG
            </button>
            <button
              onClick={() => setSettings(s => ({ ...s, format: 'png' }))}
              disabled={disabled}
              className={`
                flex-1 px-3 py-2 text-sm rounded-lg transition-all
                ${settings.format === 'png'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              PNG
            </button>
          </div>
        </div>
        
        {settings.format === 'jpeg' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">Quality</label>
              <span className="text-xs text-gray-500">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={settings.quality}
              onChange={(e) => setSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
              disabled={disabled}
              className="w-full"
            />
          </div>
        )}
        
        <button
          onClick={handleDownload}
          disabled={!canExport}
          className={`
            w-full px-4 py-3 text-sm font-medium rounded-lg transition-all
            ${canExport
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {settings.format === 'png' ? 'Download PNG (Lossless)' : 'Download JPEG'}
        </button>
      </div>
      
      {finalImage && (
        <div className="text-xs text-gray-500 text-center">
          {settings.format === 'png' 
            ? 'PNG provides lossless quality, larger file size'
            : 'JPEG is smaller but slightly compressed'
          }
        </div>
      )}
    </div>
  );
}
