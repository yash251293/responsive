"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  PlusIcon, 
  XIcon, 
  BriefcaseIcon, 
  GraduationCapIcon, 
  StarIcon, 
  UserIcon,
  CalendarIcon,
  BuildingIcon,
  AwardIcon,
  LinkIcon,
  UsersIcon,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { AIFormField } from "@/components/ai-form-field"

interface ExperienceEntry {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface EducationEntry {
  id: string
  degree: string
  school: string
  location: string
  startDate: string
  endDate: string
  gpa: string
  description: string
}

interface AwardEntry {
  id: string
  title: string
  issuer: string
  date: string
  description: string
  credentialId: string
  url: string
}

interface JobOpening {
  title: string
  department: string
  location: string
  type: string
  description: string
}

interface Benefit {
  title: string
  description: string
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get('type') || 'individual'
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Company-specific state
  const [mission, setMission] = useState("")
  const [vision, setVision] = useState("")
  const [values, setValues] = useState<string[]>([])
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([])
  const [teamSize, setTeamSize] = useState("")
  const [companyCulture, setCompanyCulture] = useState("")
  const [benefits, setBenefits] = useState<Benefit[]>([])

  // Individual-specific state
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    {
      id: "1",
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    }
  ])
  const [education, setEducation] = useState<EducationEntry[]>([
    {
      id: "1",
      degree: "",
      school: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: ""
    }
  ])
  const [awards, setAwards] = useState<AwardEntry[]>([
    {
      id: "1",
      title: "",
      issuer: "",
      date: "",
      description: "",
      credentialId: "",
      url: ""
    }
  ])
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [professionalSummary, setProfessionalSummary] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [portfolio, setPortfolio] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [github, setGithub] = useState("")
  const [website, setWebsite] = useState("")

  // Company functions
  const addJobOpening = () => {
    setJobOpenings([
      ...jobOpenings,
      {
        title: "",
        department: "",
        location: "",
        type: "",
        description: "",
      },
    ])
  }

  const updateJobOpening = (index: number, field: keyof JobOpening, value: string) => {
    const updatedOpenings = [...jobOpenings]
    updatedOpenings[index] = { ...updatedOpenings[index], [field]: value }
    setJobOpenings(updatedOpenings)
  }

  const removeJobOpening = (index: number) => {
    setJobOpenings(jobOpenings.filter((_, i) => i !== index))
  }

  const addBenefit = () => {
    setBenefits([...benefits, { title: "", description: "" }])
  }

  const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
    const updatedBenefits = [...benefits]
    updatedBenefits[index] = { ...updatedBenefits[index], [field]: value }
    setBenefits(updatedBenefits)
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  // Individual functions
  const addExperience = () => {
    const newExp: ExperienceEntry = {
      id: Date.now().toString(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    }
    setExperiences([...experiences, newExp])
  }

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id))
  }

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: string | boolean) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const addEducation = () => {
    const newEdu: EducationEntry = {
      id: Date.now().toString(),
      degree: "",
      school: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: ""
    }
    setEducation([...education, newEdu])
  }

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id))
  }

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
  }

  const addAward = () => {
    const newAward: AwardEntry = {
      id: Date.now().toString(),
      title: "",
      issuer: "",
      date: "",
      description: "",
      credentialId: "",
      url: ""
    }
    setAwards([...awards, newAward])
  }

  const removeAward = (id: string) => {
    setAwards(awards.filter(award => award.id !== id))
  }

  const updateAward = (id: string, field: keyof AwardEntry, value: string) => {
    setAwards(awards.map(award => 
      award.id === id ? { ...award, [field]: value } : award
    ))
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setShowSuccess(true)
    setIsSaving(false)
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-brand-bg-light-gray py-8 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text-dark mb-3">Profile Updated Successfully!</h1>
          <p className="text-brand-text-medium mb-6">
            {userType === 'company' 
              ? "Your company profile has been saved and is now live!"
              : "Your profile has been saved and is now visible to potential clients and employers!"
            }
          </p>
          <p className="text-sm text-brand-text-light">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-text-dark mb-3">
            Complete Your {userType === 'company' ? 'Company' : ''} Profile
          </h1>
          <p className="text-brand-text-medium leading-relaxed">
            {userType === 'company' 
              ? "Add detailed information about your company to attract the best talent."
              : "Add detailed information about your experience, skills, and work to create a compelling profile that stands out."
            }
          </p>
        </div>

        {userType === 'company' ? (
          // Company Profile Form
          <div className="space-y-8">
            {/* Company Overview Section */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <BuildingIcon className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-semibold text-brand-text-dark">Company Overview</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mission">Company Mission</Label>
                                     <AIFormField
                     aiProps={{
                       fieldType: 'textarea',
                       fieldName: 'Company Mission',
                       placeholder: 'What is your company\'s mission statement?',
                       value: mission,
                       onChange: (value) => setMission(value as string),
                       context: {
                         userType: 'company'
                       }
                     }}
                   >
                    <Textarea
                      id="mission"
                      placeholder="What is your company's mission statement?"
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                      className="min-h-[100px] bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                    />
                  </AIFormField>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vision">Company Vision</Label>
                                     <AIFormField
                     aiProps={{
                       fieldType: 'textarea',
                       fieldName: 'Company Vision',
                       placeholder: 'What is your company\'s vision for the future?',
                       value: vision,
                       onChange: (value) => setVision(value as string),
                       context: {
                         userType: 'company'
                       }
                     }}
                   >
                    <Textarea
                      id="vision"
                      placeholder="What is your company's vision for the future?"
                      value={vision}
                      onChange={(e) => setVision(e.target.value)}
                      className="min-h-[100px] bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                    />
                  </AIFormField>
                </div>

                <div className="space-y-2">
                  <Label>Company Values</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {values.map((value, index) => (
                      <span key={index} className="inline-flex items-center bg-black text-white text-sm font-medium px-3 py-1.5 rounded-full">
                        {value}
                        <button
                          type="button"
                          onClick={() => setValues(values.filter((_, i) => i !== index))}
                          className="ml-2 text-white hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                                         <AIFormField
                       aiProps={{
                         fieldType: 'list',
                         fieldName: 'Company Values',
                         placeholder: 'Add company values',
                         value: values,
                         onChange: (value) => setValues(value as string[]),
                         context: {
                           userType: 'company'
                         }
                       }}
                       className="flex-1"
                     >
                      <Input
                        placeholder="Add a company value"
                        className="bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const input = e.target as HTMLInputElement
                            const value = input.value.trim()
                            if (value && !values.includes(value)) {
                              setValues((v) => [...v, value])
                              input.value = ""
                            }
                          }
                        }}
                      />
                    </AIFormField>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-brand-border text-brand-text-medium hover:bg-brand-bg-light-gray"
                      onClick={() => {
                        const input = document.querySelector("input[placeholder='Add a company value']") as HTMLInputElement
                        const value = input.value.trim()
                        if (value && !values.includes(value)) {
                          setValues((v) => [...v, value])
                          input.value = ""
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Positions Section */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <BriefcaseIcon className="h-6 w-6 text-black" />
                  <h2 className="text-2xl font-semibold text-brand-text-dark">Open Positions</h2>
                </div>
                <Button
                  type="button"
                  onClick={addJobOpening}
                  className="bg-black hover:bg-gray-900 text-white font-medium"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Position
                </Button>
              </div>

              {jobOpenings.length === 0 ? (
                <div className="text-center py-8 text-brand-text-medium">
                  <BriefcaseIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No open positions yet. Add your first job opening!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {jobOpenings.map((job, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-brand-text-dark">Position {index + 1}</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeJobOpening(index)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Job Title</Label>
                          <Input
                            value={job.title}
                            onChange={(e) => updateJobOpening(index, "title", e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Input
                            value={job.department}
                            onChange={(e) => updateJobOpening(index, "department", e.target.value)}
                            placeholder="e.g. Engineering"
                            className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={job.location}
                            onChange={(e) => updateJobOpening(index, "location", e.target.value)}
                            placeholder="e.g. San Francisco, CA"
                            className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Employment Type</Label>
                          <Select onValueChange={(value) => updateJobOpening(index, "type", value)}>
                            <SelectTrigger className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-time">Full-time</SelectItem>
                              <SelectItem value="part-time">Part-time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="internship">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Job Description</Label>
                                                 <AIFormField
                           aiProps={{
                             fieldType: 'textarea',
                             fieldName: 'Job Description',
                             placeholder: 'Describe the role, responsibilities, and requirements',
                             value: job.description,
                             onChange: (value) => updateJobOpening(index, "description", value as string),
                             context: {
                               userType: 'company',
                               role: job.title,
                               existingContent: job.description
                             }
                           }}
                         >
                          <Textarea
                            value={job.description}
                            onChange={(e) => updateJobOpening(index, "description", e.target.value)}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            className="bg-white border-brand-border min-h-[120px] focus:border-black focus:ring-2 focus:ring-black/20"
                          />
                        </AIFormField>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team & Culture Section */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <UsersIcon className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-semibold text-brand-text-dark">Team & Culture</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Select onValueChange={setTeamSize}>
                    <SelectTrigger className="bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="culture">Company Culture</Label>
                  <Textarea
                    id="culture"
                    placeholder="Describe your company culture, values, and work environment..."
                    value={companyCulture}
                    onChange={(e) => setCompanyCulture(e.target.value)}
                    className="min-h-[120px] bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Benefits & Perks</Label>
                    <Button
                      type="button"
                      onClick={addBenefit}
                      variant="outline"
                      size="sm"
                      className="border-brand-border text-brand-text-medium hover:bg-brand-bg-light-gray"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Benefit
                    </Button>
                  </div>

                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={benefit.title}
                          onChange={(e) => updateBenefit(index, "title", e.target.value)}
                          placeholder="Benefit title (e.g., Health Insurance)"
                          className="bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                        />
                        <Input
                          value={benefit.description}
                          onChange={(e) => updateBenefit(index, "description", e.target.value)}
                          placeholder="Brief description"
                          className="bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                        className="text-red-600 border-red-300 hover:bg-red-50 mt-2"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Individual Profile Form
          <form className="space-y-12">
            {/* Professional Summary */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <UserIcon className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-semibold text-brand-text-dark">Professional Summary</h2>
              </div>
              
              <div>
                <Label htmlFor="summary" className="block text-base font-semibold text-brand-text-dark mb-3">
                  Write a compelling summary about yourself <span className="text-brand-red">*</span>
                </Label>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Pro Tip:</strong> Write 3-4 sentences that highlight your key strengths, experience, and what makes you unique. 
                    This is often the first thing potential clients or employers read!
                  </p>
                </div>
                                  <AIFormField
                    aiProps={{
                      fieldType: 'textarea',
                      fieldName: 'Professional Summary',
                      placeholder: 'Write a compelling summary about yourself',
                      value: professionalSummary,
                      onChange: (value) => setProfessionalSummary(value as string),
                      context: {
                        userType: userType as 'individual' | 'company',
                        existingContent: professionalSummary
                      }
                    }}
                  >
                  <Textarea
                    id="summary"
                    value={professionalSummary}
                    onChange={(e) => setProfessionalSummary(e.target.value)}
                    placeholder="e.g., Experienced developer with 5+ years creating web applications and helping businesses grow. Passionate about clean code, user experience, and delivering quality work. Proven track record of successful projects across various industries..."
                    maxLength={500}
                    className="bg-brand-bg-input border-brand-border min-h-[120px] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                </AIFormField>
                <div className="flex justify-between items-center text-xs mt-2">
                  <p className="text-brand-text-medium">Make it personal and specific to your expertise</p>
                  <p className={cn(
                    "font-medium",
                    professionalSummary.length > 450 ? "text-amber-600" : "text-brand-text-light"
                  )}>
                    {professionalSummary.length} / 500
                  </p>
                </div>
              </div>
            </div>

            {/* Work Experience */}
            <div className="space-y-6 border-t border-brand-border pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BriefcaseIcon className="h-6 w-6 text-black" />
                  <h2 className="text-2xl font-semibold text-brand-text-dark">Work Experience & Projects</h2>
                </div>
                <Button
                  type="button"
                  onClick={addExperience}
                  className="bg-black hover:bg-gray-900 text-white font-medium"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </div>

              {experiences.map((exp, index) => (
                <div key={exp.id} className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-brand-text-dark">Experience {index + 1}</h3>
                    {experiences.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Job Title / Role / Project Name <span className="text-brand-red">*</span>
                      </Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                        placeholder="e.g. Frontend Developer, Logo Design Project, Marketing Campaign"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Company / Client / Organization <span className="text-brand-red">*</span>
                      </Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                        placeholder="e.g. Google, Small Local Business, Freelance Client"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">Location</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">Start Date</Label>
                      <Input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onCheckedChange={(checked) => updateExperience(exp.id, "current", checked as boolean)}
                      />
                      <Label htmlFor={`current-${exp.id}`} className="text-sm font-medium text-brand-text-medium">
                        This is my current role/project
                      </Label>
                    </div>
                    {!exp.current && (
                      <div className="flex-1 max-w-xs">
                        <Label className="block text-sm font-medium text-brand-text-medium mb-2">End Date</Label>
                        <Input
                          type="month"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                          className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                      Description
                    </Label>
                                         <AIFormField
                       aiProps={{
                         fieldType: 'textarea',
                         fieldName: 'Work Experience Description',
                         placeholder: 'Describe your key responsibilities, achievements, and impact',
                         value: exp.description,
                         onChange: (value) => updateExperience(exp.id, "description", value as string),
                         context: {
                           userType: userType as 'individual' | 'company',
                           role: exp.title,
                           existingContent: exp.description
                         }
                       }}
                     >
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                        placeholder="Describe your key responsibilities, achievements, and impact. Include specific results, technologies used, or value delivered to clients."
                        className="bg-white border-brand-border min-h-[100px] focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </AIFormField>
                  </div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="space-y-6 border-t border-brand-border pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCapIcon className="h-6 w-6 text-black" />
                  <h2 className="text-2xl font-semibold text-brand-text-dark">Education & Learning</h2>
                </div>
                <Button
                  type="button"
                  onClick={addEducation}
                  className="bg-black hover:bg-gray-900 text-white font-medium"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              </div>

              {education.map((edu, index) => (
                <div key={edu.id} className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-brand-text-dark">Education {index + 1}</h3>
                    {education.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEducation(edu.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Degree / Course / Certification <span className="text-brand-red">*</span>
                      </Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        placeholder="e.g. Bachelor of Science, Web Development Bootcamp, Google Analytics Certification"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Institution / Platform <span className="text-brand-red">*</span>
                      </Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                        placeholder="e.g. Stanford University, Coursera, Udemy, General Assembly"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">Location</Label>
                      <Input
                        value={edu.location}
                        onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                        placeholder="e.g. Stanford, CA"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">Score/GPA (Optional)</Label>
                      <Input
                        value={edu.gpa}
                        onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                        placeholder="e.g. 3.8/4.0, 95%, A grade"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">Start Date</Label>
                      <Input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">End Date</Label>
                      <Input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                      Additional Details (Optional)
                    </Label>
                    <Textarea
                      value={edu.description}
                      onChange={(e) => updateEducation(edu.id, "description", e.target.value)}
                      placeholder="Relevant coursework, specializations, honors, key skills learned, or achievements"
                      className="bg-white border-brand-border min-h-[80px] focus:border-black focus:ring-2 focus:ring-black/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Awards & Certifications */}
            <div className="space-y-6 border-t border-brand-border pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AwardIcon className="h-6 w-6 text-black" />
                  <h2 className="text-2xl font-semibold text-brand-text-dark">Awards & Certifications</h2>
                </div>
                <Button
                  type="button"
                  onClick={addAward}
                  className="bg-black hover:bg-gray-900 text-white font-medium"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Award/Certification
                </Button>
              </div>

              {awards.map((award, index) => (
                <div key={award.id} className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-brand-text-dark">Award/Certification {index + 1}</h3>
                    {awards.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAward(award.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Award/Certification Title <span className="text-brand-red">*</span>
                      </Label>
                      <Input
                        value={award.title}
                        onChange={(e) => updateAward(award.id, "title", e.target.value)}
                        placeholder="e.g. AWS Certified Solutions Architect, Employee of the Year, Google Analytics Certified"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Issuing Organization <span className="text-brand-red">*</span>
                      </Label>
                      <Input
                        value={award.issuer}
                        onChange={(e) => updateAward(award.id, "issuer", e.target.value)}
                        placeholder="e.g. Amazon Web Services, Microsoft, Google, Company Name"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Date Received
                      </Label>
                      <Input
                        type="month"
                        value={award.date}
                        onChange={(e) => updateAward(award.id, "date", e.target.value)}
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                        Credential ID (Optional)
                      </Label>
                      <Input
                        value={award.credentialId}
                        onChange={(e) => updateAward(award.id, "credentialId", e.target.value)}
                        placeholder="e.g. ABC123456789"
                        className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                      Credential URL (Optional)
                    </Label>
                    <Input
                      value={award.url}
                      onChange={(e) => updateAward(award.id, "url", e.target.value)}
                      placeholder="e.g. https://www.credly.com/badges/your-badge-id"
                      className="bg-white border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-brand-text-medium mb-2">
                      Description (Optional)
                    </Label>
                    <Textarea
                      value={award.description}
                      onChange={(e) => updateAward(award.id, "description", e.target.value)}
                      placeholder="Describe what this award/certification represents, key skills demonstrated, or its significance..."
                      className="bg-white border-brand-border min-h-[80px] focus:border-black focus:ring-2 focus:ring-black/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="space-y-6 border-t border-brand-border pt-8">
              <div className="flex items-center space-x-2 mb-6">
                <StarIcon className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-semibold text-brand-text-dark">Skills & Tools</h2>
              </div>

              <div>
                <Label className="block text-base font-semibold text-brand-text-dark mb-3">
                  Add your key skills, tools, and technologies
                </Label>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                  <p className="text-sm text-green-700">
                    <strong>💡 Tip:</strong> Include both technical skills (programming languages, software) and soft skills (communication, project management). 
                    List the tools and platforms you're proficient with.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center bg-black text-white text-sm font-medium px-3 py-1.5 rounded-full"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-white hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex space-x-2">
                                     <AIFormField
                     aiProps={{
                       fieldType: 'list',
                       fieldName: 'Skills & Technologies',
                       placeholder: 'Add your key skills, tools, and technologies',
                       value: skills,
                       onChange: (value) => setSkills(value as string[]),
                       context: {
                         userType: userType as 'individual' | 'company',
                         skills: skills
                       }
                     }}
                     className="flex-1"
                   >
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="Type a skill and press Enter"
                      className="bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20"
                    />
                  </AIFormField>
                  <Button
                    type="button"
                    onClick={addSkill}
                    className="bg-black hover:bg-gray-900 text-white font-medium"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Submit */}
        <div className="pt-8 border-t border-brand-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-black hover:bg-gray-900 text-white py-3 font-medium text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSaving ? "Saving..." : `Save Complete ${userType === 'company' ? 'Company' : ''} Profile`}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-brand-border text-brand-text-medium hover:bg-brand-bg-light-gray font-medium"
              asChild
            >
              <Link href="/dashboard">Save for Later</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 