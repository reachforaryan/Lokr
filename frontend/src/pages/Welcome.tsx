import React, { useState } from 'react'
import {
  CloudArrowUpIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ShareIcon,
  DocumentIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

export const Welcome: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      localStorage.setItem('onboarding_completed', 'true')
      window.location.reload()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true')
    window.location.reload()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-8">
            <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <CloudArrowUpIcon className="w-12 h-12 text-primary-600" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Lokr!
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your secure file vault with intelligent deduplication.
                Store, organize, and share files efficiently while saving storage space.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <ShieldCheckIcon className="w-8 h-8 text-green-600 mb-4 mx-auto" />
                <h3 className="font-semibold text-gray-900 mb-2">Secure Storage</h3>
                <p className="text-sm text-gray-600">
                  Enterprise-grade security with encryption and access controls
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <ChartBarIcon className="w-8 h-8 text-blue-600 mb-4 mx-auto" />
                <h3 className="font-semibold text-gray-900 mb-2">Smart Deduplication</h3>
                <p className="text-sm text-gray-600">
                  Automatically eliminates duplicate files to save storage space
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <ShareIcon className="w-8 h-8 text-purple-600 mb-4 mx-auto" />
                <h3 className="font-semibold text-gray-900 mb-2">Easy Sharing</h3>
                <p className="text-sm text-gray-600">
                  Share files securely with teams or make them publicly accessible
                </p>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="text-center space-y-8">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <DocumentIcon className="w-12 h-12 text-blue-600" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Getting Started
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Here's how to make the most of your Lokr experience:
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6 text-left">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Upload Your Files</h3>
                  <p className="text-gray-600">
                    Drag and drop files or use the upload button to add documents, images, and more.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Organize in Folders</h3>
                  <p className="text-gray-600">
                    Create folders to organize your files by project, category, or any system that works for you.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Share Securely</h3>
                  <p className="text-gray-600">
                    Control who can view, download, or edit your files with granular permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center space-y-8">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <UsersIcon className="w-12 h-12 text-green-600" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Experience
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Select how you'd like to use Lokr:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-8 rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-colors cursor-pointer">
                <DocumentIcon className="w-12 h-12 text-blue-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Use</h3>
                <p className="text-gray-600 mb-4">
                  Perfect for individuals who want to store and organize personal files securely.
                </p>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• 10GB storage quota</li>
                  <li>• Private file storage</li>
                  <li>• Basic sharing features</li>
                  <li>• File deduplication</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-lg border-2 border-primary-200 bg-primary-50 cursor-pointer">
                <UsersIcon className="w-12 h-12 text-primary-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Enterprise <span className="text-sm text-primary-600 font-normal">(Coming Soon)</span>
                </h3>
                <p className="text-gray-600 mb-4">
                  For teams and organizations that need advanced collaboration and management features.
                </p>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• Unlimited storage</li>
                  <li>• Team collaboration</li>
                  <li>• Admin controls</li>
                  <li>• Advanced analytics</li>
                </ul>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Don't worry - you can always upgrade later!
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl w-full">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-center mb-4">
            <div className="flex space-x-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep
                      ? 'bg-primary-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-12">
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Skip for now
            </button>

            <div className="flex space-x-4">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="btn-outline"
                >
                  Previous
                </button>
              )}

              <button
                onClick={handleNext}
                className="btn-primary"
              >
                {currentStep === totalSteps ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}