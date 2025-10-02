"use client"
import { useState, useEffect } from "react"
import Footer from "@/components/footer/footer"
import Header from "@/components/header/header"
import { useRouter } from "next/navigation"

export default function ResetPassword() {
  const [step, setStep] = useState(1) // 1: Enter phone, 2: Enter OTP, 3: New password
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [userId, setUserId] = useState("")
  const [validationErrors, setValidationErrors] = useState({})
  const router = useRouter()

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  const validatePassword = (password) => {
    return password.length >= 6
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError("")
    setValidationErrors({})

    if (!validatePhone(phone)) {
      setValidationErrors({ mobile: "Please enter a valid 10-digit phone number" })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/generateAndSendOtp`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          authType: 'Login',
          roleId: 2 // Doctor role
        })
      })

      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`)
      }

      if (response.ok && data.status) {
        setStep(2)
        setUserId(data.data.userId)
        setCountdown(60)
        setSuccess("OTP sent successfully to your phone")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Failed to send OTP")
      }
    } catch (error) {
      setError(error.message || "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError("")

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/verify-otp`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          otp: otp,
          userId: userId,
          roleId:2
        })
      })

      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`)
      }

      if (response.ok && data.status) {
        setStep(3)
        setSuccess("OTP verified successfully")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      setError(error.message || "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError("")
    setValidationErrors({})

    if (!validatePassword(newPassword)) {
      setValidationErrors({ password: "Password must be at least 6 characters long" })
      return
    }

    if (newPassword !== confirmPassword) {
      setValidationErrors({ confirmPassword: "Passwords do not match" })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/reset-password`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          newPassword: newPassword,
          roleId: 2 // Doctor role
        })
      })

      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`)
      }

      if (response.ok && data.status) {
        setSuccess("Password reset successfully! Redirecting to login...")
        setTimeout(() => {
          router.push('/doctor/login') // Redirect to login page
        }, 2000)
      } else {
        setError(data.message || "Failed to reset password")
      }
    } catch (error) {
      setError(error.message || "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async () => {
    if (countdown > 0) return

    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/generateAndSendOtp`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          roleId: 2,
          authType:'Login'
        })
      })

      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`)
      }

      if (response.ok && data.status) {
        setCountdown(60)
        setSuccess("OTP resent successfully")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Failed to resend OTP")
      }
    } catch (error) {
      setError(error.message || "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.back()
    }
  }

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#2c96fc] mb-2">Reset Password</h1>
            <p className="text-gray-600">Reset your password in 3 simple steps</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-4 left-0 right-0 h-1.5 bg-gray-200 -z-10 rounded-full">
                <div
                  className="h-1.5 bg-[#2c96fc] transition-all duration-500 rounded-full"
                  style={{ width: `${(step - 1) * 50}%` }}
                ></div>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= i ? "bg-[#2c96fc] text-white" : "bg-gray-200 text-gray-500"
                      } font-semibold transition-colors duration-300`}
                  >
                    {i}
                  </div>
                  <span
                    className={`text-sm mt-2 ${step === i ? "font-medium text-[#2c96fc]" : "text-gray-500"
                      }`}
                  >
                    {i === 1 ? "Enter Phone" : i === 2 ? "Verify OTP" : "New Password"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-xl text-sm">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={
            step === 1 ? handleSendOtp :
            step === 2 ? handleVerifyOtp :
            handleResetPassword
          }>
            {/* Step 1: Enter Phone Number */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">Enter Your Phone Number</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-gray-200 pr-2">
                      <span className="text-gray-500">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                        setValidationErrors(prev => ({ ...prev, mobile: "" }))
                      }}
                      className="pl-16 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Enter your registered phone number"
                      required
                      maxLength="10"
                    />
                  </div>
                  {validationErrors.mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.mobile}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Enter OTP */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">Verify OTP</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OTP *</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                </div>

                <div className="text-sm text-gray-600">
                  {countdown > 0 ? (
                    <span>Resend OTP in {countdown} seconds</span>
                  ) : (
                    <button 
                      type="button" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      onClick={resendOtp}
                      disabled={isLoading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">Create New Password</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setValidationErrors(prev => ({ ...prev, password: "" }))
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter new password (min. 6 characters)"
                    required
                  />
                  {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setValidationErrors(prev => ({ ...prev, confirmPassword: "" }))
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Confirm new password"
                    required
                  />
                  {validationErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={goBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm"
              >
                {step === 1 ? 'Back to Login' : 'Back'}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-[#2c96fc] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {step === 1 ? "Sending OTP..." : step === 2 ? "Verifying..." : "Resetting..."}
                  </div>
                ) : (
                  step === 1 ? "Send OTP" : step === 2 ? "Verify OTP" : "Reset Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}