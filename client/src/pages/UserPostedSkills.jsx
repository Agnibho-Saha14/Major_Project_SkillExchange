import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, IndianRupee, Clock, Star, Users, Filter, Search, Loader2, AlertCircle } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'


// Star Rating Component
function StarRating({ rating, size = "sm" }) {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star key={i} className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} fill-yellow-400 text-yellow-400`} />
    )
  }

  if (hasHalfStar) {
    stars.push(
      <div key="half" className="relative">
        <Star className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} text-gray-300`} />
        <div className="absolute inset-0 overflow-hidden w-1/2">
          <Star className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} fill-yellow-400 text-yellow-400`} />
        </div>
      </div>
    )
  }

  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star key={`empty-${i}`} className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} text-gray-300`} />
    )
  }

  return <div className="flex items-center">{stars}</div>
}

// Skill Card Component
function SkillCard({ skill }) {
  const formatPrice = (price, priceType, paymentOptions) => {
    if (paymentOptions === 'exchange') {
      return <span className="text-blue-600 font-semibold">Skill Exchange</span>
    }
    
    if (paymentOptions === 'both') {
      return (
        <div className="flex flex-col">
          <span className="text-green-600 font-semibold">₹{price}/{priceType}</span>
          <span className="text-blue-600 text-sm">or Exchange</span>
        </div>
      )
    }
    
    return <span className="text-green-600 font-semibold">₹{price}/{priceType}</span>
  }

  return (
    <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
            {skill.category}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            {skill.level}
          </span>
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {skill.title}
        </CardTitle>
        <p className="text-gray-600 font-medium">by {skill.instructor}</p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">{skill.description}</p>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <StarRating rating={skill.averageRating || 0} />
              <span className="ml-2 text-sm">
                ({skill.totalRatings || 0} {skill.totalRatings === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{skill.duration}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{skill.timePerWeek}/week</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center">
            
            {formatPrice(skill.price, skill.priceType, skill.paymentOptions)}
          </div>
          <a href={`/skills/${skill._id}`}>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all">
              View Details
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

// Filter Component
function SkillFilters({ filters, setFilters, categories }) {
  return (
    <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Filter className="h-5 w-5 mr-2 text-indigo-600" />
          Filter Skills
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search skills..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 h-10 rounded-lg border-2 border-gray-200 focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
            <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 focus:border-indigo-500">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v })}>
            <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 focus:border-indigo-500">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Type Filter */}
          <Select value={filters.paymentOptions} onValueChange={(v) => setFilters({ ...filters, paymentOptions: v })}>
            <SelectTrigger className="h-10 rounded-lg border-2 border-gray-200 focus:border-indigo-500">
              <SelectValue placeholder="Payment Type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="paid">Paid Only</SelectItem>
              <SelectItem value="exchange">Exchange Only</SelectItem>
              <SelectItem value="both">Both Options</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

export default function UserPostedSkills({ limit, sort }) {
  const [skills, setSkills] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    paymentOptions: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: limit || 12,
    total: 0,
    pages: 1
  })

  // Fetch skills from API
  const fetchSkills = async () => {
    setLoading(true)
    setError('')
    
    try {
      const queryParams = new URLSearchParams()
      if (sort) queryParams.append('sort', sort)
      if (limit) queryParams.append('limit', limit)
      if (!limit) {
        if (filters.category) queryParams.append('category', filters.category)
        if (filters.level) queryParams.append('level', filters.level)
        if (filters.paymentOptions) queryParams.append('paymentOptions', filters.paymentOptions)
        queryParams.append('page', pagination.page.toString())
        queryParams.append('limit', pagination.limit.toString())
      }
      

      const response = await fetch(`${API_BASE_URL}/skills?${queryParams}`)
      const result = await response.json()

      if (result.success) {
        let filteredSkills = result.data
        
        // Client-side search filter (since backend doesn't handle search yet)
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          filteredSkills = filteredSkills.filter(skill =>
            skill.title.toLowerCase().includes(searchTerm) ||
            skill.instructor.toLowerCase().includes(searchTerm) ||
            skill.category.toLowerCase().includes(searchTerm) ||
            skill.description.toLowerCase().includes(searchTerm)
          )
        }
        
        setSkills(filteredSkills)
        setPagination(prev => ({
          ...prev,
          ...result.pagination
        }))
      } else {
        setError(result.message || 'Failed to fetch skills')
      }
    } catch (err) {
      console.error('Error fetching skills:', err)
      setError('Failed to connect to server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`)
      const result = await response.json()
      
      if (result.success) {
        setCategories(result.data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Effect to fetch data
  useEffect(() => {
    fetchSkills()
  }, [filters.category, filters.level, filters.paymentOptions, pagination.page, sort, limit])

  // Effect for search (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchSkills()
      } else {
        setPagination(prev => ({ ...prev, page: 1 }))
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.search])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  if (error && skills.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Skills</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchSkills} className="bg-indigo-600 hover:bg-indigo-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header (Only show for browse page) */}
        {!limit && (
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Discover Amazing Skills
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Learn from experts, share your knowledge, and grow together in our community
              </p>
            </div>
        )}

        {/* Filters (Only show for browse page) */}
        {!limit && <SkillFilters filters={filters} setFilters={setFilters} categories={categories} />}

        {/* Loading State */}
        {loading && skills.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading amazing skills...</p>
          </div>
        )}

        {/* Skills Grid */}
        {skills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {skills.map((skill) => (
              <SkillCard key={skill._id} skill={skill} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && skills.length === 0 && !error && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Skills Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search terms
            </p>
            {!limit && (
              <Button 
                onClick={() => setFilters({ search: '', category: '', level: '', paymentOptions: '' })}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination (Only show for browse page) */}
        {!limit && pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2"
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className="px-3 py-2"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2"
            >
              Next
            </Button>
          </div>
        )}

        {/* Call to Action (Only show for browse page) */}
        {!limit && skills.length > 0 && (
          <div className="text-center mt-16 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Share Your Skills?</h2>
            <p className="text-xl text-indigo-100 mb-6">
              Join our community of learners and teachers
            </p>
            <a href="/publish">
              <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-3 text-lg">
                Publish Your Skill
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}