/**
 * Cloudinary image upload utility for Cafe Lina / Yeserahut Web App.
 * Uses environment variables VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.
 * Falls back to local base64 data URLs if Cloudinary is not configured in development.
 */

export interface CloudinaryUploadResponse {
  secure_url?: string;
  url?: string;
  error?: {
    message: string;
  };
}

export async function uploadImageToCloudinary(file: File | Blob): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // If Cloudinary credentials are provided, perform real API upload
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Cloudinary upload failed with status ${response.status}`);
      }

      const data: CloudinaryUploadResponse = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
      if (data.url) {
        return data.url;
      }
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to local encoding:', error);
    }
  }

  // Fallback to Base64 Data URL for offline / local preview mode
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file data'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
