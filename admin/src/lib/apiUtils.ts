// apiUtils.ts - Utilities for API requests

/**
 * Make an API request with options
 * @param url The URL to make the request to
 * @param options Request options
 * @returns Response object
 */
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  // Set default headers if not provided
  if (!options.headers) {
    options.headers = {
      'Content-Type': 'application/json',
    };
  }

  // Always include credentials for cookies
  options.credentials = 'include';

  // Get API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL || '';
  
  // Ensure URL starts with API URL
  const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;
  
  try {
    const response = await fetch(fullUrl, options);
    
    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * GET request helper
 * @param url The URL to make the GET request to
 * @returns Parsed JSON response
 */
export const get = async <T>(url: string): Promise<T> => {
  const response = await apiRequest(url, { method: 'GET' });
  return response.json();
};

/**
 * POST request helper
 * @param url The URL to make the POST request to
 * @param data Data to send in the request body
 * @returns Parsed JSON response
 */
export const post = async <T>(url: string, data: any): Promise<T> => {
  const response = await apiRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

/**
 * PUT request helper
 * @param url The URL to make the PUT request to
 * @param data Data to send in the request body
 * @returns Parsed JSON response
 */
export const put = async <T>(url: string, data: any): Promise<T> => {
  const response = await apiRequest(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

/**
 * DELETE request helper
 * @param url The URL to make the DELETE request to
 * @returns Parsed JSON response
 */
export const del = async <T>(url: string): Promise<T> => {
  const response = await apiRequest(url, { method: 'DELETE' });
  return response.json();
};

/**
 * Get data from an API endpoint
 * @param url The URL to fetch from
 * @returns Parsed JSON data
 */
export const getData = async (url: string) => {
  const response = await apiRequest(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  return response.json();
};

/**
 * Post data to an API endpoint
 * @param url The URL to post to
 * @param data The data to post
 * @returns Parsed JSON response
 */
export const postData = async (url: string, data: any) => {
  const response = await apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  return response.json();
};

/**
 * Put data to an API endpoint
 * @param url The URL to put to
 * @param data The data to put
 * @returns Parsed JSON response
 */
export const putData = async (url: string, data: any) => {
  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  return response.json();
};

/**
 * Delete data from an API endpoint
 * @param url The URL to delete from
 * @returns Parsed JSON response
 */
export const deleteData = async (url: string) => {
  const response = await apiRequest(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  return response.json();
};
