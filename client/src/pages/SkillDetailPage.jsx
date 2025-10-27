import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  Shield
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ---------- StarRating ---------- */
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

/* ---------- InteractiveStarRating ---------- */
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
            className={`${size === "lg" ? "h-8 w-8" : "h-6 w-6"} cursor-pointer ${value <= (hoverRating || rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 hover:text-yellow-300"
              }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ---------- RatingSection ---------- */
/* ---------- RatingSection ---------- */
function RatingSection({ skillId, averageRating, totalRatings, onRatingUpdate, isOwnSkill }) {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [checkingRating, setCheckingRating] = useState(true);
  const [existingRating, setExistingRating] = useState(null);

  // Check if user has already rated this skill
  useEffect(() => {
    const checkUserRating = async () => {
      if (!isLoaded || !user || !skillId) {
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

    checkUserRating();
  }, [isLoaded, user, skillId, getToken]);

  const handleSubmitRating = async () => {
    if (userRating === 0) return;

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
          rating: userRating,
          comment: comment.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setHasRated(true);
        setExistingRating({
          rating: userRating,
          comment: comment.trim(),
          createdAt: new Date()
        });
        setUserRating(0);
        setComment("");
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
        {/* Current Rating Display */}
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

        {/* Loading state while checking */}
        {checkingRating && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
            <span className="text-gray-600">Checking rating status...</span>
          </div>
        )}

        {/* Owner Message */}
        {!checkingRating && isOwnSkill && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center text-blue-800">
              <Shield className="h-5 w-5 mr-2" />
              <span className="font-medium">This is your skill - you cannot rate your own content.</span>
            </div>
          </div>
        )}

        {/* Already Rated Message */}
        {!checkingRating && hasRated && !isOwnSkill && existingRating && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
            <div className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">You have already rated this skill</span>
            </div>
            <div className="pl-7">
              <div className="flex items-center mb-2">
                <span className="text-sm text-gray-700 mr-2">Your rating:</span>
                <StarRating rating={existingRating.rating} size="sm" showNumber={false} />
                <span className="ml-2 font-semibold text-gray-900">{existingRating.rating}/5</span>
              </div>
              {existingRating.comment && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Your comment:</span>
                  <p className="mt-1 italic">"{existingRating.comment}"</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Submitted on {new Date(existingRating.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Rate This Skill - Only if not rated and not owner */}
        {!checkingRating && !hasRated && !isOwnSkill && (
          <div className="p-4 border-2 border-dashed border-indigo-200 rounded-xl">
            {!user ? (
              <div className="text-center p-4">
                <p className="text-gray-600 mb-3">Sign in to rate this skill</p>
                <Button
                  onClick={() => window.location.href = '/sign-in'}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate This Skill</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Your Rating:</p>
                    <InteractiveStarRating
                      rating={userRating}
                      onRatingChange={setUserRating}
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Comment (optional):</p>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this skill..."
                      rows={3}
                      className="resize-none rounded-xl border-2 border-gray-200 focus:border-indigo-500"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitRating}
                    disabled={userRating === 0 || isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Rating'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- SkillDetailPage ---------- */
export default function SkillDetailPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [skillId, setSkillId] = useState('');

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const id = parts.pop() || parts.pop(); // handle trailing slash
    setSkillId(id);
  }, []);

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Check if current user is the skill owner
  const isOwnSkill = userLoaded && user && skill &&
    (user.emailAddresses[0]?.emailAddress === skill.email ||
      user.emailAddresses.some(email => email.emailAddress === skill.email));

  const fetchSkillDetails = async () => {
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
  };

  const checkEnrollmentStatus = async () => {
    if (!userLoaded || !user || !skillId) {
      setIsEnrolled(false);
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
      } else {
        setIsEnrolled(false);
      }
    } catch (err) {
      console.error('Error checking enrollment status:', err);
      setIsEnrolled(false);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  useEffect(() => {
    if (skillId) {
      fetchSkillDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  useEffect(() => {
    checkEnrollmentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, user, skillId, getToken]);

  const handleRatingUpdate = (updatedSkill) => {
    setSkill(prev => ({ ...prev, ...updatedSkill }));
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

    // Prevent self-enrollment
    if (isOwnSkill) {
      alert('You cannot enroll in your own course.');
      return;
    }

    // Check if user is authenticated
    if (!userLoaded || !user) {
      alert('Please sign in to enroll in this course.');
      return;
    }

    // Check if already enrolled
    if (isEnrolled) {
      alert('You are already enrolled in this course.');
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
    // Prevent self-exchange
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

    // Navigate to exchange proposal flow, passing necessary state
    navigate("/propose-exchange", {
      state: {
        skillId: skill._id,
        instructorEmail: skill.email,
        instructorName: skill.instructor,
        courseTitle: skill.title,
        wantedSkills: skill.skills // Instructor's wanted skills
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

  // Show loading while user data is being fetched
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
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
            {/* Header Card */}
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

                {/* Display instructor email */}
                {skill.email && (
                  <div className="flex items-center mt-2">
                    <Mail className="h-4 w-4 mr-2 text-indigo-200" />
                    <span className="text-indigo-100 text-sm">{skill.email}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-6">
                {/* Quick Stats */}
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

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">About This Skill</h3>
                  <p className="text-gray-700 leading-relaxed">{skill.description}</p>
                </div>

                {/* Prerequisites */}
                {skill.prerequisites && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Prerequisites</h3>
                    <p className="text-gray-700 leading-relaxed">{skill.prerequisites}</p>
                  </div>
                )}

                {/* Learning Outcomes */}
                {skill.learningOutcomes && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">What You'll Learn</h3>
                    <p className="text-gray-700 leading-relaxed">{skill.learningOutcomes}</p>
                  </div>
                )}

                {/* Teaching Format */}
                <div>
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

                {/* Skills for Exchange */}
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

            {/* Rating Section */}
            <RatingSection
              skillId={skill._id}
              averageRating={skill.averageRating || 0}
              totalRatings={skill.totalRatings || 0}
              onRatingUpdate={handleRatingUpdate}
              isOwnSkill={isOwnSkill}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Pricing Card */}
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
                      {/* Show both buttons for 'both' payment option */}
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
                            className="w-full bg-gradient-to-r cursor-pointer
 from-blue-600 to-indigo-600 hover:from-blue-700
  hover:to-indigo-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Instructor Card */}
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

                    {/* Display instructor email in sidebar */}
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
    </div>
  );
}