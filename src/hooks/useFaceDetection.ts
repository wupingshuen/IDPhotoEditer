import { useCallback, useRef, useState, useEffect } from 'react';
import type { FaceData } from '../types';
import { extractFaceData } from '../utils/faceUtils';

declare global {
  interface Window {
    FaceMesh: any;
  }
}

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

export function useFaceDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const faceMeshRef = useRef<any>(null);

  useEffect(() => {
    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js')
      .then(() => {
        setIsReady(true);
      })
      .catch(() => {
        setError('Failed to load face detection library');
      });
  }, []);

  const initFaceMesh = useCallback(async () => {
    if (faceMeshRef.current) return faceMeshRef.current;
    
    if (!window.FaceMesh) {
      throw new Error('FaceMesh not loaded');
    }

    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    await faceMesh.initialize();
    faceMeshRef.current = faceMesh;
    return faceMesh;
  }, []);

  const detectFace = useCallback(
    async (image: HTMLImageElement): Promise<FaceData | null> => {
      if (!isReady) {
        setError('Face detection not ready yet');
        return null;
      }
      
      setIsLoading(true);
      setError(null);

      try {
        const faceMesh = await initFaceMesh();
        
        return new Promise((resolve, reject) => {
          const handleResults = (results: any) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              const landmarks = results.multiFaceLandmarks[0];
              const faceData = extractFaceData(
                landmarks,
                image.naturalWidth,
                image.naturalHeight
              );
              setIsLoading(false);
              resolve(faceData);
            } else {
              setIsLoading(false);
              setError('No face detected in the image');
              resolve(null);
            }
          };

          faceMesh.onResults(handleResults);
          
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(image, 0, 0);
          
          faceMesh.send({ image: canvas }).catch((err: Error) => {
            setIsLoading(false);
            setError('Face detection failed');
            reject(err);
          });
        });
      } catch (err) {
        setIsLoading(false);
        setError('Failed to initialize face detection');
        return null;
      }
    },
    [initFaceMesh, isReady]
  );

  return { detectFace, isLoading, error, isReady };
}
