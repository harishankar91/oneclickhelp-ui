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
  const [showClosedDatesModal, setShowClosedDatesModal] = useState(false) // New state for closed dates modal
  const [doctorSlots, setDoctorSlots] = useState([])
  const [doctorShifts, setDoctorShifts] = useState([])
  const [closedDates, setClosedDates] = useState([]) // New state for closed dates
  const [newClosedDate, setNewClosedDate] = useState("") // New state for adding closed date

  const [newShift, setNewShift] = useState({
    shiftId: "",
    startTime: "09:00",
    endTime: "17:00",
    maxAllowedPatients: 10
  })
  const [availableShifts, setAvailableShifts] = useState([])
  const [shiftError, setShiftError] = useState("")

  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00"
  })
  const [slotError, setSlotError] = useState("")
  const [closedDateError, setClosedDateError] = useState("") // New error state for closed dates

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
    fetchAvailableShifts()
    fetchClosedDates() // Fetch closed dates on component mount

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

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Function to validate time (end time should not be less than start time)
  const validateTime = (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)

    if (endHours < startHours) {
      return false
    }
    if (endHours === startHours && endMinutes <= startMinutes) {
      return false
    }
    return true
  }

  // Function to validate slot before adding
  const validateSlot = () => {
    setSlotError("")

    if (!newSlot.date) {
      setSlotError("Please select a date")
      return false
    }

    if (!validateTime(newSlot.startTime, newSlot.endTime)) {
      setSlotError("End time must be greater than start time")
      return false
    }

    // Check if date is not in the past
    if (newSlot.date < getTodayDate()) {
      setSlotError("Cannot add slots for previous dates")
      return false
    }

    return true
  }

  // Function to validate shift before adding
  const validateShift = () => {
    setShiftError("")

    if (!newShift.shiftId) {
      setShiftError("Please select a shift")
      return false
    }

    if (!validateTime(newShift.startTime, newShift.endTime)) {
      setShiftError("End time must be greater than start time")
      return false
    }

    if (!newShift.maxAllowedPatients || newShift.maxAllowedPatients < 1) {
      setShiftError("Please enter a valid number of patients")
      return false
    }

    return true
  }

  // Function to validate closed date before adding
  const validateClosedDate = () => {
    setClosedDateError("")

    if (!newClosedDate) {
      setClosedDateError("Please select a date")
      return false
    }

    // Check if date is not in the past
    if (newClosedDate < getTodayDate()) {
      setClosedDateError("Cannot add closed dates for previous dates")
      return false
    }

    // Check if date is already in the closed dates list
    if (closedDates.some(date => date.closedDate === newClosedDate)) {
      setClosedDateError("This date is already marked as closed")
      return false
    }

    return true
  }

  const fetchAvailableShifts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getOPDShiftDetails`)
      const data = await response.json()
      if (data.status) {
        setAvailableShifts(data.data)
      } else {
        setAvailableShifts([])
      }
    } catch (error) {
      console.error("Error fetching available shifts:", error)
      setAvailableShifts([])
    }
  }

  // Fetch closed dates for the doctor
  const fetchClosedDates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getOPDClosedDates?doctorId=${userId}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setClosedDates(data)
      } else {
        setClosedDates([])
      }
    } catch (error) {
      console.error("Error fetching closed dates:", error)
      setClosedDates([])
    }
  }

  const fetchDoctorData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorsById?doctorId=${userId}`)
      const data = await response.json()
      setDoctorData(data)
    } catch (error) {
      console.error("Error fetching doctor data:", error)
    }
  }

  // Fetch the list of available statuses
  const fetchStatusList = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getTokenStatusList`)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorSlots?doctorId=${doctorData.doctorId}&date=${filterDate}`)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorOPDShifts?doctorId=${userId}`)
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
      const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getTokenDetailsByDocIdAndDate?fromDate=${selectedDate}&toDate=${selectedDate}&doctorId=${userId}`)
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
        shiftOrSlot: token.shiftName,
        date: token.date
      }))

      todayBookings = [...todayBookings, ...tokenBookings];

      // Fetch appointments
      const appointmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getAppointmentsByDocIdAndDate?fromDate=${selectedDate}&toDate=${selectedDate}&doctorId=${userId}`)
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
        shiftOrSlot: appointment.slotStartTime + '-' + appointment.slotEndTime,
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
      const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getTokenDetailsByDocIdAndDate?fromDate=${today}&toDate=${nextWeek}&doctorId=${userId}`)
      const tokenData = await tokenResponse.json()

      const tokenBookings = tokenData
        .filter(token => token.bookingDate > today) // Exclude today's tokens
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
          shiftOrSlot: token.shiftName,
          date: token.bookingDate
        }))

      upcomingBookings = [...upcomingBookings, ...tokenBookings];

      // Fetch appointments
      const appointmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getAppointmentsByDocIdAndDate?fromDate=${today}&toDate=${nextWeek}&doctorId=${userId}`)
      const appointmentData = await appointmentResponse.json()

      const appointmentBookings = appointmentData
        .filter(appointment => appointment.bookingDate > today) // Exclude today's appointments
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
          shiftOrSlot: appointment.slotStartTime + '-' + appointment.slotEndTime,
          date: appointment.bookingDate
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
      const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getTokenDetailsByDocIdAndDate?fromDate=${date}&toDate=${date}&doctorId=${userId}`)
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
        shiftOrSlot: token.shiftName,
        date: token.date
      }))

      filteredBookings = [...filteredBookings, ...tokenBookings];

      // Fetch appointments
      const appointmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getAppointmentsByDocIdAndDate?fromDate=${date}&toDate=${date}&doctorId=${userId}`)
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
        shiftOrSlot: appointment.slotStartTime + '-' + appointment.slotEndTime,
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
    if (!validateSlot()) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/addDoctorSlots`, {
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
        alert(result.message || 'Slot added successfully!')
        setNewSlot({
          date: getTodayDate(),
          startTime: "09:00",
          endTime: "10:00"
        })
        setSlotError("")
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
    if (!validateShift()) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/addShiftAndMaxPatients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: userId,
          shiftId: parseInt(newShift.shiftId),
          startTime: newShift.startTime,
          endTime: newShift.endTime,
          maxAllowedPatients: parseInt(newShift.maxAllowedPatients)
        })
      })

      const result = await response.json()

      if (result.status) {
        alert('Shift added successfully!')
        setNewShift({
          shiftId: "",
          startTime: "09:00",
          endTime: "17:00",
          maxAllowedPatients: 10
        })
        setShiftError("")
        fetchDoctorShifts()
      } else {
        alert('Failed to add shift: ' + result.message)
      }
    } catch (error) {
      console.error("Error adding shift:", error)
      alert('Error adding shift. Please try again.')
    }
  }

  // Add a closed date
  const addClosedDate = async () => {
    if (!validateClosedDate()) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/addOPDClosedDates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            doctorId: userId,
            closedDate: newClosedDate
          }
        ])
      })

      const result = await response.json()

      if (result.status) {
        alert('OPD Closed date added successfully!')
        setNewClosedDate("")
        setClosedDateError("")
        fetchClosedDates() // Refresh the closed dates list
      } else {
        alert('Failed to add closed date: ' + result.message)
      }
    } catch (error) {
      console.error("Error adding closed date:", error)
      alert('Error adding closed date. Please try again.')
    }
  }

  // Remove a closed date
  const removeClosedDate = async (closedDate) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/removeOPDClosedDates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            doctorId: userId,
            closedDate: closedDate
          }
        ])
      })

      const result = await response.json()

      if (result.status) {
        alert('OPD Closed date removed successfully!')
        fetchClosedDates() // Refresh the closed dates list
      } else {
        alert('Failed to remove closed date: ' + result.message)
      }
    } catch (error) {
      console.error("Error removing closed date:", error)
      alert('Error removing closed date. Please try again.')
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
        apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/updateTokenStatus`;
      } else if (bookingType === 'Appointment') {
        apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/updateAppointmentStatus`;
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
    setSlotError("")
    setNewSlot({
      date: getTodayDate(),
      startTime: "09:00",
      endTime: "10:00"
    })
    fetchDoctorSlots()
  }

  // Open shifts modal and fetch current shifts
  const openShiftsModal = () => {
    setShowShiftsModal(true)
    setShiftError("")
    setNewShift({
      shiftId: "",
      startTime: "09:00",
      endTime: "17:00",
      maxAllowedPatients: 10
    })
    fetchDoctorShifts()
  }

  // Open closed dates modal and fetch current closed dates
  const openClosedDatesModal = () => {
    setShowClosedDatesModal(true)
    setClosedDateError("")
    setNewClosedDate("")
    fetchClosedDates()
  }

  // Handle slot date filter change
  const handleSlotDateFilter = (date) => {
    setSlotFilterDate(date)
    fetchDoctorSlots(date)
  }

  // Handle slot time changes with validation
  const handleSlotTimeChange = (field, value) => {
    setNewSlot(prev => {
      const updatedSlot = { ...prev, [field]: value }

      // Validate time when both start and end times are set
      if (updatedSlot.startTime && updatedSlot.endTime) {
        if (!validateTime(updatedSlot.startTime, updatedSlot.endTime)) {
          setSlotError("End time must be greater than start time")
        } else {
          setSlotError("")
        }
      }

      return updatedSlot
    })
  }

  // Handle shift time changes with validation
  const handleShiftTimeChange = (field, value) => {
    setNewShift(prev => {
      const updatedShift = { ...prev, [field]: value }

      // Validate time when both start and end times are set
      if (updatedShift.startTime && updatedShift.endTime) {
        if (!validateTime(updatedShift.startTime, updatedShift.endTime)) {
          setShiftError("End time must be greater than start time")
        } else {
          setShiftError("")
        }
      }

      return updatedShift
    })
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
                      <img
                        src={doctorData?.photo_url ? `${process.env.NEXT_PUBLIC_API_URL}${doctorData?.photo_url}` : "https://www.iconpacks.net/icons/1/free-doctor-icon-313-thumb.png"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </button>

                    {showDropdown && (
                      <div className="origin-top-right cursor-pointer absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <div className="px-4 py-2 text-sm text-gray-700 border-b">
                            <p className="font-medium">Dr. {userName}</p>
                            <p className="text-xs text-gray-500">{doctorData?.doctorProfDetails?.specialization || 'Doctor'}</p>
                          </div>

                          <button
                            onClick={() => router.push(`/doctor/upload-photo/${doctorData?.doctorId}`)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <span className="flex cursor-pointer items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              Upload Photo
                            </span>
                          </button>

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

            <button
              onClick={openClosedDatesModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Manage Closed Dates
            </button>

            <Link
              href={`/doctor/book/${doctorData?.doctorId}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Book {doctorData?.is_appointment && doctorData?.is_token ? 'Token/Appointment' : doctorData?.is_appointment ? 'Appointment' : 'Token'}
            </Link>
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
                <nav className="flex flex-wrap -mb-px">
                  <button
                    onClick={() => setActiveTab('today')}
                    className={`py-3 px-4 sm:py-4 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm md:text-base ${activeTab === 'today'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Today's Bookings
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`py-3 px-4 sm:py-4 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm md:text-base ${activeTab === 'upcoming'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Upcoming
                  </button>
                </nav>

                {activeTab === 'today' && (
                  <div className="px-4 py-3 md:py-0 w-full sm:w-auto">
                    <label
                      htmlFor="date-filter"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-0 sm:inline-block"
                    >
                      Filter by Date:
                    </label>
                    <input
                      type="date"
                      id="date-filter"
                      value={selectedDate}
                      min={getTodayDate()}
                      onChange={(e) => handleDateFilter(e.target.value)}
                      className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">
                  {activeTab === 'today' ? "Today's Bookings" : 'Upcoming Bookings'}
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {activeTab === 'today'
                    ? new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                    : `Next 7 Days (${new Date(
                      Date.now() + 1 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()} - ${new Date(
                      Date.now() + 7 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()})`}
                </span>
              </div>

              {/* Booking List */}
              <ul className="divide-y divide-gray-200">
                {(activeTab === 'today' ? appointmentsToday : appointmentsUpcoming).map(
                  (booking) => (
                    <li
                      key={booking.id}
                      className="py-4 sm:py-5 px-3 sm:px-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                        {/* Avatar */}
                        <div className="flex-shrink-0 self-center sm:self-start">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {booking.patient.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center">
                              <p className="text-sm sm:text-md font-semibold text-gray-900 mr-2">
                                {booking.patient}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${booking.bookingType === 'Token'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                  }`}
                              >
                                {booking.bookingType}{' '}
                                {booking.tokenNumber && `#${booking.tokenNumber}`}
                              </span>
                            </div>

                            <div className="mt-2 sm:mt-0 flex flex-wrap items-center text-xs sm:text-sm text-gray-500">
                              {booking.date && (
                                <span className="mr-2 flex items-center">
                                  📅 {new Date(booking.date).toLocaleDateString()}
                                </span>
                              )}
                              <span className="flex items-center">⏰ {booking.shiftOrSlot}</span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">{booking.type}</p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {booking.patientGender}
                                <svg className="mx-2 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                                <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {booking.patientPhone}
                              </p>
                            </div>

                            {activeTab === 'today' &&
                              selectedDate === new Date().toISOString().split('T')[0] && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${booking.status === 'Completed'
                                        ? 'bg-green-100 text-green-800'
                                        : booking.status === 'With_Doctor'
                                          ? 'bg-blue-100 text-blue-800'
                                          : booking.status === 'Waiting'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                      }`}
                                  >
                                    {booking.status.replace(/_/g, ' ')}
                                  </span>
                                  <select
                                    onChange={(e) =>
                                      updateStatus(
                                        booking.id,
                                        parseInt(e.target.value),
                                        booking.bookingType
                                      )
                                    }
                                    className="block w-full sm:w-auto py-1.5 pl-2 pr-6 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[11px] sm:text-xs"
                                    value={booking.statusId}
                                  >
                                    {statusList.map((status) => (
                                      <option key={status.statusId} value={status.statusId}>
                                        {status.status.replace(/_/g, ' ')}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Slots Modal */}
      {showSlotsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full md:max-w-lg lg:max-w-2xl animate-scale-in">
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
                  min={getTodayDate()}
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
                    min={getTodayDate()}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => handleSlotTimeChange('startTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => handleSlotTimeChange('endTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {slotError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
                  {slotError}
                </div>
              )}

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
                          <span className="font-medium">Time - {slot.startTime} - {slot.endTime}</span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slot.isBooked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {slot.isBooked ? 'Booked' : 'Available'}
                          </span>
                        </div>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full md:max-w-lg animate-scale-in">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select
                    value={newShift.shiftId}
                    onChange={(e) => setNewShift({ ...newShift, shiftId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a shift</option>
                    {availableShifts.map(shift => (
                      <option key={shift.shiftId} value={shift.shiftId}>
                        {shift.shiftName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => handleShiftTimeChange('startTime', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => handleShiftTimeChange('endTime', e.target.value)}
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

              {shiftError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
                  {shiftError}
                </div>
              )}

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
                          Max Patients: {shift.maxPatients}
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

      {/* Closed Dates Modal */}
      {showClosedDatesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full md:max-w-lg animate-scale-in">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold text-gray-900">
                Manage OPD Closed Dates
              </h3>
              <button
                onClick={() => setShowClosedDatesModal(false)}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <div className="p-4 md:p-5 space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Closed Date</label>
                <input
                  type="date"
                  value={newClosedDate}
                  min={getTodayDate()}
                  onChange={(e) => setNewClosedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {closedDateError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
                  {closedDateError}
                </div>
              )}

              <button
                onClick={addClosedDate}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Add Closed Date
              </button>

              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Current Closed Dates</h4>
                {closedDates.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {closedDates.map((dateObj, index) => (
                      <li key={index} className="py-3 flex justify-between items-center">
                        <span className="font-medium">
                          {new Date(dateObj.closedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        {/* <button
                          onClick={() => removeClosedDate(dateObj.closedDate)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button> */}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No closed dates configured yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}