import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { BookOpen } from "lucide-react"
import { UserButton } from "@clerk/clerk-react"

export default function Navbar() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Title */}
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <Link to="/" className="text-2xl font-bold text-gray-900">SkillExchange</Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/browse" className="text-gray-700 hover:text-indigo-600 transition-colors">Browse Skills</Link>
            <Link to="/publish" className="text-gray-700 hover:text-indigo-600 transition-colors">Teach a Skill</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 transition-colors">Dashboard</Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild><Link to="/login">Login</Link></Button>
            <Button asChild><Link to="/signup">Sign Up</Link></Button>
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}
