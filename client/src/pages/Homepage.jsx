import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, MessageCircle, ArrowRight, BookOpen } from "lucide-react"
import { Link } from "react-router-dom"
import { UserPostedSkills } from "./UserPostedSkills"
import { UserButton } from "@clerk/clerk-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">SkillExchange</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/browse" className="text-gray-700 hover:text-indigo-600 transition-colors">Browse Skills</Link>
              <Link to="/publish" className="text-gray-700 hover:text-indigo-600 transition-colors">Teach a Skill</Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 transition-colors">Dashboard</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild><Link to="/login">Login</Link></Button>
              <Button asChild><Link to="/signup">Sign Up</Link></Button>
              <UserButton/>
            </div>
          </div>
        </div>
      </header>
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Learn Any Skill,<span className="text-indigo-600"> Teach What You Know</span></h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">Connect with skilled individuals in your community. Learn new skills by paying or exchanging your expertise.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3" asChild><Link to="/browse"><Search className="mr-2 h-5 w-5" />Explore Skills</Link></Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent" asChild><Link to="/publish"><BookOpen className="mr-2 h-5 w-5" />Share Your Skill</Link></Button>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recently Posted Skills</h2>
              <p className="text-lg text-gray-600">Latest skills shared by our community</p>
            </div>
            <Button variant="outline" asChild><Link to="/browse">View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <UserPostedSkills />
        </div>
      </section>
    </div>
  )
}
