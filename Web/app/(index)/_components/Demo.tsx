import { Button } from '../../../components/ui/button'

export default function Demo() {
  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
      <div className="container">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Ready to transform your academic experience?
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Discover how EduAssist can revolutionize your institution&apos;s approach to education management.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <Button size="lg" className="w-full">Request a Demo</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

