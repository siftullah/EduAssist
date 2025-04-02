import { BookOpen, MessageCircle, Brain, Calendar } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: BookOpen,
    title: "Unified Digital Classrooms",
    description: "Centralize all your course materials and resources in one place."
  },
  {
    icon: MessageCircle,
    title: "Seamless Communication",
    description: "Connect with students and colleagues effortlessly through integrated messaging."
  },
  {
    icon: Brain,
    title: "AI-Powered Assistance",
    description: "Get intelligent insights and recommendations to enhance learning outcomes."
  },
  {
    icon: Calendar,
    title: "Efficient Course Management",
    description: "Streamline scheduling, assignments, and grading with smart tools."
  }
]

export default function Features() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-4 p-2 bg-blue-100 rounded-full">
                <feature.icon className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-500 mb-4">{feature.description}</p>
              <Link href="#" className="text-blue-500 hover:underline">
                Learn More
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

