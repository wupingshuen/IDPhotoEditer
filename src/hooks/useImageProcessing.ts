import { useState, useCallback, useEffect } from 'react';
import type { FaceData, Adjustments, SizePreset } from '../types';
import { SIZE_PRESETS } from '../types';
import { useFaceDetection } from './useFaceDetection';
import { useBackgroundRemoval } from './useBackgroundRemoval';
import {
  rotateCanvas,
  compositeWithMask,
  cropAndResize,
  createCanvas,
  getContext2D,
} from '../utils/canvasUtils';
import {
  calculateIdPhotoCrop,
  applyAdjustmentsToCrop,
} from '../utils/faceUtils';

export interface ProcessingResult {
  preview: HTMLCanvasElement | null;
  faceData: FaceData | null;
}

export function useImageProcessing() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [compositeImage, setCompositeImage] = useState<HTMLCanvasElement | null>(null);
  const [finalImage, setFinalImage] = useState<HTMLCanvasElement | null>(null);
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [baseCrop, setBaseCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const [adjustments, setAdjustments] = useState<Adjustments>({
    zoom: 1,
    verticalOffset: 0,
    rotation: 0,
  });
  
  const [selectedPreset, setSelectedPreset] = useState<SizePreset>(SIZE_PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { detectFace, error: faceError } = useFaceDetection();
  const { removeBackground, error: bgError } = useBackgroundRemoval();

  const processImage = useCallback(async (image: HTMLImageElement) => {
    setIsProcessing(true);
    setError(null);
    setOriginalImage(image);
    
    try {
      setProcessingStep('Detecting face...');
      const detected = await detectFace(image);
      
      if (!detected) {
        setError('No face detected. Please upload a clear portrait photo.');
        setIsProcessing(false);
        return;
      }
      
      setFaceData(detected);
      
      setProcessingStep('Auto-rotating image...');
      const rotationAngle = -detected.eyeAngle;
      let processedImage: HTMLCanvasElement;
      
      if (Math.abs(rotationAngle) > 0.5) {
        processedImage = rotateCanvas(image, rotationAngle);
      } else {
        processedImage = createCanvas(image.naturalWidth, image.naturalHeight);
        const ctx = getContext2D(processedImage);
        ctx.drawImage(image, 0, 0);
      }
      
      setProcessingStep('Removing background...');
      const tempImg = new Image();
      tempImg.src = processedImage.toDataURL();
      
      await new Promise<void>((resolve) => {
        tempImg.onload = () => resolve();
      });
      
      const mask = await removeBackground(tempImg);
      
      if (!mask) {
        setError('Failed to remove background. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      setProcessingStep('Compositing...');
      const composite = compositeWithMask(processedImage, mask, '#FFFFFF', 3);
      setCompositeImage(composite);
      
      setProcessingStep('Calculating crop...');
      const targetAspectRatio = selectedPreset.widthPx / selectedPreset.heightPx;
      
      let adjustedFaceData = detected;
      if (Math.abs(rotationAngle) > 0.5) {
        const newDetected = await detectFace(tempImg);
        if (newDetected) {
          adjustedFaceData = newDetected;
          setFaceData(newDetected);
        }
      }
      
      const crop = calculateIdPhotoCrop(
        adjustedFaceData,
        composite.width,
        composite.height,
        targetAspectRatio,
        0.6
      );
      
      setBaseCrop(crop);
      
      const final = cropAndResize(
        composite,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        selectedPreset.widthPx,
        selectedPreset.heightPx
      );
      
      setFinalImage(final);
      setProcessingStep('');
      setIsProcessing(false);
      
    } catch (err) {
      setError('An error occurred during processing. Please try again.');
      setIsProcessing(false);
    }
  }, [detectFace, removeBackground, selectedPreset]);

  const updateAdjustments = useCallback((newAdjustments: Partial<Adjustments>) => {
    setAdjustments(prev => ({ ...prev, ...newAdjustments }));
  }, []);

  useEffect(() => {
    if (!compositeImage || !baseCrop || !selectedPreset) return;
    
    let imageToProcess = compositeImage;
    
    if (Math.abs(adjustments.rotation) > 0.1) {
      imageToProcess = rotateCanvas(compositeImage, adjustments.rotation);
    }
    
    const adjustedCrop = applyAdjustmentsToCrop(
      baseCrop,
      adjustments.zoom,
      adjustments.verticalOffset,
      imageToProcess.width,
      imageToProcess.height
    );
    
    const final = cropAndResize(
      imageToProcess,
      adjustedCrop.x,
      adjustedCrop.y,
      adjustedCrop.width,
      adjustedCrop.height,
      selectedPreset.widthPx,
      selectedPreset.heightPx
    );
    
    setFinalImage(final);
  }, [compositeImage, baseCrop, adjustments, selectedPreset]);

  const updatePreset = useCallback((preset: SizePreset) => {
    setSelectedPreset(preset);
    
    if (compositeImage && faceData) {
      const targetAspectRatio = preset.widthPx / preset.heightPx;
      const crop = calculateIdPhotoCrop(
        faceData,
        compositeImage.width,
        compositeImage.height,
        targetAspectRatio,
        0.6
      );
      setBaseCrop(crop);
    }
  }, [compositeImage, faceData]);

  const reset = useCallback(() => {
    setOriginalImage(null);
    setCompositeImage(null);
    setFinalImage(null);
    setFaceData(null);
    setBaseCrop(null);
    setAdjustments({ zoom: 1, verticalOffset: 0, rotation: 0 });
    setError(null);
  }, []);

  return {
    originalImage,
    finalImage,
    faceData,
    adjustments,
    selectedPreset,
    isProcessing,
    processingStep,
    error: error || faceError || bgError,
    processImage,
    updateAdjustments,
    updatePreset,
    reset,
  };
}
