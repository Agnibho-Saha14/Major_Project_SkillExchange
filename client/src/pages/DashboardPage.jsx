import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import Navbar from "../components/Navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PostedSkills from "./PostedSkills"
import EnrolledSkills from "./EnrolledSkills" 
import PreferencesEditor from "../components/PreferencesEditor";
import ProposalsDashboard from "./ProposalsDashboard"// ADDED: Import the new component

export default function DashboardPage() {
  const [tab, setTab] = useState("posted")
  const { user, isLoaded } = useUser()
  // if (isLoaded && user) {
  //   console.log("Your Clerk User ID is:", user.id);
  // }

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
            <TabsTrigger value="proposals">Exchange Proposals</TabsTrigger>
            <TabsTrigger value="preferences">AI Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="posted">
            <PostedSkills />
          </TabsContent>

          <TabsContent value="enrolled">
            {/* MODIFIED: Use the EnrolledSkills component */}
            <EnrolledSkills /> 
          </TabsContent>
          <TabsContent value="proposals">
            <ProposalsDashboard />
          </TabsContent>
          <TabsContent value="preferences">
            <div className="max-w-4xl">
              <PreferencesEditor />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}