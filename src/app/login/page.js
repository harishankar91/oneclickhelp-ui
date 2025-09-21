"use client"
import Footer from "@/components/footer/footer"
import Header from "@/components/header/header"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Login() {
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [userId, setUserId] = useState("")
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  const [validationErrors, setValidationErrors] = useState({})


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

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError("")
    
    if (!validatePhone(phone)) {
      setValidationErrors({mobile: "Please enter a valid 10-digit phone number"})
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('https://api.oneclickhelp.in/api/generateAndSendOtp', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          roleId: 1
        })
      })

      // Handle non-JSON responses (like 400 errors)
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`);
      }

      if (response.ok && data.status) {
        setOtpSent(true)
        setUserId(data.data.userId)
        setCountdown(60) // 60 seconds countdown
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
      const response = await fetch('https://api.oneclickhelp.in/api/verify-otp', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          otp: otp,
          userId: userId
        })
      })

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`);
      }

      if (response.ok && data.status) {
        // OTP verification successful
        sessionStorage.setItem("userId", data.data.userId)
        sessionStorage.setItem("userName", data.data.userName)
        sessionStorage.setItem('userRole', "1") // Assuming roleId 1
        

        // Redirect to dashboard
        router.push('/user/dashboard')
      } else {
        setError(data.message || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
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
      const response = await fetch('https://api.oneclickhelp.in/api/generateAndSendOtp', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          roleId: 1
        })
      })

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`);
      }

      if (response.ok && data.status) {
        setCountdown(60) // Reset countdown
      } else {
        setError(data.message || "Failed to resend OTP")
      }
    } catch (error) {
      console.error("OTP resend error:", error)
      setError(error.message || "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-blue-100 transform transition-all duration-300 hover:shadow-2xl">
          {/* Logo/Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 mb-4">
              <img src="/logo.png" className="w-50" alt="Company Logo" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Sign in with OTP to access your account</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-gray-200 pr-2">
                  <span className="text-gray-500">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setValidationErrors(prev => ({ ...prev, mobile: "" }))
                  }}
                  className="pl-16 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter phone number"
                  required
                  maxLength="10"
                  disabled={isLoading || otpSent}
                />
              </div>
              {validationErrors.mobile && <p className="text-red-500 text-xs mt-2">{validationErrors.mobile}</p>}
            </div>
            
            {otpSent && (
              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter 6-digit OTP"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-600">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {otpSent ? "Verifying..." : "Sending OTP..."}
                </div>
              ) : (
                otpSent ? "Verify OTP" : "Send OTP"
              )}
            </button>
          </form>
          
        </div>
      </div>
      <Footer />
    </>
  )
}