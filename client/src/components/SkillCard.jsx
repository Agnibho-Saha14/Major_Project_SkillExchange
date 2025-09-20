import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, Clock, Users } from "lucide-react"
import StarRating from "./starRating"
import PriceDisplay from "./priceDisplay"

export default function SkillCard({ skill }) {
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
            <StarRating 
              rating={skill.averageRating || 0} 
              showCount 
              count={skill.totalRatings || 0}
            />
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
            <PriceDisplay 
              price={skill.price}
              priceType={skill.priceType}
              paymentOptions={skill.paymentOptions}
            />
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