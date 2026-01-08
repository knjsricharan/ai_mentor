'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import Hero from '@/components/sections/Hero'
import Problem from '@/components/sections/Problem'
import Vision from '@/components/sections/Vision'
import AIUnderstanding from '@/components/sections/AIUnderstanding'
import ExecutionEngine from '@/components/sections/ExecutionEngine'
import MemorySystem from '@/components/sections/MemorySystem'
import SmartGrouping from '@/components/sections/SmartGrouping'
import AdaptiveRoadmap from '@/components/sections/AdaptiveRoadmap'
import ProgressMonitoring from '@/components/sections/ProgressMonitoring'
import TechStack from '@/components/sections/TechStack'
import UseCases from '@/components/sections/UseCases'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'

interface SignInPageProps {
  onGoogleSignIn: () => Promise<any>
  title?: string
}

export default function SignInPage({ onGoogleSignIn, title = 'cerebro ai.' }: SignInPageProps) {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onGoogleSignIn()
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-dark-900">
      {/* Simple Title Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Brain className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold gradient-text">{title}</span>
          </motion.div>
        </div>
      </div>

      <Hero onSignIn={handleSignIn} />
      <Problem />
      <Vision />
      <AIUnderstanding />
      <ExecutionEngine />
      <MemorySystem />
      <SmartGrouping />
      <AdaptiveRoadmap />
      <ProgressMonitoring />
      <TechStack />
      <UseCases />
      <CTA showButtons={false} />
      <Footer />
    </main>
  )
}
