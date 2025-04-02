'use client'

import { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useInView } from 'react-intersection-observer'

const EducationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z" fill="currentColor"/>
  </svg>
)

const AiIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10.5V6.5C21 4.84 19.66 3.5 18 3.5H14.82C14.4 2.61 13.52 2 12.5 2H11.5C10.48 2 9.6 2.61 9.18 3.5H6C4.34 3.5 3 4.84 3 6.5V10.5C2.11 10.92 1.5 11.8 1.5 12.82V14.18C1.5 15.2 2.11 16.08 3 16.5V20.5C3 22.16 4.34 23.5 6 23.5H18C19.66 23.5 21 22.16 21 20.5V16.5C21.89 16.08 22.5 15.2 22.5 14.18V12.82C22.5 11.8 21.89 10.92 21 10.5ZM12 3.5C12.55 3.5 13 3.95 13 4.5C13 5.05 12.55 5.5 12 5.5C11.45 5.5 11 5.05 11 4.5C11 3.95 11.45 3.5 12 3.5ZM5 6.5C5 5.95 5.45 5.5 6 5.5H8.18C8.6 6.39 9.48 7 10.5 7H13.5C14.52 7 15.4 6.39 15.82 5.5H18C18.55 5.5 19 5.95 19 6.5V10.5C18.11 10.92 17.5 11.8 17.5 12.82V14H6.5V12.82C6.5 11.8 5.89 10.92 5 10.5V6.5ZM19 20.5C19 21.05 18.55 21.5 18 21.5H6C5.45 21.5 5 21.05 5 20.5V16.5H19V20.5ZM20.5 14.18C20.5 14.73 20.05 15.18 19.5 15.18H4.5C3.95 15.18 3.5 14.73 3.5 14.18V12.82C3.5 12.27 3.95 11.82 4.5 11.82H19.5C20.05 11.82 20.5 12.27 20.5 12.82V14.18Z" fill="currentColor"/>
  </svg>
)

export default function Hero() {
  const controls = useAnimation()
  const [ref, inView] = useInView()

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-100 to-white">
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-blue-50 opacity-50" />
        <motion.div
          className="absolute top-20 left-20 text-blue-200"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          <EducationIcon className="w-32 h-32" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-20 text-blue-200"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          <AiIcon className="w-32 h-32" />
        </motion.div>
      </motion.div>

      <div className="container relative z-10">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={containerVariants}
          className="flex flex-col items-center space-y-4 text-center"
        >
          <motion.h1 
            className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
            variants={itemVariants}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
              Transforming Education
            </span>
            <br />
            with AI-Powered Integration
          </motion.h1>
          <motion.p 
            className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400"
            variants={itemVariants}
          >
            One platform for all your academic needs—classroom management, communication, and AI assistance, seamlessly unified.
          </motion.p>
          <motion.div 
            className="space-x-4"
            variants={itemVariants}
          >
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started Today
            </Button>
            <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </motion.svg>
      </motion.div>
    </section>
  )
}

