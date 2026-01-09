import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Hero from '../sections/Hero'
import CTA from '../sections/CTA'

interface SignInPageProps {
  onGoogleSignIn: () => Promise<any>
  title?: string
}

export default function SignInPage({ onGoogleSignIn, title = 'cerebro ai.' }: SignInPageProps) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, userProfile, profileLoading, isProfileComplete } = useAuth() as any

  // Redirect authenticated users based on profile completion
  useEffect(() => {
    if (user && !profileLoading) {
      if (isProfileComplete) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [user, profileLoading, isProfileComplete, navigate])

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
      <CTA showButtons={false} />
    </main>
  )
}
