"use client"
import Footer from "@/components/footer/footer"
import Header from "@/components/header/header"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Login() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const [validationErrors, setValidationErrors] = useState({

  })

  useEffect(() => {
    // Check if phone was remembered
    const rememberedPhone = localStorage.getItem('rememberedPhone')
    if (rememberedPhone) {
      setPhone(rememberedPhone)
      setRememberMe(true)
    }
  }, [])

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  const errors = {}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validatePhone(phone)) {
      errors["mobile"] = "Please enter a valid 10-digit phone number"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('https://api.oneclickhelp.in/api/getToken', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          roleId:"1",
          password: password
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Login successful - now fetch user data
        const userResponse = await fetch('https://api.oneclickhelp.in/api/getUserDetails', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'accept': '*/*',
          },
        })
        
        const userData = await userResponse.json()
        
        if (userData.status && userData.data?.userId) {
          // Save userId and userName to session storage
          sessionStorage.setItem("userId", userData.data.userId)
          sessionStorage.setItem("userName", userData.data.name)
          
          // Store token and role in sessionStorage
          sessionStorage.setItem('authToken', data.token)
          sessionStorage.setItem('userRole', data.roleId)
          
          // Store phone if rememberMe is checked
          if (rememberMe) {
            sessionStorage.setItem('rememberedPhone', phone)
          } else {
            sessionStorage.removeItem('rememberedPhone')
          }
          
          // Redirect to dashboard
          router.push('/user/dashboard')
        } else {
          setError(userData.message || "Failed to fetch user data")
        }
      } else {
        // Login failed
        setError(data.message || "Login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please try again.")
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
            <p className="text-gray-500 mt-2">Sign in to access your account</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                    }
                  }
                  className="pl-16 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter phone number"
                  required
                  maxLength="10"
                  disabled={isLoading}
                />
                
              </div>
              {validationErrors.mobile && <p className="text-red-500 text-xs mt-2">{validationErrors.mobile}</p>}
            </div>
            
            <div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            
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
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
        </div>
      </div>
      <Footer />
    </>
  )
}