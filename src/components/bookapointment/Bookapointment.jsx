"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import styles from "./styles/bookapointment.module.scss"
import Link from "next/link"
import Swal from "sweetalert2"

// Remove the module declaration and use global declaration instead
// This should be in a separate types file, but for now we'll declare it globally
if (typeof window !== 'undefined') {
  window.Razorpay = window.Razorpay || null;
}

export default function Bookapointment() {
  const { id } = useParams()
  const [doctorData, setDoctorData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authToken, setAuthToken] = useState(null)
  const router = useRouter()

  // OTP verification states
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpUserId, setOtpUserId] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpSuccessMessage, setOtpSuccessMessage] = useState("")

  // Closed dates state
  const [closedDates, setClosedDates] = useState([])

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
    age: "",
    gender: "male"
  })
  const [someoneElseData, setSomeoneElseData] = useState({
    fullName: "",
    mobile: "",
    age: "",
    gender: "male"
  })

  // Payment states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Fetch closed dates
  const fetchClosedDates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getOPDClosedDates?doctorId=${id}`)
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

  // Check if a date is closed
  const isDateClosed = (dateString) => {
    return closedDates.some(closedDate => closedDate.closedDate === dateString)
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  const [validationErrors, setValidationErrors] = useState({
    mobile: "",
    age: "",
    someoneElseMobile: "",
    someoneElseEmail: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState("")

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

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

  const getNextAvailableDate = (dateString) => {
    if (!doctorData?.weekOff) return dateString;

    let nextDate = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    do {
      nextDate.setDate(nextDate.getDate() + 1);
    } while (days[nextDate.getDay()] === doctorData.weekOff);

    return nextDate.toISOString().split("T")[0];
  };

  // Get next available date considering both week off and closed dates
  const getNextAvailableDateConsideringAll = (dateString) => {
    let nextDate = new Date(dateString);
    const maxDate = getMaxDate();

    while (true) {
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateString = nextDate.toISOString().split("T")[0];

      // Stop if we exceed max date
      if (maxDate && nextDateString > maxDate) {
        return null;
      }

      // Check if this date is available
      if (!isWeekOffDay(nextDateString) && !isDateClosed(nextDateString)) {
        return nextDateString;
      }
    }
  };

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        resolve(true);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

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

        // Fetch closed dates after doctor data is loaded
        await fetchClosedDates()
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
        age: user.age,
        gender: user.gender
      }))
      setIsLoggedIn(true)
    }

    // Load Razorpay script
    loadRazorpayScript()
  }, [id])



  // Fetch shifts when date changes or doctor data changes
  useEffect(() => {
    if (!id || !appointmentDate || !doctorData) return

    const fetchShifts = async () => {
      setLoadingShifts(true)
      try {
        let apiUrl;

        if (doctorData.is_token) {
          apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/getDoctorOPDShifts?doctorId=${id}`
        } else {
          apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/getDoctorSlots?doctorId=${id}&date=${appointmentDate}`
        }

        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error("Failed to fetch shifts")
        const data = await res.json()

        if (doctorData.is_token) {
          setShifts(data.data || [])
        } else {
          setShifts(data)
        }

        setSelectedShift(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingShifts(false)
      }
    }

    fetchShifts()
  }, [id, appointmentDate, doctorData])

  // Function to handle date selection with validation
  const handleDateChange = (selectedDate) => {
    if (isWeekOffDay(selectedDate)) {
      const nextAvailable = getNextAvailableDateConsideringAll(selectedDate);
      Swal.fire({
        title: "Not Available",
        text: `The doctor is not available on ${doctorData.weekOff}s. Would you like to select the next available date?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Please choose another date",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed && nextAvailable) {
          setAppointmentDate(nextAvailable);
        } else {
          setAppointmentDate(today);
        }
      });
    } else if (isDateClosed(selectedDate)) {
      const nextAvailable = getNextAvailableDateConsideringAll(selectedDate);
      Swal.fire({
        title: "OPD Closed",
        text: `The OPD is closed on this date. Would you like to select the next available date?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Please choose another date",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed && nextAvailable) {
          setAppointmentDate(nextAvailable);
        } else {
          setAppointmentDate(today);
        }
      });
    } else {
      setAppointmentDate(selectedDate);
    }
  };

  // OTP Functions
  const handleSendOtp = async () => {
    const patientData = patientType === "self" ? formData : someoneElseData

    if (!validatePhone(patientData.mobile)) {
      setValidationErrors(prev => ({
        ...prev,
        [patientType === "self" ? "mobile" : "someoneElseMobile"]: "Please enter a valid 10-digit phone number"
      }))
      return false
    }

    setIsSendingOtp(true)
    setOtpError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/generateAndSendOtp`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: patientData.mobile,
          roleId: 1,
          authType: 'Booking',
          name: patientData.fullName,
          gender: patientData.gender
        })
      })

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`);
      }

      if (response.ok && data.status) {
        setOtpSuccessMessage(data.message);
        setOtpSent(true)
        setOtpUserId(data.data.userId)
        setCountdown(60)
        return true
      } else {
        setOtpError(data.message || "Failed to send OTP")
        return false
      }
    } catch (error) {
      setOtpError(error.message || "Network error. Please try again.")
      return false
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP")
      return false
    }

    setIsVerifyingOtp(true)
    setOtpError("")

    try {
      const patientData = patientType === "self" ? formData : someoneElseData

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/verify-otp`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: patientData.mobile,
          otp: otp,
          userId: otpUserId,
          roleId: 1
        })
      })

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
        sessionStorage.setItem('userRole', "1")
        setIsLoggedIn(true)

        // Reset OTP state
        setOtpSent(false)
        setOtp("")
        setOtpError("")
        return true
      } else {
        setOtpError(data.message || "Invalid OTP. Please try again.")
        return false
      }
    } catch (error) {
      setOtpError(error.message || "Network error. Please try again.")
      return false
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const resendOtp = async () => {
    if (countdown > 0) return

    setIsSendingOtp(true)
    setOtpError("")

    try {
      const patientData = patientType === "self" ? formData : someoneElseData

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/generateAndSendOtp`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: patientData.mobile,
          roleId: 1,
          authType: 'Booking',
          name: patientData.fullName,
          gender: patientData.gender
        })
      })

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`);
      }

      if (response.ok && data.status) {
        setOtpSuccessMessage(data.message);
        setCountdown(60)
        setOtpError("")
      } else {
        setOtpError(data.message || "Failed to resend OTP")
      }
    } catch (error) {
      setOtpError(error.message || "Network error. Please try again.")
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Function to register or get user (now only used after OTP verification)
  const handleAuth = async () => {
    try {
      setAuthError("")
      const patientData = patientType === "self" ? formData : someoneElseData

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/registerUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: patientData.fullName,
          password: "1234",
          phone: patientData.mobile,
          email: patientData.email,
          gender: patientData.gender,
          role_id: 0
        })
      })

      const data = await response.json()

      if (data.status && data.data?.userId) {
        sessionStorage.setItem("userId", data.data.userId)
        sessionStorage.setItem("userName", patientData.fullName)
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

  // Temporary debug function to test Razorpay
  const testRazorpayIntegration = async (bookingResult) => {
    try {
      console.log("Testing Razorpay integration...");

      // Test with a simple hardcoded order first
      const testOrderData = {
        amount: 100, // ₹1 in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`,
      };

      console.log("Sending test order data:", testOrderData);

      const orderResponse = await fetch(`/api/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOrderData)
      });

      const orderResult = await orderResponse.json();
      console.log("Backend response:", orderResult);

      if (!orderResult.success) {
        throw new Error(`Backend error: ${orderResult.message}`);
      }

      if (!orderResult.data || !orderResult.data.id) {
        throw new Error("Backend did not return a valid order ID");
      }

      console.log("Valid order ID received:", orderResult.data.id);
      return orderResult.data.id;

    } catch (error) {
      console.error("Razorpay test failed:", error);
      throw error;
    }
  };

  // SIMPLIFIED Razorpay Function for Debugging
  const initiateRazorpayPayment = async (bookingResult) => {
    try {
      setIsProcessingPayment(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Payment gateway not available");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      // Calculate amount - ensure it's at least ₹1 (100 paise)
      let amount = 100; // Start with minimum amount for testing
      if (doctorData.is_token) {
        amount = doctorData.is_fees_online ?
          ((doctorData.tokenFees || 10) + 10) * 100 :
          10 * 100;
      } else {
        amount = Math.round(doctorData.fees * 100);
      }

      // Ensure minimum amount
      if (amount < 100) amount = 100;

      console.log("🔄 Creating Razorpay order with amount:", amount, "paise");

      // Create order on backend
      const orderResponse = await fetch(`/api/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            booking_type: doctorData.is_token ? 'token' : 'appointment',
            doctor_id: id
          }
        })
      });

      const orderResult = await orderResponse.json();
      console.log("📦 Backend order response:", orderResult);

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.message || 'Invalid response from server');
      }

      if (!orderResult.data.id) {
        throw new Error('No order ID received from server');
      }

      const orderId = orderResult.data.id;
      console.log("✅ Valid Razorpay order ID:", orderId);

      // Verify order ID format (should start with 'order_')
      if (!orderId.startsWith('order_')) {
        console.warn("⚠️ Order ID format may be incorrect. Expected format: 'order_XXXXXXXXXXXXXX'");
      }

      const patientData = patientType === "self" ? formData : someoneElseData;

      // Razorpay options - SIMPLIFIED
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResult.data.amount.toString(),
        currency: orderResult.data.currency,
        name: 'Oneclickhelp',
        description: `${doctorData.is_token ? 'Token' : 'Appointment'} Booking`,
        order_id: orderId, // Use the Razorpay order ID
        handler: function (response) {
          console.log("💰 Payment successful:", response);
          handleSuccessfulPayment(response, bookingResult);
        },
        prefill: {
          name: patientData.fullName || 'Customer',
          email: patientData.email || 'customer@example.com',
          contact: patientData.mobile || '9999999999',
        },
        theme: {
          color: '#3399cc'
        }
      };

      console.log("🎯 Opening Razorpay checkout...", options);

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response) {
        console.error("❌ Payment failed:", response.error);
        setIsProcessingPayment(false);
        Swal.fire(
          "Payment Failed",
          response.error.description || "Payment failed. Please try again.",
          "error"
        );
      });

      razorpay.open();

    } catch (error) {
      console.error("💥 Payment initiation failed:", error);
      setIsProcessingPayment(false);
      Swal.fire(
        "Payment Error",
        error.message || "Failed to initialize payment. Please try again.",
        "error"
      );
    }
  };

  // Separate function for successful payment handling
  const handleSuccessfulPayment = async (response, bookingResult) => {
    try {
      console.log("🔄 Verifying payment...", response);

      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/updatePaymentStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingResult.data?.id,
          bookingType: doctorData.is_token ? "Token" : "Appointment",
          paymentStatus: "Success",
          transactionId: response.razorpay_payment_id
        })
      });

      const verifyData = await verifyResponse.json();
      console.log("✅ Payment verification:", verifyData);

      if (verifyData.success) {
        await updateBookingWithPayment(bookingResult, response.razorpay_payment_id);
      } else {
        throw new Error(verifyData.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("❌ Payment handling error:", error);
      Swal.fire("Payment Error", "Payment completed but verification failed. Please contact support.", "warning");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Helper function to update booking with payment info
  const updateBookingWithPayment = async (bookingResult, paymentId) => {
    try {
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/update-booking-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingResult.data.bookingId,
          token: bookingResult.data.token,
          paymentId: paymentId,
          isPaid: true,
          paymentMethod: 'razorpay'
        })
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        await processSuccessfulBooking(bookingResult, paymentId);
      } else {
        throw new Error(updateData.message || "Failed to update booking payment");
      }
    } catch (error) {
      console.error("Update booking error:", error);
      Swal.fire("Booking Error", "Booking completed but payment update failed. Please contact support.", "warning");
    }
  };

  // Helper function to process successful booking after payment
  const processSuccessfulBooking = async (bookingResult, paymentId) => {
    if (doctorData.is_token) {
      Swal.fire({
        title: "Token Booked 🎉",
        html: `
      <p>Your token has been booked successfully!</p>
      <h2 style="margin-top:10px">Token Number: <b>${bookingResult.data?.token}</b></h2>
      <p style="margin-top:10px">Payment ID: ${paymentId}</p>
      ${doctorData.is_fees_online ?
            `<p style="margin-top:10px; color: #d97706; font-weight: bold;">
          Paid: ₹${((doctorData.tokenFees || 10) + 10)} (₹${doctorData.tokenFees || 10} token fee + ₹10 online fee)
        </p>` :
            `<p style="margin-top:10px; color: #d97706; font-weight: bold;">
          Paid: ₹10 (Token fee)
        </p>`
          }
    `,
        icon: "success",
        confirmButtonText: "Okay"
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/user/dashboard");
        }
      });
    } else {
      Swal.fire({
        title: "Appointment Booked 🎉",
        html: `
      <p>Your appointment has been booked successfully!</p>
      <h2 style="margin-top:10px">Booking ID: <b>${bookingResult.data?.bookingId}</b></h2>
      <p style="margin-top:10px">Payment ID: ${paymentId}</p>
      <p style="margin-top:10px; color: #d97706; font-weight: bold;">
        Paid: ₹${doctorData.fees}
      </p>
    `,
        icon: "success",
        confirmButtonText: "Okay"
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/user/dashboard");
        }
      });
    }
  };

  // Process booking after payment or for free bookings
  const processBooking = async (paymentId = null) => {
    const patientData = patientType === "self" ? formData : someoneElseData
    const userId = sessionStorage.getItem("userId")

    try {
      let bookingRes
      let bookingData

      if (doctorData.is_token) {
        bookingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/bookToken`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: patientData.fullName,
            patientGender: patientData.gender,
            bookedBy: "patient",
            user_id: userId,
            patientAge: patientData.age,
            patientPhone: patientData.mobile,
            doctor_id: doctorData.doctorId || id,
            bookingDate: appointmentDate,
            shiftId: selectedShift.id,
            paymentId: paymentId,
            isPaid: !!paymentId
          })
        })
        bookingData = await bookingRes.json()
      } else {
        bookingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/bookAppointment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: doctorData.doctorId || id,
            userId: userId,
            patientName: patientData.fullName,
            patientPhone: patientData.mobile,
            patientGender: patientData.gender,
            slotId: selectedShift.id,
            age: patientData.age,
            bookedBy: "patient",
            paymentId: paymentId,
            isPaid: !!paymentId
          })
        })
        bookingData = await bookingRes.json()
      }

      if (bookingData.status) {
        return bookingData;
      } else {
        throw new Error(bookingData.message || "Booking failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    // If OTP is not verified, send OTP first
    if (!isLoggedIn && !otpSent) {
      const otpSentSuccess = await handleSendOtp()
      if (!otpSentSuccess) {
        return
      }
      // Show message to enter OTP
      Swal.fire("OTP Sent", "Please enter the OTP sent to your mobile number", "info")
      return
    }

    // If OTP is sent but not verified, verify OTP
    if (otpSent && !isLoggedIn) {
      const otpVerified = await handleVerifyOtp()
      if (!otpVerified) {
        return
      }
      // Continue with booking after successful OTP verification
    }

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

    setValidationErrors({})
    setIsSubmitting(true)

    if (!selectedShift) {
      Swal.fire("Warning", "Please select a shift/slot", "warning")
      setIsSubmitting(false)
      return
    }

    // Check if selected date is closed
    if (isDateClosed(appointmentDate)) {
      Swal.fire("OPD Closed", "The OPD is closed on the selected date. Please choose another date.", "warning")
      setIsSubmitting(false)
      return
    }

    // Check if selected date is week off
    if (isWeekOffDay(appointmentDate)) {
      Swal.fire("Not Available", `The doctor is not available on ${doctorData.weekOff}s. Please choose another date.`, "warning")
      setIsSubmitting(false)
      return
    }

    // Register user if not already registered (after OTP verification)
    if (isLoggedIn && !sessionStorage.getItem("userId")) {
      const authSuccess = await handleAuth()
      if (!authSuccess) {
        setIsSubmitting(false)
        return
      }
    }

    const userId = sessionStorage.getItem("userId")

    try {
      const requiresPayment =
        (doctorData.is_token && (doctorData.tokenFees || 10) > 0) ||
        (!doctorData.is_token && doctorData.is_fees_online && doctorData.fees > 0);

      // SECOND: If payment is required, initiate Razorpay payment with the booking result
      if (requiresPayment) {

        const bookingResult = await processBooking();

        if (bookingResult.status) {
          // Initiate Razorpay payment with the booking result
          await initiateRazorpayPayment(bookingResult);
        } else {
          throw new Error(bookingResult.message || "Booking failed");
        }
      } else {
        const bookingResult = await processBooking();
        if (bookingResult.status) {

          // Free booking - show success message directly
          if (doctorData.is_token) {
            Swal.fire({
              title: "Token Booked 🎉",
              html: `
            <p>Your token has been booked successfully!</p>
            <h2 style="margin-top:10px">Token Number: <b>${bookingResult.data?.token}</b></h2>
          `,
              icon: "success",
              confirmButtonText: "Okay"
            }).then((result) => {
              if (result.isConfirmed) {
                router.push("/user/dashboard");
              }
            });
          } else {
            Swal.fire({
              title: "Appointment Booked 🎉",
              html: `
            <p>Your appointment has been booked successfully!</p>
            <h2 style="margin-top:10px">Booking ID: <b>${bookingResult.data?.bookingId}</b></h2>
          `,
              icon: "success",
              confirmButtonText: "Okay"
            }).then((result) => {
              if (result.isConfirmed) {
                router.push("/user/dashboard");
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Booking error:", error)
      Swal.fire("Error", error.message || "Booking failed", "error")
    }

    setIsSubmitting(false)
  }
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Reset OTP state if mobile number changes
    if (field === "mobile" && otpSent) {
      setOtpSent(false)
      setOtp("")
    }
  }

  const handleSomeoneElseInputChange = (field, value) => {
    setSomeoneElseData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Reset OTP state if mobile number changes
    if (field === "mobile" && otpSent) {
      setOtpSent(false)
      setOtp("")
    }
  }

  const getMinDate = () => {
    return new Date().toISOString().split("T")[0]
  }

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
                onChange={(e) => handleDateChange(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            {/* Display warning messages if current selected date has issues */}
            {isWeekOffDay(appointmentDate) && (
              <div className={styles.warningMessage}>
                ⚠️ Doctor is not available on {doctorData.weekOff}s
              </div>
            )}
            {isDateClosed(appointmentDate) && (
              <div className={styles.warningMessage}>
                ⚠️ OPD is closed on this date
              </div>
            )}

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
              src={photo_url ? `${process.env.NEXT_PUBLIC_API_URL}${photo_url}` : "https://www.iconpacks.net/icons/1/free-doctor-icon-313-thumb.png"}
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


                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => {
                      handleInputChange("age", e.target.value)
                      setValidationErrors(prev => ({ ...prev, age: "" }))
                    }}
                    className={styles.textInput}
                    placeholder="Enter Your Age"
                  />
                  {validationErrors.age && <p className={styles.validationError}>{validationErrors.age}</p>}
                </div>


                {/* OTP Verification Section */}
                {!isLoggedIn && (
                  <div className={styles.otpSection}>
                    {otpSent ? (
                      <>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>
                            Enter OTP<span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className={styles.textInput}
                            placeholder="Enter 6-digit OTP"
                            maxLength="6"
                          />
                        </div>
                        {otpSuccessMessage && <p className={styles.otpSuccess}>{otpSuccessMessage}</p>}
                        {otpError && <p className={styles.otpError}>{otpError}</p>}
                      </>
                    ) : (
                      <>
                        {otpError ? (
                          <p className={styles.otpError}>{otpError}</p>
                        ) : (
                          <div className={styles.otpNotice}>
                            <p>You need to verify your mobile number before getting {is_token ? "token" : "booking"}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
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

                {/* OTP Verification Section for someone else */}
                {!isLoggedIn && (
                  <div className={styles.otpSection}>
                    {otpSent ? (
                      <>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>
                            Enter OTP<span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className={styles.textInput}
                            placeholder="Enter 6-digit OTP"
                            maxLength="6"
                          />
                          <div className={styles.otpActions}>
                            <button
                              type="button"
                              onClick={resendOtp}
                              disabled={countdown > 0 || isSendingOtp}
                              className={styles.resendBtn}
                            >
                              {isSendingOtp ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                            </button>
                          </div>
                        </div>
                        {otpError && <p className={styles.otpError}>{otpError}</p>}
                      </>
                    ) : (
                      <div className={styles.otpNotice}>
                        <p>You need to verify the patient's mobile number before booking</p>
                      </div>
                    )}
                  </div>
                )}

                {authError && <p className={styles.authError}>{authError}</p>}
              </>
            )}
          </div>

          {/* Payment Section */}
          {is_token ? (
            <>
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedShift || (isVerifyingOtp) || isProcessingPayment}
                  className={styles.confirmBtn}
                >
                  {isProcessingPayment ? "Processing Payment..." :
                    isVerifyingOtp ? "Verifying OTP..." :
                      isSubmitting ? "Processing..." :
                        doctorData.is_fees_online ? `Pay ₹${tokenFees || 10}` : "Book Token"}
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-md mb-10 p-6 max-w-md w-full border-l-4 border-yellow-400">
                <div className="flex items-start">
                  {/* Warning Icon */}
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {/* Content */}
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Kindly Note:</h3>
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="font-medium">
                        The Token Fee is only for reserving your spot in the queue.
                      </p>
                      <p className="mt-2">
                        The OPD Consultation Fee is a separate charge that you will need to
                        pay to the doctor during your visit.
                      </p>
                    </div>
                  </div>
                </div>
              </div></>
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
                        </div>
                        <div className={styles.paymentMethod}>
                          <span>Pay Online</span>
                          <span className={styles.paymentSubtext}>
                            - Get hassle free experience
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedShift || (isVerifyingOtp) || isProcessingPayment}
                className={styles.confirmBtn}
              >
                {isProcessingPayment ? "Processing Payment..." :
                  isVerifyingOtp ? "Verifying OTP..." :
                    isSubmitting ? "Processing..." :
                      "Confirm Clinic Visit"}
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  )
}