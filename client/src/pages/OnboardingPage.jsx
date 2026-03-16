import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { X, Plus, Sparkles } from "lucide-react";

// You can customize this list based on your platform's main categories
const POPULAR_SKILLS = [
  "Web Development", "Python", "React", "Machine Learning",
  "UI/UX Design", "Graphic Design", "Digital Marketing",
  "Data Analysis", "Photography", "Public Speaking",
  "Video Editing", "SEO", "Blockchain", "Content Writing"
];

export default function OnboardingPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSkill = (skillToAdd) => {
    const trimmed = skillToAdd.trim();
    if (trimmed !== "" && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setCurrentSkill("");
    setError("");
  };

  const onInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(currentSkill);
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const togglePopularSkill = (skill) => {
    if (skills.includes(skill)) {
      removeSkill(skill);
    } else {
      handleAddSkill(skill);
    }
  };

  const handleCompleteOnboarding = async (e) => {
    e.preventDefault();
    
    if (skills.length < 3) {
      setError("Please add at least 3 skills or interests.");
      return;
    }

    setIsLoading(true);
    try {
      // ONLY update the metadata, completely skip the name
      await user?.update({
        unsafeMetadata: {
          onboardingComplete: true,
          savedSkills: skills 
        }
      });

      await user?.reload();
      navigate("/");
      
    } catch (err) {
      console.error("Error during onboarding:", err);
      const clerkError = err.errors?.[0]?.longMessage || err.message;
      setError(`Clerk Error: ${clerkError}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-xl shadow-lg border-gray-200">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto bg-primary/10 w-12 h-12 flex items-center justify-center rounded-full mb-4">
            <Sparkles className="text-primary w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Personalize Your Feed</CardTitle>
          <CardDescription className="text-base mt-2">
            What do you want to learn or share? Select at least 3 skills to help us curate your perfect dashboard.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleCompleteOnboarding} className="space-y-8">
            
            {/* 1. Quick Select: Popular Skills Cloud */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Popular Interests</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.slice(0, 10).map(skill => {
                  const isSelected = skills.includes(skill);
                  return (
                    <Badge
                      key={skill}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all py-1.5 px-3 text-sm font-medium ${
                        isSelected 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                          : 'hover:border-blue-400 hover:bg-blue-50 text-gray-600'
                      }`}
                      onClick={() => togglePopularSkill(skill)}
                    >
                      {skill}
                      {isSelected && <X className="ml-1.5 h-3 w-3 inline" />}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* 2. Dropdown & Custom Input */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Add Specific Skills</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                
                {/* Select Dropdown */}
                <Select onValueChange={(val) => handleAddSkill(val)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Browse categories..." />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_SKILLS.map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Custom Type Input */}
                <div className="flex-1 flex gap-2">
                  <Input 
                    type="text" 
                    value={currentSkill} 
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder="Type any skill & press enter..."
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => handleAddSkill(currentSkill)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>

            {/* 3. Final Selected Skills Display Basket */}
            <div className="bg-gray-100/50 p-4 rounded-lg border border-gray-200 min-h-[100px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">Your Selections</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${skills.length >= 3 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {skills.length}/3 minimum
                </span>
              </div>
              
              {skills.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-2">No skills selected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="pl-3 pr-2 py-1.5 flex items-center gap-1 bg-white border border-gray-300 shadow-sm text-gray-800 text-sm">
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => removeSkill(skill)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 focus:outline-none rounded-full p-0.5 transition-colors ml-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">{error}</p>}

            <Button 
              type="submit" 
              className="w-full text-base py-6 bg-blue-600 hover:bg-blue-700 transition-colors" 
              disabled={skills.length < 3 || isLoading}
            >
              {isLoading ? "Curating your dashboard..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}