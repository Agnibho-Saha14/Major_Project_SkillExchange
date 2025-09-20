import { useState, useEffect, useCallback } from 'react'
import SkillsAPI from "./SkillsAPI"

export default function useSkills() {
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

  // Fetch skills function
  const fetchSkills = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await SkillsAPI.fetchSkills(filters, pagination)
      
      // Apply client-side search filtering
      let filteredSkills = result.data
      if (filters.search) {
        filteredSkills = SkillsAPI.filterSkillsBySearch(filteredSkills, filters.search)
      }
      
      setSkills(filteredSkills)
      setPagination(prev => ({
        ...prev,
        ...result.pagination
      }))
    } catch (err) {
      console.error('Error fetching skills:', err)
      setError(err.message || 'Failed to connect to server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await SkillsAPI.fetchCategories()
      setCategories(categoriesData)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }))
    // Reset to first page when filters change (except for search)
    if (!newFilters.hasOwnProperty('search')) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      level: '',
      paymentOptions: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // Change page
  const changePage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  // Effect for fetching skills when filters change (except search)
  useEffect(() => {
    fetchSkills()
  }, [filters.category, filters.level, filters.paymentOptions, pagination.page])

  // Effect for search with debouncing
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
  }, [fetchCategories])

  return {
    skills,
    categories,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    clearFilters,
    changePage,
    refetch: fetchSkills
  }
}