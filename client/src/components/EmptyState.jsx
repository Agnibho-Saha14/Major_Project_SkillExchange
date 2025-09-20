import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export default function EmptyState({ 
  icon: Icon = BookOpen,
  title = "No items found", 
  message = "Try adjusting your search or filters", 
  actionLabel = "Clear Filters",
  onAction 
}) {
  return (
    <div className="text-center py-12">
      <Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}