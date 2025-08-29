import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen,IndianRupee, Clock, Star } from "lucide-react"

const mockSkills = [
  { id: "1", title: "Driving Lessons", instructor: "Rajesh Kumar", price: 3500, rating: 4.9, duration: "2 weeks", description: "Learn driving.", category: "Driving" },
  { id: "2", title: "Cooking Class", instructor: "Meera Patel", price: 2000, rating: 4.8, duration: "3 weeks", description: "Learn cooking.", category: "Cooking" },
]

export default function SkillDetailPage() {
  const { id } = useParams()
  const skill = mockSkills.find((s) => s.id === id)
  if (!skill) return <p className="p-8">Skill not found</p>

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
              <Link to="/publish" className="text-gray-700 hover:text-indigo-600">Teach a Skill</Link>
            </nav>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto p-8">
        <Card>
          <CardHeader><CardTitle>{skill.title}</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-2">Instructor: {skill.instructor}</p>
            <p className="mb-2 flex items-center"><Star className="h-4 w-4 text-yellow-400 mr-1"/> {skill.rating}</p>
            <p className="mb-2 flex items-center"><Clock className="h-4 w-4 mr-1"/> {skill.duration}</p>
            <p className="mb-2 flex items-center"> <IndianRupee className="h-4 w-4 mr-1 text-green-600" />{skill.price}</p>
            <p className="mt-4">{skill.description}</p>
            <Button className="mt-4">Enroll Now</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
