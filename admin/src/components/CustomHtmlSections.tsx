import React, { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { CodeEditor } from './ui/code-editor';
import { Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

export interface CustomHtmlSection {
  id: string;
  title: string;
  content: string;
  displayOrder: number;
  enabled: boolean;
}

interface CustomHtmlSectionsProps {
  sections: CustomHtmlSection[];
  onChange: (sections: CustomHtmlSection[]) => void;
}

const defaultTemplates: CustomHtmlSection[] = [
  {
    id: 'clinically-tested',
    title: 'Clinically Tested To',
    content: `<div>
  <h3 class="text-xl font-medium mb-4">Clinically Tested To</h3>
  <ul class="list-disc pl-5 space-y-2">
    <li>Clinically Tested To Protect From UVA & UVB rays</li>
    <li>Based on clinical trials conducted over 30 days!</li>
  </ul>
  
  <h3 class="text-xl font-medium mt-8 mb-4">Natural Sunscreen Top Ingredients</h3>
  <p class="mb-4">A light organic sunscreen containing natural origin UV protection minerals such as <strong>Titanium Dioxide</strong> and <strong>Zinc Dioxide</strong> which protect the sun rays back from exposed skin. <strong>Natural Glycerine</strong> and <strong>Olive Oil</strong> condition skin without making it greasy. Nourishing <strong>Shea Butter</strong> protects, hydrates, repairs blemishes and other signs of sun damage. <strong>Pure essential oils</strong> - <strong>Nutmeg, Ginger and Lime</strong> have the anti-aging and fruity aromas.</p>
  
  <div class="border border-gray-200 p-4 my-6 bg-gray-50">
    <blockquote class="italic text-center">
      Did you know that Natural Sun Protection contains the natural mineral Zinc Oxide known as Yasad Bhsma, which protects from both UVA & UVB rays?
    </blockquote>
  </div>
</div>`,
    displayOrder: 0,
    enabled: false
  },
  {
    id: 'ingredients-list',
    title: 'Ingredients List',
    content: `<div>
  <h3 class="text-xl font-medium mb-4">Ingredients List</h3>
  <p class="mb-4">Purified Water, Elaeis Guineensis (Olive) Oil, Glycerin, Zinc Oxide & Titanium Dioxide (Natural Sun protection minerals), Cera Alba (Beeswax), Butyrospermum Parkii (Shea) Butter, Theobroma Cacao (Cocoa) Seed Butter, Xanthan Gum, Syzygium Aromaticum (Clove) Bud Oil, Citrus Aurantium Bergamia (Bergamot) Fruit Oil, Cetyl Alcohol.</p>
</div>`,
    displayOrder: 1,
    enabled: false
  }
];

export const CustomHtmlSections: React.FC<CustomHtmlSectionsProps> = ({ 
  sections = [], 
  onChange 
}) => {
  // Initialize with provided sections or default templates if empty
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(
    sections.length > 0 ? 0 : -1
  );

  const addNewSection = () => {
    const newSection: CustomHtmlSection = {
      id: nanoid(8),
      title: 'New Section',
      content: '<div>\n  <!-- Content goes here -->\n</div>',
      displayOrder: sections.length,
      enabled: false
    };
    
    onChange([...sections, newSection]);
    setActiveSectionIndex(sections.length);
  };

  const addTemplateSection = (template: CustomHtmlSection) => {
    // Check if a section with this title already exists
    const exists = sections.some(s => s.title === template.title);
    const newSection = {
      ...template,
      id: exists ? nanoid(8) : template.id,
      title: exists ? `${template.title} (Copy)` : template.title,
      enabled: false // Always start disabled
    };
    
    onChange([...sections, newSection]);
    setActiveSectionIndex(sections.length);
  };

  const updateSection = (index: number, updates: Partial<CustomHtmlSection>) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], ...updates };
    onChange(updatedSections);
  };

  const removeSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    onChange(updatedSections);
    
    if (activeSectionIndex === index) {
      setActiveSectionIndex(updatedSections.length > 0 ? 0 : -1);
    } else if (activeSectionIndex > index) {
      setActiveSectionIndex(activeSectionIndex - 1);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Custom HTML Sections</CardTitle>
        <CardDescription>Create rich HTML sections like "Clinically Tested To" or "Ingredients List"</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={section.id} className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id={`section-enabled-${section.id}`}
                    checked={section.enabled}
                    onCheckedChange={(checked: boolean) => {
                      updateSection(index, { enabled: !!checked });
                    }}
                  />
                  <div className="flex flex-col">
                    <label 
                      htmlFor={`section-enabled-${section.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {section.title}
                    </label>
                    <p className="text-xs text-gray-500">
                      {section.enabled ? 'Visible on product page' : 'Hidden on product page'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`section-title-${index}`}>Section Title</Label>
                    <Input
                      id={`section-title-${index}`}
                      value={section.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        updateSection(index, { title: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`section-order-${index}`}>Display Order</Label>
                    <Input
                      id={`section-order-${index}`}
                      type="number"
                      min="0"
                      value={section.displayOrder.toString()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        updateSection(index, { 
                          displayOrder: parseInt(e.target.value) || 0 
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`section-content-${index}`}>HTML Content</Label>
                  <CodeEditor
                    value={section.content}
                    onChange={(value) => {
                      updateSection(index, { content: value });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={addNewSection}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Section
            </Button>
            
            {sections.length === 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  defaultTemplates.forEach(template => {
                    addTemplateSection(template);
                  });
                }}
              >
                Add Default Templates
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
