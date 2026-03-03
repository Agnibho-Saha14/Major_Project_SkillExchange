import { useUser, useAuth } from "@clerk/clerk-react"
import { useState } from "react"
import SkillCard from "@/components/SkillCard"
import CTASection from "@/components/CTASection"
import Pagination from "@/components/Pagination"
import useSkills from "@/components/useSkills"
import { BookOpen } from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import SkillsAPI from "@/components/SkillsAPI"

export default function PostedSkills() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const { skills, loading, error, pagination, changePage, refetch } = useSkills()
  const [deletingId, setDeletingId] = useState(null)

  // Filter skills posted by the logged-in user
  const postedSkills = skills.filter(
    skill => skill.email === user?.primaryEmailAddress?.emailAddress
  )

  const handleEdit = (skillId) => {
  // Navigate to edit page using the correct route
  navigate(`/skills/${skillId}/edit`)
}

  const handleDelete = async (skillId) => {
    const confirmation = window.confirm(
      "Are you sure you want to delete this skill? This action cannot be undone."
    )
    if (!confirmation) return

    setDeletingId(skillId)
    try {
      const token = await getToken()
      await SkillsAPI.deleteSkill(skillId, token)
      // refresh the list after successful deletion
      await refetch()
    } catch (err) {
      console.error("Failed to delete skill", err)
      alert(err.message || "Could not delete skill. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }


  if (!isLoaded) {
    return <div className="text-center py-8">Loading user...</div>
  }

  if (loading) {
    return <div className="text-center py-8">Loading your skills...</div>
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">Error: {error}</div>
  }

  if (postedSkills.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No skills posted yet
        </h3>
        <Link
          to="/publish"
          className="inline-flex items-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Post Your First Skill
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {/* Posted Skills Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postedSkills.map(skill => (
          <SkillCard 
            key={skill._id} 
            skill={skill} 
            showEditButton={true}
            showDeleteButton={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
            // if this card is currently being deleted, disable buttons
            disabled={deletingId === skill._id}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination pagination={pagination} onPageChange={changePage} />

      {/* CTA Section */}
      <CTASection
        title="Want to add more skills?"
        subtitle="Share more knowledge with our community"
        buttonText="Post Another Skill"
        buttonLink="/post-skill"
      />
    </div>
  )
}
