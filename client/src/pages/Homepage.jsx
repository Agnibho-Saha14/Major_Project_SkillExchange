// client/src/pages/Homepage.jsx
import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Search, ArrowRight, BookOpen, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import UserPostedSkills from "./UserPostedSkills"
import Navbar from "../components/Navbar"
import CTASection from "@/components/CTASection"
import SkillCard from "../components/SkillCard" // Make sure this path is correct

export default function HomePage() {
  const { user, isSignedIn } = useUser();
  const [allSkills, setAllSkills] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  // Fetch all skills to match against ML recommendations
  useEffect(() => {
    const fetchAllSkills = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/skills");
        const data = await response.json();
        if (data.success) {
          setAllSkills(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch skills for recommendations", error);
      } finally {
        setLoadingRecommended(false);
      }
    };

    if (isSignedIn) {
      fetchAllSkills();
    }
  }, [isSignedIn]);

  // Extract the titles the Python script saved to Clerk
  const recommendedTitles = user?.publicMetadata?.recommendedCourses || [];
  
  // Filter the full DB objects based on the recommended string titles
  const recommendedSkills = allSkills
    .filter(skill => recommendedTitles.includes(skill.title))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Learn Any Skill, <span className="text-indigo-600">Teach What You Know</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with skilled individuals in your community. Learn new skills by paying or exchanging your expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <Link to="/browse"><Search className="mr-2 h-5 w-5" />Explore Skills</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent" asChild>
              <Link to="/publish"><BookOpen className="mr-2 h-5 w-5" />Share Your Skill</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 🔥 NEW: ML Recommended Section */}
      {isSignedIn && recommendedSkills.length > 0 && !loadingRecommended && (
        <section className="py-16 bg-white border-y border-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-3xl font-bold text-gray-900">Recommended for You</h2>
                </div>
                <p className="text-lg text-gray-600">Curated by our AI based on your onboarding interests</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedSkills.map(skill => (
                <SkillCard key={skill._id} skill={skill} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Rated Skills */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Rated Skills</h2>
              <p className="text-lg text-gray-600">Explore the best skills in our community</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/browse">View All<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          
          <UserPostedSkills limit={6} sort="rating" />
          <CTASection/>
        </div>
      </section>
            
    </div>
  )
}