// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class SkillsAPI {
  // Fetch skills with filters and pagination
  static async fetchSkills(filters = {}, pagination = { page: 1, limit: 12 }) {
    const queryParams = new URLSearchParams()
    
    // Add filters to query params
    if (filters.category) queryParams.append('category', filters.category)
    if (filters.level) queryParams.append('level', filters.level)
    if (filters.paymentOptions) queryParams.append('paymentOptions', filters.paymentOptions)
    
    // Add pagination
    queryParams.append('page', pagination.page.toString())
    queryParams.append('limit', pagination.limit.toString())

    const response = await fetch(`${API_BASE_URL}/skills?${queryParams}`)
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch skills')
    }

    return result
  }

  // Fetch categories
  static async fetchCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`)
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch categories')
    }

    return result.data
  }

  // Client-side filtering for search
  static filterSkillsBySearch(skills, searchTerm) {
    if (!searchTerm) return skills

    const search = searchTerm.toLowerCase()
    return skills.filter(skill =>
      skill.title.toLowerCase().includes(search) ||
      skill.instructor.toLowerCase().includes(search) ||
      skill.category.toLowerCase().includes(search) ||
      skill.description.toLowerCase().includes(search)
    )
  }
}

export default SkillsAPI