import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { CodeEditor } from './ui/code-editor';

export interface HtmlSection {
  id: string;
  title: string;
  content: string;
  displayOrder: number;
  enabled: boolean;
}

interface HtmlSectionManagerProps {
  sections: HtmlSection[];
  onChange: (sections: HtmlSection[]) => void;
}

const defaultTemplates = [
  {
    id: 'clinically-tested',
    title: 'Clinically Tested To',
    content: `<div>
  <h3 class="text-xl font-medium mb-4">Clinically Tested To</h3>
  <ul class="list-disc pl-5 space-y-2">
    <li>Clinically Tested To Protect From UVA & UVB rays</li>
    <li>Based on clinical trials conducted over 30 days!</li>
  </ul>
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

export const HtmlSectionManager: React.FC<HtmlSectionManagerProps> = ({ sections = [], onChange }) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );

  const addNewSection = () => {
    const newSection: HtmlSection = {
      id: nanoid(8),
      title: 'New Section',
      content: '<div>\n  <!-- Content goes here -->\n</div>',
      displayOrder: sections.length,
      enabled: false
    };
    
    const updatedSections = [...sections, newSection];
    onChange(updatedSections);
    setActiveSectionId(newSection.id);
  };

  const addTemplateSection = (template: HtmlSection) => {
    // Check if a section with this title already exists
    const exists = sections.some(s => s.title === template.title);
    const newSection = {
      ...template,
      id: exists ? nanoid(8) : template.id,
      title: exists ? `${template.title} (Copy)` : template.title,
      enabled: false // Always start disabled
    };
    
    const updatedSections = [...sections, newSection];
    onChange(updatedSections);
    setActiveSectionId(newSection.id);
  };

  const updateSection = (id: string, updates: Partial<HtmlSection>) => {
    const updatedSections = sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    );
    onChange(updatedSections);
  };

  const removeSection = (id: string) => {
    const updatedSections = sections.filter(section => section.id !== id);
    onChange(updatedSections);
    
    if (activeSectionId === id) {
      setActiveSectionId(updatedSections.length > 0 ? updatedSections[0].id : null);
    }
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Custom HTML Sections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[250px_1fr] gap-6">
          {/* Section List */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md border">
              <h4 className="text-sm font-medium mb-2">Your Sections</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sections.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No sections added yet</p>
                ) : (
                  sections.map(section => (
                    <div 
                      key={section.id}
                      className={`
                        p-2 rounded cursor-pointer flex items-center justify-between border
                        ${activeSectionId === section.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}
                      `}
                      onClick={() => setActiveSectionId(section.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`enable-${section.id}`}
                          checked={section.enabled}
                          onCheckedChange={(checked) => {
                            updateSection(section.id, { enabled: !!checked });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={`text-sm ${!section.enabled && 'text-gray-500'}`}>
                          {section.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewSection}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Section
                </Button>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-gray-50 p-3 rounded-md border">
              <h4 className="text-sm font-medium mb-2">Templates</h4>
              <div className="space-y-2">
                {defaultTemplates.map(template => (
                  <div 
                    key={template.id}
                    className="p-2 rounded cursor-pointer border bg-white hover:bg-gray-50"
                    onClick={() => addTemplateSection(template)}
                  >
                    <span className="text-sm">{template.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Editor */}
          <div>
            {activeSection ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input
                      id="section-title"
                      value={activeSection.title}
                      onChange={(e) => updateSection(activeSection.id, { title: e.target.value })}
                      placeholder="Section title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="display-order">Display Order</Label>
                    <Input
                      id="display-order"
                      type="number"
                      min="0"
                      value={activeSection.displayOrder.toString()}
                      onChange={(e) => updateSection(activeSection.id, { 
                        displayOrder: parseInt(e.target.value) || 0 
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Determines the order of sections (lower numbers appear first)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`editor-enable-${activeSection.id}`}
                      checked={activeSection.enabled}
                      onCheckedChange={(checked) => {
                        updateSection(activeSection.id, { enabled: !!checked });
                      }}
                    />
                    <Label htmlFor={`editor-enable-${activeSection.id}`} className="cursor-pointer">
                      Enable this section
                    </Label>
                    <p className="text-xs text-gray-500 ml-2">
                      When disabled, this section will not be shown on the product page.
                    </p>
                  </div>
                </div>

                <div>
                  <Label>HTML Content</Label>
                  <CodeEditor
                    value={activeSection.content}
                    onChange={(value) => updateSection(activeSection.id, { content: value })}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 border rounded-md">
                <p className="text-gray-500">Select a section to edit or create a new one</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewSection}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Section
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
