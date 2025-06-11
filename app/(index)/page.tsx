import Header from './_components/Header'
import Hero from './_components/Hero'
import Features from './_components/Features'
import About from './_components/About'
import Testimonials from './_components/Testimonials'
import Demo from './_components/Demo'
import Footer from './_components/Footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      <main>
        <Features />
        <About />
        <Testimonials />
        <Demo />
      </main>
      <Footer />
    </div>
  )
}

