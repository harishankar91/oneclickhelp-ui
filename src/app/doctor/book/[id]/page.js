"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Swal from "sweetalert2"
import Header from "@/components/header/header"
import Footer from "@/components/footer/footer"
import Link from "next/link"

export default function BookAppointment() {
  const { id } = useParams()
  const router = useRouter()
  const [doctorData, setDoctorData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0]
  
  const [appointmentDate, setAppointmentDate] = useState(today)
  const [shifts, setShifts] = useState([])
  const [selectedShift, setSelectedShift] = useState(null)
  const [loadingShifts, setLoadingShifts] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientGender: "Male",
    patientAge: "",
    doctor_id: id || "",
    bookingDate: today,
    shiftId: null,
    bookedBy: "doctor"
  })

  // Fetch doctor details
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}api/getDoctorsById?doctorId=${id}`
        )
        if (!res.ok) throw new Error("Failed to fetch doctor")
        const data = await res.json()
        setDoctorData(data)
      } catch (err) {
        console.error("Error fetching doctor:", err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDoctor()
  }, [id])

  // Fetch shifts when date changes or doctor data changes
  useEffect(() => {
    if (!id || !appointmentDate || !doctorData) return

    const fetchShifts = async () => {
      setLoadingShifts(true)
      try {
        let apiUrl;

        if (doctorData.is_token) {
          // For tokens, use the OPD shifts API
          apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/getDoctorOPDShifts?doctorId=${id}`
        } else {
          // For appointments, use the slots API
          apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/getDoctorSlots?doctorId=${id}&date=${appointmentDate}`
        }

        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error("Failed to fetch shifts/slots")
        const data = await res.json()

        if (doctorData.is_token) {
          // For tokens, use the data directly from the OPD shifts API
          setShifts(data.data || [])
        } else {
          // For appointments, use the data structure from the slots API
          setShifts(data)
        }

        setSelectedShift(null) // Reset selected shift when date changes
      } catch (err) {
        console.error("Error fetching shifts:", err)
      } finally {
        setLoadingShifts(false)
      }
    }

    fetchShifts()
  }, [id, appointmentDate, doctorData])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Determine which API to use based on doctor type
      const isToken = doctorData?.is_token
      const apiUrl = isToken 
        ? `${process.env.NEXT_PUBLIC_API_URL}api/bookTokenByDoctor`
        : `${process.env.NEXT_PUBLIC_API_URL}api/bookAppointmentByDoctor`

      // Prepare request body based on API
      const requestBody = isToken 
        ? {
            patientName: formData.patientName,
            patientGender: formData.patientGender,
            bookedBy: formData.bookedBy,
            doctor_id: formData.doctor_id,
            bookingDate: formData.bookingDate,
            shiftId: formData.shiftId,
            patientAge: parseInt(formData.patientAge),
            patientPhone: formData.patientPhone
          }
        : {
            doctorId: formData.doctor_id,
            patientName: formData.patientName,
            patientPhone: formData.patientPhone,
            patientGender: formData.patientGender,
            slotId: formData.shiftId,
            bookedBy: formData.bookedBy
          }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.status) {
        // Success message
        Swal.fire({
          title: "Success!",
          text: data.message,
          icon: "success",
          confirmButtonText: "OK"
        }).then(() => {
          router.push("/doctor/dashboard") // Redirect to dashboard after booking
        })
      } else {
        Swal.fire("Error", data.message || "Booking failed", "error")
      }
    } catch (error) {
      console.error("Booking error:", error)
      Swal.fire("Error", "Something went wrong. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return ""
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="border-6 border-solid border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="text-center mb-6">
            <Link href="/doctor/dashboard" className="text-blue-500 hover:underline mb-4 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h2 className="text-2xl font-bold text-gray-800">
              {doctorData?.is_token ? "Book Token" : "Book Appointment"}
            </h2>
            <p className="text-gray-600 mt-2">Please fill in the patient details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange("patientName", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter patient name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.patientPhone}
                  onChange={(e) => handleInputChange("patientPhone", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                  required
                  maxLength="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender<span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.patientGender}
                  onChange={(e) => handleInputChange("patientGender", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) => handleInputChange("patientAge", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter age"
                  required
                  min="0"
                  max="120"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  handleInputChange("bookingDate", e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                min={today}
                max={doctorData?.is_token ? today : new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split("T")[0]} 
              />

            </div>

            {loadingShifts ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Loading available {doctorData?.is_token ? "shifts" : "slots"}...</p>
              </div>
            ) : shifts.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select {doctorData?.is_token ? "Shift" : "Time Slot"}<span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shifts.map((shift) => (
                    <button
                      type="button"
                      key={doctorData?.is_token ? shift.shiftId : shift.id}
                      className={`p-3 border rounded-md text-center transition-colors ${
                        selectedShift?.id === (doctorData?.is_token ? shift.shiftId : shift.id)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : shift.isBooked
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        if (!shift.isBooked) {
                          const selected = doctorData?.is_token
                            ? { id: shift.shiftId, name: shift.shiftName }
                            : shift
                          setSelectedShift(selected)
                          handleInputChange("shiftId", doctorData?.is_token ? shift.shiftId : shift.id)
                        }
                      }}
                      disabled={shift.isBooked}
                    >
                      {doctorData?.is_token ? (
                        <div className="font-medium">{shift.shiftName}</div>
                      ) : (
                        <>
                          <div className="font-medium">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</div>
                          {shift.isBooked && <div className="text-xs mt-1">Booked</div>}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-red-500 text-sm">No {doctorData?.is_token ? "shifts" : "slots"} found for the selected date.</p>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !selectedShift}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Processing..."
                  : doctorData?.is_token
                    ? "Book Token"
                    : "Book Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}