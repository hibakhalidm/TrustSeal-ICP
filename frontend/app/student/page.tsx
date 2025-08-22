'use client'

import { useState, useEffect } from 'react'
import { UserCheck, ArrowLeft, Download, QrCode, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import QRCode from 'qrcode.react'

interface Credential {
  id: number
  credentialId: string
  degree: string
  institution: string
  issueDate: string
  status: string
  proofData: string
  qrCodeData: string
}

export default function StudentPage() {
  const [studentId, setStudentId] = useState('')
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)
  const [showProof, setShowProof] = useState(false)

  const handleSearch = async () => {
    if (!studentId.trim()) {
      setError('Please enter a student ID')
      return
    }

    setIsLoading(true)
    setError('')
    setCredentials([])

    try {
      const response = await axios.get(`/api/student/credentials?studentId=${studentId}`)
      
      if (response.data.success) {
        setCredentials(response.data.credentials)
        if (response.data.credentials.length === 0) {
          setError('No credentials found for this student ID')
        }
      } else {
        setError(response.data.error || 'Failed to fetch credentials')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'An error occurred while fetching credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateProof = async (credentialId: number) => {
    try {
      const response = await axios.post(`/api/student/credentials/${credentialId}/proof`)
      
      if (response.data.success) {
        // Update the credential with the proof data
        setCredentials(prev => prev.map(cred => 
          cred.id === credentialId 
            ? { ...cred, proofData: response.data.proof, qrCodeData: response.data.qrCode }
            : cred
        ))
        
        // Find and set the selected credential
        const updatedCredential = credentials.find(cred => cred.id === credentialId)
        if (updatedCredential) {
          setSelectedCredential({
            ...updatedCredential,
            proofData: response.data.proof,
            qrCodeData: response.data.qrCode
          })
        }
      }
    } catch (error: any) {
      setError('Failed to generate proof for this credential')
    }
  }

  const downloadQRCode = (credential: Credential) => {
    const canvas = document.getElementById(`qr-${credential.id}`) as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `credential-${credential.credentialId}.png`
      link.href = url
      link.click()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">View Your Credentials</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access your digital credentials and generate zero-knowledge proofs for privacy-preserving verification.
            </p>
          </div>

          {/* Search Section */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your Student ID"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Searching...' : 'Search Credentials'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="card border-error-200 bg-error-50">
              <p className="text-error-700">{error}</p>
            </div>
          )}

          {/* Credentials List */}
          {credentials.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Your Credentials</h3>
              
              <div className="grid gap-6">
                {credentials.map((credential) => (
                  <div key={credential.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-xl font-semibold text-gray-900">{credential.degree}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            credential.status === 'ISSUED' 
                              ? 'bg-success-100 text-success-800' 
                              : 'bg-warning-100 text-warning-800'
                          }`}>
                            {credential.status}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Institution:</span> {credential.institution}
                          </div>
                          <div>
                            <span className="font-medium">Issue Date:</span> {formatDate(credential.issueDate)}
                          </div>
                          <div>
                            <span className="font-medium">Credential ID:</span> 
                            <span className="font-mono ml-1">{credential.credentialId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleGenerateProof(credential.id)}
                          className="btn-secondary"
                        >
                          Generate Proof
                        </button>
                        
                        {credential.qrCodeData && (
                          <button
                            onClick={() => setSelectedCredential(credential)}
                            className="btn-primary"
                          >
                            <QrCode className="w-4 h-4 mr-2 inline" />
                            View QR Code
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Proof Data (Collapsible) */}
                    {credential.proofData && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowProof(!showProof)}
                          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          {showProof ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          <span>{showProof ? 'Hide' : 'Show'} ZK Proof Data</span>
                        </button>
                        
                        {showProof && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <pre className="text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(JSON.parse(credential.proofData), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code Modal */}
          {selectedCredential && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="card max-w-md w-full">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Credential QR Code</h3>
                  
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCode
                      id={`qr-${selectedCredential.id}`}
                      value={selectedCredential.qrCodeData}
                      size={200}
                      level="H"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Scan this QR code to verify the credential
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadQRCode(selectedCredential)}
                      className="btn-secondary flex-1"
                    >
                      <Download className="w-4 h-4 mr-2 inline" />
                      Download
                    </button>
                    <button
                      onClick={() => setSelectedCredential(null)}
                      className="btn-primary flex-1"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Information Card */}
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">How to Use</h3>
                <div className="space-y-2 text-green-800">
                  <p>1. Enter your Student ID to search for your credentials</p>
                  <p>2. View your issued credentials and their details</p>
                  <p>3. Generate ZK proofs for privacy-preserving verification</p>
                  <p>4. Download QR codes to share with employers</p>
                  <p>5. Employers can scan the QR code to verify your credential instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
