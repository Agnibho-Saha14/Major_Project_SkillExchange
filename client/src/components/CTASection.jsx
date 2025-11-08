import { Button } from "@/components/ui/button"

export default function CTASection({ 
  title = "Ready to Share Your Skills?",
  subtitle = "Join our community of learners and teachers",
  buttonText = "Publish Your Skill",
  buttonLink = "/publish"
}) {
  return (
    <div className="text-center mt-16 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl text-white">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-xl text-indigo-100 mb-6">{subtitle}</p>
      <a href={buttonLink}>
        <Button className="cursor-pointer bg-white text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-3 text-lg">
          {buttonText}
        </Button>
      </a>
    </div>
  )
}