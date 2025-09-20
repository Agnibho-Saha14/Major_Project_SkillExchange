import { Loader2 } from "lucide-react"

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="text-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}