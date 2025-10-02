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
  const [doctorDetails, setDoctorDetails] = useState({})
  const [statusList, setStatusList] = useState([])
  const [liveStatus, setLiveStatus] = useState(null)
  const [showLiveStatus, setShowLiveStatus] = useState(false)
  const [loadingLiveStatus, setLoadingLiveStatus] = useState(false)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [isCurrentDate, setIsCurrentDate] = useState(true)
  
  // Token reschedule states
  const [rescheduleData, setRescheduleData] = useState({
    tokenId: null,
    bookingDate: new Date().toISOString().split('T')[0],
    shiftId: null
  })
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [shifts, setShifts] = useState([])

  // Appointment reschedule states
  const [appointmentRescheduleData, setAppointmentRescheduleData] = useState({
    bookingId: null,
    slotId: null,
    bookingDate: new Date().toISOString().split('T')[0]
  })
  const [showAppointmentRescheduleModal, setShowAppointmentRescheduleModal] = useState(false)
  const [appointmentRescheduleLoading, setAppointmentRescheduleLoading] = useState(false)
  const [appointmentSlots, setAppointmentSlots] = useState([])

  const fetchShifts = async (doctorId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorOPDShifts?doctorId=${doctorId}`)
      if (!res.ok) throw new Error("Failed to fetch shifts")
      const data = await res.json()
      setShifts(data.data)
    } catch (err) {
      console.error("Error fetching shifts:", err)
      alert("Failed to fetch available shifts. Please try again.")
    }
  }

  const fetchAppointmentSlots = async (doctorId, date) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorSlots?doctorId=${doctorId}&date=${date}`)
      if (!res.ok) throw new Error("Failed to fetch appointment slots")
      const data = await res.json()
      setAppointmentSlots(data || [])
    } catch (err) {
      console.error("Error fetching appointment slots:", err)
      alert("Failed to fetch available appointment slots. Please try again.")
    }
  }

  const rescheduleToken = async () => {
    if (!rescheduleData.bookingDate || !rescheduleData.shiftId) {
      alert("Please select both date and shift")
      return
    }
  
    setRescheduleLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/rescheduleToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldBookingId: rescheduleData.tokenId,
          bookingDate: rescheduleData.bookingDate,
          shiftId: rescheduleData.shiftId
        })
      })
  
      if (!res.ok) throw new Error("Failed to reschedule token")
  
      const result = await res.json()
      
      if (result.status) {
        alert("Token rescheduled successfully!")
        setShowRescheduleModal(false)
        
        // Refresh the data
        const userId = sessionStorage.getItem('userId')
        if (userId) {
          fetchUserData(userId)
        }
      } else {
        throw new Error(result.message || "Failed to reschedule token")
      }
    } catch (err) {
      alert(err.message || "Failed to reschedule token. Please try again.")
    } finally {
      setRescheduleLoading(false)
    }
  }

  const rescheduleAppointment = async () => {
    if (!appointmentRescheduleData.slotId) {
      alert("Please select a slot")
      return
    }
  
    setAppointmentRescheduleLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/rescheduleAppointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldBookingId: appointmentRescheduleData.bookingId,
          slotId: appointmentRescheduleData.slotId
        })
      })
    
      const result = await res.json()
      
      if (result.status) {
        alert("Appointment rescheduled successfully!")
        setShowAppointmentRescheduleModal(false)
        
        // Refresh the data
        const userId = sessionStorage.getItem('userId')
        if (userId) {
          fetchUserData(userId)
        }
      } else {
        
        throw new Error(result.message || "Failed to reschedule appointment")
      }
    } catch (err) {
      alert(err.message || "Failed to reschedule appointment. Please try again.")
    } finally {
      setAppointmentRescheduleLoading(false)
    }
  }

  const openRescheduleModal = (token) => {
    setRescheduleData({
      tokenId: token.id,
      bookingDate: new Date().toISOString().split('T')[0],
      shiftId: null
    })
    fetchShifts(token.doctorId)
    setShowRescheduleModal(true)
  }

  const openAppointmentRescheduleModal = (appointment) => {
    setAppointmentRescheduleData({
      bookingId: appointment.bookingId,
      slotId: null,
      bookingDate: new Date().toISOString().split('T')[0]
    })
    fetchAppointmentSlots(appointment.doctorId, new Date().toISOString().split('T')[0])
    setShowAppointmentRescheduleModal(true)
  }

  const handleAppointmentDateChange = (date) => {
    setAppointmentRescheduleData(prev => ({ ...prev, bookingDate: date, slotId: null }))
    // Find the appointment to get doctorId
    const appointment = appointments.find(app => app.bookingId === appointmentRescheduleData.bookingId)
    if (appointment) {
      fetchAppointmentSlots(appointment.doctorId, date)
    }
  }

  useEffect(() => {
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

  useEffect(() => {
    // Check if the selected date is the current date
    const today = new Date().toISOString().split('T')[0]
    setIsCurrentDate(dateFilter === today)
  }, [dateFilter])

  const fetchLiveStatus = async (doctorId, tokenId) => {
    setLoadingLiveStatus(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/liveStatus?doctorId=${doctorId}&token=${tokenId}`)
      if (!res.ok) throw new Error("Failed to fetch live status")
      const data = await res.json()
      setLiveStatus(data)
      setShowLiveStatus(true)
    } catch (err) {
      console.error("Error fetching live status:", err)
      alert("Failed to fetch live status. Please try again.")
    } finally {
      setLoadingLiveStatus(false)
    }
  }

  const closeLiveStatus = () => {
    setShowLiveStatus(false)
    setLiveStatus(null)
  }

  const fetchStatusList = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getTokenStatusList`)
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
        `${process.env.NEXT_PUBLIC_API_URL}api/getDoctorsById?doctorId=${doctorId}`
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
      const tokensResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getTokenDetailsByUserId?userId=${userId}`)
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
      const appointmentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getAppointmentsByUser?userId=${userId}`)
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        if (appointmentsData.status && appointmentsData.data) {
          setAppointments(appointmentsData.data)

          // Fetch doctor details for each appointment
          const appointmentDoctorIds = [...new Set(appointmentsData.data.map(appointment => appointment.doctorId))];
          const appointmentDoctorDetailsMap = {};

          for (const doctorId of appointmentDoctorIds) {
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

  const filteredTokens = tokens.filter(token => {
    const statusMatch = filterStatus === "all" ||
      (token.statusId && token.statusId.toString() === filterStatus);

    const dateMatch = !dateFilter ||
      (token.bookingDate && token.bookingDate.split('T')[0] === dateFilter);

    return statusMatch && dateMatch;
  });

  const filteredAppointments = appointments.filter(appointment => {
    let statusMatch = false;
    if (filterStatus === "all") {
      statusMatch = true;
    } else if (filterStatus === "1") {
      statusMatch = appointment.status === "Booked" || appointment.status === "Confirmed";
    } else if (filterStatus === "2") {
      statusMatch = appointment.status === "Completed";
    } else if (filterStatus === "3") {
      statusMatch = appointment.status === "Cancelled";
    }

    const dateMatch = !dateFilter ||
      (appointment.bookingDate && appointment.bookingDate.split('T')[0] === dateFilter);

    return statusMatch && dateMatch;
  });

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-4">
              <div>
                <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 mr-2">Filter by date:</label>
                <input
                  type="date"
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mr-2">Filter by status:</label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="1">Booked</option>
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
        </div>

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
                  <p className="text-gray-600 mb-6">
                    {dateFilter || filterStatus !== "all"
                      ? "No tokens match your filters. Try changing your filter criteria."
                      : "You haven't booked any tokens yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTokens.map((token) => {
                    const doctor = doctorDetails[token.doctorId];
                    // Check if token booking date is today
                    const isTokenToday = token.bookingDate && 
                      token.bookingDate.split('T')[0] === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div key={token.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 relative bg-white">
                        <div className="absolute top-5 right-5">
                          {getStatusBadge(token.status)}
                        </div>

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
                          </div>
                        </div>

                        {/* Only show Check Live Status button if token is for today */}
                        {isTokenToday && (
                          <div className="mb-4">
                            <button
                              onClick={() => fetchLiveStatus(token.doctorId, token.token)}
                              disabled={loadingLiveStatus}
                              className="w-full bg-green-100 hover:bg-green-200 text-green-800 py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                            >
                              {loadingLiveStatus ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Loading Status...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  Check Live Status
                                </>
                              )}
                            </button>
                          </div>
                        )}

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

                            <div className="flex">
                              <span className="text-sm text-gray-600 w-32 flex-shrink-0">Shift:</span>
                              <span className="text-sm font-medium text-gray-900">{token.shiftName}</span>
                            </div>

                            <div className="flex">
                              <span className="text-sm text-gray-600 w-32 flex-shrink-0">Arrival Time:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {token.estimatedArrivalTime || "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>

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
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Specialization:</span>
                                <span className="text-sm font-medium text-gray-900">{doctor.doctorProfDetails.specialization || "Not specified"}</span>
                              </div>
                            </div>
                          </div>
                        )}

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
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Phone:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {doctor.hospitalDetails.phone_1 || doctor.hospitalDetails.phone_2 || doctor.hospitalDetails.landline || "NA"}
                                </span>

                              </div>
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Address:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {[token.address_1, token.address_2]
                                    .filter(Boolean).join(", ") || "Not available"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Landmark:</span>
                                <span className="text-sm font-medium text-gray-900">{token.landmark}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Only show action buttons if token is for today */}
                        {isTokenToday && (
                          <div className="mt-6 flex space-x-3">
                            <button 
                              onClick={() => openRescheduleModal(token)}
                              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded-md transition-colors duration-200"
                            >
                              Reschedule
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {showLiveStatus && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                      <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm" onClick={closeLiveStatus}></div>

                      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative z-10">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-gray-800">Live Token Status</h3>
                          <button onClick={closeLiveStatus} className="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {liveStatus ? (
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-blue-800 mb-2">Doctor: {liveStatus.doctorName}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-md shadow-sm">
                                  <p className="text-sm text-gray-600">Current Token</p>
                                  <p className="text-2xl font-bold text-blue-600">{liveStatus.currentToken}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md shadow-sm">
                                  <p className="text-sm text-gray-600">Your Token</p>
                                  <p className="text-2xl font-bold text-green-600">{liveStatus.yourToken}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md shadow-sm">
                                  <p className="text-sm text-gray-600">Waiting Patients</p>
                                  <p className="text-2xl font-bold text-orange-600">{liveStatus.waitingPatients}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md shadow-sm">
                                  <p className="text-sm text-gray-600">Estimated Time</p>
                                  <p className="text-2xl font-bold text-purple-600">{liveStatus.estimatedTime} min</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-100 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-800 mb-2">Status Summary</h4>
                              <p className="text-gray-600">
                                {liveStatus.yourToken === liveStatus.currentToken
                                  ? "It's your turn now! Please proceed to the doctor's room."
                                  : liveStatus.yourToken > liveStatus.currentToken
                                    ? `There are ${liveStatus.waitingPatients} patients ahead of you. Estimated wait time is ${liveStatus.estimatedTime} minutes.`
                                    : "Your token has already been processed."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading status information...</p>
                          </div>
                        )}

                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={closeLiveStatus}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showRescheduleModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                      <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm" onClick={() => setShowRescheduleModal(false)}></div>

                      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative z-10">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-gray-800">Reschedule Token</h3>
                          <button onClick={() => setShowRescheduleModal(false)} className="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                            <input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={rescheduleData.bookingDate}
                              onChange={(e) => setRescheduleData(prev => ({ ...prev, bookingDate: e.target.value }))}
                              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Shift</label>
                            <select
                              value={rescheduleData.shiftId || ""}
                              onChange={(e) => setRescheduleData(prev => ({ ...prev, shiftId: parseInt(e.target.value) }))}
                              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Choose a shift</option>
                              {shifts.map(shift => (
                                <option key={shift.shiftId} value={shift.shiftId}>{shift.shiftName}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            onClick={() => setShowRescheduleModal(false)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={rescheduleToken}
                            disabled={rescheduleLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rescheduleLoading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Rescheduling...
                              </>
                            ) : (
                              'Reschedule Token'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                  <p className="text-gray-600 mb-6">
                    {dateFilter || filterStatus !== "all"
                      ? "No appointments match your filters. Try changing your filter criteria."
                      : "You haven't booked any appointments yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAppointments.map((appointment) => {
                    const doctor = doctorDetails[appointment.doctorId];
                    // Check if appointment booking date is today or future
                    const isAppointmentActive = appointment.bookingDate && 
                    appointment.bookingDate.split('T')[0] === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div key={appointment.bookingId} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 relative bg-white">
                        <div className="absolute top-5 right-5">
                          {getStatusBadge(appointment.status, true)}
                        </div>

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
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Booking Date:</span>
                              <span className="text-sm font-medium text-gray-900">{formatDate(appointment.bookingDate)}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Slot:</span>
                              <span className="text-sm font-medium text-gray-900">{appointment.slotStartTime} - {appointment.slotEndTime}</span>
                            </div>
                          </div>
                        </div>

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
                                {[appointment.address1, appointment.address2]
                                  .filter(Boolean).join(", ") || "Not available"}
                              </span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Landmark:</span>
                              <span className="text-sm font-medium text-gray-900">{appointment.landmark}</span>
                            </div>
                            <div className="flex">
                              <span className="text-sm text-gray-600 w-28 flex-shrink-0">Phone:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {doctor.hospitalDetails.phone_1 || doctor.hospitalDetails.phone_2 || doctor.hospitalDetails.landline || "NA"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Only show reschedule button for active appointments */}
                        {isAppointmentActive && appointment.status === "Booked" && (
                          <div className="mt-6">
                            <button 
                              onClick={() => openAppointmentRescheduleModal(appointment)}
                              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-4 rounded-md transition-colors duration-200"
                            >
                              Reschedule Appointment
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Appointment Reschedule Modal */}
      {showAppointmentRescheduleModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm" onClick={() => setShowAppointmentRescheduleModal(false)}></div>

          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Reschedule Appointment</h3>
              <button onClick={() => setShowAppointmentRescheduleModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentRescheduleData.bookingDate}
                  onChange={(e) => handleAppointmentDateChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Slot</label>
                <select
                  value={appointmentRescheduleData.slotId || ""}
                  onChange={(e) => setAppointmentRescheduleData(prev => ({ ...prev, slotId: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={appointmentSlots.length === 0}
                >
                  <option value="">Choose a slot</option>
                  {appointmentSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </option>
                  ))}
                </select>
                {appointmentSlots.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No slots available for selected date</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAppointmentRescheduleModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={rescheduleAppointment}
                disabled={appointmentRescheduleLoading || !appointmentRescheduleData.slotId}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {appointmentRescheduleLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}