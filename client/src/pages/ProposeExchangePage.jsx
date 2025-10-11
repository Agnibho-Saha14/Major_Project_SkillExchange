import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
// NOTE: Assuming Toast component is custom or imported from your library
// import Toast from "@/components/Toast"; 
import { useAuth, useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, MessageSquare, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
// NOTE: Assuming Navbar component is imported from components
import Navbar from "@/components/Navbar"; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simple Toast component placeholder (You may need to define this in your components)
const Toast = ({ message, type, onClose }) => {
    if (!message) return null;
    const color = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl text-white ${color} z-50 flex items-center`}>
            {type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold">X</button>
        </div>
    );
};


export default function ProposeExchangePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  // State passed from SkillDetailPage
  const { 
    skillId, 
    instructorName, 
    courseTitle, 
    wantedSkills: instructorWantedSkills 
  } = location.state || {};

  // Local form state
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    if (!skillId) {
      // If no skill details were passed, redirect away
      navigate('/browse');
      return;
    }
    // Redirect if not signed in (protected route should handle this, but double check)
    if (isLoaded && !isSignedIn) {
      navigate('/signup');
    }
  }, [skillId, isLoaded, isSignedIn, navigate]);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 5000);
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setOfferedSkills([...offeredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setOfferedSkills(offeredSkills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (offeredSkills.length === 0 || !message.trim()) {
      showToast('Please list at least one skill you offer and include a message.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = await getToken();

      const proposalData = {
        skillId,
        offeredSkills,
        message,
      };

      const response = await fetch(`${API_BASE_URL}/exchange/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Pass JWT for authentication
        },
        body: JSON.stringify(proposalData),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Proposal submitted! Check your dashboard for updates.', 'success');
        
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        showToast(result.message || 'Failed to submit proposal.', 'error');
      }
    } catch (error) {
      console.error('Network error:', error);
      showToast('Failed to connect to server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!skillId) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">Missing skill details. Please try again from the skill page.</p>
            <Button onClick={() => navigate('/browse')}>Browse Skills</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Assuming Navbar is rendered outside the main content */}
      {/* <Navbar /> */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

        <Link to={`/skills/${skillId}`}>
          <Button variant="outline" className="mb-6 hover:bg-indigo-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {courseTitle}
          </Button>
        </Link>
        
        <Card className="shadow-2xl rounded-3xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8">
            <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
              <MessageSquare className="h-8 w-8" />
              Propose Skill Exchange
            </CardTitle>
            <p className="text-blue-100 text-center mt-2">
              For: <span className='font-semibold'>{courseTitle}</span> (Instructor: {instructorName})
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8 py-8">

              {/* Instructor's Wanted Skills */}
              <div className="p-5 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
                  <Label className="text-lg font-bold text-yellow-800 mb-3 block">Instructor is Interested in:</Label>
                  <div className="flex flex-wrap gap-2">
                      {instructorWantedSkills && instructorWantedSkills.length > 0 ? (
                          instructorWantedSkills.map((skill, index) => (
                              <span key={index} className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                  {skill}
                              </span>
                          ))
                      ) : (
                          <p className="text-sm text-yellow-700 italic">The instructor hasn't specified any skills.</p>
                      )}
                  </div>
                  <p className="text-xs text-yellow-700 mt-3">Propose a skill that matches their interests, or something else valuable!</p>
              </div>

              {/* Skills Offered by Proposer */}
              <div className="p-5 border-2 border-blue-200 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50">
                <Label className="text-xl font-bold text-blue-800 mb-3 block">Your Offered Skill(s) *</Label>
                <div className="flex space-x-3 mb-3">
                  <Input 
                    placeholder="e.g., Advanced SEO, Video Editing" 
                    value={skillInput} 
                    onChange={(e) => setSkillInput(e.target.value)} 
                    className="h-11 rounded-xl border-2 border-blue-200 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddSkill} 
                    variant="outline" 
                    className="h-11 px-4 rounded-xl border-2 border-blue-200 hover:bg-blue-100"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {offeredSkills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="ml-2 hover:text-indigo-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Message to Instructor */}
              <div className="space-y-3">
                <Label className="text-xl font-bold text-gray-800">Your Proposal Message *</Label>
                <Textarea 
                  name="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  rows={5} 
                  placeholder={`Explain why your offered skill(s) are valuable, and how the exchange will work...`} 
                  required 
                  className="text-base rounded-2xl border-2 border-gray-200 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit"
                  disabled={isSubmitting || offeredSkills.length === 0 || !message.trim()}
                  className="w-full px-8 py-3 text-base rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Proposal...
                    </>
                  ) : (
                    'Submit Exchange Proposal'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {/* <Navbar /> */} 
    </div>
  );
}