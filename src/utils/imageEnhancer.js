/**
 * Thermal Receipt Image Enhancer using offscreen HTML Canvas
 * Rescues faded, smudged thermal paper printouts before OCR
 */

export async function enhanceReceiptImage(fileOrDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 2048;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Apply thermal optimization filter
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(105%)';
        ctx.drawImage(img, 0, 0, width, height);

        const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64 = enhancedDataUrl.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        resolve({
          dataUrl: enhancedDataUrl,
          base64,
          mimeType: 'image/jpeg',
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(new Error('Failed to load receipt image: ' + err));

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      reject(new Error('Invalid image input format'));
    }
  });
}
