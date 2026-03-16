import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { X, Sparkles, PlusCircle } from "lucide-react";

// Updated with a diverse mix of tech and creative skills
const SUGGESTED_SKILLS = [
  "Python", "Machine Learning", "Data Structures", 
  "React", "Algorithms", "UI/UX Design", 
  "Interior Design", "Photography", "Database Management", 
  "Japanese", "Digital Marketing", "Content Writing"
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

  const toggleSuggestedSkill = (skill) => {
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
    <div className="min-h-screen bg-white flex flex-col items-center pt-24 px-6 font-sans">
      <div className="w-full max-w-2xl space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="text-zinc-900 w-7 h-7" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            What are your interests?
          </h1>
          <p className="text-lg text-zinc-500 max-w-lg mx-auto">
            Select at least 3 skills you want to learn or share to help us curate your perfect dashboard.
          </p>
        </div>

        <form onSubmit={handleCompleteOnboarding} className="space-y-10">
          
          {/* Unified Input Section */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <PlusCircle className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            </div>
            <Input 
              type="text" 
              value={currentSkill} 
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type any skill and press enter..."
              className="pl-12 py-7 text-lg rounded-2xl border-zinc-200 bg-zinc-50/50 focus-visible:ring-zinc-900 focus-visible:bg-white shadow-sm transition-all"
            />
          </div>

          {/* User's Selected Skills (The Basket) */}
          {skills.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Your Selections</span>
                <span className={`text-sm font-medium ${skills.length >= 3 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                  {skills.length}/3 minimum
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5 p-5 bg-zinc-50 border border-zinc-100 rounded-2xl min-h-[80px]">
                {skills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="group flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-red-600 hover:shadow-md"
                  >
                    {skill}
                    <X className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Skills Cloud */}
          <div>
            <span className="text-sm font-semibold text-zinc-900 uppercase tracking-wider block mb-4">Popular Suggestions</span>
            <div className="flex flex-wrap gap-3">
              {SUGGESTED_SKILLS.map(skill => {
                const isSelected = skills.includes(skill);
                // We hide it from suggestions if they already picked it so the screen doesn't look cluttered
                if (isSelected) return null; 
                
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSuggestedSkill(skill)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 text-zinc-600 bg-white hover:border-zinc-900 hover:text-zinc-900 transition-all shadow-sm"
                  >
                    + {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl text-center border border-red-100">
              {error}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-zinc-100">
            <Button 
              type="submit" 
              className="w-full py-7 text-lg rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg transition-all" 
              disabled={skills.length < 3 || isLoading}
            >
              {isLoading ? "Curating your experience..." : "Finish Setup"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}