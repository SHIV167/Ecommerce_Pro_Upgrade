import React, { useState } from 'react';
import { Button } from './button';
import { Label } from './label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card } from './card';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
}

export function CodeEditor({ value, onChange, label, description }: CodeEditorProps) {
  const [previewHtml, setPreviewHtml] = useState(value || '');

  const handleUpdate = () => {
    setPreviewHtml(value);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="border rounded-md p-0 overflow-hidden">
          <div className="flex flex-col">
            <div className="bg-gray-100 p-2 border-b flex items-center justify-between">
              <span className="text-xs font-mono">HTML Editor</span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleUpdate}
              >
                Update Preview
              </Button>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[250px] p-3 font-mono text-sm focus:outline-none resize-y"
              placeholder="<div>\n  <!-- Enter your HTML here -->\n</div>"
            />
          </div>
        </TabsContent>
        <TabsContent value="preview" className="border rounded-md p-4 min-h-[250px] bg-white">
          <div 
            className="prose max-w-none" 
            dangerouslySetInnerHTML={{ __html: previewHtml }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
