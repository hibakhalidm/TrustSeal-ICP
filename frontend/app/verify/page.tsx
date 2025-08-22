'use client'

import { useState } from 'react'
import { Shield, ArrowLeft, CheckCircle, XCircle, QrCode, Upload, FileText } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface VerificationResult {
  isValid: boolean
  message: string
  timestamp: number
  verificationMethod: string
}

export default function VerifierPage() {
  const [verificationMethod, setVerificationMethod] = useState<'qr' | 'proof'>('qr')
  const [qrCodeData, setQrCodeData] = useState('')
  const [proofData, setProofData] = useState('')
  const [publicInputs, setPublicInputs] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')

  const handleQRVerification = async () => {
    if (!qrCodeData.trim()) {
      setError('Please enter QR code data')
      return
    }

    setIsVerifying(true)
    setError('')
    setVerificationResult(null)

    try {
      const response = await axios.post('/api/verifier/credentials/verify-qr', {
        qrCodeData: qrCodeData
      })

      if (response.data.success) {
        setVerificationResult({
          isValid: response.data.isValid,
          message: response.data.message,
          timestamp: response.data.timestamp,
          verificationMethod: 'QR Code'
        })
      } else {
        setError(response.data.error || 'Verification failed')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'An error occurred during verification')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleProofVerification = async () => {
    if (!proofData.trim() || !publicInputs.trim()) {
      setError('Please enter both proof data and public inputs')
      return
    }

    setIsVerifying(true)
    setError('')
    setVerificationResult(null)

    try {
      const response = await axios.post('/api/verifier/proofs/verify', {
        proof: proofData,
        publicInputs: publicInputs
      })

      if (response.data.success) {
        setVerificationResult({
          isValid: response.data.isValid,
          message: response.data.message,
          timestamp: response.data.timestamp,
          verificationMethod: 'ZK Proof'
        })
      } else {
        setError(response.data.error || 'Verification failed')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'An error occurred during verification')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (verificationMethod === 'qr') {
          setQrCodeData(content)
        } else {
          setProofData(content)
        }
      }
      reader.readAsText(file)
    }
  }

  const resetForm = () => {
    setQrCodeData('')
    setProofData('')
    setPublicInputs('')
    setVerificationResult(null)
    setError('')
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Credential Verifier</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Verify Credentials</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Instantly verify student credentials using zero-knowledge proofs or QR codes. 
              No need to contact issuing institutions - verification happens in seconds.
            </p>
          </div>

          {/* Verification Method Tabs */}
          <div className="card">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setVerificationMethod('qr')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  verificationMethod === 'qr'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <QrCode className="w-4 h-4 inline mr-2" />
                QR Code Verification
              </button>
              <button
                onClick={() => setVerificationMethod('proof')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  verificationMethod === 'proof'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                ZK Proof Verification
              </button>
            </div>
          </div>

          {/* Verification Form */}
          <div className="card">
            {verificationMethod === 'qr' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Verification</h3>
                  <p className="text-gray-600">
                    Enter the QR code data from a student's credential to verify its authenticity.
                  </p>
                </div>

                <div>
                  <label htmlFor="qrCodeData" className="form-label">
                    QR Code Data
                  </label>
                  <textarea
                    id="qrCodeData"
                    value={qrCodeData}
                    onChange={(e) => setQrCodeData(e.target.value)}
                    className="input-field h-32 resize-none"
                    placeholder="Paste QR code data here or upload a file..."
                    required
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="file"
                      accept=".txt,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Upload file</span>
                  </label>
                </div>

                <button
                  onClick={handleQRVerification}
                  disabled={isVerifying || !qrCodeData.trim()}
                  className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Credential'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ZK Proof Verification</h3>
                  <p className="text-gray-600">
                    Verify a zero-knowledge proof to confirm credential authenticity without revealing private data.
                  </p>
                </div>

                <div>
                  <label htmlFor="proofData" className="form-label">
                    ZK Proof Data
                  </label>
                  <textarea
                    id="proofData"
                    value={proofData}
                    onChange={(e) => setProofData(e.target.value)}
                    className="input-field h-32 resize-none"
                    placeholder="Paste ZK proof data here or upload a file..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="publicInputs" className="form-label">
                    Public Inputs
                  </label>
                  <textarea
                    id="publicInputs"
                    value={publicInputs}
                    onChange={(e) => setPublicInputs(e.target.value)}
                    className="input-field h-24 resize-none"
                    placeholder="Paste public inputs here..."
                    required
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="file"
                      accept=".txt,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Upload proof file</span>
                  </label>
                </div>

                <button
                  onClick={handleProofVerification}
                  disabled={isVerifying || !proofData.trim() || !publicInputs.trim()}
                  className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying...' : 'Verify ZK Proof'}
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="card border-error-200 bg-error-50">
              <p className="text-error-700">{error}</p>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className={`card ${
              verificationResult.isValid 
                ? 'border-success-200 bg-success-50' 
                : 'border-error-200 bg-error-50'
            }`}>
              <div className="flex items-start space-x-3">
                {verificationResult.isValid ? (
                  <CheckCircle className="w-8 h-8 text-success-600 mt-1 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-error-600 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold ${
                    verificationResult.isValid ? 'text-success-800' : 'text-error-800'
                  }`}>
                    {verificationResult.isValid ? 'Verification Successful!' : 'Verification Failed'}
                  </h3>
                  <p className={`mt-2 ${
                    verificationResult.isValid ? 'text-success-700' : 'text-error-700'
                  }`}>
                    {verificationResult.message}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Method:</span>
                      <span className="ml-2 text-gray-600">{verificationResult.verificationMethod}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Timestamp:</span>
                      <span className="ml-2 text-gray-600">{formatTimestamp(verificationResult.timestamp)}</span>
                    </div>
                  </div>

                  {verificationResult.isValid && (
                    <div className="mt-4 p-3 bg-success-100 rounded-lg">
                      <p className="text-sm font-medium text-success-800">
                        ✅ This credential has been verified and is authentic.
                      </p>
                      <p className="text-sm text-success-700 mt-1">
                        The student possesses a valid credential from the issuing institution.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetForm}
              className="btn-secondary px-8 py-3"
            >
              Reset Form
            </button>
            
            {verificationResult && (
              <button
                onClick={() => window.print()}
                className="btn-primary px-8 py-3"
              >
                Print Result
              </button>
            )}
          </div>

          {/* Information Card */}
          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">How Verification Works</h3>
                <div className="space-y-2 text-purple-800">
                  <p><strong>QR Code Method:</strong> Scan or paste QR code data from a student's credential</p>
                  <p><strong>ZK Proof Method:</strong> Verify the cryptographic proof without seeing private data</p>
                  <p>Both methods provide instant verification results</p>
                  <p>No need to contact universities or wait for responses</p>
                  <p>All verifications are cryptographically secure and tamper-proof</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
