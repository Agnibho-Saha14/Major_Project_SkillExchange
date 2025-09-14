import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen } from "lucide-react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"


const mockSkills = [
  { id: 1, title: "Driving Lessons", students: 10 },
  { id: 2, title: "Cooking Class", students: 5 },
]

export default function DashboardPage() {
  const [tab, setTab] = useState("posted")
  return (
    <div className="min-h-screen bg-gray-50">
          <Navbar />


      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="posted">My Posted Skills</TabsTrigger>
            <TabsTrigger value="enrolled">Enrolled Skills</TabsTrigger>
          </TabsList>
          <TabsContent value="posted">
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {mockSkills.map(skill=>(
                <Card key={skill.id}><CardHeader><CardTitle>{skill.title}</CardTitle></CardHeader>
                  <CardContent>Students Enrolled: {skill.students}</CardContent></Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="enrolled">
            <p className="mt-4 text-gray-600">You have not enrolled in any skills yet.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
