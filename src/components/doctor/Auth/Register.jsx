"use client"
import Footer from "@/components/footer/footer"
import Header from "@/components/header/header"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function Register() {
  const [step, setStep] = useState(1)
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingSpecializations, setLoadingSpecializations] = useState(false)
  const [loadingHospitals, setLoadingHospitals] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    password: "",
    photo_url: "",
    hospital_name: "",
    address_1: "",
    address_2: "",
    stateId: "",
    district_Id: "",
    landmark: "",
    specialization: "",
    sub_specialization: "",
    hospital_id: 0,
    registration_no: "",
    qualifications: "",
    medical_council_name: "",
    year_of_experience: 0,
    about: "",
    fees: 0,
    is_token: true,
    is_appointment: true,
    is_fees_online: false,
    avgConsultMins: 20,
    weekOff: "Sunday",
    tokenFees: 200,
    phone_1: "",
    phone_2: "",
    landline: "",
    daysToBookAppointment: "",
    daysToBookToken: "",
    selectedHospital: "0" // New field to track selected hospital
  })

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  // Validate form fields
  const validateFields = () => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.name) newErrors.name = "Name is required"
      if (!formData.email) {
        newErrors.email = "Email is required"
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
      if (!formData.password) newErrors.password = "Password is required"
      if (!formData.phone) {
        newErrors.phone = "Phone number is required"
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = "Please enter a valid 10-digit phone number"
      }
      if (!formData.gender) newErrors.gender = "Gender is required"

      // Validate alternate phone numbers if provided
      if (formData.phone_1 && !validatePhone(formData.phone_1)) {
        newErrors.phone_1 = "Please enter a valid 10-digit phone number"
      }
      if (formData.phone_2 && !validatePhone(formData.phone_2)) {
        newErrors.phone_2 = "Please enter a valid 10-digit phone number"
      }
    }

    if (step === 2) {
      if (!formData.registration_no) newErrors.registration_no = "Medical registration number is required"
      if (!formData.qualifications) newErrors.qualifications = "Qualifications are required"
      if (!formData.medical_council_name) newErrors.medical_council_name = "Medical council name is required"
      if (!formData.year_of_experience && formData.year_of_experience !== 0) newErrors.year_of_experience = "Years of experience is required"
      if (!formData.specialization) newErrors.specialization = "Specialization is required"
    }

    if (step === 3) {
      if (formData.selectedHospital === "0") {
        if (!formData.hospital_name) newErrors.hospital_name = "Hospital name is required"
        if (!formData.address_1) newErrors.address_1 = "Address is required"
        if (!formData.stateId) newErrors.stateId = "State is required"
        if (!formData.district_Id) newErrors.district_Id = "District is required"
      } else if (!formData.selectedHospital) {
        // If no hospital is selected at all
        newErrors.selectedHospital = "Please select a hospital"
      }
      if (!formData.fees && formData.fees !== 0) newErrors.fees = "Consultation fees is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getStatesList`)
        const data = await res.json()
        setStates(data)
      } catch (err) {
        console.error(err)
        alert("Failed to load states.")
      } finally {
        setLoadingStates(false)
      }
    }
    fetchStates()
  }, [])

  // Fetch districts
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.stateId) return
      setLoadingDistricts(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDistrictsList?stateId=${formData.stateId}`)
        const data = await res.json()
        setDistricts(data)
      } catch (err) {
        console.error(err)
        alert("Failed to load districts.")
      } finally {
        setLoadingDistricts(false)
      }
    }
    fetchDistricts()
  }, [formData.stateId])

  // Fetch specializations
  useEffect(() => {
    const fetchSpecializations = async () => {
      setLoadingSpecializations(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getSpecializations`)
        const data = await res.json()
        setSpecializations(data)
      } catch (err) {
        console.error(err)
        alert("Failed to load specializations.")
      } finally {
        setLoadingSpecializations(false)
      }
    }
    fetchSpecializations()
  }, [])

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      setLoadingHospitals(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getHospitalList`)
        const data = await res.json()
        setHospitals(data)
      } catch (err) {
        console.error(err)
        alert("Failed to load hospitals.")
      } finally {
        setLoadingHospitals(false)
      }
    }
    fetchHospitals()
  }, [])

  // handle change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // If appointment availability is unchecked, also uncheck the online fees option
    if (name === "is_appointment" && !checked) {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        is_fees_online: false
      }))
    } else if (name === "selectedHospital") {
      // When hospital selection changes
      const hospitalId = value;
      setFormData(prev => ({
        ...prev,
        [name]: hospitalId,
        hospital_id: hospitalId === "0" ? 0 : parseInt(hospitalId)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }))
    }
  }

  // next step validation
  const nextStep = () => {
    if (!validateFields()) {
      return
    }

    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.gender) {
        alert("Please fill all required fields")
        return
      }
    }
    if (step === 2) {
      if (!formData.specialization || !formData.registration_no || !formData.qualifications ||
        !formData.medical_council_name || (formData.year_of_experience === "")) {
        alert("Please fill all required fields")
        return
      }
    }
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  // submit API
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Final validation
    if (!validateFields()) {
      alert("Please fix the validation errors before submitting.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/registerDoctor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "*/*"
        },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.status) {

        sessionStorage.setItem("userId", data.data.doctorId)
        sessionStorage.setItem("userName", formData.name)
        sessionStorage.setItem('userRole', '2') // Role 2 = Doctor

        router.push('/doctor/dashboard');
      } else {
        alert(data.message || "Registration failed")
      }
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#2c96fc] mb-2">Doctor Registration</h1>
            <p className="text-gray-600">Complete your profile in 3 simple steps</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-4 left-0 right-0 h-1.5 bg-gray-200 -z-10 rounded-full">
                <div
                  className="h-1.5 bg-[#2c96fc] transition-all duration-500 rounded-full"
                  style={{ width: `${(step - 1) * 50}%` }}
                ></div>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= i ? "bg-[#2c96fc] text-white" : "bg-gray-200 text-gray-500"
                      } font-semibold transition-colors duration-300`}
                  >
                    {i}
                  </div>
                  <span
                    className={`text-sm mt-2 ${step === i ? "font-medium text-[#2c96fc]" : "text-gray-500"
                      }`}
                  >
                    {i === 1 ? "Basic Info" : i === 2 ? "Professional Info" : "Hospital/Clinic Info"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      name="name"
                      value={formData.name}
                      placeholder="Dr. John Doe"
                      className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      placeholder="1234567890"
                      type="tel"
                      maxLength="10"
                      className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      placeholder="your.email@example.com"
                      className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      placeholder="Create a strong password"
                      className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      className={`w-full px-4 py-3 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Days to book Appointment</label>
                    <input
                      name="daysToBookAppointment"
                      type="number"
                      value={formData.daysToBookAppointment}
                      min="0"
                      className={`w-full px-4 py-3 border ${errors.daysToBookAppointment ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                    />
                    {errors.daysToBookAppointment && <p className="text-red-500 text-xs mt-1">{errors.daysToBookAppointment}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Days to book Token</label>
                    <input
                      name="daysToBookToken"
                      type="number"
                      value={formData.daysToBookToken}
                      min="0"
                      className={`w-full px-4 py-3 border ${errors.daysToBookToken ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                    />
                    {errors.daysToBookToken && <p className="text-red-500 text-xs mt-1">{errors.daysToBookToken}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fees (₹) *</label>
                    <input
                      name="fees"
                      type="number"
                      value={formData.fees}
                      placeholder="500"
                      min="0"
                      className={`w-full px-4 py-3 border ${errors.fees ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.fees && <p className="text-red-500 text-xs mt-1">{errors.fees}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Average Consultation Time (mins)</label>
                    <input
                      name="avgConsultMins"
                      type="number"
                      value={formData.avgConsultMins}
                      placeholder="20"
                      min="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Off Day</label>
                    <select
                      name="weekOff"
                      value={formData.weekOff}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      onChange={handleChange}
                    >
                      <option value="Sunday">Sunday</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </div>

                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">Professional Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medical Registration No *</label>
                    <input
                      name="registration_no"
                      value={formData.registration_no}
                      placeholder="Medical license number"
                      className={`w-full px-4 py-3 border ${errors.registration_no ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.registration_no && <p className="text-red-500 text-xs mt-1">{errors.registration_no}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications *</label>
                    <input
                      name="qualifications"
                      value={formData.qualifications}
                      placeholder="MD, MBBS, etc."
                      className={`w-full px-4 py-3 border ${errors.qualifications ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.qualifications && <p className="text-red-500 text-xs mt-1">{errors.qualifications}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medical Council Name *</label>
                    <input
                      name="medical_council_name"
                      value={formData.medical_council_name}
                      placeholder="Governing council name"
                      className={`w-full px-4 py-3 border ${errors.medical_council_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.medical_council_name && <p className="text-red-500 text-xs mt-1">{errors.medical_council_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                    <input
                      name="year_of_experience"
                      value={formData.year_of_experience}
                      placeholder="Number of years"
                      type="number"
                      min="0"
                      className={`w-full px-4 py-3 border ${errors.year_of_experience ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    />
                    {errors.year_of_experience && <p className="text-red-500 text-xs mt-1">{errors.year_of_experience}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      className={`w-full px-4 py-3 border ${errors.specialization ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Specialization</option>
                      {specializations.map(spec => (
                        <option key={spec.id} value={spec.name}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                    {loadingSpecializations && <p className="text-xs text-gray-500 mt-1">Loading specializations...</p>}
                    {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub Specialization</label>
                    <input
                      name="sub_specialization"
                      value={formData.sub_specialization}
                      placeholder="Pediatric Cardiology, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">About Yourself</label>
                    <textarea
                      name="about"
                      value={formData.about}
                      placeholder="Brief professional summary..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors h-24"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">Hospital/Clinic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Hospital *</label>
                    <select
                      name="selectedHospital"
                      value={formData.selectedHospital}
                      className={`w-full px-4 py-3 border ${errors.selectedHospital ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                      onChange={handleChange}
                      disabled={loadingHospitals}
                      required
                    >
                      <option value="">Select Hospital</option>
                      {hospitals.map(hospital => (
                        <option key={hospital.id} value={hospital.hospital_id}>
                          {hospital.hospital_name}
                        </option>
                      ))}
                      <option value="0">Other (Add New Hospital)</option>
                    </select>
                    {loadingHospitals && <p className="text-xs text-gray-500 mt-1">Loading hospitals...</p>}
                    {errors.selectedHospital && <p className="text-red-500 text-xs mt-1">{errors.selectedHospital}</p>}
                  </div>

                  {/* Show hospital details form only when "Other" is selected */}
                  {formData.selectedHospital === "0" && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
                        <input
                          name="hospital_name"
                          value={formData.hospital_name}
                          placeholder="General Hospital"
                          className={`w-full px-4 py-3 border ${errors.hospital_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                          onChange={handleChange}
                        />
                        {errors.hospital_name && <p className="text-red-500 text-xs mt-1">{errors.hospital_name}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                        <input
                          name="address_1"
                          value={formData.address_1}
                          placeholder="Street address"
                          className={`w-full px-4 py-3 border ${errors.address_1 ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                          onChange={handleChange}
                        />
                        {errors.address_1 && <p className="text-red-500 text-xs mt-1">{errors.address_1}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                        <input
                          name="address_2"
                          value={formData.address_2}
                          placeholder="Apartment, suite, etc."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                        <select
                          name="stateId"
                          value={formData.stateId}
                          className={`w-full px-4 py-3 border ${errors.stateId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                          onChange={handleChange}
                          disabled={loadingStates}
                        >
                          <option value="">Select State</option>
                          {states.map(state => (
                            <option key={state.stateId} value={state.stateId}>
                              {state.stateName}
                            </option>
                          ))}
                        </select>
                        {loadingStates && <p className="text-xs text-gray-500 mt-1">Loading states...</p>}
                        {errors.stateId && <p className="text-red-500 text-xs mt-1">{errors.stateId}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                        <select
                          name="district_Id"
                          value={formData.district_Id}
                          className={`w-full px-4 py-3 border ${errors.district_Id ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                          onChange={handleChange}
                          disabled={loadingDistricts || !formData.stateId}
                        >
                          <option value="">Select District</option>
                          {districts.map(district => (
                            <option key={district.districtId} value={district.districtId}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                        {loadingDistricts && <p className="text-xs text-gray-500 mt-1">Loading districts...</p>}
                        {!formData.stateId && !loadingDistricts && (
                          <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                        )}
                        {errors.district_Id && <p className="text-red-500 text-xs mt-1">{errors.district_Id}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                        <input
                          name="landmark"
                          value={formData.landmark}
                          placeholder="Nearby prominent location"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone 1</label>
                        <input
                          name="phone_1"
                          value={formData.phone_1}
                          placeholder="Alternate phone number"
                          type="tel"
                          maxLength="10"
                          className={`w-full px-4 py-3 border ${errors.phone_1 ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                          onChange={handleChange}
                        />
                        {errors.phone_1 && <p className="text-red-500 text-xs mt-1">{errors.phone_1}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone 2</label>
                        <input
                          name="phone_2"
                          value={formData.phone_2}
                          placeholder="Another alternate phone"
                          type="tel"
                          maxLength="10"
                          className={`w-full px-4 py-3 border ${errors.phone_2 ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                          onChange={handleChange}
                        />
                        {errors.phone_2 && <p className="text-red-500 text-xs mt-1">{errors.phone_2}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Landline</label>
                        <input
                          name="landline"
                          value={formData.landline}
                          placeholder="Landline number"
                          type="tel"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}


                  <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 py-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_token"
                        checked={formData.is_token}
                        onChange={handleChange}
                        className="w-5 h-5 text-[#2c96fc] rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">Token Available</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_appointment"
                        checked={formData.is_appointment}
                        onChange={handleChange}
                        className="w-5 h-5 text-[#2c96fc] rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">Appointment Available</span>
                    </label>
                  </div>

                  {/* Online Fees Payment Option - Only show if appointment is available */}
                  {formData.is_appointment && (
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_fees_online"
                          checked={formData.is_fees_online}
                          onChange={handleChange}
                          className="w-5 h-5 text-[#2c96fc] rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">Consultation Fees Paid Online</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-8">
                        Check this if patients can pay consultation fees online when booking appointments
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NAVIGATION */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-[#2c96fc] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Complete Registration"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}