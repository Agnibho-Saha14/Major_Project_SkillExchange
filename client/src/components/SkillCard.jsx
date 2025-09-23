import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, Clock, Users, Edit } from "lucide-react"
import StarRating from "./starRating"
import PriceDisplay from "./priceDisplay"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"

export default function SkillCard({ skill, showEditButton = false, onEdit }) {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  
  function handleSignIn(){
    if(!isSignedIn){
      navigate("/login")
    } else {
      navigate(`/skills/${skill._id}`);
    }
  }

  function handleEdit() {
    if (onEdit) {
      onEdit(skill._id);
    } else {
      navigate(`/skills/${skill._id}/edit`);
    }
  }
  
  return (
    <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
            {skill.category}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {skill.level}
            </span>
            {showEditButton && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="h-6 w-6 p-0 rounded-full border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
              >
                <Edit className="h-3 w-3 text-gray-600 hover:text-indigo-600" />
              </Button>
            )}
          </div>
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
              paymentOptions={skill.paymentOptions}
            />
          </div>
          
          <div className="flex gap-2">
            {showEditButton && (
              <Button 
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            <Button onClick={handleSignIn} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}