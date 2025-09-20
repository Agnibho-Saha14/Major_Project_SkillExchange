import { Star } from "lucide-react"

export default function StarRating({ rating, size = "sm", showCount = false, count = 0 }) {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star key={i} className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} fill-yellow-400 text-yellow-400`} />
    )
  }

  // Half star
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

  // Empty stars
  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star key={`empty-${i}`} className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} text-gray-300`} />
    )
  }

  return (
    <div className="flex items-center">
      {stars}
      {showCount && (
        <span className="ml-2 text-sm text-gray-600">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  )
}