import { Button } from "@/components/ui/button"

export default function Pagination({ pagination, onPageChange }) {
  if (pagination.pages <= 1) {
    return null
  }

  const generatePageNumbers = () => {
    const pages = []
    const { page, pages: totalPages } = pagination
    
    // Show up to 5 page numbers
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <div className="flex justify-center items-center space-x-4 mt-12">
      <Button
        variant="outline"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
        className="px-4 py-2"
      >
        Previous
      </Button>
      
      <div className="flex space-x-2">
        {generatePageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            variant={pagination.page === pageNum ? "default" : "outline"}
            onClick={() => onPageChange(pageNum)}
            className="px-3 py-2"
          >
            {pageNum}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.pages}
        className="px-4 py-2"
      >
        Next
      </Button>
    </div>
  )
}