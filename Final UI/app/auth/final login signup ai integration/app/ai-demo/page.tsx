"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AIFormField } from "@/components/ai-form-field"
import { WandIcon, SparklesIcon, BrainIcon } from "lucide-react"
import Link from "next/link"

export default function AIDemoPage() {
  const [professionalSummary, setProfessionalSummary] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [experienceDescription, setExperienceDescription] = useState("")
  const [companyMission, setCompanyMission] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [values, setValues] = useState<string[]>([])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg mb-6">
            <BrainIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Magic Pen Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of AI-assisted form filling. Click the{" "}
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full text-sm">
              <WandIcon className="w-3 h-3" />
              <SparklesIcon className="w-3 h-3" />
              Fill with AI
            </span>{" "}
            button on any field to see AI suggestions!
          </p>
        </div>

        {/* Navigation */}
        <div className="text-center mb-8">
          <Button asChild className="bg-black hover:bg-gray-900 text-white">
            <Link href="/onboarding/profile?type=individual">
              Try Full Onboarding Experience →
            </Link>
          </Button>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Professional Summary */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Professional Summary</span>
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Individual</span>
              </CardTitle>
              <CardDescription>
                AI can help you write a compelling professional summary that highlights your strengths and experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="summary">Write about yourself</Label>
                                 <AIFormField
                   aiProps={{
                     fieldType: 'textarea',
                     fieldName: 'Professional Summary',
                     placeholder: 'Write a compelling summary about yourself',
                     value: professionalSummary,
                     onChange: (value) => setProfessionalSummary(value as string),
                     context: {
                       userType: 'individual',
                       role: 'Software Developer',
                       experience: '5+ years'
                     }
                   }}
                 >
                  <Textarea
                    id="summary"
                    value={professionalSummary}
                    onChange={(e) => setProfessionalSummary(e.target.value)}
                    placeholder="Describe your professional background, skills, and what makes you unique..."
                    className="min-h-[120px] resize-none"
                  />
                </AIFormField>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Skills & Technologies</span>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">List</span>
              </CardTitle>
              <CardDescription>
                AI can suggest relevant skills based on your profession and experience level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center bg-black text-white text-sm font-medium px-3 py-1.5 rounded-full"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                        className="ml-2 text-white hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                                 <AIFormField
                   aiProps={{
                     fieldType: 'list',
                     fieldName: 'Skills & Technologies',
                     placeholder: 'Add your skills and technologies',
                     value: skills,
                     onChange: (value) => setSkills(value as string[]),
                     context: {
                       userType: 'individual',
                       role: 'Software Developer',
                       skills: skills
                     }
                   }}
                 >
                   <Input
                     placeholder="Type skills or use AI suggestions..."
                     className="w-full"
                   />
                 </AIFormField>
               </div>
             </CardContent>
           </Card>

           {/* Experience Description */}
           <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <span>Work Experience</span>
                 <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Experience</span>
               </CardTitle>
               <CardDescription>
                 AI can help you describe your work experience with impact-focused language and specific achievements.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 <Label htmlFor="experience">Describe your role and achievements</Label>
                 <AIFormField
                   aiProps={{
                     fieldType: 'textarea',
                     fieldName: 'Work Experience',
                     placeholder: 'Describe your key responsibilities, achievements, and impact',
                     value: experienceDescription,
                     onChange: (value) => setExperienceDescription(value as string),
                     context: {
                       userType: 'individual',
                       role: 'Senior Frontend Developer',
                       industry: 'Technology'
                     }
                   }}
                 >
                   <Textarea
                     id="experience"
                     value={experienceDescription}
                     onChange={(e) => setExperienceDescription(e.target.value)}
                     placeholder="Led development of user-facing features, improved performance by 40%, collaborated with cross-functional teams..."
                     className="min-h-[120px] resize-none"
                   />
                 </AIFormField>
               </div>
             </CardContent>
           </Card>

           {/* Company Mission */}
           <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <span>Company Mission</span>
                 <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Company</span>
               </CardTitle>
               <CardDescription>
                 AI can help you craft a compelling mission statement that reflects your company's purpose and values.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 <Label htmlFor="mission">What is your company's mission?</Label>
                 <AIFormField
                   aiProps={{
                     fieldType: 'textarea',
                     fieldName: 'Company Mission',
                     placeholder: 'What is your company\'s mission statement?',
                     value: companyMission,
                     onChange: (value) => setCompanyMission(value as string),
                     context: {
                       userType: 'company',
                       industry: 'Technology'
                     }
                   }}
                 >
                   <Textarea
                     id="mission"
                     value={companyMission}
                     onChange={(e) => setCompanyMission(e.target.value)}
                     placeholder="To empower businesses through innovative technology solutions that drive growth and success..."
                     className="min-h-[120px] resize-none"
                   />
                 </AIFormField>
               </div>
             </CardContent>
           </Card>

           {/* Job Description */}
           <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <span>Job Description</span>
                 <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Hiring</span>
               </CardTitle>
               <CardDescription>
                 AI can help you write detailed job descriptions that attract the right candidates.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 <Label htmlFor="job">Describe the role and requirements</Label>
                 <AIFormField
                   aiProps={{
                     fieldType: 'textarea',
                     fieldName: 'Job Description',
                     placeholder: 'Describe the role, responsibilities, and requirements',
                     value: jobDescription,
                     onChange: (value) => setJobDescription(value as string),
                     context: {
                       userType: 'company',
                       role: 'Senior Software Engineer',
                       industry: 'Technology'
                     }
                   }}
                 >
                   <Textarea
                     id="job"
                     value={jobDescription}
                     onChange={(e) => setJobDescription(e.target.value)}
                     placeholder="We are seeking a Senior Software Engineer to join our growing team. You will be responsible for..."
                     className="min-h-[120px] resize-none"
                   />
                 </AIFormField>
               </div>
             </CardContent>
           </Card>

           {/* Company Values */}
           <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <span>Company Values</span>
                 <span className="text-sm bg-teal-100 text-teal-700 px-2 py-1 rounded-full">Values</span>
               </CardTitle>
               <CardDescription>
                 AI can suggest core values that align with your company culture and industry.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 <div className="flex flex-wrap gap-2">
                   {values.map((value, index) => (
                     <span
                       key={index}
                       className="inline-flex items-center bg-black text-white text-sm font-medium px-3 py-1.5 rounded-full"
                     >
                       {value}
                       <button
                         type="button"
                         onClick={() => setValues(values.filter((_, i) => i !== index))}
                         className="ml-2 text-white hover:bg-white/20 rounded-full p-0.5 transition-colors"
                       >
                         ×
                       </button>
                     </span>
                   ))}
                 </div>
                 <AIFormField
                   aiProps={{
                     fieldType: 'list',
                     fieldName: 'Company Values',
                     placeholder: 'Add company values',
                     value: values,
                     onChange: (value) => setValues(value as string[]),
                     context: {
                       userType: 'company',
                       industry: 'Technology'
                     }
                   }}
                 >
                  <Input
                    placeholder="Type values or use AI suggestions..."
                    className="w-full"
                  />
                </AIFormField>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to experience the full power of AI-assisted onboarding?
          </h3>
          <p className="text-gray-600 mb-4">
            Try the complete onboarding flow with AI assistance on every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
              <Link href="/onboarding/profile?type=individual">
                Start Individual Onboarding
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300">
              <Link href="/onboarding/profile?type=company">
                Start Company Onboarding
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 