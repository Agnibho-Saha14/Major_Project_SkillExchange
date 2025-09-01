import { useState } from "react"
import { useNavigate } from "react-router-dom"   // ✅ Import navigate
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Plus, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Navbar from "@/components/Navbar"

// API Configuration
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api'

function Toast({ message, type, onClose }) {
  if (!message) return null
  
  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        {type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function PublishSkillPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: "", 
    instructor: "", 
    category: "", 
    level: "", 
    duration: "", 
    timePerWeek: "",
    price: "", 
    priceType: "", 
    paymentOptions: "paid", 
    description: "", 
    skills: [],
    prerequisites: "",
    learningOutcomes: "",
    teachingFormat: {
      onlineSessions: false,
      inPersonSessions: false,
      flexibleSchedule: false,
      provideMaterials: false
    }
  })

  const [skillInput, setSkillInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDraftLoading, setIsDraftLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: '' })

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: '' }), 5000)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setForm({ ...form, skills: [...form.skills, skillInput.trim()] })
      setSkillInput("")
    }
  }

  const removeSkill = (index) => {
    setForm({ ...form, skills: form.skills.filter((_, i) => i !== index) })
  }

  const handleTeachingFormatChange = (field, checked) => {
    setForm({
      ...form,
      teachingFormat: {
        ...form.teachingFormat,
        [field]: checked
      }
    })
  }

  // API call function
const submitSkill = async (endpoint, successMessage, setLoadingState) => {
  setLoadingState(true)
  try {
    const skillData = {
      ...form,
      status: endpoint.includes('draft') ? 'draft' : 'published'
    }

    if (form.paymentOptions === 'paid' || form.paymentOptions === 'both') {
      skillData.price = form.price ? parseFloat(form.price) : 0
      skillData.priceType = form.priceType
    } else {
      skillData.price = 0
      delete skillData.priceType
    }

    console.log('Sending data to backend:', skillData) // Debug log

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(skillData),
    })

    const result = await response.json()

    if (result.success) {
      showToast(successMessage, 'success')
      setTimeout(() => {
    navigate('/')
  }, 2000)   
      if (endpoint === '/skills') {
        setForm({
          title: "", 
          instructor: "", 
          category: "", 
          level: "", 
          duration: "", 
          timePerWeek: "",
          price: "", 
          priceType: "", 
          paymentOptions: "paid", 
          description: "", 
          skills: [],
          prerequisites: "",
          learningOutcomes: "",
          teachingFormat: {
            onlineSessions: false,
            inPersonSessions: false,
            flexibleSchedule: false,
            provideMaterials: false
          }
        })
        setSkillInput("")
      }
    } else {
      console.error('Backend error:', result) // Debug log
      showToast(result.message || 'An error occurred', 'error')
    }
  } catch (error) {
    console.error('Network error:', error)
    showToast('Failed to connect to server. Please try again.', 'error')
  } finally {
    setLoadingState(false)
  }
}

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredFields = ['title', 'instructor', 'category', 'level', 'duration', 'timePerWeek', 'description']
    const emptyFields = requiredFields.filter(field => !form[field].trim())
    
    if (emptyFields.length > 0) {
      showToast(`Please fill in all required fields: ${emptyFields.join(', ')}`, 'error')
      return
    }

    // Validate payment fields if paid option is selected
    if ((form.paymentOptions === 'paid' || form.paymentOptions === 'both') && (!form.price || !form.priceType)) {
      showToast('Please fill in price and price type for paid options', 'error')
      return
    }

    // Validate exchange skills if exchange option is selected
    if ((form.paymentOptions === 'exchange' || form.paymentOptions === 'both') && form.skills.length === 0) {
      showToast('Please add at least one skill you want to learn for exchange options', 'error')
      return
    }

    submitSkill('/skills', 'Skill published successfully!', setIsLoading)
  }

  const handleSaveDraft = () => {
    submitSkill('/skills/draft', 'Skill saved as draft successfully!', setIsDraftLoading)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />

      {/* Header */}
      <Navbar />

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-2xl rounded-3xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
            <CardTitle className="text-3xl font-bold text-center">Share Your Skill</CardTitle>
            <p className="text-indigo-100 text-center mt-2">Help students understand what to expect</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">Skill Title *</Label>
                    <Input 
                      name="title" 
                      value={form.title} 
                      onChange={handleChange} 
                      required 
                      className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                      placeholder="e.g., Web Development Fundamentals"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">Instructor Name *</Label>
                    <Input 
                      name="instructor" 
                      value={form.instructor} 
                      onChange={handleChange} 
                      required 
                      className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">Category *</Label>
                    <Input 
                      name="category" 
                      value={form.category} 
                      onChange={handleChange} 
                      required 
                      className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                      placeholder="e.g., Programming, Design, Music"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">Skill Level *</Label>
                    <Select value={form.level} onValueChange={(v)=>setForm({...form,level:v})}>
                      <SelectTrigger className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 bg-white">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50">
                        <SelectItem value="Beginner" className="text-base py-3 hover:bg-indigo-50">Beginner</SelectItem>
                        <SelectItem value="Intermediate" className="text-base py-3 hover:bg-indigo-50">Intermediate</SelectItem>
                        <SelectItem value="Advanced" className="text-base py-3 hover:bg-indigo-50">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">Course Duration *</Label>
                    <Input 
                      name="duration" 
                      value={form.duration} 
                      onChange={handleChange} 
                      required 
                      className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                      placeholder="e.g., 8 weeks, 3 months"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">Hours per Week *</Label>
                    <Input 
                      name="timePerWeek" 
                      value={form.timePerWeek} 
                      onChange={handleChange} 
                      required 
                      className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                      placeholder="e.g., 5 hours"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Options Section */}
              <div className="p-6 border-2 border-gray-200 rounded-2xl bg-gradient-to-r from-gray-50 to-indigo-50">
                <Label className="text-xl font-bold text-gray-800 mb-4 block">Payment & Exchange Options</Label>
                <RadioGroup 
                  value={form.paymentOptions} 
                  onValueChange={(v)=>setForm({...form,paymentOptions:v})} 
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors">
                    <RadioGroupItem value="paid" id="paid" className="text-indigo-600" />
                    <Label htmlFor="paid" className="text-base font-medium cursor-pointer">Paid Teaching (₹)</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors">
                    <RadioGroupItem value="exchange" id="exchange" className="text-indigo-600" />
                    <Label htmlFor="exchange" className="text-base font-medium cursor-pointer">Skill Exchange</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors">
                    <RadioGroupItem value="both" id="both" className="text-indigo-600" />
                    <Label htmlFor="both" className="text-base font-medium cursor-pointer">Both Options Available</Label>
                  </div>
                </RadioGroup>

                {/* Conditional Payment Fields */}
                {(form.paymentOptions === "paid" || form.paymentOptions === "both") && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                    <Label className="text-lg font-semibold text-green-800 mb-3 block">Payment Details</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input 
                        type="number" 
                        placeholder="Price (₹)" 
                        name="price" 
                        value={form.price} 
                        onChange={handleChange} 
                        className="h-11 rounded-xl border-2 border-green-200 focus:border-green-500"
                        min="0"
                        step="0.01"
                      />
                      <Select value={form.priceType} onValueChange={(v)=>setForm({...form,priceType:v})}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-green-200 focus:border-green-500 bg-white">
                          <SelectValue placeholder="Select price type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 border-green-200 rounded-xl shadow-xl z-50">
                          <SelectItem value="hourly" className="text-base py-2 hover:bg-green-50">Per Hour</SelectItem>
                          <SelectItem value="weekly" className="text-base py-2 hover:bg-green-50">Per Week</SelectItem>
                          <SelectItem value="course" className="text-base py-2 hover:bg-green-50">Per Course</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Conditional Exchange Fields */}
                {(form.paymentOptions === "exchange" || form.paymentOptions === "both") && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl">
                    <Label className="text-lg font-semibold text-blue-800 mb-3 block">Skills You Want to Learn</Label>
                    <div className="flex space-x-3 mb-3">
                      <Input 
                        placeholder="e.g., Digital Marketing" 
                        value={skillInput} 
                        onChange={(e)=>setSkillInput(e.target.value)} 
                        className="h-11 rounded-xl border-2 border-blue-200 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddSkill} 
                        variant="outline" 
                        className="h-11 px-4 rounded-xl border-2 border-blue-200 hover:bg-blue-100"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="ml-2 hover:text-indigo-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <Label className="text-xl font-bold text-gray-800">Description *</Label>
                <Textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  rows={5} 
                  placeholder="Describe what you'll teach, your experience, and what students will learn..." 
                  required 
                  className="text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Additional Details Section */}
              <div className="space-y-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200">
                <div className="space-y-3">
                  <Label className="text-xl font-bold text-gray-800">Prerequisites</Label>
                  <Textarea 
                    name="prerequisites" 
                    value={form.prerequisites} 
                    onChange={handleChange} 
                    rows={3} 
                    placeholder="What should students know before starting? Any required tools or software?" 
                    className="text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xl font-bold text-gray-800">Learning Outcomes</Label>
                  <Textarea 
                    name="learningOutcomes" 
                    value={form.learningOutcomes} 
                    onChange={handleChange} 
                    rows={3} 
                    placeholder="What will students be able to do after completing this course?" 
                    className="text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Teaching Format Section */}
                <div className="space-y-4">
                  <Label className="text-xl font-bold text-gray-800">Teaching Format</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/50">
                      <Checkbox 
                        id="onlineSessions"
                        checked={form.teachingFormat.onlineSessions}
                        onCheckedChange={(checked) => handleTeachingFormatChange('onlineSessions', checked)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <Label htmlFor="onlineSessions" className="text-base font-medium cursor-pointer">Online Sessions</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/50">
                      <Checkbox 
                        id="inPersonSessions"
                        checked={form.teachingFormat.inPersonSessions}
                        onCheckedChange={(checked) => handleTeachingFormatChange('inPersonSessions', checked)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <Label htmlFor="inPersonSessions" className="text-base font-medium cursor-pointer">In-Person Sessions</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/50">
                      <Checkbox 
                        id="flexibleSchedule"
                        checked={form.teachingFormat.flexibleSchedule}
                        onCheckedChange={(checked) => handleTeachingFormatChange('flexibleSchedule', checked)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <Label htmlFor="flexibleSchedule" className="text-base font-medium cursor-pointer">Flexible Schedule</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/50">
                      <Checkbox 
                        id="provideMaterials"
                        checked={form.teachingFormat.provideMaterials}
                        onCheckedChange={(checked) => handleTeachingFormatChange('provideMaterials', checked)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <Label htmlFor="provideMaterials" className="text-base font-medium cursor-pointer">Provide Materials</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button 
                  type="button" 
                  onClick={handleSaveDraft}
                  disabled={isDraftLoading}
                  variant="outline" 
                  className="px-8 py-3 text-base rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDraftLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save as Draft'
                  )}
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 text-base rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Skill'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}