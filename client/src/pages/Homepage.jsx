import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, MessageSquare, BookOpen, Star, Frown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function StarRating({ rating, size = 'sm' }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={i} className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} fill-yellow-400 text-yellow-400`} />);
  }

  if (hasHalfStar) {
    stars.push(
      <div key="half" className="relative">
        <Star className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-gray-300`} />
        <div className="absolute inset-0 overflow-hidden w-1/2">
          <Star className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} fill-yellow-400 text-yellow-400`} />
        </div>
      </div>
    );
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-gray-300`} />);
  }

  return <div className="flex items-center space-x-1">{stars}</div>;
}

export default function Homepage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/skills?sortBy=averageRating&limit=5`);
      const result = await response.json();

      if (result.success) {
        setSkills(result.data);
      } else {
        setError(result.message || 'Failed to fetch skills.');
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchSkills();
    }
  }, [location.state]);

  const formatPrice = (price, priceType, paymentOptions) => {
    if (paymentOptions === 'exchange') {
      return (
        <span className="flex items-center text-blue-600 font-bold">
          <MessageSquare className="h-4 w-4 mr-1" />
          Exchange
        </span>
      );
    }

    if (paymentOptions === 'both') {
      return (
        <span className="flex items-center text-green-600 font-bold">
          <IndianRupee className="h-4 w-4 mr-1" />
          {price} + Exchange
        </span>
      );
    }

    return (
      <span className="flex items-center text-green-600 font-bold">
        <IndianRupee className="h-4 w-4 mr-1" />
        {price}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Discover Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Skill</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600">Find and learn from top instructors and experts</p>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Top Rated Skills</h2>

        {/* Skill Cards */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading skills...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Frown className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
        ) : skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <Link to={`/skill/${skill._id}`} key={skill._id}>
                <Card className="h-full rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-3 py-1">
                        {skill.category}
                      </Badge>
                      <StarRating rating={skill.averageRating || 0} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{skill.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{skill.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>{skill.level}</span>
                      </div>
                      <div className="text-xl font-bold">
                        {formatPrice(skill.price, skill.priceType, skill.paymentOptions)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No skills found with the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}