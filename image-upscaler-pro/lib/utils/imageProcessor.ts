/**
 * 이미지 처리 유틸리티 함수들
 */

/**
 * 이미지를 압축합니다
 */
export async function compressImage(
  imageBlob: Blob,
  quality: number,
  targetSizeKB?: number | null
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // 타겟 크기가 지정된 경우 이진 탐색으로 품질 조정
      if (targetSizeKB && targetSizeKB > 0) {
        let minQuality = 0.01;
        let maxQuality = 1.0;
        let bestBlob: Blob | null = null;
        const targetSizeBytes = targetSizeKB * 1024;

        // 이진 탐색으로 최적 품질 찾기
        for (let i = 0; i < 20; i++) {
          const testQuality = (minQuality + maxQuality) / 2;
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/jpeg', testQuality);
          });

          if (!blob) {
            maxQuality = testQuality;
            continue;
          }

          if (blob.size <= targetSizeBytes) {
            bestBlob = blob;
            minQuality = testQuality;
            if (Math.abs(blob.size - targetSizeBytes) / targetSizeBytes < 0.05) {
              break; // 5% 이내 오차면 충분
            }
          } else {
            maxQuality = testQuality;
          }
        }

        if (bestBlob) {
          resolve(bestBlob);
          return;
        }
      }

      // 일반 압축
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 압축 실패'));
          }
        },
        'image/jpeg',
        quality / 100
      );
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * 이미지 포맷을 변환합니다
 */
export async function convertImage(
  imageBlob: Blob,
  outputFormat: string,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 변환 실패'));
          }
        },
        outputFormat,
        quality
      );
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * 이미지를 회전합니다
 */
export async function rotateImage(
  imageBlob: Blob,
  degrees: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다'));
        return;
      }

      // 회전 각도에 따라 캔버스 크기 조정
      const rad = (degrees * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 회전 실패'));
          }
        },
        imageBlob.type || 'image/png',
        0.95
      );
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * 이미지를 크롭합니다
 */
export async function cropImage(
  imageBlob: Blob,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다'));
        return;
      }
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 크롭 실패'));
          }
        },
        imageBlob.type || 'image/png',
        0.95
      );
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * 이미지 크기를 조절합니다
 */
export async function resizeImage(
  imageBlob: Blob,
  width: number,
  height: number,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다'));
        return;
      }
      
      // 고품질 리사이징을 위한 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 리사이즈 실패'));
          }
        },
        imageBlob.type || 'image/png',
        quality
      );
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * 이미지를 다운로드합니다
 */
export function downloadImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Blob을 Data URL로 변환합니다
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
