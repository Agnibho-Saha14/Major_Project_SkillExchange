import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, PlusCircle, CheckCircle2, Save, Loader2, Sparkles } from "lucide-react";

// Same categories from your onboarding page
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

export default function PreferencesEditor() {
  const { user, isLoaded } = useUser();
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Load existing skills when the component mounts
  useEffect(() => {
    if (isLoaded && user?.unsafeMetadata?.savedSkills) {
      setSkills(user.unsafeMetadata.savedSkills);
    }
  }, [isLoaded, user]);

  const handleAddSkill = (skillToAdd) => {
    const trimmed = skillToAdd.trim();
    if (trimmed !== "" && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setCurrentSkill("");
    setError("");
    setSuccessMsg("");
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
    setSuccessMsg("");
  };

  const toggleSuggestedSkill = (skill) => {
    if (skills.includes(skill)) removeSkill(skill);
    else handleAddSkill(skill);
  };

  const handleSavePreferences = async () => {
    if (skills.length < 3) {
      setError("Please select at least 3 skills.");
      return;
    }

    setIsLoading(true);
    setSuccessMsg("");
    setError("");

    try {
      // 1. Update frontend Clerk Metadata instantly
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          savedSkills: skills,
          lastUpdated: new Date().toISOString()
        }
      });

      // 2. Ping Node backend to trigger the Python ML Server
      // We reuse the /onboard endpoint because it does exactly what we need:
      // Pings ML server -> saves recommendations to publicMetadata -> returns
      const response = await fetch("http://localhost:5000/api/users/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, skills: skills })
      });

      if (!response.ok) throw new Error("Failed to reach recommendation server");

      // 3. Reload user to sync the fresh AI recommendations
      await user?.reload();
      
      setSuccessMsg("Preferences updated! Your homepage recommendations have been refreshed.");
      setTimeout(() => setSuccessMsg(""), 5000);
      
    } catch (err) {
      console.error(err);
      setError("Failed to retune recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return <div className="animate-pulse h-40 bg-zinc-100 rounded-xl"></div>;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-8">
      
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" /> AI Learning Interests
        </h2>
        <p className="text-zinc-500 mt-1">
          Adjust your skills to retune the AI recommendations on your homepage.
        </p>
      </div>

      {/* Selected Skills Basket */}
      <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-xl min-h-[80px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Interests</span>
          <span className={`text-sm font-bold ${skills.length >= 3 ? 'text-emerald-600' : 'text-amber-500'}`}>
            {skills.length} / 3 Minimum
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <button
              key={skill}
              onClick={() => removeSkill(skill)}
              className="group flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
            >
              {skill} <X className="h-4 w-4 text-zinc-400 group-hover:text-red-500" />
            </button>
          ))}
          {skills.length === 0 && <p className="text-sm text-zinc-400 italic">No skills selected.</p>}
        </div>
      </div>

      {/* Custom Input */}
      <div className="flex gap-3">
        <Input 
          type="text" 
          value={currentSkill} 
          onChange={(e) => setCurrentSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(currentSkill)}
          placeholder="Add a custom skill..."
          className="flex-1"
        />
        <Button onClick={() => handleAddSkill(currentSkill)} variant="secondary">Add</Button>
      </div>

      {/* Categorized Suggestions */}
      <div className="space-y-6 pt-4 border-t border-zinc-100">
        {SKILL_CATEGORIES.map((category) => (
          <div key={category.title} className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map(skill => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSuggestedSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-1.5
                      ${isSelected 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900'
                      }`}
                  >
                    {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5 opacity-50" />}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Status Messages */}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
      {successMsg && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-100">{successMsg}</div>}

      {/* Save Button */}
      <div className="pt-4 flex justify-end">
        <Button 
          onClick={handleSavePreferences} 
          disabled={skills.length < 3 || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Retuning AI...</> : <><Save className="w-4 h-4 mr-2" /> Save & Update AI</>}
        </Button>
      </div>

    </div>
  );
}