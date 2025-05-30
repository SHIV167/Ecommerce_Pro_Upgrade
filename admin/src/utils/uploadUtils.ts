interface UploadResponse {
  success: boolean;
  files: Array<{
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    storage: 'cloudinary' | 'local';
  }>;
}

export async function uploadImages(files: File[]): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch('/api/upload/images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Upload failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Upload failed');
    }

    console.log('Upload response:', data);
    return data;
  } catch (error: any) {
    console.error('Image upload error:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
}
