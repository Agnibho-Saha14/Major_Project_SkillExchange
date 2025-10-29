import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, useUser } from "@clerk/clerk-react"
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

export default function PublishSkillPage() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded , user} = useUser()
  const { getToken } = useAuth()

  // ✅ Redirect logic moved to useEffect
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/signup");
    }
  }, [isLoaded, isSignedIn, navigate]);


  const [form, setForm] = useState({
    title: "",
    instructor: "",
    category: "",
    level: "",
    duration: "",
    timePerWeek: "",
    certificateFile: null,
    credentialId: "",
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
    }
  })

  const [skillInput, setSkillInput] = useState("")
  const [certificatePreview, setCertificatePreview] = useState(null);
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

  const handleCertificateChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }
      setForm({ ...form, certificateFile: file });

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCertificatePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setCertificatePreview(null);
      }
    }
  };

  // API call function
  const submitSkill = async (endpoint, successMessage, setLoadingState) => {
    setLoadingState(true);
    try {
      const formData = new FormData();

      const skillData = {
        ...form,
        status: endpoint.includes('draft') ? 'draft' : 'published'
      };

      // Remove certificate file before stringifying
      delete skillData.certificateFile;

      if (form.paymentOptions === 'paid' || form.paymentOptions === 'both') {
        skillData.price = form.price ? parseFloat(form.price) : 0;
      } else {
        skillData.price = 0;
      }

      formData.append('skillData', JSON.stringify(skillData));

      if (form.certificateFile) {
        formData.append('certificate', form.certificateFile);
      }

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Let browser handle FormData content-type
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showToast(successMessage, 'success');
        setTimeout(() => {
          navigate('/');
        }, 2000);

        if (endpoint === '/skills') {
          setForm({
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
            certificateFile: null
          });
          setSkillInput("");
        }
      } else {
        console.error('Backend error:', result);

        if (result.verificationFailed) {
          showToast(
            result.message ||
            'Credential ID verification failed. Please ensure your Credential ID matches exactly with what appears on your certificate.',
            'error'
          );
        } else {
          showToast(result.message || 'An error occurred', 'error');
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      showToast('Failed to connect to server. Please try again.', 'error');
    } finally {
      setLoadingState(false);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault()

    // Updated required fields to include credentialId
    const requiredFields = ['title', 'instructor', 'category', 'level', 'duration', 'timePerWeek', 'description', 'credentialId']
    const emptyFields = requiredFields.filter(field => !form[field] || !form[field].toString().trim())

    if (emptyFields.length > 0) {
      showToast(`Please fill in all required fields: ${emptyFields.join(', ')}`, 'error')
      return
    }

    // Validate certificate upload
    if (!form.certificateFile) {
      showToast('Please upload your certificate', 'error')
      return
    }

    // Validate payment fields if paid option is selected
    if ((form.paymentOptions === 'paid' || form.paymentOptions === 'both') && (!form.price)) {
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
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
                       value={`${user.firstName ?? ""}${user.lastName ? " " + user.lastName : ""}`}
                      onChange={handleChange}
                      required
                      className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                      readOnly
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

              {/*Certificate section*/}
              <div className="p-6 border-2 border-gray-200 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50">
                <Label className="text-xl font-bold text-gray-800 mb-4 block">
                  Learning Credentials
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your certificate with proper Credential ID to verify your expertise
                </p>

                <div className="space-y-4">
                  {/* Credential ID Input */}
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">
                      Credential ID *
                    </Label>
                    <Input
                      name="credentialId"
                      value={form.credentialId}
                      onChange={handleChange}
                      className="h-12 text-base rounded-xl border-2 border-amber-200 focus:border-amber-500 transition-colors"
                      placeholder="Enter your certificate credential ID"
                    />
                  </div>

                  {/* Certificate Upload */}
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-700">
                      Upload Certificate (Image(jpg/jpeg/png)) *
                    </Label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-amber-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-amber-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <BookOpen className="w-10 h-10 mb-3 text-amber-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG or PDF (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleCertificateChange}
                        />
                      </label>
                    </div>

                    {/* Preview */}
                    {form.certificateFile && (
                      <div className="mt-3 p-3 bg-white rounded-xl border-2 border-amber-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {form.certificateFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, certificateFile: null });
                              setCertificatePreview(null);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        {certificatePreview && (
                          <img
                            src={certificatePreview}
                            alt="Certificate preview"
                            className="mt-3 max-h-48 rounded-lg object-contain"
                          />
                        )}
                      </div>
                    )}
                  </div>
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
                      <Select className="h-11 rounded-xl border-2 border-green-200 focus:border-green-500 bg-white">
                        <span className="text-green-800">Per Course</span>
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
                    'Save as Draft(Coming Soon)'
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