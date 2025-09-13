"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import styles from "./styles/bookapointment.module.scss"
import Link from "next/link"
import Swal from "sweetalert2"

export default function Bookapointment() {
  const { id } = useParams()
  const [doctorData, setDoctorData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authToken, setAuthToken] = useState(null)
  const router = useRouter()
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0]
  const now = new Date().toTimeString().slice(0, 5)

  const [appointmentDate, setAppointmentDate] = useState(today)
  const [shifts, setShifts] = useState([])
  const [selectedShift, setSelectedShift] = useState(null)
  const [loadingShifts, setLoadingShifts] = useState(false)

  const [patientType, setPatientType] = useState("self")
  const [paymentOption, setPaymentOption] = useState("online")
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    gender: "male"
  })
  const [someoneElseData, setSomeoneElseData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    gender: "male"
  })

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Add validation function for phone number (10 digits)
  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  // Add state for validation errors
  const [validationErrors, setValidationErrors] = useState({
    mobile: "",
    email: "",
    someoneElseMobile: "",
    someoneElseEmail: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState("")

  const isWeekOffDay = (dateString) => {
    if (!doctorData?.weekOff) return false;

    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDay = days[dayOfWeek];

    return selectedDay === doctorData.weekOff;
  };

  const getMaxDate = () => {
    if (!doctorData) return null;

    const maxDays = doctorData.is_token
      ? doctorData.daysToBookToken
      : doctorData.daysToBookAppointment;

    if (!maxDays) return null;

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDays);
    return maxDate.toISOString().split("T")[0];
  };


  // Add this function to get the next available date
  const getNextAvailableDate = (dateString) => {
    if (!doctorData?.weekOff) return dateString;

    let nextDate = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Keep adding days until we find a non-weekoff day
    do {
      nextDate.setDate(nextDate.getDate() + 1);
    } while (days[nextDate.getDay()] === doctorData.weekOff);

    return nextDate.toISOString().split("T")[0];
  };

  // Fetch doctor details
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(
          `https://api.oneclickhelp.in/api/getDoctorsById?doctorId=${id}`
        )
        if (!res.ok) throw new Error("Failed to fetch doctor")
        const data = await res.json()
        setDoctorData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDoctor()

    // Check if user is already logged in
    const token = sessionStorage.getItem('authToken')
    const userData = sessionStorage.getItem('userData')
    if (token && userData) {
      setAuthToken(token)
      const user = JSON.parse(userData)
      setFormData(prev => ({
        ...prev,
        fullName: user.name,
        mobile: user.phone,
        email: user.email,
        gender: user.gender
      }))
      setIsLoggedIn(true)
    }
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
          apiUrl = `https://api.oneclickhelp.in/api/getDoctorOPDShifts?doctorId=${id}`
        } else {
          // For appointments, use the slots API
          apiUrl = `https://api.oneclickhelp.in/api/getDoctorSlots?doctorId=${id}&date=${appointmentDate}`
        }

        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error("Failed to fetch shifts")
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
        setError(err.message)
      } finally {
        setLoadingShifts(false)
      }
    }

    fetchShifts()
  }, [id, appointmentDate, doctorData])

  // Function to register or get user
  const handleAuth = async () => {
    try {
      setAuthError("")
      const response = await fetch('https://api.oneclickhelp.in/api/registerUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          password: "1234", // default
          phone: formData.mobile,
          email: formData.email,
          gender: formData.gender,
          role_id: 0
        })
      })

      const data = await response.json()

      if (data.status && data.data?.userId) {
        // Save userId to session
        sessionStorage.setItem("userId", data.data.userId)
        sessionStorage.setItem("userName", formData.fullName,)
        setIsLoggedIn(true)
        return true
      } else {
        setAuthError(data.message || "Registration failed")
        return false
      }
    } catch (err) {
      console.error("Auth error:", err)
      setAuthError("Something went wrong. Please try again.")
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate inputs
    const patientData = patientType === "self" ? formData : someoneElseData
    const errors = {}

    if (!validatePhone(patientData.mobile)) {
      errors[patientType === "self" ? "mobile" : "someoneElseMobile"] = "Please enter a valid 10-digit phone number"
    }

    if (patientData.email && !validateEmail(patientData.email)) {
      errors[patientType === "self" ? "email" : "someoneElseEmail"] = "Please enter a valid email address"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setIsSubmitting(false)
      return
    }

    // Clear any previous validation errors
    setValidationErrors({})

    setIsSubmitting(true)

    if (!selectedShift) {
      Swal.fire("Warning", "Please select a shift/slot", "warning")
      setIsSubmitting(false)
      return
    }

    // If user not logged in → register first
    if (!isLoggedIn) {
      const authSuccess = await handleAuth()
      if (!authSuccess) {
        setIsSubmitting(false)
        return
      }
    }

    const userId = sessionStorage.getItem("userId")

    try {
      let bookingRes
      let bookingData

      if (doctorData.is_token) {
        // Book Token
        bookingRes = await fetch("https://api.oneclickhelp.in/api/bookToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: patientData.fullName,
            patientGender: patientData.gender,
            bookedBy: "patient",
            user_id: userId,
            patientPhone: patientData.mobile,
            doctor_id: doctorData.doctorId || id,
            bookingDate: appointmentDate,
            shiftId: selectedShift.id
          })
        })
        bookingData = await bookingRes.json()
      } else {
        // Book Appointment
        bookingRes = await fetch("https://api.oneclickhelp.in/api/bookAppointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: doctorData.doctorId || id,
            userId: userId,
            patientName: patientData.fullName,
            patientPhone: patientData.mobile,
            patientGender: patientData.gender,
            slotId: selectedShift.id
          })
        })
        bookingData = await bookingRes.json()
      }

      if (bookingData.status) {
        if (doctorData.is_token) {
          Swal.fire({
            title: "Token Booked 🎉",
            html: `
            <p>Your token has been booked successfully!</p>
            <h2 style="margin-top:10px">Token Number: <b>${bookingData.data?.token}</b></h2>
          `,
            icon: "success",
            confirmButtonText: "Okay"
          }).then((result) => {
            if (result.isConfirmed) {
              router.push("/user/dashboard");
            }
          });
        } else {
          // Appointment booking success
          Swal.fire({
            title: "Appointment Booked 🎉",
            html: `
            <p>Your appointment has been booked successfully!</p>
            <h2 style="margin-top:10px">Booking ID: <b>${bookingData.data?.bookingId}</b></h2>
          `,
            icon: "success",
            confirmButtonText: "Okay"
          }).then((result) => {
            if (result.isConfirmed) {
              router.push("/user/dashboard");
            }
          });
        }
      } else {
        Swal.fire("Error", bookingData.message || "Booking failed", "error")
      }
    } catch (error) {
      console.error("Booking error:", error)
      Swal.fire("Error", "Something went wrong while booking. Please try again.", "error")
    }

    setIsSubmitting(false)
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSomeoneElseInputChange = (field, value) => {
    setSomeoneElseData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Function to calculate minimum date for appointment (today)
  const getMinDate = () => {
    return new Date().toISOString().split("T")[0]
  }

  // Format time for display
  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  if (error) return <p className={styles.error}>Error: {error}</p>
  if (!doctorData) return <p className={styles.error}>No doctor found</p>

  const {
    name,
    photo_url,
    fees,
    tokenFees,
    doctorProfDetails,
    hospitalDetails,
    is_token
  } = doctorData

  return (
    <div className={styles.container}>
      {/* LEFT SECTION */}
      <div className={styles.leftSection}>
        <div className={styles.appointmentHeader}>
          <div className={styles.headerIcon}>
            <span className={styles.icon}>🏥</span>
          </div>
          <h2 className={styles.headerTitle}>
            {is_token ? "Get Token" : "In-clinic Appointment"}
          </h2>
        </div>

        {/* Date Selection */}
        <div className={styles.dateTimeSection}>
          <>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.icon}>📅</span> Select Date
              </label>
              <input
                type="date"
                value={appointmentDate}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => {
                  const selectedDate = e.target.value;

                  if (isWeekOffDay(selectedDate)) {
                    const nextAvailable = getNextAvailableDate(selectedDate);
                    Swal.fire({
                      title: "Not Available",
                      text: `The doctor is not available on ${doctorData.weekOff}s. Would you like to select ${new Date(nextAvailable).toLocaleDateString()} instead?`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Yes, select this date",
                      cancelButtonText: "No, let me choose"
                    }).then((result) => {
                      if (result.isConfirmed) {
                        setAppointmentDate(nextAvailable);
                      }
                    });
                  } else {
                    setAppointmentDate(selectedDate);
                  }
                }}
                className={styles.dateInput}
              />

            </div>

            {/* Shift Selection */}
            <div className="mt-4">
              <h3 className="mb-2">{is_token ? "Available Shifts" : "Available Slots"}</h3>
              {loadingShifts ? (
                <div className="">Loading {is_token ? "shifts" : "slots"}...</div>
              ) : shifts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {shifts.map((shift) => (
                    <button
                      key={is_token ? shift.shiftId : shift.id}
                      className={`p-3 border rounded-md text-center transition-colors ${selectedShift?.id === (is_token ? shift.shiftId : shift.id)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : shift.isBooked
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      onClick={() => !shift.isBooked && setSelectedShift(
                        is_token
                          ? { id: shift.shiftId, name: shift.shiftName }
                          : shift
                      )}
                      disabled={shift.isBooked}
                    >
                      {is_token ? (
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
              ) : (
                <p className="text-red-500 text-sm">No {is_token ? "shifts" : "slots"} found for the selected date. Kindly select a different date.</p>
              )}
            </div>
          </>
        </div>

        {/* Doctor Section */}
        <div className={styles.doctorSection}>
          <div className={styles.doctorProfile}>
            <img
              src={photo_url ? `https://api.oneclickhelp.in${photo_url}` : "https://www.iconpacks.net/icons/1/free-doctor-icon-313-thumb.png"}
              alt={name}
              className={styles.doctorPhoto}
            />
            <div className={styles.doctorInfo}>
              <h3 className={styles.doctorName}>{name}</h3>
              <p className={styles.doctorQualification}>
                {doctorProfDetails.qualifications}
              </p>
              <p className={styles.doctorSpecialty}>
                {doctorProfDetails.specialization}
              </p>
              <p className={styles.doctorExp}>
                Experience: {doctorProfDetails.year_of_experience} years
              </p>
            </div>
          </div>
        </div>

        {/* Working Hours Section */}
        {shifts && shifts.length > 0 && doctorData.is_token && (
          <div className="mt-8 mb-8 p-6 bg-white rounded-xl shadow-xl text-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Working Hours</h3>
            <div className="divide-y divide-gray-100">
              {shifts.map((shift, index) => (
                <div key={index} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                  <span className="text-gray-800 font-semibold">
                    {is_token ? shift.shiftName : `Shift ${index + 1}`}
                  </span>
                  <span className="text-gray-700">
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinic Section */}
        <div className={styles.clinicSection}>
          <div className={styles.clinicLogo}>
            <div className={styles.logoIcon}>
              <span className={styles.icon}>🏥</span>
            </div>
          </div>
          <div className={styles.clinicInfo}>
            <h4 className={styles.clinicName}>{hospitalDetails.hospital_name}</h4>
            <p className={styles.clinicAddress}>
              {hospitalDetails.address_1}, {hospitalDetails.address_2}
              <br />
              Landmark: {hospitalDetails.landmark}
            </p>
          </div>
        </div>

        <Link href="/"><button className={styles.backBtn}>Go back to my results</button></Link>
      </div>

      {/* RIGHT SECTION */}
      <div className={styles.rightSection}>
        <h2 className={styles.patientTitle}>Patient Details</h2>

        <form onSubmit={handleSubmit} className={styles.patientForm}>
          {/* patientType selection - Only show for appointments, not tokens */}
          {!is_token && (
            <div className={styles.patientTypeSection}>
              <p className={styles.appointmentFor}>
                This in-clinic appointment is for:
              </p>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="patientType"
                    value="self"
                    checked={patientType === "self"}
                    onChange={(e) => setPatientType(e.target.value)}
                  />
                  <span className={styles.radioLabel}>Self</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="patientType"
                    value="other"
                    checked={patientType === "other"}
                    onChange={(e) => setPatientType(e.target.value)}
                  />
                  <span className={styles.radioLabel}>Someone Else</span>
                </label>
              </div>
            </div>
          )}

          {/* Patient form fields */}
          <div className={styles.formSection}>
            {is_token || patientType === "self" ? (
              <>
                <p className={styles.formInstruction}>
                  Please provide following information:
                </p>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Full Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className={styles.textInput}
                    placeholder="Enter Your Full Name"
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Whatsapp Number<span className={styles.required}>*</span>
                  </label>

                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => {
                      handleInputChange("mobile", e.target.value)
                      setValidationErrors(prev => ({ ...prev, mobile: "" }))
                    }}
                    className={styles.textInput}
                    placeholder="Enter Whatsapp Number"
                    required
                    maxLength="10"
                  />
                  {validationErrors.mobile && <p className={styles.validationError}>{validationErrors.mobile}</p>}

                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Gender<span className={styles.required}>*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className={styles.selectInput}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Show email and gender only for appointments, not tokens */}
                {!is_token && (
                  <>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          handleInputChange("email", e.target.value)
                          setValidationErrors(prev => ({ ...prev, email: "" }))
                        }}
                        className={styles.textInput}
                        placeholder="Enter Your Email Address"
                      />
                      {validationErrors.email && <p className={styles.validationError}>{validationErrors.email}</p>}
                    </div>

                  </>
                )}

                {authError && <p className={styles.authError}>{authError}</p>}
              </>
            ) : (
              <>
                <p className={styles.formInstruction}>
                  Please provide following information:
                </p>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Patient's Full Name<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={someoneElseData.fullName}
                    onChange={(e) => handleSomeoneElseInputChange("fullName", e.target.value)}
                    className={styles.textInput}
                    placeholder="Enter Patient's Full Name"
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Patient's Whatsapp Number<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={someoneElseData.mobile}
                    onChange={(e) => {
                      handleSomeoneElseInputChange("mobile", e.target.value)
                      setValidationErrors(prev => ({ ...prev, someoneElseMobile: "" }))
                    }}
                    className={styles.textInput}
                    placeholder="Enter Patient's Whatsapp Number"
                    required
                    maxLength="10"
                  />
                  {validationErrors.someoneElseMobile && <p className={styles.validationError}>{validationErrors.someoneElseMobile}</p>}

                </div>

                {/* Show email and gender only for appointments, not tokens */}
                {!is_token && (
                  <>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Patient's Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={someoneElseData.email}
                        onChange={(e) => {
                          handleSomeoneElseInputChange("email", e.target.value)
                          setValidationErrors(prev => ({ ...prev, someoneElseEmail: "" }))
                        }}
                        className={styles.textInput}
                        placeholder="Enter Patient's Email Address"
                      />
                      {validationErrors.someoneElseEmail && <p className={styles.validationError}>{validationErrors.someoneElseEmail}</p>}

                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Patient's Gender<span className={styles.required}>*</span>
                      </label>
                      <select
                        value={someoneElseData.gender}
                        onChange={(e) => handleSomeoneElseInputChange("gender", e.target.value)}
                        className={styles.selectInput}
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                {authError && <p className={styles.authError}>{authError}</p>}
              </>
            )}
          </div>

          {/* Payment Section - Different for tokens vs appointments */}
          {is_token ? (
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting || !selectedShift}
                className={styles.confirmBtn}
              >
                {isSubmitting
                  ? "Processing..."
                  : doctorData.is_fees_online
                    ? `Pay ₹${tokenFees || 10}`
                    : "Book Token"}
              </button>
            </div>

          ) : (
            <div className={styles.paymentSection}>
              {doctorData.is_fees_online && (
                <>
                  <h3 className={styles.paymentTitle}>
                    Choose a payment option to Book Appointment
                  </h3>
                  <div className={styles.paymentOptions}>
                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentOption === "online"}
                        onChange={(e) => setPaymentOption(e.target.value)}
                      />
                      <div className={styles.paymentDetails}>
                        <div className={styles.paymentPrice}>
                          <span className={styles.originalPrice}>₹{fees}</span>
                          {/* <span className={styles.strikePrice}>₹{fees}</span> */}
                          {/* <span className={styles.discount}>₹50 OFF*</span> */}
                        </div>
                        <div className={styles.paymentMethod}>
                          <span>Pay Online</span>
                          <span className={styles.paymentSubtext}>
                            - Get hassle free experience
                          </span>
                        </div>
                      </div>
                    </label>

                    {/* <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="payment"
                        value="clinic"
                        checked={paymentOption === "clinic"}
                        onChange={(e) => setPaymentOption(e.target.value)}
                      />
                      <div className={styles.paymentDetails}>
                        <div className={styles.paymentPrice}>
                          <span className={styles.originalPrice}>₹{fees}</span>
                        </div>
                        <div className={styles.paymentMethod}>
                          <span>Pay later at the clinic</span>
                        </div>
                      </div>
                    </label> */}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedShift}
                className={styles.confirmBtn}
              >
                {isSubmitting ? "Processing..." : "Confirm Clinic Visit"}
              </button>
            </div>

          )}
        </form>
      </div>
    </div>
  )
}