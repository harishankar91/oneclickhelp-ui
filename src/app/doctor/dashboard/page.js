"use client";
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Footer from "@/components/footer/footer"
import Link from "next/link"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('today')
  const [doctorData, setDoctorData] = useState(null)
  const [statusList, setStatusList] = useState([])
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
  const [showSlotsModal, setShowSlotsModal] = useState(false)
  const [showShiftsModal, setShowShiftsModal] = useState(false)
  const [doctorSlots, setDoctorSlots] = useState([])
  const [doctorShifts, setDoctorShifts] = useState([])
  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00"
  })
  const [newShift, setNewShift] = useState({
    shiftName: "",
    startTime: "09:00",
    endTime: "17:00",
    maxAllowedPatients: 10
  })
  const [slotFilterDate, setSlotFilterDate] = useState(new Date().toISOString().split('T')[0])

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
    fetchStatusList()
    fetchTodayBookings()
    fetchUpcomingBookings()

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

  // Fetch doctor's slots with date filtering
  const fetchDoctorSlots = async (date = null) => {
    try {
      const filterDate = date || slotFilterDate;
      const response = await fetch(`https://api.oneclickhelp.in/api/getDoctorSlots?doctorId=${doctorData.doctorId}&date=${filterDate}`)
      const data = await response.json()
      setDoctorSlots(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching doctor slots:", error)
      setDoctorSlots([])
    }
  }

  // Fetch doctor's shifts
  const fetchDoctorShifts = async () => {
    try {
      const response = await fetch(`https://api.oneclickhelp.in/api/getDoctorOPDShifts?doctorId=${userId}`)
      const data = await response.json()
      if (data.status) {
        setDoctorShifts(data.data)
      } else {
        setDoctorShifts([])
      }
    } catch (error) {
      console.error("Error fetching doctor shifts:", error)
      setDoctorShifts([])
    }
  }

  // Fetch today's bookings (both tokens and appointments)
  const fetchTodayBookings = async () => {
    try {
      let todayBookings = [];

      // Fetch tokens
      const tokenResponse = await fetch(`https://api.oneclickhelp.in/api/getTokenDetailsByDocIdAndDate?fromDate=${selectedDate}&toDate=${selectedDate}&doctorId=${userId}`)
      const tokenData = await tokenResponse.json()

      const tokenBookings = tokenData.map(token => ({
        id: token.id,
        patient: token.patientName,
        time: token.estimatedArrivalTime || 'Not specified',
        status: token.status,
        statusId: token.statusId,
        type: 'Token Consultation',
        bookingType: 'Token',
        patientPhone: token.patientPhone,
        patientGender: token.patientGender,
        tokenNumber: token.token,
        date: token.date
      }))

      todayBookings = [...todayBookings, ...tokenBookings];

      // Fetch appointments
      const appointmentResponse = await fetch(`https://api.oneclickhelp.in/api/getAppointmentsByDocIdAndDate?fromDate=${selectedDate}&toDate=${selectedDate}&doctorId=${userId}`)
      const appointmentData = await appointmentResponse.json()

      const appointmentBookings = appointmentData.map(appointment => ({
        id: appointment.id,
        patient: appointment.patientName,
        time: appointment.appointmentTime || 'Not specified',
        status: appointment.status,
        statusId: appointment.statusId,
        type: 'Appointment',
        bookingType: 'Appointment',
        patientPhone: appointment.patientPhone,
        patientGender: appointment.patientGender,
        date: appointment.appointmentDate
      }))

      todayBookings = [...todayBookings, ...appointmentBookings];

      setAppointmentsToday(todayBookings)

      // Update stats
      const tokenCount = todayBookings.filter(b => b.bookingType === 'Token').length;
      const appointmentCount = todayBookings.filter(b => b.bookingType === 'Appointment').length;
      const completedTokenCount = todayBookings.filter(b => b.bookingType === 'Token' && b.status === 'Completed').length;
      const completedAppointmentCount = todayBookings.filter(b => b.bookingType === 'Appointment' && b.status === 'Completed').length;

      setStatsData({
        totalTokens: tokenCount,
        totalAppointments: appointmentCount,
        completedTokens: completedTokenCount,
        completedAppointments: completedAppointmentCount
      })

      setLoading(false)
    } catch (error) {
      console.error("Error fetching today's bookings:", error)
      setLoading(false)
    }
  }

  // Fetch upcoming bookings (both tokens and appointments for next 7 days)
  const fetchUpcomingBookings = async () => {
    try {
      let upcomingBookings = [];
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch tokens
      const tokenResponse = await fetch(`https://api.oneclickhelp.in/api/getTokenDetailsByDocIdAndDate?fromDate=${today}&toDate=${nextWeek}&doctorId=${userId}`)
      const tokenData = await tokenResponse.json()

      const tokenBookings = tokenData
        .filter(token => token.date > today) // Exclude today's tokens
        .map(token => ({
          id: token.id,
          patient: token.patientName,
          time: token.estimatedArrivalTime || 'Not specified',
          status: token.status,
          statusId: token.statusId,
          type: 'Token Consultation',
          bookingType: 'Token',
          patientPhone: token.patientPhone,
          patientGender: token.patientGender,
          tokenNumber: token.token,
          date: token.date
        }))

      upcomingBookings = [...upcomingBookings, ...tokenBookings];

      // Fetch appointments
      const appointmentResponse = await fetch(`https://api.oneclickhelp.in/api/getAppointmentsByDocIdAndDate?fromDate=${today}&toDate=${nextWeek}&doctorId=${userId}`)
      const appointmentData = await appointmentResponse.json()

      const appointmentBookings = appointmentData
        .filter(appointment => appointment.appointmentDate > today) // Exclude today's appointments
        .map(appointment => ({
          id: appointment.id,
          patient: appointment.patientName,
          time: appointment.appointmentTime || 'Not specified',
          status: appointment.status,
          statusId: appointment.statusId,
          type: 'Appointment',
          bookingType: 'Appointment',
          patientPhone: appointment.patientPhone,
          patientGender: appointment.patientGender,
          date: appointment.appointmentDate
        }))

      upcomingBookings = [...upcomingBookings, ...appointmentBookings];

      setAppointmentsUpcoming(upcomingBookings)
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error)
    }
  }

  const handleDateFilter = async (date) => {
    setSelectedDate(date)
    setAppointmentsLoading(true)

    try {
      let filteredBookings = [];

      // Fetch tokens
      const tokenResponse = await fetch(`https://api.oneclickhelp.in/api/getTokenDetailsByDocIdAndDate?fromDate=${date}&toDate=${date}&doctorId=${userId}`)
      const tokenData = await tokenResponse.json()

      const tokenBookings = tokenData.map(token => ({
        id: token.id,
        patient: token.patientName,
        time: token.estimatedArrivalTime || 'Not specified',
        status: token.status,
        statusId: token.statusId,
        type: 'Token Consultation',
        bookingType: 'Token',
        patientPhone: token.patientPhone,
        patientGender: token.patientGender,
        tokenNumber: token.token,
        date: token.date
      }))

      filteredBookings = [...filteredBookings, ...tokenBookings];

      // Fetch appointments
      const appointmentResponse = await fetch(`https://api.oneclickhelp.in/api/getAppointmentsByDocIdAndDate?fromDate=${date}&toDate=${date}&doctorId=${userId}`)
      const appointmentData = await appointmentResponse.json()

      const appointmentBookings = appointmentData.map(appointment => ({
        id: appointment.id,
        patient: appointment.patientName,
        time: appointment.appointmentTime || 'Not specified',
        status: appointment.status,
        statusId: appointment.statusId,
        type: 'Appointment',
        bookingType: 'Appointment',
        patientPhone: appointment.patientPhone,
        patientGender: appointment.patientGender,
        date: appointment.appointmentDate
      }))

      filteredBookings = [...filteredBookings, ...appointmentBookings];

      setAppointmentsToday(filteredBookings)

      // Update stats
      const tokenCount = filteredBookings.filter(b => b.bookingType === 'Token').length;
      const appointmentCount = filteredBookings.filter(b => b.bookingType === 'Appointment').length;
      const completedTokenCount = filteredBookings.filter(b => b.bookingType === 'Token' && b.status === 'Completed').length;
      const completedAppointmentCount = filteredBookings.filter(b => b.bookingType === 'Appointment' && b.status === 'Completed').length;

      setStatsData({
        totalTokens: tokenCount,
        totalAppointments: appointmentCount,
        completedTokens: completedTokenCount,
        completedAppointments: completedAppointmentCount
      })

      setAppointmentsLoading(false)
    } catch (error) {
      console.error("Error fetching filtered bookings:", error)
      setAppointmentsLoading(false)
    }
  }

  // Add a new slot
  const addSlot = async () => {
    try {
      const response = await fetch('https://api.oneclickhelp.in/api/addDoctorSlots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: doctorData.doctorId,
          date: newSlot.date,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime
        })
      })

      const result = await response.json()

      if (result.status) {
        alert('Slot added successfully!')
        setNewSlot({
          date: new Date().toISOString().split('T')[0],
          startTime: "09:00",
          endTime: "10:00"
        })
        fetchDoctorSlots(newSlot.date)
      } else {
        alert('Failed to add slot: ' + result.message)
      }
    } catch (error) {
      console.error("Error adding slot:", error)
      alert('Error adding slot. Please try again.')
    }
  }

  // Add a new shift
  const addShift = async () => {
    try {
      const response = await fetch('https://api.oneclickhelp.in/api/addDoctorShift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: userId,
          shiftName: newShift.shiftName,
          startTime: newShift.startTime,
          endTime: newShift.endTime,
          maxAllowedPatients: parseInt(newShift.maxAllowedPatients)
        })
      })

      const result = await response.json()

      if (result.status) {
        alert('Shift added successfully!')
        setNewShift({
          shiftName: "",
          startTime: "09:00",
          endTime: "17:00",
          maxAllowedPatients: 10
        })
        fetchDoctorShifts()
      } else {
        alert('Failed to add shift: ' + result.message)
      }
    } catch (error) {
      console.error("Error adding shift:", error)
      alert('Error adding shift. Please try again.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userName")
    router.push('/doctor/login')
  }

  // Function to handle status update using the API
  const updateStatus = async (tokenId, statusId, bookingType) => {
    try {
      let apiUrl = '';

      if (bookingType === 'Token') {
        apiUrl = 'https://api.oneclickhelp.in/api/updateTokenStatus';
      } else if (bookingType === 'Appointment') {
        apiUrl = 'https://api.oneclickhelp.in/api/updateAppointmentStatus';
      } else {
        console.error("Unknown booking type");
        return;
      }

      const response = await fetch(apiUrl, {
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
        if (statusId === 5) {
          if (bookingType === 'Token') {
            setStatsData(prev => ({
              ...prev,
              completedTokens: prev.completedTokens + 1
            }));
          } else {
            setStatsData(prev => ({
              ...prev,
              completedAppointments: prev.completedAppointments + 1
            }));
          }
        }

        console.log("Status updated successfully");
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  // Open slots modal and fetch current slots
  const openSlotsModal = () => {
    setShowSlotsModal(true)
    fetchDoctorSlots()
  }

  // Open shifts modal and fetch current shifts
  const openShiftsModal = () => {
    setShowShiftsModal(true)
    fetchDoctorShifts()
  }

  // Handle slot date filter change
  const handleSlotDateFilter = (date) => {
    setSlotFilterDate(date)
    fetchDoctorSlots(date)
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
          {/* Management Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            {doctorData?.is_appointment && (
              <button
                onClick={openSlotsModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Manage Slots
              </button>
            )}

            {doctorData?.is_token && (
              <button
                onClick={openShiftsModal}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Manage Shifts
              </button>
            )}
          </div>

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

                {/* Date Filter - Only show for Today's Bookings */}
                {activeTab === 'today' && (
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
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  {activeTab === 'today' ? "Today's Bookings" : "Upcoming Bookings"}
                </h2>
                <span className="text-sm text-gray-500">
                  {activeTab === 'today'
                    ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    : `Next 7 Days (${new Date().toLocaleDateString()} - ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()})`
                  }
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
                      <p className="mt-1 text-sm text-gray-500">Get started by waiting for patients to book tokens or appointments.</p>
                    </div>
                  ) : activeTab === 'upcoming' && appointmentsUpcoming.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming bookings</h3>
                      <p className="mt-1 text-sm text-gray-500">No appointments scheduled for the next 7 days.</p>
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
                                    Name : {booking.patient}
                                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${booking.bookingType === 'Token' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                      {booking.bookingType} {booking.tokenNumber && `#${booking.tokenNumber}`}
                                    </span>
                                  </p>
                                  <div className="flex items-center text-sm text-gray-500">
                                    {booking.date && (
                                      <span className="mr-2">{new Date(booking.date).toLocaleDateString()}</span>
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
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'With_Doctor' ? 'bg-blue-100 text-blue-800' :
                                          booking.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                      }`}>
                                      {booking.status.replace(/_/g, ' ')}
                                    </span>

                                    <div className="relative">
                                      <select
                                        onChange={(e) => updateStatus(booking.id, parseInt(e.target.value), booking.bookingType)}
                                        className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                                        value={booking.statusId}
                                      >
                                        {statusList.map(status => (
                                          <option key={status.statusId} value={status.statusId}>
                                            {status.status.replace(/_/g, ' ')}
                                          </option>
                                        ))}
                                      </select>
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

      {/* Slots Modal */}
      {showSlotsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full md:max-w-lg lg:max-w-2xl">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold text-gray-900">
                Manage Appointment Slots
              </h3>
              <button
                onClick={() => setShowSlotsModal(false)}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <div className="p-4 md:p-5 space-y-4 overflow-y-auto max-h-96">
              {/* Date filter for slots */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter Slots by Date</label>
                <input
                  type="date"
                  value={slotFilterDate}
                  onChange={(e) => handleSlotDateFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <button
                onClick={addSlot}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Slot
              </button>

              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Existing Slots for {new Date(slotFilterDate).toLocaleDateString()}</h4>
                {doctorSlots.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {doctorSlots.map(slot => (
                      <li key={slot.id} className="py-3 flex justify-between items-center">
                        <div>
                          <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slot.isBooked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {slot.isBooked ? 'Booked' : 'Available'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(slot.date).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No slots available for this date.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shifts Modal */}
      {showShiftsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full md:max-w-lg">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold text-gray-900">
                Manage OPD Shifts
              </h3>
              <button
                onClick={() => setShowShiftsModal(false)}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <div className="p-4 md:p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
                  <input
                    type="text"
                    value={newShift.shiftName}
                    onChange={(e) => setNewShift({ ...newShift, shiftName: e.target.value })}
                    placeholder="e.g., Morning Shift, Evening Shift"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Patients</label>
                  <input
                    type="number"
                    min="1"
                    value={newShift.maxAllowedPatients}
                    onChange={(e) => setNewShift({ ...newShift, maxAllowedPatients: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <button
                onClick={addShift}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Shift
              </button>

              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Current Shifts</h4>
                {doctorShifts.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {doctorShifts.map(shift => (
                      <li key={shift.shiftId} className="py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{shift.shiftName}</span>
                          <span className="text-sm text-gray-500">{shift.startTime} - {shift.endTime}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Max Patients: {shift.maxAllowedPatients}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No shifts configured yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}