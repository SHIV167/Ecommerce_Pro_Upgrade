export async function handleApiResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    throw new Error(`Server returned non-JSON response: ${contentType}`);
  }

  try {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error: any) {
    console.error('API Response Error:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      error: error.message
    });
    throw new Error('Failed to parse server response');
  }
}

export async function uploadImages(files: File[]) {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    return handleApiResponse(response);
  } catch (error: any) {
    console.error('Image Upload Error:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
}

export async function updateProduct(productId: string, data: any) {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleApiResponse(response);
  } catch (error: any) {
    console.error('Product Update Error:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }
}
