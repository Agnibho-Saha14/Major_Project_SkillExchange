import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { loadStripe } from '@stripe/stripe-js';
import { useUser, useAuth } from '@clerk/clerk-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
import {
  BookOpen,
  IndianRupee,
  Clock,
  Star,
  User,
  Calendar,
  Award,
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Shield,
  Maximize2,
  X,
  ChevronDown,
  PlayCircle,
  Plus
} from "lucide-react";
// Import useParams to get URL parameters
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* -------------------------------------- */
/* ---------- Helper Components --------- */
/* -------------------------------------- */

function VideoModal({ videoUrl, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-6xl">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            key={isOpen ? 'modal-video' : 'hidden'}
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-auto max-h-[85vh]"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}


function StarRating({ rating = 0, size = "md", showNumber = true }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={i}
        className={`${size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"} fill-yellow-400 text-yellow-400`}
      />
    );
  }

  if (hasHalfStar) {
    stars.push(
      <div key="half" className="relative">
        <Star className={`${size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"} text-gray-300`} />
        <div className="absolute inset-0 overflow-hidden w-1/2">
          <Star className={`${size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"} fill-yellow-400 text-yellow-400`} />
        </div>
      </div>
    );
  }

  const emptyStars = 5 - Math.ceil(rating || 0);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star key={`empty-${i}`} className={`${size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"} text-gray-300`} />
    );
  }

  return (
    <div className="flex items-center">
      {stars}
      {showNumber && <span className="ml-2 text-gray-600 font-medium">{(rating || 0).toFixed(1)}</span>}
    </div>
  );
}

function InteractiveStarRating({ rating, onRatingChange, size = "lg" }) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    onRatingChange(value);
  };

  const handleMouseEnter = (value) => {
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const starSizeClass = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          onMouseEnter={() => handleMouseEnter(value)}
          onMouseLeave={handleMouseLeave}
          className="focus:outline-none transition-colors hover:scale-110 transform"
        >
          <Star
            className={`${starSizeClass} cursor-pointer ${value <= (hoverRating || rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 hover:text-yellow-300"
              }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingSection({ skillId, averageRating, totalRatings, onRatingUpdate, isOwnSkill, isEnrolled }) {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [checkingRating, setCheckingRating] = useState(true);
  const [existingRating, setExistingRating] = useState(null);

  const RATING_PARAMETERS = [
    "Course Content Quality",
    "Instructor Expertise",
    "Clarity of Explanation",
    "Practical Examples",
    "Course Duration",
    "Simplicity and Pace",
    "Engagement/Interactivity",
    "Materials Provided",
    "Value for Money",
    "Overall Learning Experience",
  ];

  const initialParameterRatings = RATING_PARAMETERS.reduce((acc, param) => {
    acc[param] = 0;
    return acc;
  }, {});

  const [parameterRatings, setParameterRatings] = useState(initialParameterRatings);
  const [userComment, setUserComment] = useState("");

  useEffect(() => {
    const checkUserRating = async () => {
      if (!isLoaded || !user || !skillId || !isEnrolled) {
        setCheckingRating(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/skills/${skillId}/my-rating`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (result.success && result.data) {
          setHasRated(result.data.hasRated);
          if (result.data.rating) {
            setExistingRating(result.data.rating);
          }
        }
      } catch (error) {
        console.error('Error checking user rating:', error);
      } finally {
        setCheckingRating(false);
      }
    };

    if (isEnrolled) {
      checkUserRating();
    } else {
      setCheckingRating(false);
    }
  }, [isLoaded, user, skillId, getToken, isEnrolled]);

  const handleParameterRatingChange = (param, value) => {
    setParameterRatings(prev => ({ ...prev, [param]: value }));
  };

  const calculateAverageRating = () => {
    const ratingsArray = Object.values(parameterRatings);
    const ratedArray = ratingsArray.filter(r => r > 0);
    if (ratedArray.length === 0) return 0;
    const sum = ratedArray.reduce((acc, r) => acc + r, 0);
    return Math.round((sum / ratedArray.length) * 10) / 10;
  };

  const formatParameterRatings = (avg) => {
    const breakdown = RATING_PARAMETERS.map(param =>
      `${param}: ${parameterRatings[param]}/5`
    ).join('\n');
    return `Average Rating: ${avg.toFixed(1)}/5\nDetailed Rating Breakdown:\n${breakdown}\n\nUser Comment:\n${userComment.trim()}`;
  };

  const currentAverage = calculateAverageRating();
  const allRated = Object.values(parameterRatings).length === RATING_PARAMETERS.length &&
    Object.values(parameterRatings).every(r => r > 0);

  const handleSubmitRating = async () => {
    if (!allRated) {
      alert("Please rate all 10 parameters before submitting.");
      return;
    }

    const avgRating = calculateAverageRating();
    const formattedComment = formatParameterRatings(avgRating);

    setIsSubmitting(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/skills/${skillId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: avgRating,
          comment: formattedComment, // Send formatted comment
        }),
      });

      const result = await response.json();

      if (result.success) {
        setHasRated(true);
        setExistingRating({
          rating: avgRating,
          comment: formattedComment, // **FIX:** Use formatted comment for optimistic update
          createdAt: new Date()
        });
        setParameterRatings(initialParameterRatings);
        setUserComment("");
        onRatingUpdate(result.data);
      } else {
        if (result.alreadyRated) {
          setHasRated(true);
          alert("You have already rated this skill.");
        } else {
          alert(result.message || "Failed to submit rating");
        }
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Star className="h-6 w-6 text-yellow-400 mr-2" />
          Ratings & Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
          <div>
            <div className="flex items-center space-x-3">
              <StarRating rating={averageRating || 0} size="lg" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{(averageRating || 0).toFixed(1)}</p>
                <p className="text-sm text-gray-600">
                  {totalRatings || 0} {totalRatings === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {checkingRating && (isEnrolled || hasRated) && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
            <span className="text-gray-600">Checking rating status...</span>
          </div>
        )}

        {!checkingRating && isOwnSkill && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center text-blue-800">
              <Shield className="h-5 w-5 mr-2" />
              <span className="font-medium">This is your skill - you cannot rate your own content.</span>
            </div>
          </div>
        )}

        {!checkingRating && hasRated && !isOwnSkill && existingRating && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
            <div className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">You have already rated this skill</span>
            </div>
            <div className="pl-7">
              <div className="flex items-center mb-2">
                <span className="text-sm text-gray-700 mr-2">Your average rating:</span>
                <StarRating rating={existingRating.rating} size="sm" showNumber={false} />
                <span className="ml-2 font-semibold text-gray-900">{existingRating.rating.toFixed(1)}/5</span>
              </div>
              {existingRating.comment && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Your comment:</span>
                  <p className="mt-1 italic whitespace-pre-wrap text-xs md:text-sm">{existingRating.comment}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Submitted on {new Date(existingRating.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {!checkingRating && !hasRated && !isOwnSkill && (
          !user ? (
            <div className="p-4 border-2 border-dashed border-indigo-200 rounded-xl">
              <div className="text-center p-4">
                <p className="text-gray-600 mb-3">Sign in to rate this skill</p>
                <Button
                  onClick={() => window.location.href = '/sign-in'}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign In
                </Button>
              </div>
            </div>
          ) : !isEnrolled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">You must be enrolled in this course to leave a rating.</span>
              </div>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-indigo-200 rounded-xl">
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="h-6 w-6 text-yellow-400 mr-2" fill="currentColor" />
                  Rate This Course (10 Parameters)
                </h3>

                <div className="space-y-6">
                  <div className="space-y-4 p-4 border rounded-xl bg-gray-50">
                    <p className="text-sm font-medium text-gray-800 border-b pb-2 mb-2">
                      Please rate each parameter from 1 to 5 stars:
                    </p>
                    {RATING_PARAMETERS.map((param, index) => (
                      <div key={param} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b last:border-b-0 pb-3">
                        <p className="text-sm font-medium text-gray-700 w-full sm:w-1/2 mb-1 sm:mb-0">
                          {index + 1}. **{param}**:
                        </p>
                        <div className="w-full sm:w-auto">
                          <InteractiveStarRating
                            rating={parameterRatings[param]}
                            onRatingChange={(value) => handleParameterRatingChange(param, value)}
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center">
                    <p className="text-md font-semibold text-indigo-700">Calculated Average Rating:</p>
                    <span className="text-xl font-bold text-indigo-900">
                      {currentAverage.toFixed(1)} / 5
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Comment (optional):</p>
                    <Textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Share your overall experience (this will be submitted along with the detailed breakdown)..."
                      rows={3}
                      className="resize-none rounded-xl border-2 border-gray-200 focus:border-indigo-500"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitRating}
                    disabled={!allRated || isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Detailed Rating...
                      </>
                    ) : (
                      'Submit 10-Parameter Rating'
                    )}
                  </Button>
                  {!allRated && (
                    <p className="text-center text-xs text-red-500 mt-2">
                      Please provide a rating (1-5) for **all 10 parameters** before submitting.
                    </p>
                  )}
                </div>
              </>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------- */
/* --- PROGRESS & PLACEHOLDERS --- */
/* -------------------------------------- */

const CourseProgress = ({ percentage, totalModules, completedModulesCount }) => {
  const progress = Math.min(100, Math.max(0, percentage));

  return (
    <div className="space-y-2 mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
      <div className="flex justify-between items-center text-sm font-medium text-indigo-700">
        <span>Course Progress</span>
        <span>{completedModulesCount}/{totalModules} Modules Complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-right text-xs font-semibold text-indigo-800">{progress}% Complete</p>
    </div>
  );
};

const PlaceholderLine = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${width} ${height}`}></div>
);

const CourseContentPlaceholder = () => {
  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center p-4 bg-gray-50">
          <ChevronDown className="w-5 h-5 text-gray-400 mr-4" />
          <PlaceholderLine width="w-1/3" height="h-5" />
        </div>
        <div className="p-4 space-y-2 bg-white border-t">
          <div className="flex items-center space-x-3 p-2 border-l-2 border-transparent">
            <PlayCircle className="w-5 h-5 text-gray-400" />
            <PlaceholderLine width="w-3/4" />
            <PlaceholderLine width="w-1/6" />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center p-4 bg-gray-50">
          <ChevronDown className="w-5 h-5 text-gray-400 mr-4" />
          <PlaceholderLine width="w-1/4" height="h-5" />
        </div>
      </div>
    </div>
  );
};


/* -------------------------------------- */
/* ---------- SkillDetailPage ----------- */
/* -------------------------------------- */

export default function SkillDetailPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  // **FIX:** Get id from URL params
  const { id } = useParams();
  const [skillId, setSkillId] = useState('');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  // **FIX:** Add state for the modal's video URL
  const [modalVideoUrl, setModalVideoUrl] = useState('');
  const [activeModuleId, setActiveModuleId] = useState(null);

  const [completedModules, setCompletedModules] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    // **FIX:** Set skillId from URL params
    if (id) {
      setSkillId(id);
    }
  }, [id]);

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

// Inside export default function SkillDetailPage() { ... }

// ... other state definitions

const isOwnSkill = userLoaded && user && skill &&
  (user.emailAddresses[0]?.emailAddress === skill.email ||
    user.emailAddresses.some(email => email.emailAddress === skill.email));

// Wrapped fetching logic in useCallback
const fetchSkillDetails = useCallback(async () => {
  if (!skillId) return;

  setLoading(true);
  setError('');

  try {
    const response = await fetch(`${API_BASE_URL}/skills/${skillId}`);
    const result = await response.json();

    if (result.success) {
      setSkill(result.data);
    } else {
      setError(result.message || 'Skill not found');
    }
  } catch (err) {
    console.error('Error fetching skill details:', err);
    setError('Failed to load skill details. Please try again.');
  } finally {
    setLoading(false);
  }
}, [skillId]);

// Wrapped enrollment check logic in useCallback
const checkEnrollmentStatus = useCallback(async () => {
  if (!userLoaded || !user || !skillId) {
    setIsEnrolled(false);
    setCompletedModules([]);
    setProgressPercentage(0);
    return;
  }

  setEnrollmentLoading(true);

  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/enrollments/check/${skillId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setIsEnrolled(result.data.isEnrolled);
      if (result.data.isEnrolled) {
          setCompletedModules(result.data.completedModules || []);
          setProgressPercentage(result.data.progressPercentage || 0);
      } else {
          setCompletedModules([]);
          setProgressPercentage(0);
      }
    } else {
      setIsEnrolled(false);
      setCompletedModules([]);
      setProgressPercentage(0);
    }
  } catch (err) {
    console.error('Error checking enrollment status:', err);
    setIsEnrolled(false);
  } finally {
    setEnrollmentLoading(false);
  }
}, [userLoaded, user, skillId, getToken]); // Dependencies

const handleCompleteModule = useCallback(async (moduleId, moduleTitle) => {
  if (!isEnrolled || isOwnSkill) return; // Prevent creator from using button
  
  // Note: We use the state directly here because dependency checking ensures we only run if the state is current enough.
  if (completedModules.includes(moduleId) || enrollmentLoading) {
      alert(`Module "${moduleTitle}" is already marked as complete.`);
      return;
  }

  // Optimistic UI update
  setCompletedModules(prev => [...prev, moduleId]);

  try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/enrollments/complete-module/${skillId}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ moduleId })
      });
      
      const result = await response.json();

      if (result.success) {
          setCompletedModules(result.data.completedModules);
          setProgressPercentage(result.data.progressPercentage);
      } else {
          // Revert optimistic update on failure
          setCompletedModules(prev => prev.filter(id => id !== moduleId));
          alert(`Failed to mark module as complete: ${result.message}`);
      }
  } catch (error) {
      console.error("Error marking module complete:", error);
      // Revert optimistic update on failure
      setCompletedModules(prev => prev.filter(id => id !== moduleId));
      alert("An unexpected error occurred. Could not mark module as complete.");
  }
}, [isEnrolled, isOwnSkill, skillId, getToken, enrollmentLoading, completedModules]); // IMPORTANT: completedModules is a dependency because we read it.

// ... rest of the component // **FIX:** Removed completedModules dependency

// Fetch skill details when skillId changes
  useEffect(() => {
    if (skillId) {
      fetchSkillDetails();
    }
  }, [skillId, fetchSkillDetails]);

  // Check enrollment status when dependencies change
  useEffect(() => {
    if (userLoaded && skillId && skill) {
        checkEnrollmentStatus();
    }
  }, [userLoaded, user, skillId, skill, checkEnrollmentStatus]);

  const handleRatingUpdate = (updatedSkill) => {
    setSkill(prev => ({ ...prev, ...updatedSkill }));
  };

  const handleToggleModule = (moduleId) => {
    setActiveModuleId(prevId => (prevId === moduleId ? null : moduleId));
  };

  const handleAddVideo = (moduleTitle) => {
    alert(`[Action Placeholder]: Opening form to add video to Module: ${moduleTitle}`);
  };

  // **FIX: Critical Bug** - Implement video playback
  const handlePlayVideo = (videoTitle, videoUrl) => {
    if (!videoUrl) {
      alert("Video URL is missing.");
      return;
    }
    // Set the full URL for the modal
    setModalVideoUrl(`${API_BASE_URL.replace('/api', '')}${videoUrl}`);
    // Open the modal
    setIsVideoModalOpen(true);
  };


  const formatPrice = (price, paymentOptions) => {
    if (paymentOptions === 'exchange') {
      return (
        <div className="flex items-center text-blue-600">
          <MessageSquare className="h-5 w-5 mr-2" />
          <span className="text-xl font-bold">Skill Exchange</span>
        </div>
      );
    }

    if (paymentOptions === 'both') {
      return (
        <div className="space-y-2">
          <div className="flex items-center text-green-600">
            <IndianRupee className="h-5 w-5 mr-1" />
            <span className="text-xl font-bold">{price}</span>
            <span className="text-sm ml-1">/course</span>
          </div>
          <div className="flex items-center text-blue-600 text-sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>or Skill Exchange</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center text-green-600">
        <span className="text-xl font-bold">₹{price}</span>
        <span className="text-sm ml-1">/course</span>
      </div>
    );
  };

  const handleCheckout = async () => {
    if (!skill) return;

    if (isOwnSkill) {
      alert('You cannot enroll in your own course.');
      return;
    }

    if (!userLoaded || !user) {
      alert('Please sign in to enroll in this course.');
      return;
    }

    if (isEnrolled) {
      alert('You are already enrolled in this course.');
      return;
    }

    if (skill.price === 0) {
      setEnrollmentLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/enrollments/free-enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ skillId: skill._id })
        });

        const result = await response.json();

        if (result.success) {
          setIsEnrolled(true);
          alert("Successfully enrolled in the free skill! You can now rate it.");
        } else {
          alert(result.message || "Failed to enroll in the free skill.");
        }
      } catch (error) {
        console.error("Free enrollment error:", error);
        alert("An unexpected error occurred during free enrollment.");
      } finally {
        setEnrollmentLoading(false);
      }
      return;
    }

    try {
      const stripe = await stripePromise;

      const res = await fetch(`${API_BASE_URL}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skill._id,
          price: skill.price,
          userEmail: user.emailAddresses[0]?.emailAddress
        }),
      });

      const data = await res.json();

      if (data.id) {
        await stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        alert('Failed to initiate payment.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to initiate payment.');
    }
  };

  const handleProposeExchange = () => {
    if (isOwnSkill) {
      alert('You cannot propose an exchange for your own skill.');
      return;
    }
    if (!userLoaded || !user) {
      alert('Please sign in to propose an exchange.');
      return;
    }
    if (isEnrolled) {
      alert('You are already enrolled in this course.');
      return;
    }

    navigate("/propose-exchange", {
      state: {
        skillId: skill._id,
        instructorEmail: skill.email,
        instructorName: skill.instructor,
        courseTitle: skill.title,
        wantedSkills: skill.skills
      },
    });
  };

  const handleContact = () => {
    if (!userLoaded || !user) {
      alert('Please sign in to contact the instructor.');
      return;
    }

    navigate("/contact", {
      state: {
        instructorEmail: skill.email,
        instructorName: skill.instructor,
        courseTitle: skill.title,
        skillId: skill._id
      },
    });
  }

  if (!userLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading skill details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Skill Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.history.back()} className="bg-indigo-600 hover:bg-indigo-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isModuleContentVisible = isEnrolled || isOwnSkill;

  const modulesToDisplay = isOwnSkill || isEnrolled
    ? skill.modules || []
    : (skill.modules || []).filter(m => m.videos && m.videos.some(v => v.isFreePreview));

  const sortedModules = modulesToDisplay.sort((a, b) => a.order - b.order);


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/">
          <Button
            variant="outline"
            className="mb-6 hover:bg-indigo-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Skills
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
                    {skill.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
                      {skill.level}
                    </span>
                    {isOwnSkill && (
                      <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        Your Skill
                      </span>
                    )}
                    {isEnrolled && !isOwnSkill && (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enrolled
                      </span>
                    )}
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold">{skill.title}</CardTitle>
                <div className="flex items-center mt-3">
                  <User className="h-5 w-5 mr-2 text-indigo-200" />
                  <span className="text-indigo-100 text-lg">by {skill.instructor}</span>
                </div>

                {skill.email && (
                  <div className="flex items-center mt-2">
                    <Mail className="h-4 w-4 mr-2 text-indigo-200" />
                    <span className="text-indigo-100 text-sm">{skill.email}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <StarRating rating={skill.averageRating || 0} size="sm" />
                    <p className="text-xs text-gray-600 mt-1">
                      {skill.totalRatings || 0} reviews
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 text-gray-600 mr-1" />
                      <span className="font-medium">{skill.duration}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Duration</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-gray-600 mr-1" />
                      <span className="font-medium">{skill.timePerWeek}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Per Week</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-center">
                      <Award className="h-4 w-4 text-gray-600 mr-1" />
                      <span className="font-medium">{skill.level}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Level</p>
                  </div>
                </div>

                {skill.introVideoUrl && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Course Introduction</h3>
                    <div className="relative bg-black rounded-xl overflow-hidden group">
                      <video
                        src={`${API_BASE_URL.replace('/api', '')}${skill.introVideoUrl}`}
                        controls
                        className="w-full h-auto max-h-96"
                      >
                        Your browser does not support the video tag.
                      </video>
                      <button
                        // **FIX:** Use the central video handler
                        onClick={() => handlePlayVideo(skill.title, skill.introVideoUrl)}
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="View fullscreen"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <Tabs defaultValue="overview">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Overview</TabsTrigger>
                      <TabsTrigger value="content" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Course Content</TabsTrigger>
                      <TabsTrigger value="prereqs" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Prerequisites</TabsTrigger>
                      <TabsTrigger value="outcomes" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Outcomes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">About This Skill</h3>
                      <p className="text-gray-700 leading-relaxed">{skill.description}</p>

                      <div className="mt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Teaching Format</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {skill.teachingFormat?.onlineSessions && (
                            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                              <span className="text-green-800 font-medium">Online Sessions</span>
                            </div>
                          )}
                          {skill.teachingFormat?.inPersonSessions && (
                            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                              <span className="text-green-800 font-medium">In-Person Sessions</span>
                            </div>
                          )}
                          {skill.teachingFormat?.flexibleSchedule && (
                            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                              <span className="text-green-800 font-medium">Flexible Schedule</span>
                            </div>
                          )}
                          {skill.teachingFormat?.provideMaterials && (
                            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                              <span className="text-green-800 font-medium">Materials Provided</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="mt-4 p-4 bg-white rounded-lg border">
                      <h2 className="text-2xl font-bold mb-4 flex items-center">
                        <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
                        Course Contents
                      </h2>

                      {/* Display Progress Bar for Enrolled Users/Owner */}
                      {(isEnrolled || isOwnSkill) && (
                        <CourseProgress
                          percentage={progressPercentage}
                          totalModules={skill.modules?.length || 0}
                          completedModulesCount={completedModules.length}
                        />
                      )}

                      {loading || enrollmentLoading ? (
                        <CourseContentPlaceholder />
                      ) : sortedModules.length > 0 ? (
                        <div className="space-y-4">
                          {sortedModules.map((module) => {
                            const moduleId = module._id;
                            const isCompleted = completedModules.includes(moduleId);
                            const isModuleOpen = activeModuleId === moduleId || isOwnSkill;

                            return (
                              <div
                                key={moduleId}
                                className={`border rounded-lg overflow-hidden ${isCompleted && isEnrolled ? 'border-green-400' : 'border-gray-200'}`}
                              >
                                {/* Module Header */}
                                <div
                                  className={`flex justify-between items-center p-4 transition-colors cursor-pointer ${isCompleted && isEnrolled ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                                  onClick={() => handleToggleModule(moduleId)}
                                >
                                  <div className="flex items-center space-x-4">
                                    <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isModuleOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    <h3 className={`font-semibold text-lg ${isCompleted && isEnrolled ? 'text-green-800' : 'text-gray-900'}`}>
                                      Module {module.order}: {module.title}
                                    </h3>
                                  </div>
                                  {isOwnSkill && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddVideo(module.title);
                                      }}
                                      className="flex items-center text-indigo-600 hover:text-indigo-700 p-1"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add Video
                                    </Button>
                                  )}
                                </div>

                                {/* Module Content (Visible if open) */}
                                {isModuleOpen && (
                                  <div className="p-4 bg-white border-t border-gray-200">
                                    {module.description && (
                                      <p className="text-sm text-gray-700 mb-4">{module.description}</p>
                                    )}

                                    {module.videos && module.videos.length > 0 ? (
                                      <div className="space-y-2">
                                        {module.videos.sort((a, b) => a.order - b.order).map((video) => (
                                          <div
                                            key={video._id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors border-l-4 ${isModuleContentVisible || video.isFreePreview
                                                ? 'hover:bg-indigo-50 cursor-pointer border-indigo-500'
                                                : 'opacity-60 cursor-not-allowed border-gray-300'
                                              }`}
                                            onClick={() => {
                                              if (isModuleContentVisible || video.isFreePreview) {
                                                handlePlayVideo(video.title, video.videoUrl);
                                              }
                                            }}
                                            title={!isModuleContentVisible && !video.isFreePreview ? "Enroll to view this video" : video.title}
                                          >
                                            <PlayCircle className={`w-5 h-5 ${isModuleContentVisible || video.isFreePreview ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            <span className={`flex-1 text-sm ${isModuleContentVisible || video.isFreePreview ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                              {video.title}
                                              {video.isFreePreview && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Free Preview</span>}
                                            </span>
                                            <span className="text-xs text-gray-500">{video.duration}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500 p-2">No videos added to this module yet.</p>
                                    )}

                                  </div>
                                )}

                                {/* Completion Button (Visible only to Enrolled Users, not Owner) */}
                                {isEnrolled && !isOwnSkill && isModuleOpen && ( // Only show when module is open
                                  <div className="p-3 bg-gray-100 border-t border-gray-200 flex justify-end">
                                    <Button
                                      onClick={() => handleCompleteModule(moduleId, module.title)}
                                      disabled={isCompleted}
                                      className={`flex items-center transition-all ${isCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    >
                                      {isCompleted ? (
                                        <><CheckCircle className="w-4 h-4 mr-2" /> Completed</>
                                      ) : (
                                        <><CheckCircle className="w-4 h-4 mr-2" /> Mark as Complete</>
                                      )}
                                    </Button>
                                  </div>
                                )}

                                {/* Enrollment CTA for non-owners/non-enrolled */}
                                {!isEnrolled && !isOwnSkill && (
                                  <div className="p-3 bg-red-50 text-red-700 text-sm text-center border-t border-red-200">
                                    Enroll to unlock the rest of this module's content.
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <BookOpen className="w-8 h-8 mx-auto mb-3 text-indigo-500" />
                          <p className="text-gray-700 font-medium">Unlock 100% of the course content by enrolling!</p>
                          <p className="text-sm text-gray-500">The full course outline with all modules and videos will appear here upon enrollment.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="prereqs" className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Prerequisites</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {skill.prerequisites || "No specific prerequisites listed for this course."}
                      </p>
                    </TabsContent>

                    <TabsContent value="outcomes" className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">What You'll Learn</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {skill.learningOutcomes || "Learning outcomes are not yet specified."}
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>


                {skill.credentialId && (
                  <div className="my-6">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Certificate Uploaded
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Credential ID:</span>{" "}
                            <span className="font-mono bg-white px-2 py-1 rounded border border-green-200">
                              {skill.credentialId}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-700" />
                          <span className="text-xs font-semibold text-green-700">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {skill.paymentOptions !== 'paid' && skill.skills && skill.skills.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Skills Wanted in Exchange</h3>
                    <div className="flex flex-wrap gap-2">
                      {skill.skills.map((skillName, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <RatingSection
              skillId={skill._id}
              averageRating={skill.averageRating || 0}
              totalRatings={skill.totalRatings || 0}
              onRatingUpdate={handleRatingUpdate}
              isOwnSkill={isOwnSkill}
              isEnrolled={isEnrolled}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {isOwnSkill ? 'Your Skill' : isEnrolled ? 'Already Enrolled' : 'Get Started'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                    {formatPrice(skill.price, skill.paymentOptions)}
                  </div>

                  {isOwnSkill ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-center text-blue-800 mb-2">
                        <Shield className="h-5 w-5 mr-2" />
                        <span className="font-medium">This is your skill</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        You cannot enroll in your own course. Share this link with others to get enrollments!
                      </p>
                    </div>
                  ) : isEnrolled ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-center text-green-800 mb-2">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">You're enrolled!</span>
                      </div>
                      <p className="text-sm text-green-700">
                        You have access to this skill. Contact the instructor to coordinate learning sessions.
                      </p>
                    </div>
                  ) : (
                    <>
                      {skill.paymentOptions === 'both' ? (
                        <div className="space-y-3">
                          <Button
                            onClick={handleCheckout}
                            disabled={!user || enrollmentLoading}
                            className="w-full bg-gradient-to-r cursor-pointer from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            size="lg"
                          >
                            {enrollmentLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                              </>
                            ) : !user ? (
                              'Sign In to Enroll'
                            ) : (
                              <>
                                <IndianRupee className="h-5 w-5 mr-2" />
                                Enroll Now (₹{skill.price})
                              </>
                            )}
                          </Button>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-white text-gray-500">OR</span>
                            </div>
                          </div>

                          <Button
                            onClick={handleProposeExchange}
                            disabled={!user || enrollmentLoading}
                            className="w-full bg-gradient-to-r cursor-pointer from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            size="lg"
                          >
                            {enrollmentLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                              </>
                            ) : !user ? (
                              'Sign In to Exchange'
                            ) : (
                              <>
                                <MessageSquare className="h-5 w-5 mr-2" />
                                Propose Exchange
                              </>
                            )}
                          </Button>
                        </div>
                      ) : skill.paymentOptions === 'exchange' ? (
                        <Button
                          onClick={handleProposeExchange}
                          disabled={!user || enrollmentLoading}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          size="lg"
                        >
                          {enrollmentLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Checking...
                            </>
                          ) : !user ? (
                            'Sign In to Exchange'
                          ) : (
                            'Propose Exchange'
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCheckout}
                          disabled={!user || enrollmentLoading}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          size="lg"
                        >
                          {enrollmentLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Checking...
                            </>
                          ) : !user ? (
                            'Sign In to Enroll'
                          ) : (
                            'Enroll Now'
                          )}
                        </Button>
                      )}

                      {!user && (
                        <p className="text-xs text-gray-500">
                          Please sign in to enroll in this course
                        </p>
                      )}
                    </>
                  )}

                  {!isOwnSkill && !isEnrolled && (
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>✅ Direct access to instructor</p>
                      <p>✅ Flexible learning schedule</p>
                      <p>✅ Certificate of completion</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="h-5 w-5 mr-2 text-indigo-600" />
                    About the Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{skill.instructor}</h3>
                    <p className="text-gray-600 text-sm">Skill Expert</p>

                    {skill.email && (
                      <div className="flex items-center justify-center mt-2 text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="text-sm">{skill.email}</span>
                      </div>
                    )}
                  </div>

                  {isOwnSkill ? (
                    <div className="text-center text-sm text-gray-600">
                      This is your profile
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer hover:bg-gray-100"
                      onClick={handleContact}
                      disabled={!user}
                    >
                      {!user ? 'Sign In to Contact' : 'Contact Instructor for Queries'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* **FIX:** Use modalVideoUrl state and clear it on close */}
      <VideoModal
        videoUrl={modalVideoUrl}
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setModalVideoUrl(''); // Clear the URL when closing
        }}
      />

    </div>
  );
}