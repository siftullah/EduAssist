import Image from 'next/image'

export default function About() {
  return (
    <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Say goodbye to fragmented systems</h2>
            <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              EduAssist integrates classroom management, communication, and assessments into one user-friendly platform.
              Experience the power of a unified academic ecosystem designed to enhance productivity and learning outcomes.
            </p>
          </div>
          <div className="mx-auto flex w-full items-center justify-end">
            <Image
              alt="EduAssist Platform"
              className="aspect-video overflow-hidden rounded-xl object-cover object-center"
              height="310"
              src="/placeholder.svg"
              width="550"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

