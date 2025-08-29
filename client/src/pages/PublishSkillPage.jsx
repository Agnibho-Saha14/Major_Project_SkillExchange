import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen } from "lucide-react"
import { Link } from "react-router-dom"

export default function PublishSkillPage() {
  const [form, setForm] = useState({
    title: "", instructor: "", category: "", level: "", duration: "", timePerWeek: "",
    price: "", paymentOptions: "paid", description: ""
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert("Skill submitted: " + JSON.stringify(form, null, 2))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">SkillExchange</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-indigo-600">Home</Link>
              <Link to="/browse" className="text-gray-700 hover:text-indigo-600">Browse Skills</Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader><CardTitle>Share Your Skill</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Skill Title</Label>
                <Input name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <Label>Instructor Name</Label>
                <Input name="instructor" value={form.instructor} onChange={handleChange} required />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input name="category" value={form.category} onChange={handleChange} />
                </div>
                <div>
                  <Label>Level</Label>
                  <Select value={form.level} onValueChange={(v)=>setForm({...form,level:v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Duration</Label><Input name="duration" value={form.duration} onChange={handleChange} /></div>
                <div><Label>Time/Week</Label><Input name="timePerWeek" value={form.timePerWeek} onChange={handleChange} /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Price (₹)</Label><Input type="number" name="price" value={form.price} onChange={handleChange} /></div>
                <div><Label>Payment Option</Label>
                  <Select value={form.paymentOptions} onValueChange={(v)=>setForm({...form,paymentOptions:v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="exchange">Exchange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" value={form.description} onChange={handleChange} rows={4} />
              </div>
              <Button type="submit">Publish</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
