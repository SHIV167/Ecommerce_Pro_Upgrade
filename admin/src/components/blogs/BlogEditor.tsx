import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

// TinyMCE editor configuration options
const editorConfig = {
  height: 500,
  menubar: true,
  branding: false,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
    'emoticons', 'template', 'paste', 'hr', 'pagebreak', 'nonbreaking',
    'textpattern', 'imagetools', 'quickbars', 'codesample'
  ],
  toolbar: [
    'undo redo | styles | bold italic underline forecolor backcolor | alignleft aligncenter alignright | bullist numlist outdent indent',
    'image media link codesample table | hr pagebreak nonbreaking | removeformat | help'
  ],
  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; max-width:900px; margin:0 auto; padding:20px; }',
  image_title: true,
  automatic_uploads: true,
  file_picker_types: 'image',
  promotion: false,
  resize: true,
  templates: [
    { title: 'Product Review Template', description: 'Template for product reviews', content: '<h2>Product Name</h2><p>Introduction about the product...</p><h3>Features</h3><ul><li>Feature 1</li><li>Feature 2</li></ul><h3>Pros</h3><ul><li>Pro 1</li><li>Pro 2</li></ul><h3>Cons</h3><ul><li>Con 1</li><li>Con 2</li></ul><h3>Verdict</h3><p>Summary and final thoughts...</p>' },
    { title: 'How-To Guide Template', description: 'Step-by-step guide template', content: '<h2>How to [Task Name]</h2><p>Introduction paragraph...</p><h3>What You\'ll Need</h3><ul><li>Item 1</li><li>Item 2</li></ul><h3>Step 1: [First Step]</h3><p>Instructions for first step...</p><h3>Step 2: [Second Step]</h3><p>Instructions for second step...</p><h3>Tips and Tricks</h3><ul><li>Tip 1</li><li>Tip 2</li></ul>' }
  ],
  // Enhanced file picker that uploads to server instead of using blob URLs
  file_picker_callback: function (
    cb: (url: string, meta?: { title: string }) => void, 
    value: string, 
    meta: { filetype: string }
  ) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.onchange = async function () {
      const file = (this as HTMLInputElement).files?.[0];
      if (!file) return;

      // Create unique ID outside try block so it's available in the catch block too
      const uniqueId = 'img-' + Date.now();
      
      try {
        // Use FormData to prepare the file for upload
        const formData = new FormData();
        formData.append('image', file);

        // Create a loading indicator in the editor
        const loadingImage = `<p id="${uniqueId}">Uploading image, please wait...</p>`;
        
        // Insert temporary loading indicator
        (window as any).tinymce.activeEditor.insertContent(loadingImage);

        // Upload the image to your server's upload endpoint
        const response = await fetch('/api/uploads/images', {
          method: 'POST',
          body: formData,
          // No need to set Content-Type - fetch sets it with boundary for FormData
        });

        if (!response.ok) {
          throw new Error('Upload failed: ' + response.statusText);
        }

        const data = await response.json();
        
        // Replace the loading indicator with the actual image
        const imageUrl = data.url; // Adjust based on your server's response format
        
        // Remove the loading indicator
        const loadingElement = (window as any).tinymce.activeEditor.dom.get(uniqueId);
        if (loadingElement) {
          loadingElement.remove();
        }
        
        // Call callback with the URL from the server
        cb(imageUrl, { title: file.name });
      } catch (error) {
        console.error('Image upload error:', error);
        // Handle error (remove loading indicator, show error message)
        const loadingElement = (window as any).tinymce.activeEditor.dom.get(uniqueId);
        if (loadingElement) {
          loadingElement.innerHTML = 'Error uploading image. Please try again.';
        }
        
        // Fallback to blob URL if server upload fails
        const reader = new FileReader();
        reader.onload = function () {
          const blobUrl = URL.createObjectURL(file);
          cb(blobUrl, { title: file.name + ' (local only)' });
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  }
};

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ content, onChange }) => {
  // Get API key from environment variable or use from the .env file
  // Replace 'your-api-key-here' with your actual TinyMCE API key
    // Get the TinyMCE API key from Vite environment variables
    // For local development, add VITE_TINYMCE_API_KEY to your .env file
    // For production, set it in your environment or deployment platform
    const apiKey = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
  
  return (
    <div className="border border-input rounded-md mt-1.5">
      <Editor
        apiKey={apiKey}
        init={editorConfig}
        value={content}
        onEditorChange={(newContent: string) => onChange(newContent)}
      />
    </div>
  );
};

export default BlogEditor;
