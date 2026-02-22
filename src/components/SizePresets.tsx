import { useState, useCallback } from 'react';
import type { SizePreset } from '../types';
import { SIZE_PRESETS } from '../types';
import { mmToPixels, inchesToPixels } from '../utils/imageUtils';

interface SizePresetsProps {
  selectedPreset: SizePreset;
  onPresetChange: (preset: SizePreset) => void;
  disabled?: boolean;
}

export function SizePresets({ selectedPreset, onPresetChange, disabled }: SizePresetsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState('35');
  const [customHeight, setCustomHeight] = useState('45');
  const [customDpi, setCustomDpi] = useState('300');
  const [customUnit, setCustomUnit] = useState<'mm' | 'inches'>('mm');

  const handlePresetSelect = useCallback((preset: SizePreset) => {
    setShowCustom(false);
    onPresetChange(preset);
  }, [onPresetChange]);

  const handleCustomApply = useCallback(() => {
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    const dpi = parseInt(customDpi, 10);
    
    if (isNaN(width) || isNaN(height) || isNaN(dpi)) return;
    if (width <= 0 || height <= 0 || dpi <= 0) return;
    
    const widthPx = customUnit === 'mm' 
      ? mmToPixels(width, dpi)
      : inchesToPixels(width, dpi);
    const heightPx = customUnit === 'mm'
      ? mmToPixels(height, dpi)
      : inchesToPixels(height, dpi);
    
    const customPreset: SizePreset = {
      name: `Custom (${width}x${height} ${customUnit})`,
      width,
      height,
      dpi,
      widthPx,
      heightPx,
    };
    
    onPresetChange(customPreset);
  }, [customWidth, customHeight, customDpi, customUnit, onPresetChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Photo Size
      </label>
      
      <div className="space-y-2">
        {SIZE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetSelect(preset)}
            disabled={disabled}
            className={`
              w-full px-3 py-2 text-left text-sm rounded-lg border transition-all
              ${selectedPreset.name === preset.name && !showCustom
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="font-medium">{preset.name}</div>
            <div className="text-xs text-gray-500">
              {preset.widthPx} × {preset.heightPx} px @ {preset.dpi} DPI
            </div>
          </button>
        ))}
        
        <button
          onClick={() => setShowCustom(!showCustom)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-left text-sm rounded-lg border transition-all
            ${showCustom
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="font-medium">Custom Size</div>
          <div className="text-xs text-gray-500">Enter your own dimensions</div>
        </button>
      </div>
      
      {showCustom && (
        <div className="p-3 bg-gray-50 rounded-lg space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setCustomUnit('mm')}
              className={`
                flex-1 px-2 py-1 text-xs rounded transition-all
                ${customUnit === 'mm'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 hover:bg-gray-100'
                }
              `}
            >
              Millimeters
            </button>
            <button
              onClick={() => setCustomUnit('inches')}
              className={`
                flex-1 px-2 py-1 text-xs rounded transition-all
                ${customUnit === 'inches'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 hover:bg-gray-100'
                }
              `}
            >
              Inches
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                min="1"
                step="0.1"
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                min="1"
                step="0.1"
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">DPI</label>
            <input
              type="number"
              value={customDpi}
              onChange={(e) => setCustomDpi(e.target.value)}
              min="72"
              max="600"
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleCustomApply}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Custom Size
          </button>
          
          {selectedPreset.name.startsWith('Custom') && (
            <div className="text-xs text-gray-500 text-center">
              Output: {selectedPreset.widthPx} × {selectedPreset.heightPx} px
            </div>
          )}
        </div>
      )}
    </div>
  );
}
