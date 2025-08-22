'use client'

import { useState } from 'react'
import { GraduationCap, UserCheck, Shield, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview')

  const features = [
    {
      icon: <GraduationCap className="w-8 h-8 text-primary-600" />,
      title: 'Credential Issuance',
      description: 'Universities can issue digital diplomas and certificates as verifiable credentials on the ICP blockchain.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <UserCheck className="w-8 h-8 text-success-600" />,
      title: 'Student Ownership',
      description: 'Students own their credentials as NFTs and can generate ZK proofs for privacy-preserving verification.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: 'Instant Verification',
      description: 'Employers can instantly verify credentials using ZK proofs without revealing private information.',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const quickActions = [
    {
      title: 'Issue Credential',
      description: 'For university administrators',
      href: '/issuer',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Credentials',
      description: 'For students',
      href: '/student',
      icon: <UserCheck className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Verify Credential',
      description: 'For employers',
      href: '/verify',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">TrustSeal ICP</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'features'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'demo'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Demo
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900">
                Decentralized Credential
                <span className="text-gradient block">Verification</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                TrustSeal ICP revolutionizes credential verification using blockchain technology and 
                zero-knowledge proofs to ensure privacy, security, and instant verification.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/issuer" className="btn-primary text-lg px-8 py-3">
                  Start Issuing Credentials
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Link>
                <Link href="/verify" className="btn-secondary text-lg px-8 py-3">
                  Verify a Credential
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="card hover:shadow-xl transition-shadow duration-300 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
              <p className="text-lg text-gray-600">Discover what makes TrustSeal ICP unique</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card text-center group hover:shadow-xl transition-shadow duration-300">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Technology Stack */}
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Technology Stack</h3>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-blue-600 font-bold text-lg">ICP</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Internet Computer</p>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-green-600 font-bold text-lg">ZK</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Zero-Knowledge Proofs</p>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-purple-600 font-bold text-lg">VC</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Verifiable Credentials</p>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-orange-600 font-bold text-lg">NFT</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">NFT Standards</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'demo' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Live Demo</h2>
              <p className="text-lg text-gray-600">Experience the TrustSeal ICP workflow</p>
            </div>

            <div className="card max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Issue a Credential</h3>
                    <p className="text-gray-600">University admin creates a digital diploma for a student</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Generate ZK Proof</h3>
                    <p className="text-gray-600">Student generates a privacy-preserving proof of their credential</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Verify Credential</h3>
                    <p className="text-gray-600">Employer verifies the credential using the ZK proof</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/issuer" className="btn-primary">
                      Try Issuing a Credential
                    </Link>
                    <Link href="/student" className="btn-secondary">
                      View Student Dashboard
                    </Link>
                    <Link href="/verify" className="btn-success">
                      Verify a Credential
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">TrustSeal ICP</span>
            </div>
            <p className="text-gray-400 mb-4">
              Built for WCHL 2025 - Revolutionizing credential verification with blockchain technology
            </p>
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Powered by Internet Computer Protocol</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
