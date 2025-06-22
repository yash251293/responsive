"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  WandIcon,
  SparklesIcon,
  LoaderIcon,
  CheckIcon,
  XIcon,
  BrainIcon,
  EditIcon,
  ArrowRightIcon,
  RefreshCwIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  fieldType: 'text' | 'textarea' | 'list' | 'experience' | 'education'
  fieldName: string
  currentValue: string | string[]
  onApply: (value: string | string[]) => void
  context?: {
    userType?: 'individual' | 'company'
    role?: string
    industry?: string
    experience?: string
    skills?: string[]
    existingContent?: string
  }
}

export function AIAssistantModal({
  isOpen,
  onClose,
  fieldType,
  fieldName,
  currentValue,
  onApply,
  context = {}
}: AIAssistantModalProps) {
  const [userInput, setUserInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>("")

  const getFieldPrompt = () => {
    switch (fieldType) {
      case 'textarea':
        if (fieldName.toLowerCase().includes('summary') || fieldName.toLowerCase().includes('about')) {
          return "Tell me about yourself in simple words - your role, experience, what you do, what you're good at..."
        } else if (fieldName.toLowerCase().includes('mission')) {
          return "What does your company do? What's your main goal or purpose?"
        } else if (fieldName.toLowerCase().includes('vision')) {
          return "Where do you see your company in the future? What's your big dream or goal?"
        } else if (fieldName.toLowerCase().includes('description') || fieldName.toLowerCase().includes('experience')) {
          return "What did you do in this role? What were your main tasks? Any achievements or results?"
        } else if (fieldName.toLowerCase().includes('culture')) {
          return "How would you describe your company's work environment and values?"
        } else if (fieldName.toLowerCase().includes('ideal') || fieldName.toLowerCase().includes('opportunity')) {
          return "What kind of work excites you? What impact do you want to make? What environment helps you do your best work?"
        } else {
          return "Describe what you want to say in simple words..."
        }
      case 'text':
        if (fieldName.toLowerCase().includes('title') || fieldName.toLowerCase().includes('role')) {
          return "What's your job title or what do you do for work?"
        } else if (fieldName.toLowerCase().includes('skill')) {
          return "What skills do you have? What tools or technologies do you use?"
        } else {
          return "Tell me what you want to write here..."
        }
      case 'list':
        if (fieldName.toLowerCase().includes('skill')) {
          return "List your skills, tools, or technologies (separated by commas)..."
        } else if (fieldName.toLowerCase().includes('value')) {
          return "What values are important to your company? (e.g., honesty, innovation, teamwork)"
        } else {
          return "List the items you want to include (separated by commas)..."
        }
      default:
        return "Tell me what you want to write and I'll help make it better..."
    }
  }

  const generateAIContent = async () => {
    if (!userInput.trim()) return

    setIsGenerating(true)
    setSuggestions([])

    try {
      // Simulate AI processing with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000))

      let generatedContent: string[] = []

      // Generate refined content based on user input and field type
      switch (fieldType) {
        case 'textarea':
          generatedContent = generateRefinedText(userInput, fieldName, context)
          break
        case 'text':
          generatedContent = generateRefinedTitle(userInput, fieldName, context)
          break
        case 'list':
          generatedContent = generateRefinedList(userInput, fieldName, context)
          break
        default:
          generatedContent = generateRefinedText(userInput, fieldName, context)
      }

      setSuggestions(generatedContent)
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = () => {
    if (selectedSuggestion) {
      if (fieldType === 'list') {
        const items = selectedSuggestion.split(',').map(item => item.trim()).filter(item => item)
        onApply(items)
      } else {
        onApply(selectedSuggestion)
      }
      onClose()
      // Reset state
      setUserInput("")
      setSuggestions([])
      setSelectedSuggestion("")
    }
  }

  const handleTryAgain = () => {
    setSuggestions([])
    setSelectedSuggestion("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BrainIcon className="w-6 h-6 text-primary-navy" />
            AI Writing Assistant
          </DialogTitle>
          <DialogDescription className="text-base">
            Tell me what you want to write in your own words, and I'll help you create professional content for your <span className="font-medium text-primary-navy">{fieldName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Step 1: User Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-navy text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <Label className="text-base font-medium">What do you want to say?</Label>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-3">
                <strong>💡 Tip:</strong> {getFieldPrompt()}
              </p>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your thoughts here in simple words..."
                className="min-h-[100px] bg-white border-blue-200 focus:border-primary-navy focus:ring-2 focus:ring-primary-navy/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    if (userInput.trim() && !isGenerating) {
                      generateAIContent()
                    }
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={generateAIContent}
                disabled={!userInput.trim() || isGenerating}
                style={{
                  backgroundColor: !userInput.trim() || isGenerating ? '#d1d5db' : '#1e3a8a',
                  color: !userInput.trim() || isGenerating ? '#6b7280' : '#ffffff',
                  border: 'none'
                }}
                className="flex-1 font-medium transition-colors duration-200"
              >
                {isGenerating ? (
                  <>
                    <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                    AI is refining your content...
                  </>
                ) : (
                  <>
                    <WandIcon className="w-4 h-4 mr-2" />
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Refine with AI
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUserInput("")
                  setSuggestions([])
                  setSelectedSuggestion("")
                }}
                disabled={isGenerating}
                className="px-4 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              💡 Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to quickly submit
            </p>
          </div>

          {/* Step 2: AI Suggestions */}
          {(suggestions.length > 0 || isGenerating) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <Label className="text-base font-medium">Choose your refined content</Label>
              </div>

              {isGenerating ? (
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <LoaderIcon className="w-8 h-8 mx-auto mb-3 animate-spin text-primary-navy" />
                  <p className="text-gray-600">AI is crafting professional content for you...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                        selectedSuggestion === suggestion
                          ? "border-primary-navy bg-blue-50"
                          : "border-gray-200 hover:border-primary-navy/50 hover:bg-gray-50"
                      )}
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {suggestion}
                          </p>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          {selectedSuggestion === suggestion ? (
                            <div className="w-6 h-6 bg-primary-navy rounded-full flex items-center justify-center">
                              <CheckIcon className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleTryAgain}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCwIcon className="w-4 h-4 mr-2" />
                      Try Different Suggestions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Apply */}
          {selectedSuggestion && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <Label className="text-base font-medium">Apply to your form</Label>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 mb-3">
                  <strong>✨ Ready to apply:</strong> Your refined content will be added to the form field.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleApply}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Apply This Content
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// AI Content Generation Functions (Mocked)
// These functions are placeholders and should be replaced with actual AI service calls.
function generateRefinedText(userInput: string, fieldName: string, context: any): string[] {
  const baseText = `Refined: ${userInput} for ${fieldName}. Context: ${JSON.stringify(context)}.`;
  return [
    `${baseText} (Option 1 - Professional Tone)`,
    `${baseText} (Option 2 - Friendly Tone)`,
    `${baseText} (Option 3 - Concise Version)`
  ];
}

function generateRefinedTitle(userInput: string, fieldName: string, context: any): string[] {
  const baseTitle = `Title: ${userInput} for ${fieldName}.`;
  return [
    `Enhanced ${baseTitle}`,
    `Creative ${baseTitle}`,
    `Formal ${baseTitle}`
  ];
}

function generateRefinedList(userInput: string, fieldName: string, context: any): string[] {
  const items = userInput.split(',').map(item => item.trim()).filter(item => item);
  return [
    items.map(item => `Polished ${item}`).join(', '),
    items.map(item => `Improved ${item}`).join(', '),
    items.map(item => `Professional ${item}`).join(', ')
  ];
}

function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Dummy helper functions for content extraction (replace with actual logic if needed for more sophisticated mocks)
function extractKeyPoints(input: string): string { return "Key points based on input." }
function extractDomain(input: string, context: any): string { return context?.industry || "relevant domain"; }
function extractRole(input: string, context: any): string { return context?.role || "professional role"; }
function extractAchievements(input: string): string { return "Notable achievements highlighted."}
function extractSkills(input: string): string { return "Relevant skills identified."}
function extractPurpose(input: string): string { return "Core purpose." }
function extractGoal(input: string): string { return "Primary goal." }
function extractVision(input: string): string { return "Forward-looking vision."}
function extractIndustry(input: string, context: any): string { return context?.industry || "the industry" }
function extractFutureGoal(input: string): string { return "Future aspiration." }
function extractImpact(input: string): string { return "Desired impact."}
function extractAspiration(input: string): string { return "Key aspiration." }
function extractMainPoint(input: string): string { return "Main point." }
function extractSupportingDetails(input: string): string { return "Supporting details." }
function extractKeyAction(input: string): string { return "Key action." }
function extractFocus(input: string): string { return "Area of focus." }
function extractObjective(input: string): string { return "Clear objective."}
function extractMethodology(input: string): string { return "Effective methodology." }
function extractLevel(input: string): string { return "Experience level." }
function extractSpecialty(input: string): string { return "Specialty area." }
function enhanceTitle(input: string): string { return `Enhanced: ${input}`; }
function professionalizeTitle(input: string): string { return `Professional: ${input}`; }
function enhanceSkill(skill: string): string { return `Enhanced ${skill}`; }
function professionalizeSkill(skill: string): string { return `Proficient in ${skill}`; }
function getRelatedSkills(skills: string[], context: any): string[] { return ["Teamwork", "Communication"]; }
function enhanceValue(value: string): string { return `Strong belief in ${value}`; }
function professionalizeValue(value: string): string { return `Commitment to ${value}`;}
function enhanceItem(item: string): string { return `Improved ${item}`;}
function professionalizeItem(item: string): string { return `Professional ${item}`;}
function extractOpportunityGoal(input: string): string { return "Key opportunity goal." }
function extractWorkEnvironment(input: string): string { return "Preferred work environment." }
function extractValues(input: string): string { return "Core values." }
function extractImpactGoal(input: string): string { return "Desired impact goal." }
function extractCollaboration(input: string): string { return "Collaboration style." }
function extractGrowthAspects(input: string): string { return "Growth aspects." }
function extractPassion(input: string): string { return "Area of passion." }
function extractContribution(input: string): string { return "Intended contribution." }
function extractIdealEnvironment(input: string): string { return "Ideal work setting." }
function extractWorkValues(input: string): string { return "Important work values." }
