import { useCallback, useRef, useState, useEffect } from 'react';
import { createCanvas, getContext2D } from '../utils/canvasUtils';
import { scaleImageForProcessing } from '../utils/imageUtils';

declare global {
  interface Window {
    SelfieSegmentation: any;
  }
}

const MAX_PROCESSING_SIZE = 1024;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function useBackgroundRemoval() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const segmentationRef = useRef<any>(null);

  useEffect(() => {
    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js')
      .then(() => {
        setIsReady(true);
      })
      .catch(() => {
        setError('Failed to load segmentation library');
      });
  }, []);

  const initSegmentation = useCallback(async () => {
    if (segmentationRef.current) return segmentationRef.current;
    
    if (!window.SelfieSegmentation) {
      throw new Error('SelfieSegmentation not loaded');
    }

    const segmentation = new window.SelfieSegmentation({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });

    segmentation.setOptions({
      modelSelection: 1,
      selfieMode: false,
    });

    await segmentation.initialize();
    segmentationRef.current = segmentation;
    return segmentation;
  }, []);

  const removeBackground = useCallback(
    async (image: HTMLImageElement): Promise<ImageData | null> => {
      if (!isReady) {
        setError('Segmentation not ready yet');
        return null;
      }
      
      setIsLoading(true);
      setError(null);

      try {
        const segmentation = await initSegmentation();
        const { canvas: scaledCanvas, scale } = scaleImageForProcessing(
          image,
          MAX_PROCESSING_SIZE
        );

        return new Promise((resolve, reject) => {
          const handleResults = (results: any) => {
            try {
              const maskCanvas = createCanvas(
                scaledCanvas.width,
                scaledCanvas.height
              );
              const maskCtx = getContext2D(maskCanvas);
              
              maskCtx.drawImage(results.segmentationMask, 0, 0);
              
              const fullSizeMask = createCanvas(
                image.naturalWidth,
                image.naturalHeight
              );
              const fullSizeCtx = getContext2D(fullSizeMask);
              
              if (scale !== 1) {
                fullSizeCtx.drawImage(
                  maskCanvas,
                  0,
                  0,
                  image.naturalWidth,
                  image.naturalHeight
                );
              } else {
                fullSizeCtx.drawImage(maskCanvas, 0, 0);
              }
              
              const fullMaskData = fullSizeCtx.getImageData(
                0,
                0,
                image.naturalWidth,
                image.naturalHeight
              );
              
              const alphaMask = new ImageData(
                image.naturalWidth,
                image.naturalHeight
              );
              
              for (let i = 0; i < fullMaskData.data.length; i += 4) {
                const maskValue = fullMaskData.data[i];
                alphaMask.data[i] = 255;
                alphaMask.data[i + 1] = 255;
                alphaMask.data[i + 2] = 255;
                alphaMask.data[i + 3] = maskValue;
              }

              setIsLoading(false);
              resolve(alphaMask);
            } catch (err) {
              setIsLoading(false);
              setError('Failed to process segmentation mask');
              reject(err);
            }
          };

          segmentation.onResults(handleResults);
          
          segmentation.send({ image: scaledCanvas }).catch((err: Error) => {
            setIsLoading(false);
            setError('Segmentation failed');
            reject(err);
          });
        });
      } catch (err) {
        setIsLoading(false);
        setError('Failed to initialize segmentation');
        return null;
      }
    },
    [initSegmentation, isReady]
  );

  return { removeBackground, isLoading, error, isReady };
}
