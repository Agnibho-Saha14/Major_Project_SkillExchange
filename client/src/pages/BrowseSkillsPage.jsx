import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, AlertCircle } from "lucide-react"
import Navbar from "@/components/Navbar"
import StarRating from "@/components/starRating"
import PriceDisplay from "@/components/priceDisplay"
import SkillCard from "@/components/SkillCard"
import SkillFilters from "@/components/SkillFilter"
import Pagination from "@/components/Pagination"
import LoadingState from "@/components/LoadingState"
import ErrorState from "@/components/ErrorState"
import EmptyState from "@/components/EmptyState"
import CTASection from "@/components/CTASection"

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function BrowseSkills() {
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
    limit: 12,
    total: 0,
    pages: 1
  })

  const fetchSkills = async () => {
    setLoading(true)
    setError('')
    
    try {
      const queryParams = new URLSearchParams()
      if (filters.category) queryParams.append('category', filters.category)
      if (filters.level) queryParams.append('level', filters.level)
      if (filters.paymentOptions) queryParams.append('paymentOptions', filters.paymentOptions)
      queryParams.append('page', pagination.page.toString())
      queryParams.append('limit', pagination.limit.toString())

      const response = await fetch(`${API_BASE_URL}/skills?${queryParams}`)
      const result = await response.json()

      if (result.success) {
        let filteredSkills = result.data
        
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

  const clearFilters = () => {
    setFilters({ search: '', category: '', level: '', paymentOptions: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const changePage = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  useEffect(() => {
    fetchSkills()
  }, [filters.category, filters.level, filters.paymentOptions, pagination.page])

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
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorState
            title="Unable to Load Skills"
            message={error}
            onRetry={fetchSkills}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header - Inline */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Skills
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn from experts, share your knowledge, and grow together in our community
          </p>
        </div>

        {/* Filters */}
        <SkillFilters filters={filters} setFilters={setFilters} categories={categories} />

        {/* Loading State */}
        {loading && skills.length === 0 && (
          <LoadingState message="Loading amazing skills..." />
        )}

        {/* Skills Grid - Inline */}
        {skills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {skills.map((skill) => (
              <SkillCard key={skill._id} skill={skill} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && skills.length === 0 && !error && (
          <EmptyState
            title="No Skills Found"
            message="Try adjusting your filters or search terms"
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        )}

        {/* Pagination */}
        <Pagination 
          pagination={pagination} 
          onPageChange={changePage}
        />

        {/* Call to Action */}
        {skills.length > 0 && <CTASection />}
      </div>
    </div>
  )
}