import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import Navbar from "../components/Navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PostedSkills from "./PostedSkills"
import EnrolledSkills from "./EnrolledSkills" // ADDED: Import the new component

export default function DashboardPage() {
  const [tab, setTab] = useState("posted")
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="posted">My Posted Skills</TabsTrigger>
            <TabsTrigger value="enrolled">Enrolled Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="posted">
            <PostedSkills />
          </TabsContent>

          <TabsContent value="enrolled">
            {/* MODIFIED: Use the EnrolledSkills component */}
            <EnrolledSkills /> 
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}