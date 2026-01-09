'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Target } from 'lucide-react'
import { useEffect, useState } from 'react'

interface HeroProps {
  onSignIn?: () => void
}

export default function Hero({ onSignIn }: HeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            transition: 'all 0.3s ease-out',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900" />
      </div>

      {/* Neural Network Visualization */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.circle
              key={i}
              cx={`${(i * 5) % 100}%`}
              cy={`${(i * 7) % 100}%`}
              r="3"
              fill="#00e6c8"
              className="neural-node"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <motion.span
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-500 text-sm font-medium"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Adaptive Execution Intelligence
            </motion.span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="gradient-text">Your Project's</span>
            <br />
            <span className="text-white">Thinking Brain</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Other tools give dashboards. CereBro AI gives direction.
            <br />
            <span className="text-primary-500 font-semibold">
              Stop managing projects. Start executing smarter.
            </span>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            {onSignIn ? (
              <motion.button
                onClick={onSignIn}
                className="px-8 py-4 bg-primary-500 text-dark-900 rounded-lg font-bold text-lg flex items-center gap-2 glow-teal-strong hover:bg-primary-400 transition-all"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 230, 200, 0.6)' }}
                whileTap={{ scale: 0.95 }}
              >
                Start Executing Smarter
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <>
                <motion.a
                  href="/get-started"
                  className="px-8 py-4 bg-primary-500 text-dark-900 rounded-lg font-bold text-lg flex items-center gap-2 glow-teal-strong hover:bg-primary-400 transition-all"
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 230, 200, 0.6)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Executing Smarter
                  <ArrowRight className="w-5 h-5" />
                </motion.a>
                <motion.button
                  className="px-8 py-4 border-2 border-primary-500 text-primary-500 rounded-lg font-bold text-lg hover:bg-primary-500/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Watch Demo
                </motion.button>
              </>
            )}
          </motion.div>

          {/* Key Features */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16"
          >
            {[
              { icon: Zap, text: 'Start messy. We\'ll structure it.' },
              { icon: Target, text: 'AI-powered execution guidance' },
              { icon: Sparkles, text: 'Never lose context again' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="p-6 bg-dark-800/50 backdrop-blur-sm rounded-xl border border-primary-500/20 hover:border-primary-500/50 transition-all"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <feature.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <p className="text-gray-300 font-medium">{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-primary-500 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-500 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  )
}
