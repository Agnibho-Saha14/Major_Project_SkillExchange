import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock, BookOpen, IndianRupee } from "lucide-react"
import { Link } from "react-router-dom"

const fetchUserPostedSkills = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return [
    {
      id: 1,
      title: "Learn to Drive Manual Car",
      instructor: "Rajesh Kumar",
      rating: 4.9,
      price: 3500,
      duration: "2 weeks",
      timePerWeek: "4 hours",
      category: "Driving",
      image: "/driving-lessons.png",
      postedDate: "2024-01-20",
      paymentOptions: ["paid"],
    },
    {
      id: 2,
      title: "Classical Indian Cooking",
      instructor: "Meera Patel",
      rating: 4.8,
      price: 2000,
      duration: "3 weeks",
      timePerWeek: "3 hours",
      category: "Cooking",
      image: "/indian-cooking.png",
      postedDate: "2024-01-19",
      paymentOptions: ["paid", "exchange"],
      skillsWanted: ["Baking", "Photography"],
    },
  ]
}

export function UserPostedSkills() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSkills = async () => {
      const userSkills = await fetchUserPostedSkills()
      setSkills(userSkills.slice(0, 6))
      setLoading(false)
    }
    loadSkills()
  }, [])

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-300"></div>
            <CardHeader>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Skills Posted Yet</h3>
        <Button asChild>
          <Link to="/publish">Share Your First Skill</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {skills.map((skill) => (
        <Card key={skill.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-video bg-gray-200">
            <img src={skill.image} alt={skill.title} className="w-full h-full object-cover" />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <Badge variant="secondary">{skill.category}</Badge>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{skill.rating}</span>
              </div>
            </div>
            <CardTitle className="text-lg">{skill.title}</CardTitle>
            <CardDescription>by {skill.instructor}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {skill.timePerWeek}/week
              </div>
              <div className="text-sm text-gray-600">{skill.duration}</div>
            </div>
            <div className="flex gap-1 mb-4">
              {skill.paymentOptions.includes("paid") && <Badge variant="outline">Paid</Badge>}
              {skill.paymentOptions.includes("exchange") && <Badge variant="outline">Exchange</Badge>}
            </div>
            {skill.paymentOptions.includes("exchange") && skill.skillsWanted && (
              <div className="text-xs text-blue-600 mb-3">Wants: {skill.skillsWanted.join(", ")}</div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                <span className="font-medium">{skill.price}</span>
              </div>
              <Button asChild size="sm">
                <Link to={`/skill/${skill.id}`}>View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
