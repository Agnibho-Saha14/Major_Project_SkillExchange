import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search } from "lucide-react"

export default function SkillFilters({ filters, setFilters, categories = [] }) {
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

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
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 h-10 rounded-lg border-2 border-gray-200 focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <Select 
            value={filters.category} 
            onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
          >
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
          <Select 
            value={filters.level} 
            onValueChange={(value) => handleFilterChange('level', value === 'all' ? '' : value)}
          >
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
          <Select 
            value={filters.paymentOptions} 
            onValueChange={(value) => handleFilterChange('paymentOptions', value === 'all' ? '' : value)}
          >
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