import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth, useUser } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Plus, X, CheckCircle, AlertCircle, Loader2, Edit, BookCopy } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function Toast({ message, type, onClose }) {
  if (!message) return null

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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

export default function EditSkillPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { isSignedIn, isLoaded } = useUser()
  const { getToken } = useAuth()

  const [form, setForm] = useState({
    title: "",
    instructor: "",
    category: "",
    level: "",
    duration: "",
    timePerWeek: "",
    price: "",
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
    },
    modules: []
  })

  const originalPrice = useRef(0);
  const [currentModule, setCurrentModule] = useState({ title: "", description: "" });
  const [skillInput, setSkillInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [toast, setToast] = useState({ message: '', type: '' })

  // Redirect logic
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/signup");
    }
  }, [isLoaded, isSignedIn, navigate]);

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: '' }), 5000)
  }

  // Fetch skill data for editing
  useEffect(() => {
    const fetchSkillData = async () => {
      if (!id || !isLoaded || !isSignedIn) return

      setIsPageLoading(true)
      try {
        const token = await getToken()
        const response = await fetch(`${API_BASE_URL}/skills/${id}/edit`, {
          headers: { Authorization: `Bearer ${token}` }
        })


        const result = await response.json()

        if (result.success) {
          const skillData = result.data
          setForm({
            title: skillData.title || "",
            instructor: skillData.instructor || "",
            category: skillData.category || "",
            level: skillData.level || "",
            duration: skillData.duration || "",
            timePerWeek: skillData.timePerWeek || "",
            price: skillData.price || "",
            paymentOptions: skillData.paymentOptions || "paid",
            description: skillData.description || "",
            skills: skillData.skills || [],
            prerequisites: skillData.prerequisites || "",
            learningOutcomes: skillData.learningOutcomes || "",
            teachingFormat: skillData.teachingFormat || {
              onlineSessions: false,
              inPersonSessions: false,
              flexibleSchedule: false,
              provideMaterials: false
            },
            modules: skillData.modules || []
          })
          console.log("Fetched skillData.modules:", skillData.modules);
          originalPrice.current = (skillData.price || "");
        } else {
          showToast(result.message || 'Failed to fetch skill data', 'error')
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('Error fetching skill:', error)
        showToast('Failed to load skill data', 'error')
        navigate('/dashboard')
      } finally {
        setIsPageLoading(false)
      }
    }

    fetchSkillData()
  }, [id, isLoaded, isSignedIn, getToken, navigate])

  const handleChange = (e) => {
    // Prevent price changes
    if (e.target.name === 'price') return

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

  const handleAddModule = () => {
    if (!currentModule.title.trim() || !currentModule.description.trim()) {
      showToast("Please enter module title and description", "error");
      return;
    }
    setForm(prev => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          ...currentModule,
          order: prev.modules.length + 1,
          // Initialize with an empty videos array

        }
      ]
    }));


    setCurrentModule({ title: "", description: "" }); // Reset module input
  };

  const removeModule = (index) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }));
  };


  const handleTeachingFormatChange = (field, checked) => {
    setForm({
      ...form,
      teachingFormat: {
        ...form.teachingFormat,
        [field]: checked
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const requiredFields = ['title', 'instructor', 'category', 'level', 'duration', 'timePerWeek', 'description']
    const emptyFields = requiredFields.filter(field => !String(form[field] || "").trim());


    if (emptyFields.length > 0) {
      showToast(`Please fill in all required fields: ${emptyFields.join(', ')}`, 'error')
      return
    }

    // Validate exchange skills if exchange option is selected
    if ((form.paymentOptions === 'exchange' || form.paymentOptions === 'both') && form.skills.length === 0) {
      showToast('Please add at least one skill you want to learn for exchange options', 'error')
      return
    }

    setIsLoading(true)
    try {
      const updateData = {
        skillData: {
          ...form,
          price: originalPrice.current
        }
      };


      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/skills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (result.success) {
        showToast('Skill updated successfully!', 'success')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } else {
        console.error('Backend error:', result)
        showToast(result.message || 'An error occurred', 'error')
      }
    } catch (error) {
      console.error('Network error:', error)
      showToast('Failed to connect to server. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded || isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading skill data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: '' })}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-2xl rounded-3xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
            <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
              <Edit className="h-8 w-8" />
              Edit Your Skill
            </CardTitle>
            <p className="text-indigo-100 text-center mt-2">Update your skill details</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

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
                    <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
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

              <div className="p-6 border-2 border-gray-200 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50">
                <Label className="text-xl font-bold text-gray-800 mb-4 block">
                  Course Content
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Add the modules you will teach.
                </p>

                {/* Display Added Modules */}
                <div className="space-y-4 mb-6">
                  {form.modules.map((module, modIndex) => (
                    <Card key={modIndex} className="bg-white p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <BookCopy className="h-5 w-5 mr-3 text-teal-600" />
                          <h4 className="font-semibold text-lg">{module.order}. {module.title}</h4>
                        </div>
                        {/* "Add Video" button is GONE. Only remove button remains. */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeModule(modIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 pl-8">{module.description}</p>
                    </Card>
                  ))}
                </div>

                {/* Form to Add New Module */}
                <div className="p-4 bg-white border-2 border-dashed rounded-xl space-y-3">
                  <h4 className="font-semibold text-lg">Add a New Module</h4>
                  <Input
                    placeholder="Module Title (e.g., Module 1: Introduction)"
                    value={currentModule.title}
                    onChange={(e) => setCurrentModule(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Module Description"
                    rows={2}
                    value={currentModule.description}
                    onChange={(e) => setCurrentModule(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddModule}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </div>
              </div>

              {/* Payment Options Section */}
              <div className="p-6 border-2 border-gray-200 rounded-2xl bg-gradient-to-r from-gray-50 to-indigo-50">
                <Label className="text-xl font-bold text-gray-800 mb-4 block">Payment & Exchange Options</Label>
                <RadioGroup
                  value={form.paymentOptions}
                  onValueChange={(v) => setForm({ ...form, paymentOptions: v })}
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

                {/* Conditional Payment Fields - PRICE IS FIXED */}
                {(form.paymentOptions === "paid" || form.paymentOptions === "both") && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl">
                    <Label className="text-lg font-semibold text-orange-800 mb-3 block">Payment Details (Fixed)</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Price (₹)"
                          name="price"
                          value={originalPrice.current}
                          className="h-11 rounded-xl border-2 border-orange-200 bg-orange-50/50 text-gray-600 cursor-not-allowed"
                          disabled
                          min="0"
                          step="0.01"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Fixed</span>
                        </div>
                      </div>
                      <div className="flex items-center text-orange-800 font-medium">
                        Per Course
                      </div>
                    </div>
                    <p className="text-sm text-orange-600 mt-2">
                      💡 Price cannot be changed after skill creation
                    </p>
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
                        onChange={(e) => setSkillInput(e.target.value)}
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
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="px-8 py-3 text-base rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 text-base rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Skill'
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