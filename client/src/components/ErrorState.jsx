import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function ErrorState({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred", 
  onRetry,
  showRetry = true 
}) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{message}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700">
          Try Again
        </Button>
      )}
    </div>
  )
}