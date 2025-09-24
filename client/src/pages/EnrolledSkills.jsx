// client/src/pages/EnrolledSkills.jsx

import React, { useState, useEffect } from 'react';
// MODIFIED: Import useAuth along with useUser
import { useUser, useAuth } from "@clerk/clerk-react"; 
import SkillCard from "@/components/SkillCard";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Clock, MessageCircle } from 'lucide-react'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EnrolledSkills() {
  // MODIFIED: Get getToken from useAuth
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  
  const [enrolledSkills, setEnrolledSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEnrolledSkills = async () => {
    // Check for both loading status and sign-in status
    if (!isLoaded || !isSignedIn) {
        // Stop loading and do nothing if not authenticated/loaded
        setLoading(false);
        return;
    }

    setLoading(true);
    setError('');

    try {
      // Get the current JWT from Clerk
      const token = await getToken(); 

      // MODIFIED: Include the Authorization header with the JWT
      const response = await fetch(`${API_BASE_URL}/enrollments/my-skills`, {
        headers: { 
            'Authorization': `Bearer ${token}` 
        }
      });
      
      const result = await response.json();

      if (response.status === 401) {
          throw new Error('Unauthorized. Please log in again.');
      }

      if (result.success) {
        setEnrolledSkills(result.data);
      } else {
        setError(result.message || 'Failed to fetch enrolled skills');
      }
    } catch (err) {
      console.error('Error fetching enrolled skills:', err);
      setError(err.message || 'Failed to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // MODIFIED: Add getToken to dependency array
    fetchEnrolledSkills();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || loading) {
    return <LoadingState message="Loading your enrolled skills..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchEnrolledSkills} />;
  }

  if (enrolledSkills.length === 0) {
    return (
      <EmptyState 
        icon={Clock}
        title="No Enrolled Skills"
        message="You haven't enrolled in any paid or exchanged skills yet."
        actionLabel="Browse Skills"
        onAction={() => window.location.href = '/browse'} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledSkills.map(skill => (
          <SkillCard 
            key={skill._id} 
            skill={skill} 
            showEditButton={false} 
          >
            <div className="flex items-center text-sm text-green-600 font-semibold mt-2">
                <MessageCircle className="h-4 w-4 mr-1" />
                Access Granted!
            </div>
          </SkillCard>
        ))}
      </div>
    </div>
  );
}