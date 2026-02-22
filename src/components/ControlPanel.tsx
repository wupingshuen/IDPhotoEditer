import type { Adjustments, SizePreset } from '../types';
import { SizePresets } from './SizePresets';

interface ControlPanelProps {
  adjustments: Adjustments;
  selectedPreset: SizePreset;
  onAdjustmentsChange: (adjustments: Partial<Adjustments>) => void;
  onPresetChange: (preset: SizePreset) => void;
  disabled?: boolean;
}

export function ControlPanel({
  adjustments,
  selectedPreset,
  onAdjustmentsChange,
  onPresetChange,
  disabled,
}: ControlPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Adjustments</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">Zoom</label>
              <span className="text-xs text-gray-500">
                {Math.round(adjustments.zoom * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={adjustments.zoom}
              onChange={(e) => onAdjustmentsChange({ zoom: parseFloat(e.target.value) })}
              disabled={disabled}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">Vertical Position</label>
              <span className="text-xs text-gray-500">
                {adjustments.verticalOffset > 0 ? '+' : ''}{Math.round(adjustments.verticalOffset)}px
              </span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="5"
              value={adjustments.verticalOffset}
              onChange={(e) => onAdjustmentsChange({ verticalOffset: parseFloat(e.target.value) })}
              disabled={disabled}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">Rotation Fine-tune</label>
              <span className="text-xs text-gray-500">
                {adjustments.rotation > 0 ? '+' : ''}{adjustments.rotation.toFixed(1)}°
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={adjustments.rotation}
              onChange={(e) => onAdjustmentsChange({ rotation: parseFloat(e.target.value) })}
              disabled={disabled}
              className="w-full"
            />
          </div>
          
          <button
            onClick={() => onAdjustmentsChange({ zoom: 1, verticalOffset: 0, rotation: 0 })}
            disabled={disabled}
            className="w-full px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset Adjustments
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <SizePresets
          selectedPreset={selectedPreset}
          onPresetChange={onPresetChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
