"use client";
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Footer from "@/components/footer/footer"
import Link from "next/link"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('today')
  const [doctorData, setDoctorData] = useState(null)
  const [statusList, setStatusList] = useState([]) // For storing status options
  const [statsData, setStatsData] = useState({
    totalTokens: 0,
    totalAppointments: 0,
    completedTokens: 0,
    completedAppointments: 0
  })
  const [appointmentsToday, setAppointmentsToday] = useState([])
  const [appointmentsUpcoming, setAppointmentsUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const dropdownRef = useRef(null)
  const router = useRouter()
  
  // Get user data from session storage
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem("userId") : null
  const userName = typeof window !== 'undefined' ? sessionStorage.getItem("userName") : null

  useEffect(() => {
    if (!userId) {
      router.push('/login')
      return
    }
    
    fetchDoctorData()
    fetchStatusList() // Fetch the status options
    fetchTodayTokens()
    
    // Add event listener to close dropdown when clicking outside
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userId, router])

  // Handle clicks outside the dropdown
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false)
    }
  }

  const fetchDoctorData = async () => {
    try {
      const response = await fetch(`https://api.oneclickhelp.in/api/getDoctorsById?doctorId=${userId}`)
      const data = await response.json()
      setDoctorData(data)
    } catch (error) {
      console.error("Error fetching doctor data:", error)
    }
  }

  // Fetch the list of available statuses
  const fetchStatusList = async () => {
    try {
      const response = await fetch('https://api.oneclickhelp.in/api/getTokenStatusList')
      const data = await response.json()
      setStatusList(data)
    } catch (error) {
      console.error("Error fetching status list:", error)
    }
  }

  const fetchTodayTokens = async () => {
    try {
      const response = await fetch(`https://api.oneclickhelp.in/api/getTokenDetailsByDocIdAndDate?date=${selectedDate}&doctorId=${userId}`)
      const data = await response.json()
      
      // Process token data for today's appointments
      const todayAppointments = data.map(token => ({
        id: token.id,
        patient: token.patientName,
        time: token.estimatedArrivalTime || 'Not specified',
        status: token.status,
        statusId: token.statusId,
        type: 'Token Consultation',
        bookingType: 'Token',
        patientPhone: token.patientPhone,
        patientGender: token.patientGender,
        tokenNumber: token.token
      }))
      
      setAppointmentsToday(todayAppointments)
      
      // Update stats
      setStatsData({
        totalTokens: data.length,
        totalAppointments: 0, // You'll need to fetch appointments from another API
        completedTokens: data.filter(t => t.status === 'Completed').length,
        completedAppointments: 0 // You'll need to fetch appointments from another API
      })
      
      setLoading(false)
    } catch (error) {
      console.error("Error fetching token data:", error)
      setLoading(false)
    }
  }

  const handleDateFilter = async (date) => {
    setSelectedDate(date)
    setAppointmentsLoading(true) // Set appointments loading to true
    
    try {
      const response = await fetch(`https://api.oneclickhelp.in/api/getTokenDetailsByDocIdAndDate?date=${date}&doctorId=${userId}`)
      const data = await response.json()
      
      const filteredAppointments = data.map(token => ({
        id: token.id,
        patient: token.patientName,
        time: token.estimatedArrivalTime || 'Not specified',
        status: token.status,
        statusId: token.statusId,
        type: 'Token Consultation',
        bookingType: 'Token',
        patientPhone: token.patientPhone,
        patientGender: token.patientGender,
        tokenNumber: token.token
      }))
      
      setAppointmentsToday(filteredAppointments)
      
      // Update stats
      setStatsData({
        totalTokens: data.length,
        totalAppointments: 0,
        completedTokens: data.filter(t => t.status === 'Completed').length,
        completedAppointments: 0
      })
      
      setAppointmentsLoading(false) // Set appointments loading to false
    } catch (error) {
      console.error("Error fetching filtered token data:", error)
      setAppointmentsLoading(false) // Set appointments loading to false even on error
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userName")
    router.push('/login')
  }

  // Function to handle status update using the API
  const updateStatus = async (tokenId, statusId) => {
    try {
      const response = await fetch('https://api.oneclickhelp.in/api/updateTokenStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: tokenId,
          statusId: statusId
        })
      });
      
      const result = await response.json();
      
      if (result.status) {
        // Update the local state to reflect the change
        setAppointmentsToday(prev => 
          prev.map(app => 
            app.id === tokenId ? {
              ...app, 
              statusId: statusId,
              status: statusList.find(s => s.statusId === statusId)?.status || app.status
            } : app
          )
        );
        
        // If the status is "Completed", update the stats
        if (statusId === 5) { // 5 is the statusId for "Completed"
          setStatsData(prev => ({
            ...prev,
            completedTokens: prev.completedTokens + 1
          }));
        }
        
        console.log("Status updated successfully");
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/"> <img src="/logo.png" className="w-30" alt="Company Logo" /></Link>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  {/* Mobile name display */}
                  <div className="md:hidden text-right cursor-pointer mr-2">
                    <p className="text-sm font-medium text-gray-700">Dr. {userName?.split(' ')[0]}</p>
                  </div>
                  
                  {/* Desktop name display */}
                  <div className="hidden md:block text-right cursor-pointer">
                    <p className="text-sm font-medium text-gray-700">Dr. {userName}</p>
                    <p className="text-xs font-medium text-gray-500">
                      {doctorData?.doctorProfDetails?.specialization || 'Doctor'}
                    </p>
                  </div>
                  
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="h-10 w-10 cursor-pointer rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {userName ? userName.charAt(0).toUpperCase() : 'D'}
                    </button>
                    
                    {showDropdown && (
                      <div className="origin-top-right cursor-pointer absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <div className="px-4 py-2 text-sm text-gray-700 border-b">
                            <p className="font-medium">Dr. {userName}</p>
                            <p className="text-xs text-gray-500">{doctorData?.doctorProfDetails?.specialization || 'Doctor'}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            role="menuitem"
                          >
                            <span className="flex cursor-pointer items-center">
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                              </svg>
                              Logout
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
              <div className="flex items-center">
                <div className="rounded-lg bg-blue-100 p-3 mr-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tokens</p>
                  <p className="text-2xl font-semibold text-gray-900">{statsData.totalTokens}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
              <div className="flex items-center">
                <div className="rounded-lg bg-green-100 p-3 mr-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{statsData.totalAppointments}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100">
              <div className="flex items-center">
                <div className="rounded-lg bg-purple-100 p-3 mr-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Tokens</p>
                  <p className="text-2xl font-semibold text-gray-900">{statsData.completedTokens}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
              <div className="flex items-center">
                <div className="rounded-lg bg-orange-100 p-3 mr-4">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{statsData.completedAppointments}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Appointments Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('today')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'today' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Today's Bookings
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'upcoming' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Upcoming
                  </button>
                </nav>
                
                {/* Date Filter */}
                <div className="px-6 py-4 md:py-0">
                  <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mr-2 mb-2 md:mb-0 md:inline-block">
                    Filter by Date:
                  </label>
                  <input
                    type="date"
                    id="date-filter"
                    value={selectedDate}
                    onChange={(e) => handleDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  {activeTab === 'today' ? "Today's Bookings" : "Upcoming Bookings"}
                </h2>
                <span className="text-sm text-gray-500">
                  {activeTab === 'today' ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Next 7 Days'}
                </span>
              </div>
              
              {appointmentsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'today' && appointmentsToday.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings for {new Date(selectedDate).toLocaleDateString()}</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by waiting for patients to book tokens.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {(activeTab === 'today' ? appointmentsToday : appointmentsUpcoming).map((booking) => (
                          <li key={booking.id} className="py-4">
                            <div className="flex space-x-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {booking.patient}
                                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${booking.bookingType === 'Token' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                      {booking.bookingType} {booking.tokenNumber && `#${booking.tokenNumber}`}
                                    </span>
                                  </p>
                                  <div className="flex items-center text-sm text-gray-500">
                                    {booking.date && (
                                      <span className="mr-2">{booking.date}</span>
                                    )}
                                    <span>{booking.time}</span>
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-gray-500 truncate">
                                      {booking.type}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {booking.patientGender} • {booking.patientPhone}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      booking.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                      booking.status === 'With_Doctor' ? 'bg-blue-100 text-blue-800' : 
                                      booking.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {booking.status.replace(/_/g, ' ')}
                                    </span>
                                    <div className="flex space-x-1">
                                      {statusList
                                        .filter(status => status.statusId !== booking.statusId)
                                        .map(status => (
                                          <button 
                                            key={status.statusId}
                                            onClick={() => updateStatus(booking.id, status.statusId)}
                                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                          >
                                            {status.status.replace(/_/g, ' ')}
                                          </button>
                                        ))
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}