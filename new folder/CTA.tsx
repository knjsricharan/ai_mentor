'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'

interface CTAProps {
  showButtons?: boolean
}

export default function CTA({ showButtons = true }: CTAProps) {
  const keyMessages = [
    "Other tools give dashboards. CereBro AI gives direction.",
    "Stop managing projects. Start executing smarter.",
    "Start messy. We'll structure it.",
    "Your project's thinking brain.",
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-dark-900 via-primary-500/10 to-dark-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-500 text-sm font-medium mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4" />
            Ready to Transform Your Execution
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Start Executing</span>
            <br />
            <span className="text-white">Smarter Today</span>
          </h2>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the future of intelligent project execution.
            <br />
            Experience the power of an AI that thinks, learns, and adapts with you.
          </p>

          {showButtons && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <motion.a
                href="/get-started"
                className="px-8 py-4 bg-primary-500 text-dark-900 rounded-lg font-bold text-lg flex items-center gap-2 glow-teal-strong hover:bg-primary-400 transition-all"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 230, 200, 0.6)' }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.button
                className="px-8 py-4 border-2 border-primary-500 text-primary-500 rounded-lg font-bold text-lg hover:bg-primary-500/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Demo
              </motion.button>
            </div>
          )}

          {/* Key Messages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyMessages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="p-4 bg-dark-800/50 rounded-lg border border-primary-500/20"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p className="text-gray-300 font-medium">{message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
