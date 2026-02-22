import type { FaceData } from '../types';

const LEFT_EYE_INDICES = [33, 133, 160, 159, 158, 144, 145, 153];
const RIGHT_EYE_INDICES = [362, 263, 387, 386, 385, 373, 374, 380];
const FACE_OVAL_INDICES = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

export function calculateEyeCenter(
  landmarks: Array<{ x: number; y: number; z: number }>,
  indices: number[],
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  let sumX = 0;
  let sumY = 0;
  
  for (const idx of indices) {
    sumX += landmarks[idx].x * imageWidth;
    sumY += landmarks[idx].y * imageHeight;
  }
  
  return {
    x: sumX / indices.length,
    y: sumY / indices.length,
  };
}

export function extractFaceData(
  landmarks: Array<{ x: number; y: number; z: number }>,
  imageWidth: number,
  imageHeight: number
): FaceData {
  const leftEye = calculateEyeCenter(landmarks, LEFT_EYE_INDICES, imageWidth, imageHeight);
  const rightEye = calculateEyeCenter(landmarks, RIGHT_EYE_INDICES, imageWidth, imageHeight);
  
  const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const idx of FACE_OVAL_INDICES) {
    const x = landmarks[idx].x * imageWidth;
    const y = landmarks[idx].y * imageHeight;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  
  const padding = 0.15;
  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  
  minX -= faceWidth * padding;
  minY -= faceHeight * padding;
  maxX += faceWidth * padding;
  maxY += faceHeight * padding;
  
  return {
    boundingBox: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    leftEye,
    rightEye,
    eyeAngle,
    faceCenter: {
      x: (leftEye.x + rightEye.x) / 2,
      y: (minY + maxY) / 2,
    },
    landmarks,
  };
}

export function calculateIdPhotoCrop(
  faceData: FaceData,
  imageWidth: number,
  imageHeight: number,
  targetAspectRatio: number,
  headToFrameRatio: number = 0.6
): { x: number; y: number; width: number; height: number } {
  const { boundingBox, faceCenter } = faceData;
  
  const headHeight = boundingBox.height;
  const frameHeight = headHeight / headToFrameRatio;
  const frameWidth = frameHeight * targetAspectRatio;
  
  const topPadding = headHeight * 0.35;
  const frameTop = boundingBox.y - topPadding;
  const frameCenterX = faceCenter.x;
  
  let cropX = frameCenterX - frameWidth / 2;
  let cropY = frameTop;
  let cropWidth = frameWidth;
  let cropHeight = frameHeight;
  
  if (cropX < 0) {
    cropX = 0;
  }
  if (cropX + cropWidth > imageWidth) {
    cropX = imageWidth - cropWidth;
  }
  if (cropY < 0) {
    cropY = 0;
  }
  if (cropY + cropHeight > imageHeight) {
    cropY = imageHeight - cropHeight;
  }
  
  if (cropWidth > imageWidth) {
    const scale = imageWidth / cropWidth;
    cropWidth = imageWidth;
    cropHeight *= scale;
    cropX = 0;
  }
  if (cropHeight > imageHeight) {
    const scale = imageHeight / cropHeight;
    cropHeight = imageHeight;
    cropWidth *= scale;
    cropX = (imageWidth - cropWidth) / 2;
    cropY = 0;
  }
  
  return {
    x: Math.max(0, cropX),
    y: Math.max(0, cropY),
    width: cropWidth,
    height: cropHeight,
  };
}

export function applyAdjustmentsToCrop(
  baseCrop: { x: number; y: number; width: number; height: number },
  zoom: number,
  verticalOffset: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const centerX = baseCrop.x + baseCrop.width / 2;
  const centerY = baseCrop.y + baseCrop.height / 2;
  
  const newWidth = baseCrop.width / zoom;
  const newHeight = baseCrop.height / zoom;
  
  let newX = centerX - newWidth / 2;
  let newY = centerY - newHeight / 2 + verticalOffset;
  
  newX = Math.max(0, Math.min(imageWidth - newWidth, newX));
  newY = Math.max(0, Math.min(imageHeight - newHeight, newY));
  
  return {
    x: newX,
    y: newY,
    width: Math.min(newWidth, imageWidth),
    height: Math.min(newHeight, imageHeight),
  };
}
