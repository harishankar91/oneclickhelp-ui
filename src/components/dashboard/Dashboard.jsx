"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Footer from "../footer/footer"
import Header from "../header/header"

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tokens")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [tokens, setTokens] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [doctorDetails, setDoctorDetails] = useState({}) // Store doctor details by ID
  const [statusList, setStatusList] = useState([]) // Store token status list

  useEffect(() => {
    // Check if user is logged in
    const userId = sessionStorage.getItem('userId')
    const userName = sessionStorage.getItem('userName')

    if (!userId || !userName) {
      router.push('/')
      return
    }

    setUserName(userName)
    fetchStatusList().then(() => {
      fetchUserData(userId)
    })
  }, [router])

  const fetchStatusList = async () => {
    try {
      const res = await fetch('https://api.oneclickhelp.in/api/getTokenStatusList')
      if (!res.ok) throw new Error("Failed to fetch status list")
      const data = await res.json()
      setStatusList(data)
    } catch (err) {
      console.error("Error fetching status list:", err)
    }
  }

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const res = await fetch(
        `https://api.oneclickhelp.in/api/getDoctorsById?doctorId=${doctorId}`
      )
      if (!res.ok) throw new Error("Failed to fetch doctor")
      const data = await res.json()
      return data
    } catch (err) {
      console.error("Error fetching doctor details:", err)
      return null
    }
  }

  const fetchUserData = async (userId) => {
    try {
      setLoading(true)

      // Fetch tokens
      const tokensResponse = await fetch(`https://api.oneclickhelp.in/api/getTokenDetailsByUserId?userId=${userId}`)
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json()
        setTokens(tokensData)

        // Fetch doctor details for each token
        const tokenDoctorIds = [...new Set(tokensData.map(token => token.doctorId))];
        const doctorDetailsMap = {};

        for (const doctorId of tokenDoctorIds) {
          const details = await fetchDoctorDetails(doctorId);
          if (details) {
            doctorDetailsMap[doctorId] = details;
          }
        }

        setDoctorDetails(prev => ({ ...prev, ...doctorDetailsMap }));
      }

      // Fetch appointments
      const appointmentsResponse = await fetch(`https://api.oneclickhelp.in/api/getAppointmentsByUser?userId=${userId}`)
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        if (appointmentsData.status && appointmentsData.data) {
          setAppointments(appointmentsData.data)

          // Fetch doctor details for each appointment
          const appointmentDoctorIds = [...new Set(appointmentsData.data.map(appointment => appointment.doctorId))];
          const appointmentDoctorDetailsMap = {};

          for (const doctorId of appointmentDoctorIds) {
            // Only fetch if we haven't already fetched this doctor's details
            if (!doctorDetails[doctorId]) {
              const details = await fetchDoctorDetails(doctorId);
              if (details) {
                appointmentDoctorDetailsMap[doctorId] = details;
              }
            }
          }

          setDoctorDetails(prev => ({ ...prev, ...appointmentDoctorDetailsMap }));
        }
      }

    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadge = (statusId, isAppointment = false) => {

    // For tokens, use the status list from API
    const statusInfo = statusList.find(status => status.status === statusId);

    if (statusInfo) {
      const colorMap = {
        "Booked": "bg-blue-100 text-blue-800 border-blue-200",
        "Checked_In": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Waiting": "bg-orange-100 text-orange-800 border-orange-200",
        "With_Doctor": "bg-indigo-100 text-indigo-800 border-indigo-200",
        "Completed": "bg-green-100 text-green-800 border-green-200",
        "Cancelled": "bg-red-100 text-red-800 border-red-200",
        "Missed": "bg-gray-100 text-gray-800 border-gray-200"
      }

      const colorClass = colorMap[statusInfo.status] || "bg-gray-100 text-gray-800 border-gray-200";

      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
          {statusInfo.status.replace(/_/g, ' ')}
        </span>
      )
    }

    // Default badge if status not found
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
        Unknown
      </span>
    )
  }

  const handleLogout = () => {
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('userName')
    router.push('/')
  }

  const filteredTokens = filterStatus === "all"
    ? tokens
    : tokens.filter(token => token.statusId && token.statusId.toString() === filterStatus)

  const filteredAppointments = filterStatus === "all"
    ? appointments
    : appointments.filter(appointment => {
      // For appointments, we need to map the status string to a filter value
      if (filterStatus === "1") return appointment.status === "Booked" || appointment.status === "Confirmed";
      if (filterStatus === "2") return appointment.status === "Completed";
      if (filterStatus === "3") return appointment.status === "Cancelled";
      return false;
    })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Hello, {userName}!</h2>
              <p className="opacity-90">Here's an overview of your medical tokens and appointments</p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <div className="bg-white/20 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold">{tokens.length}</p>
                <p className="text-sm">Total Tokens</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold">{appointments.length}</p>
                <p className="text-sm">Appointments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex border-b border-gray-200 md:border-none overflow-x-auto">
              <button
                className={`px-6 py-3 cursor-pointer text-sm font-medium rounded-t-lg md:rounded-lg transition-colors duration-200 flex-shrink-0 ${activeTab === 'tokens'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600 md:border-none'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab('tokens')}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  My Tokens ({tokens.length})
                </span>
              </button>
              <button
                className={`px-6 py-3 cursor-pointer text-sm font-medium rounded-t-lg md:rounded-lg transition-colors duration-200 flex-shrink-0 ${activeTab === 'appointments'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600 md:border-none'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab('appointments')}
              >
                <span className="flex  items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  My Appointments ({appointments.length})
                </span>
              </button>
            </div>

            <div className="mt-4 md:mt-0">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mr-2">Filter by status:</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="1">Booked/Confirmed</option>
                <option value="2">Completed</option>
                <option value="3">Cancelled</option>
                <option value="4">Checked In</option>
                <option value="5">Waiting</option>
                <option value="6">With Doctor</option>
                <option value="7">Missed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {activeTab === 'tokens' ? (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                My Tokens
              </h2>

              {filteredTokens.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No tokens found</h3>
                  <p className="text-gray-600 mb-6">You haven't booked any tokens yet.</p>
                 
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTokens.map((token) => {
                    const doctor = doctorDetails[token.doctorId];
                    return (
                      <div key={token.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 relative bg-white">
                        <div className="absolute top-5 right-5">
                          {getStatusBadge(token.status)}
                        </div>

                        {/* Token Header */}
                        <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                          <div className="bg-blue-100 p-3 rounded-lg mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              Token #{token.token}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Booking ID: {token.id}
                            </div>
                          </div>
                        </div>

                        {/* Patient Information */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Patient Details
                          </h3>
                          <div className="space-y-2.5 pl-2">
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-32 flex-shrink-0">Name:</span>
                              <span className="text-sm font-medium text-gray-900">{token.patientName}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-32 flex-shrink-0">Phone:</span>
                              <span className="text-sm font-medium text-gray-900">{token.patientPhone}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-32 flex-shrink-0">Gender:</span>
                              <span className="text-sm font-medium text-gray-900">{token.patientGender}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-32 flex-shrink-0">Booking Date:</span>
                              <span className="text-sm font-medium text-gray-900">{formatDate(token.bookingDate)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Doctor Information */}
                        {doctor && (
                          <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Doctor Details
                            </h3>
                            <div className="space-y-2.5 pl-2">
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Name:</span>
                                <span className="text-sm font-medium text-gray-900">{token.doctorName}</span>
                              </div>
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Phone:</span>
                                <span className="text-sm font-medium text-gray-900">{doctor.phone || "Not available"}</span>
                              </div>
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Specialization:</span>
                                <span className="text-sm font-medium text-gray-900">{doctor.doctorProfDetails.specialization || "Not specified"}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Hospital Information */}
                        {doctor && doctor.hospitalDetails && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Hospital Details
                            </h3>
                            <div className="space-y-2.5 pl-2">
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Name:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {token.hospitalName || "Not specified"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Arrival Time:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {token.estimatedArrivalTime || "Not specified"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Address:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {[token.address_1, token.address_2, token.landmark]
                                    .filter(Boolean).join(", ") || "Not available"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}


                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                My Appointments
              </h2>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No appointments found</h3>
                  <p className="text-gray-600 mb-6">You haven't booked any appointments yet.</p>
                  
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAppointments.map((appointment) => {
                    const doctor = doctorDetails[appointment.doctorId];
                    return (
                      <div key={appointment.bookingId} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 relative bg-white">
                        <div className="absolute top-5 right-5">
                          {getStatusBadge(appointment.status, true)}
                        </div>

                        {/* Appointment Header */}
                        <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
                          <div className="bg-purple-100 p-3 rounded-lg mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-purple-600">
                              Appointment
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Booked Id: {appointment.bookingId}
                            </div>
                          </div>
                        </div>

                        {/* Patient Information */}
                        <div className="mb-5">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Patient Details</h3>
                          <div className="space-y-2.5 pl-2">
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Name:</span>
                              <span className="text-sm font-medium text-gray-900">{appointment.patientName}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Phone:</span>
                              <span className="text-sm font-medium text-gray-900">{appointment.patientPhone}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Gender:</span>
                              <span className="text-sm font-medium text-gray-900">{appointment.patientGender}</span>
                            </div>
                          </div>
                        </div>

                        {/* Doctor Information */}
                        {doctor && (
                          <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Doctor Details</h3>
                            <div className="space-y-2.5 pl-2">
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-28 flex-shrink-0">Name:</span>
                                <span className="text-sm font-medium text-gray-900">{appointment.doctorName}</span>
                              </div>
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-28 flex-shrink-0">Specialization:</span>
                                <span className="text-sm font-medium text-gray-900">{doctor.doctorProfDetails.specialization || "Not specified"}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Hospital Information */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Hospital Details</h3>
                          <div className="space-y-2.5 pl-2">
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Name:</span>
                              <span className="text-sm font-medium text-gray-900">{appointment.hospitalName}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Address:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {[appointment.address1, appointment.address2, appointment.landmark]
                                  .filter(Boolean).join(", ") || "Not available"}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}