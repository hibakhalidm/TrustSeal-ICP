'use client'

import { useState } from 'react'
import { GraduationCap, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface CredentialForm {
  studentName: string
  degree: string
  institution: string
  issueDate: string
  studentId: string
  studentEmail: string
}

export default function IssuerPage() {
  const [formData, setFormData] = useState<CredentialForm>({
    studentName: '',
    degree: '',
    institution: '',
    issueDate: '',
    studentId: '',
    studentEmail: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
    credentialId?: string
  } | null>(null)

  const degreeOptions = [
    'Bachelor of Science',
    'Bachelor of Arts',
    'Master of Science',
    'Master of Arts',
    'Doctor of Philosophy',
    'Associate Degree',
    'Certificate',
    'Diploma'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await axios.post('/api/issuer/credentials', formData, {
        headers: {
          'X-User-ID': '1', // Mock issuer ID for demo
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setSubmitResult({
          success: true,
          message: 'Credential issued successfully!',
          credentialId: response.data.credentialId
        })
        
        // Reset form on success
        setFormData({
          studentName: '',
          degree: '',
          institution: '',
          issueDate: '',
          studentId: '',
          studentEmail: ''
        })
      } else {
        setSubmitResult({
          success: false,
          message: response.data.error || 'Failed to issue credential'
        })
      }
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error.response?.data?.error || 'An error occurred while issuing the credential'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Credential Issuer</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Issue New Credential</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create and issue digital credentials to students. These credentials will be stored on the 
              Internet Computer blockchain and can be verified using zero-knowledge proofs.
            </p>
          </div>

          {/* Credential Form */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Student Name */}
                <div>
                  <label htmlFor="studentName" className="form-label">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label htmlFor="studentId" className="form-label">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter student ID"
                    required
                  />
                </div>

                {/* Student Email */}
                <div>
                  <label htmlFor="studentEmail" className="form-label">
                    Student Email *
                  </label>
                  <input
                    type="email"
                    id="studentEmail"
                    name="studentEmail"
                    value={formData.studentEmail}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter student's email"
                    required
                  />
                </div>

                {/* Degree */}
                <div>
                  <label htmlFor="degree" className="form-label">
                    Degree/Credential Type *
                  </label>
                  <select
                    id="degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select degree type</option>
                    {degreeOptions.map((degree, index) => (
                      <option key={index} value={degree}>
                        {degree}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Institution */}
                <div>
                  <label htmlFor="institution" className="form-label">
                    Institution *
                  </label>
                  <input
                    type="text"
                    id="institution"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter institution name"
                    required
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label htmlFor="issueDate" className="form-label">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Issuing Credential...</span>
                    </div>
                  ) : (
                    'Issue Credential'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Result Message */}
          {submitResult && (
            <div className={`card ${
              submitResult.success 
                ? 'border-success-200 bg-success-50' 
                : 'border-error-200 bg-error-50'
            }`}>
              <div className="flex items-start space-x-3">
                {submitResult.success ? (
                  <CheckCircle className="w-6 h-6 text-success-600 mt-1 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-error-600 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    submitResult.success ? 'text-success-800' : 'text-error-800'
                  }`}>
                    {submitResult.success ? 'Success!' : 'Error'}
                  </h3>
                  <p className={`mt-1 ${
                    submitResult.success ? 'text-success-700' : 'text-error-700'
                  }`}>
                    {submitResult.message}
                  </p>
                  {submitResult.success && submitResult.credentialId && (
                    <div className="mt-3 p-3 bg-success-100 rounded-lg">
                      <p className="text-sm font-medium text-success-800">
                        Credential ID: <span className="font-mono">{submitResult.credentialId}</span>
                      </p>
                      <p className="text-sm text-success-700 mt-1">
                        This credential has been successfully issued and stored on the ICP blockchain.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Information Card */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">How It Works</h3>
                <div className="space-y-2 text-blue-800">
                  <p>1. Fill out the form above with student and credential details</p>
                  <p>2. Click "Issue Credential" to create the digital credential</p>
                  <p>3. The credential is stored on the Internet Computer blockchain</p>
                  <p>4. A zero-knowledge proof is generated for privacy-preserving verification</p>
                  <p>5. The student receives their credential and can share it with employers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
