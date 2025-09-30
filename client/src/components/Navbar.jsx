import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { BookOpen } from "lucide-react"
import { UserButton, useUser } from "@clerk/clerk-react"
import { useEffect, useState } from "react"

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const [greeting, setGreeting] = useState("");

  const teachLink = isSignedIn ? "/publish" : "/signup";
  const dashboardLink = isSignedIn ? "/dashboard" : "/signup";

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Title */}
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <Link to="/" className="text-2xl font-bold text-gray-900">
              SkillExchange
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/browse"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Browse Skills
            </Link>
            <Link
              to={teachLink}
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Teach a Skill
            </Link>
            <Link
              to={dashboardLink}
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Dashboard
            </Link>
          </nav>

          {/* Auth Buttons + Greeting */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                <span className="text-gray-700 font-medium">
                  {greeting}, {user?.firstName || "User"} 👋
                </span>
                <UserButton />
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
