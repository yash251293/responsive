"use client";

import React, { useState } from 'react';
import { Input, InputProps } from "@/components/ui/input";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SparklesIcon, InfoIcon } from "lucide-react";
import { cn } from '@/lib/utils';

interface AIFormFieldProps {
  aiProps: {
    fieldType: 'input' | 'textarea';
    fieldName: string; // e.g., "Professional Title", "Company Description"
    placeholder?: string;
    // value prop will be handled by react-hook-form's Controller or register
    // onChange prop will be handled by react-hook-form's Controller or register
    context?: {
      userType?: 'individual' | 'company';
      role?: string; // e.g., current professional title to get relevant skill suggestions
      existingContent?: string; // Pass existing content for refinement suggestions
      // any other contextual info needed for AI
    };
    maxLength?: number;
  };
  children: React.ReactElement<InputProps | TextareaProps>; // Expecting Input or Textarea as child
}

export const AIFormField: React.FC<AIFormFieldProps> = ({ aiProps, children }) => {
  const { fieldType, fieldName, placeholder, context, maxLength } = aiProps;
  const [showMockSuggestion, setShowMockSuggestion] = useState(false);
  const [mockSuggestion, setMockSuggestion] = useState("");

  const handleGetMockSuggestions = () => {
    // In a real scenario, this would call an AI service based on fieldName, context, and current value from RHF
    // For now, it's a mock.
    let suggestion = "This is a mock AI suggestion! ";
    if (fieldName.toLowerCase().includes("skill")) {
      suggestion += "Consider adding 'Project Management' or 'Data Analysis'.";
    } else if (fieldName.toLowerCase().includes("description") || fieldName.toLowerCase().includes("bio")) {
      suggestion += "Try starting with a strong action verb or highlighting a key achievement.";
    } else if (fieldName.toLowerCase().includes("title")) {
      suggestion += "How about 'Lead Software Engineer' or 'Senior Product Manager'?";
    } else {
        suggestion += `Make sure your ${fieldName.toLowerCase()} is clear and concise.`;
    }
    setMockSuggestion(suggestion);
    setShowMockSuggestion(true);
  };

  // Enhance the child (Input or Textarea) with necessary props if they aren't already there
  // This primarily ensures react-hook-form props are passed down if this component
  // is used directly without a <Controller> wrapping its children.
  // However, typical RHF usage would involve <Controller render={({field}) => <AIFormField><Input {...field} /></AIFormField>} />
  // So, the direct child passed via `children` should already have RHF's field props.
  const childWithProps = React.cloneElement(children, {
    placeholder: children.props.placeholder || placeholder,
    maxLength: children.props.maxLength || maxLength,
    // value and onChange are expected to be passed by react-hook-form to the child
  });

  return (
    <div className="space-y-2 w-full">
      {childWithProps}
      <div className="flex items-center justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetMockSuggestions}
          className="text-xs px-2 py-1 h-auto border-gray-300 hover:bg-gray-100"
          // disabled // Keep it enabled to show mock functionality
        >
          <SparklesIcon className="w-3 h-3 mr-1.5" />
          Get AI Suggestions (Mock)
        </Button>
      </div>
      {showMockSuggestion && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
          <div className="flex items-start">
            <InfoIcon className="w-3.5 h-3.5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
                <p className="font-semibold mb-0.5">Mock AI Suggestion:</p>
                <p>{mockSuggestion}</p>
            </div>
          </div>
           <Button type="button" size="sm" variant="ghost" className="text-xs mt-1 text-blue-600 hover:text-blue-800 px-1 h-auto" onClick={() => setShowMockSuggestion(false)}>Dismiss</Button>
        </div>
      )}
    </div>
  );
};
