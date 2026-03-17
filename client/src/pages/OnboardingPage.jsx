import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { X, Sparkles, PlusCircle, CheckCircle2, ChevronRight, GraduationCap } from "lucide-react";

// Grouped skills for better cognitive load / UX
const SKILL_CATEGORIES = [
  {
    title: "Tech & Coding",
    skills: ["Python", "React", "Machine Learning", "Data Structures", "Algorithms", "Database Management"]
  },
  {
    title: "Creative & Design",
    skills: ["UI/UX Design", "Interior Design", "Photography", "Video Editing", "Graphic Design"]
  },
  {
    title: "Business & Languages",
    skills: ["Japanese", "Digital Marketing", "Content Writing", "Public Speaking"]
  }
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already completed or load existing skills
  useEffect(() => {
    if (isLoaded && user) {
      if (user.unsafeMetadata?.onboardingComplete) {
        navigate("/", { replace: true });
      } else if (user.unsafeMetadata?.savedSkills) {
        setSkills(user.unsafeMetadata.savedSkills);
      }
    }
  }, [isLoaded, user, navigate]);

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

  const handleCompleteOnboarding = async () => {
    if (skills.length < 3) {
      setError("Please select at least 3 skills to curate your dashboard.");
      return;
    }

    setIsLoading(true);
    try {
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingComplete: true,
          savedSkills: skills,
          lastUpdated: new Date().toISOString()
        }
      });

      await user?.reload();
      navigate("/");
    } catch (err) {
      console.error("Onboarding Error:", err);
      setError("Something went wrong saving your preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>;

  const progressPercentage = Math.min((skills.length / 3) * 100, 100);
  const isReady = skills.length >= 3;

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col items-center pt-16 px-6 font-sans pb-40 relative selection:bg-zinc-200">
      
      <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <GraduationCap className="text-zinc-900 w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
            What are your interests?
          </h1>
          <p className="text-lg text-zinc-500 max-w-md mx-auto">
            Select 3 or more skills to personalize your learning and teaching dashboard.
          </p>
        </div>

        {/* Progress Bar UI */}
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex justify-between items-center text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Your Setup Progress</span>
            <span className={isReady ? "text-emerald-600" : "text-zinc-400"}>
              {skills.length} / 3 Selected
            </span>
          </div>
          <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${isReady ? 'bg-emerald-500' : 'bg-zinc-900'}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Custom Input Area */}
        <div className="relative group max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <PlusCircle className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          </div>
          <Input 
            type="text" 
            value={currentSkill} 
            onChange={(e) => setCurrentSkill(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search or type a custom skill and hit enter..."
            className="pl-12 py-7 text-lg rounded-2xl border-zinc-200 bg-white focus-visible:ring-zinc-900 focus-visible:ring-2 shadow-sm transition-all"
          />
        </div>

        {/* Selected Skills Basket (Only shows if skills exist) */}
        {skills.length > 0 && (
          <div className="max-w-xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-wrap gap-2.5 p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm min-h-[90px]">
              {skills.map(skill => (
                <button
                  key={skill}
                  onClick={() => removeSkill(skill)}
                  className="group flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-50 hover:text-red-600 hover:ring-1 hover:ring-red-200"
                >
                  {skill} 
                  <X className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl text-center border border-red-100 animate-in shake">
            {error}
          </div>
        )}

        {/* Categorized Suggestions */}
        <div className="max-w-2xl mx-auto space-y-10 pt-4">
          {SKILL_CATEGORIES.map((category) => (
            <div key={category.title} className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                {category.title}
                <div className="h-px bg-zinc-200 flex-1 ml-2" />
              </h3>
              <div className="flex flex-wrap gap-3">
                {category.skills.map(skill => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSuggestedSkill(skill)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-2
                        ${isSelected 
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-400 opacity-60 hover:opacity-100' 
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 hover:shadow-md'
                        }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4 opacity-50" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Floating Action Bar (Appears when 3 skills are selected) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-zinc-200 transform transition-all duration-500 ease-in-out flex justify-center z-50
          ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
      >
        <div className="max-w-md w-full flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-emerald-600 font-medium">
            <Sparkles className="w-5 h-5" />
            <span>Dashboard Ready</span>
          </div>
          <Button 
            onClick={handleCompleteOnboarding} 
            disabled={isLoading || !isReady}
            className="w-full sm:w-auto flex-1 py-7 text-lg rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group"
          >
            {isLoading ? "Curating Dashboard..." : "Enter Skill Exchange"} 
            {!isLoading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </div>
      </div>

    </div>
  );
}