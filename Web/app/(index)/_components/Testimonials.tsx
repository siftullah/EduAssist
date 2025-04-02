import Image from 'next/image'

const testimonials = [
  {
    quote: "EduAssist has completely streamlined our classroom management and communication processes!",
    author: "Dr. Emily Johnson",
    role: "Professor of Computer Science"
  },
  {
    quote: "As a student, I love how easy it is to access all my course materials and communicate with my professors.",
    author: "Michael Chen",
    role: "Undergraduate Student"
  },
  {
    quote: "The AI-powered insights have revolutionized how we approach student engagement and success.",
    author: "Sarah Thompson",
    role: "Dean of Student Affairs"
  }
]

export default function Testimonials() {
  return (
    <section id="reviews" className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">What People Are Saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex flex-col items-center text-center bg-gray-50 p-6 rounded-lg">
              <div className="mb-4">
                <Image
                  alt={testimonial.author}
                  className="rounded-full"
                  height="60"
                  src="/placeholder.svg"
                  style={{
                    aspectRatio: "60/60",
                    objectFit: "cover",
                  }}
                  width="60"
                />
              </div>
              <blockquote className="text-lg mb-4">&quot;{testimonial.quote}&quot;</blockquote>
              <cite className="not-italic">
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </cite>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

