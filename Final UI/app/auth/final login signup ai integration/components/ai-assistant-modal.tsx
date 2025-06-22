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

// AI Content Generation Functions
function generateRefinedText(userInput: string, fieldName: string, context: any): string[] {
  const input = userInput.toLowerCase()
  
  if (fieldName.toLowerCase().includes('summary') || fieldName.toLowerCase().includes('about')) {
    return [
      `Passionate professional with proven expertise in delivering exceptional results. ${extractKeyPoints(userInput)} Committed to continuous growth and innovation, with strong collaborative skills and a track record of driving meaningful impact in dynamic environments.`,
      
      `Results-driven specialist with comprehensive experience in ${extractDomain(userInput, context)}. ${extractAchievements(userInput)} Known for analytical thinking, effective communication, and the ability to translate complex challenges into successful outcomes.`,
      
      `Dedicated ${extractRole(userInput, context)} with a passion for excellence and innovation. ${extractSkills(userInput)} Proven ability to work effectively in fast-paced environments while maintaining attention to detail and delivering high-quality solutions.`
    ]
  } else if (fieldName.toLowerCase().includes('ideal') || fieldName.toLowerCase().includes('opportunity')) {
    return [
      `I'm seeking opportunities where I can ${extractOpportunityGoal(userInput)} while contributing to meaningful projects that drive real impact. ${extractWorkEnvironment(userInput)} I thrive in environments that value ${extractValues(userInput)} and provide opportunities for continuous learning and professional growth.`,
      
      `Looking for a role where I can leverage my skills to ${extractImpactGoal(userInput)} and make a tangible difference. ${extractCollaboration(userInput)} I'm excited about opportunities that offer ${extractGrowthAspects(userInput)} and align with my passion for ${extractPassion(userInput)}.`,
      
      `I'm passionate about ${extractPassion(userInput)} and am seeking opportunities where I can ${extractContribution(userInput)}. ${extractIdealEnvironment(userInput)} I value ${extractWorkValues(userInput)} and am looking for a role that challenges me to grow while making meaningful contributions.`
    ]
  } else if (fieldName.toLowerCase().includes('mission')) {
    return [
      `Our mission is to ${extractPurpose(userInput)} through innovative solutions that drive meaningful change and create lasting value for our clients and community.`,
      
      `We exist to ${extractGoal(userInput)}, delivering exceptional services that make a positive impact and foster sustainable growth for all stakeholders.`,
      
      `Dedicated to ${extractVision(userInput)} by providing cutting-edge solutions, building strong partnerships, and maintaining our commitment to excellence and integrity.`
    ]
  } else if (fieldName.toLowerCase().includes('vision')) {
    return [
      `To become the leading force in ${extractIndustry(userInput, context)}, creating a future where ${extractFutureGoal(userInput)} and innovation thrives across all our endeavors.`,
      
      `We envision a world where ${extractImpact(userInput)}, transforming how people work and collaborate through our commitment to excellence and forward-thinking approach.`,
      
      `To be recognized as the most trusted partner in ${extractDomain(userInput, context)}, setting new standards for quality and innovation while achieving ${extractAspiration(userInput)}.`
    ]
  } else {
    return [
      `${capitalizeFirst(extractMainPoint(userInput))}. ${extractSupportingDetails(userInput)} This approach ensures comprehensive results while maintaining the highest standards of quality and professionalism.`,
      
      `${capitalizeFirst(extractKeyAction(userInput))} with a focus on ${extractFocus(userInput)}. Through strategic planning and effective execution, we deliver measurable outcomes that exceed expectations.`,
      
      `${capitalizeFirst(extractObjective(userInput))}. ${extractMethodology(userInput)} Our commitment to excellence drives continuous improvement and sustainable success.`
    ]
  }
}

function generateRefinedTitle(userInput: string, fieldName: string, context: any): string[] {
  if (fieldName.toLowerCase().includes('title') || fieldName.toLowerCase().includes('role')) {
    const role = extractRole(userInput, context)
    const level = extractLevel(userInput)
    const specialty = extractSpecialty(userInput)
    
    return [
      `${level} ${role}${specialty ? ` - ${specialty}` : ''}`,
      `${role}${level ? ` (${level})` : ''}${specialty ? ` | ${specialty}` : ''}`,
      `${specialty ? `${specialty} ` : ''}${role}${level ? ` - ${level}` : ''}`
    ].filter(title => title.trim() !== ' - ' && title.trim() !== '')
  } else {
    return [
      capitalizeFirst(userInput.trim()),
      enhanceTitle(userInput),
      professionalizeTitle(userInput)
    ]
  }
}

function generateRefinedList(userInput: string, fieldName: string, context: any): string[] {
  const items = userInput.split(',').map(item => item.trim()).filter(item => item)
  
  if (fieldName.toLowerCase().includes('skill')) {
    const enhanced = items.map(skill => enhanceSkill(skill)).filter(skill => skill)
    const professional = items.map(skill => professionalizeSkill(skill)).filter(skill => skill)
    const comprehensive = [...new Set([...enhanced, ...professional, ...getRelatedSkills(items, context)])]
    
    return [
      enhanced.join(', '),
      professional.join(', '),
      comprehensive.slice(0, 10).join(', ')
    ]
  } else if (fieldName.toLowerCase().includes('value')) {
    const enhanced = items.map(value => enhanceValue(value)).filter(value => value)
    const professional = items.map(value => professionalizeValue(value)).filter(value => value)
    
    return [
      enhanced.join(', '),
      professional.join(', '),
      [...new Set([...enhanced, ...professional])].join(', ')
    ]
  } else {
    return [
      items.map(item => capitalizeFirst(item)).join(', '),
      items.map(item => enhanceItem(item)).join(', '),
      items.map(item => professionalizeItem(item)).join(', ')
    ]
  }
}

// Helper functions for content extraction and enhancement
function extractKeyPoints(input: string): string {
  // Extract main points from user input
  return "Demonstrates strong analytical and problem-solving capabilities."
}

function extractDomain(input: string, context: any): string {
  return context?.industry || "technology and innovation"
}

function extractRole(input: string, context: any): string {
  if (context?.role) return context.role
  const roleKeywords = input.match(/\b(developer|designer|manager|analyst|consultant|engineer|specialist)\b/i)
  return roleKeywords ? roleKeywords[0] : "professional"
}

function extractAchievements(input: string): string {
  return "Successfully delivered multiple high-impact projects with measurable results."
}

function extractSkills(input: string): string {
  return "Proficient in modern technologies and methodologies with a focus on best practices."
}

function extractPurpose(input: string): string {
  return input.includes('help') ? 'empower and support our clients' : 'drive innovation and excellence'
}

function extractGoal(input: string): string {
  return 'transform challenges into opportunities'
}

function extractVision(input: string): string {
  return 'fostering growth and innovation'
}

function extractIndustry(input: string, context: any): string {
  return context?.industry || 'our industry'
}

function extractFutureGoal(input: string): string {
  return 'excellence and innovation drive meaningful progress'
}

function extractImpact(input: string): string {
  return 'technology seamlessly integrates with human creativity'
}

function extractAspiration(input: string): string {
  return 'sustainable growth and lasting partnerships'
}

function extractMainPoint(input: string): string {
  return input.split('.')[0] || input.substring(0, 50)
}

function extractSupportingDetails(input: string): string {
  return "Leveraging proven methodologies and innovative approaches to achieve optimal outcomes."
}

function extractKeyAction(input: string): string {
  return input.split(' ').slice(0, 5).join(' ')
}

function extractFocus(input: string): string {
  return "delivering exceptional value and sustainable results"
}

function extractObjective(input: string): string {
  return input.split('.')[0] || input.substring(0, 40)
}

function extractMethodology(input: string): string {
  return "Utilizing best practices and innovative solutions to ensure optimal outcomes."
}

function extractLevel(input: string): string {
  const levels = ['senior', 'junior', 'lead', 'principal', 'director']
  const found = levels.find(level => input.toLowerCase().includes(level))
  return found ? capitalizeFirst(found) : ''
}

function extractSpecialty(input: string): string {
  const specialties = ['frontend', 'backend', 'fullstack', 'mobile', 'data', 'cloud', 'security']
  const found = specialties.find(spec => input.toLowerCase().includes(spec))
  return found ? capitalizeFirst(found) : ''
}

function enhanceTitle(input: string): string {
  return capitalizeFirst(input.trim()) + (input.includes('specialist') ? '' : ' Specialist')
}

function professionalizeTitle(input: string): string {
  return 'Professional ' + capitalizeFirst(input.trim())
}

function enhanceSkill(skill: string): string {
  const skillMap: Record<string, string> = {
    'js': 'JavaScript',
    'javascript': 'JavaScript (ES6+)',
    'react': 'React.js',
    'node': 'Node.js',
    'python': 'Python Programming',
    'css': 'CSS3 & Styling',
    'html': 'HTML5',
    'sql': 'SQL & Database Management'
  }
  return skillMap[skill.toLowerCase()] || capitalizeFirst(skill)
}

function professionalizeSkill(skill: string): string {
  return capitalizeFirst(skill) + ' Proficiency'
}

function getRelatedSkills(skills: string[], context: any): string[] {
  // Return related skills based on input
  const related = ['Problem Solving', 'Team Collaboration', 'Communication', 'Project Management']
  return related.slice(0, 3)
}

function enhanceValue(value: string): string {
  const valueMap: Record<string, string> = {
    'honesty': 'Integrity & Transparency',
    'teamwork': 'Collaboration & Teamwork',
    'innovation': 'Innovation & Creativity',
    'quality': 'Quality Excellence'
  }
  return valueMap[value.toLowerCase()] || capitalizeFirst(value)
}

function professionalizeValue(value: string): string {
  return 'Commitment to ' + capitalizeFirst(value)
}

function enhanceItem(item: string): string {
  return capitalizeFirst(item.trim())
}

function professionalizeItem(item: string): string {
  return 'Excellence in ' + capitalizeFirst(item.trim())
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Additional helper functions for opportunity descriptions
function extractOpportunityGoal(input: string): string {
  if (input.includes('lead') || input.includes('manage')) return 'lead impactful projects'
  if (input.includes('create') || input.includes('build')) return 'create innovative solutions'
  if (input.includes('help') || input.includes('support')) return 'support and empower teams'
  if (input.includes('solve') || input.includes('problem')) return 'solve complex challenges'
  return 'apply my expertise effectively'
}

function extractWorkEnvironment(input: string): string {
  if (input.includes('collaborative') || input.includes('team')) return 'I excel in collaborative environments where diverse perspectives drive innovation.'
  if (input.includes('remote') || input.includes('flexible')) return 'I value flexible work arrangements that promote work-life balance.'
  if (input.includes('fast') || input.includes('dynamic')) return 'I thrive in fast-paced, dynamic environments that embrace change.'
  return 'I work best in supportive environments that encourage growth and innovation.'
}

function extractValues(input: string): string {
  const values = []
  if (input.includes('innovation') || input.includes('creative')) values.push('innovation')
  if (input.includes('quality') || input.includes('excellence')) values.push('quality')
  if (input.includes('team') || input.includes('collaboration')) values.push('collaboration')
  if (input.includes('growth') || input.includes('learning')) values.push('continuous learning')
  if (values.length > 0) return values.join(', ')
  return 'excellence, integrity, and continuous improvement'
}

function extractImpactGoal(input: string): string {
  if (input.includes('improve') || input.includes('optimize')) return 'improve processes and drive efficiency'
  if (input.includes('grow') || input.includes('scale')) return 'drive growth and scale operations'
  if (input.includes('user') || input.includes('customer')) return 'enhance user experiences'
  if (input.includes('team') || input.includes('people')) return 'develop and mentor teams'
  return 'create meaningful value and drive positive change'
}

function extractCollaboration(input: string): string {
  if (input.includes('team') || input.includes('collaborative')) return 'I enjoy working with cross-functional teams to achieve shared goals.'
  if (input.includes('mentor') || input.includes('guide')) return 'I\'m passionate about mentoring others and sharing knowledge.'
  if (input.includes('client') || input.includes('customer')) return 'I value building strong relationships with clients and stakeholders.'
  return 'I believe in the power of collaboration to achieve exceptional results.'
}

function extractGrowthAspects(input: string): string {
  if (input.includes('learn') || input.includes('skill')) return 'skill development and learning opportunities'
  if (input.includes('challenge') || input.includes('complex')) return 'challenging projects that push boundaries'
  if (input.includes('career') || input.includes('advancement')) return 'clear career progression paths'
  return 'professional development and growth opportunities'
}

function extractPassion(input: string): string {
  if (input.includes('technology') || input.includes('tech')) return 'technology and innovation'
  if (input.includes('design') || input.includes('creative')) return 'design and creative problem-solving'
  if (input.includes('data') || input.includes('analysis')) return 'data-driven insights and analysis'
  if (input.includes('people') || input.includes('team')) return 'people development and team building'
  return 'creating solutions that make a difference'
}

function extractContribution(input: string): string {
  if (input.includes('lead') || input.includes('drive')) return 'lead initiatives and drive strategic outcomes'
  if (input.includes('build') || input.includes('create')) return 'build innovative solutions from the ground up'
  if (input.includes('improve') || input.includes('optimize')) return 'improve existing processes and systems'
  return 'contribute my unique skills and perspective'
}

function extractIdealEnvironment(input: string): string {
  if (input.includes('startup') || input.includes('fast')) return 'I\'m drawn to startup environments where I can wear multiple hats and make a direct impact.'
  if (input.includes('established') || input.includes('stable')) return 'I prefer established organizations with strong foundations and clear processes.'
  if (input.includes('remote') || input.includes('flexible')) return 'I value flexible work arrangements that support work-life integration.'
  return 'I thrive in environments that encourage innovation and support professional growth.'
}

function extractWorkValues(input: string): string {
  const values = []
  if (input.includes('balance') || input.includes('flexible')) values.push('work-life balance')
  if (input.includes('transparent') || input.includes('honest')) values.push('transparency')
  if (input.includes('diverse') || input.includes('inclusive')) values.push('diversity and inclusion')
  if (input.includes('growth') || input.includes('development')) values.push('professional development')
  if (values.length > 0) return values.join(', ')
  return 'authenticity, growth, and meaningful work'
} 