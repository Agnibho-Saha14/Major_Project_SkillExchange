import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Filter, Star, Clock, DollarSign, Users } from "lucide-react"
import { Link } from "react-router-dom"

const categories = [
  "All","Programming","Design","Marketing","Music","Language","Fitness","Photography","Cooking",
  "Driving","Technology","Arts & Crafts","Business","Health & Wellness",
]

const levels = ["All", "Beginner", "Intermediate", "Advanced"]

const skills = [
  { id: 1, title: "Learn to Drive Manual Car", instructor: "Rajesh Kumar", rating: 4.9, reviews: 15, price: 3500,
    duration: "2 weeks", timePerWeek: "4 hours", category: "Driving", level: "Beginner", students: 28, paymentOptions: ["paid"], image: "/driving-lessons.png",
    description: "Learn manual car driving with experienced instructor. Includes traffic rules and parking." },
  { id: 2, title: "Classical Indian Cooking", instructor: "Meera Patel", rating: 4.8, reviews: 22, price: 2000,
    duration: "3 weeks", timePerWeek: "3 hours", category: "Cooking", level: "Beginner", students: 18,
    paymentOptions: ["paid", "exchange"], skillsWanted: ["Baking", "Photography"], image: "/indian-cooking.png",
    description: "Master traditional Indian recipes including curries, breads, and desserts." },
]

export default function BrowseSkillsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedLevel, setSelectedLevel] = useState("All")
  const [paymentType, setPaymentType] = useState("All")
  const [showFilters, setShowFilters] = useState(false)

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory
    const matchesLevel = selectedLevel === "All" || skill.level === selectedLevel
    const matchesPayment = paymentType === "All" ||
      (paymentType === "Paid" && skill.paymentOptions.includes("paid")) ||
      (paymentType === "Exchange" && skill.paymentOptions.includes("exchange"))
    return matchesSearch && matchesCategory && matchesLevel && matchesPayment
  })

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
              <Link to="/publish" className="text-gray-700 hover:text-indigo-600">Teach a Skill</Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</Link>
            </nav>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input placeholder="Search skills..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" onClick={()=>setShowFilters(!showFilters)}> <Filter className="h-4 w-4 mr-2"/> Filters </Button>
          </div>
          {showFilters && (
            <Card className="mb-6"><CardContent className="pt-6"><div className="grid md:grid-cols-4 gap-4">
              <div><label className="text-sm">Category</label><Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {categories.map((c)=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent></Select></div>
              <div><label className="text-sm">Level</label><Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {levels.map((l)=><SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent></Select></div>
              <div><label className="text-sm">Payment</label><Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="All">All</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Exchange">Exchange</SelectItem>
                </SelectContent></Select></div>
            </div></CardContent></Card>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map(skill=>(
            <Card key={skill.id} className="overflow-hidden hover:shadow-lg">
              <div className="aspect-video bg-gray-200"><img src={skill.image} alt={skill.title} className="w-full h-full object-cover" /></div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">{skill.category}</Badge>
                  <div className="flex items-center"><Star className="h-4 w-4 text-yellow-400 fill-current"/><span className="ml-1">{skill.rating}</span></div>
                </div>
                <CardTitle className="text-lg">{skill.title}</CardTitle>
                <CardDescription>by {skill.instructor}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{skill.description}</p>
                <div className="flex justify-between"><span className="text-green-600 font-medium">₹{skill.price}</span>
                  <Button asChild size="sm"><Link to={`/skill/${skill.id}`}>View</Link></Button></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
