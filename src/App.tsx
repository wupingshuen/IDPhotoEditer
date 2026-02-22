import { useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ControlPanel } from './components/ControlPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ExportPanel } from './components/ExportPanel';
import { useImageProcessing } from './hooks/useImageProcessing';

function App() {
  const {
    originalImage,
    finalImage,
    adjustments,
    selectedPreset,
    isProcessing,
    processingStep,
    error,
    processImage,
    updateAdjustments,
    updatePreset,
    reset,
  } = useImageProcessing();

  const handleImageLoaded = useCallback((image: HTMLImageElement) => {
    processImage(image);
  }, [processImage]);

  const hasImage = originalImage !== null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                ID Photo Editor
              </h1>
              <p className="text-sm text-gray-500">
                Create professional ID photos with white background
              </p>
            </div>
            
            {hasImage && (
              <button
                onClick={reset}
                disabled={isProcessing}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!hasImage ? (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 text-center">
                Upload Your Portrait Photo
              </h2>
              <ImageUploader 
                onImageLoaded={handleImageLoaded}
                disabled={isProcessing}
              />
              
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Tips for best results:</h3>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Use a well-lit photo with your face clearly visible</li>
                  <li>• Face the camera directly with a neutral expression</li>
                  <li>• Avoid photos with busy backgrounds</li>
                  <li>• Higher resolution photos produce better results</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
                <ControlPanel
                  adjustments={adjustments}
                  selectedPreset={selectedPreset}
                  onAdjustmentsChange={updateAdjustments}
                  onPresetChange={updatePreset}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-sm font-medium text-gray-700 mb-4">Preview</h2>
                <PreviewPanel
                  finalImage={finalImage}
                  selectedPreset={selectedPreset}
                  isProcessing={isProcessing}
                  processingStep={processingStep}
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
                <ExportPanel
                  finalImage={finalImage}
                  disabled={isProcessing || !finalImage}
                />
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Upload New Photo
                  </h3>
                  <ImageUploader
                    onImageLoaded={handleImageLoaded}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-xs text-gray-500 text-center">
            All processing is done locally in your browser. No images are uploaded to any server.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
