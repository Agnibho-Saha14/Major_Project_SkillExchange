import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DashboardPage() {
  const [tab, setTab] = useState('posted');
  const [postedSkills, setPostedSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  const fetchUserPostedSkills = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/skills`);
      const result = await response.json();
      if (response.ok && result.success) {
        // Since backend has no user filter, we filter client-side
        const userSkills = result.data.filter(
          (skill) => skill.instructor === user.fullName
        );
        setPostedSkills(userSkills);
      } else {
        setError(result.message || 'Failed to fetch skills.');
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPostedSkills();
    }
  }, [user]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value='posted'>My Posted Skills</TabsTrigger>
            <TabsTrigger value='enrolled'>Enrolled Skills</TabsTrigger>
          </TabsList>
          <TabsContent value='posted'>
            {loading ? (
              <div className='text-center py-12'>
                <Loader2 className='h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4' />
                <p className='text-gray-600'>Loading your skills...</p>
              </div>
            ) : error ? (
              <div className='text-center py-12'>
                <AlertCircle className='h-16 w-16 text-red-500 mx-auto mb-4' />
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>Error</h2>
                <p className='text-gray-600 mb-4'>{error}</p>
              </div>
            ) : postedSkills.length > 0 ? (
              <div className='grid md:grid-cols-2 gap-4 mt-4'>
                {postedSkills.map((skill) => (
                  <Card key={skill._id}>
                    <CardHeader>
                      <CardTitle>{skill.title}</CardTitle>
                    </CardHeader>
                    <CardContent>Status: {skill.status}</CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className='mt-4 text-gray-600'>
                You have not posted any skills yet.
              </p>
            )}
          </TabsContent>
          <TabsContent value='enrolled'>
            <p className='mt-4 text-gray-600'>
              You have not enrolled in any skills yet.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}