"use client"

import { useState, useEffect, useMemo } from "react"
import styles from "./styles/doctorCards.module.scss"
import { redirect } from "next/navigation"

export default function DoctorCards({ districtId, locationName = "" }) {
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    gender: "",
    specialization: "",
    name: "",
    experience: "",
    stories: "",
    sort: "relevance",
  })

  // UI state
  const [showAllFilters, setShowAllFilters] = useState(false) // desktop "All Filters" dropdown
  const [showMobileFilters, setShowMobileFilters] = useState(false) // mobile sidebar

  // Available specializations
  const [specializations, setSpecializations] = useState([])

  useEffect(() => {
    if (!districtId) {
      setDoctors([])
      setFilteredDoctors([])
      return
    }

    const fetchDoctors = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(
          `https://api.oneclickhelp.in/api/getDoctorsByDistrict?districtId=${districtId}`,
          { cache: "no-store" }
        )
        if (!res.ok) throw new Error("Failed to fetch doctors")
        const data = await res.json()
        const arr = Array.isArray(data) ? data : []
        setDoctors(arr)

        const uniqueSpecs = [
          ...new Set(
            arr.map((d) => d?.doctorProfDetails?.specialization).filter(Boolean)
          ),
        ]
        setSpecializations(uniqueSpecs)
      } catch (err) {
        setError(err.message || "Something went wrong")
        setDoctors([])
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [districtId])

  const visibleDoctors = useMemo(() => {
    let result = [...doctors]

    // Gender
    if (filters.gender) {
      result = result.filter(
        (d) => (d?.gender || "").toLowerCase() === filters.gender.toLowerCase()
      )
    }

    // Patient stories % — check multiple possible fields
    if (filters.stories) {
      const minPct = parseInt(filters.stories, 10)
      result = result.filter((d) => {
        const pct =
          parseInt(
            d?.patientStoriesPercentage ??
              d?.positive_reviews_percent ??
              d?.rating_percent ??
              "0",
            10
          ) || 0
        return pct >= minPct
      })
    }

    // Experience
    if (filters.experience) {
      const minYears = parseInt(filters.experience, 10)
      result = result.filter((d) => {
        const yrs = parseInt(d?.doctorProfDetails?.year_of_experience ?? "0", 10) || 0
        return yrs >= minYears
      })
    }

    // Specialization
    if (filters.specialization) {
      result = result.filter(
        (d) => (d?.doctorProfDetails?.specialization || "") === filters.specialization
      )
    }

    // Name
    if (filters.name) {
      const t = filters.name.toLowerCase()
      result = result.filter((d) => (d?.name || "").toLowerCase().includes(t))
    }

    // Sort
    if (filters.sort === "experience") {
      result.sort(
        (a, b) =>
          (parseInt(b?.doctorProfDetails?.year_of_experience ?? "0", 10) || 0) -
          (parseInt(a?.doctorProfDetails?.year_of_experience ?? "0", 10) || 0)
      )
    } else if (filters.sort === "feesLow") {
      result.sort((a, b) => (parseInt(a?.fees ?? "0", 10) || 0) - (parseInt(b?.fees ?? "0", 10) || 0))
    } else if (filters.sort === "feesHigh") {
      result.sort((a, b) => (parseInt(b?.fees ?? "0", 10) || 0) - (parseInt(a?.fees ?? "0", 10) || 0))
    }
    // relevance -> no-op

    return result
  }, [doctors, filters])

  useEffect(() => {
    setFilteredDoctors(visibleDoctors)
  }, [visibleDoctors])

  const handleFilterChange = (name, value) => {
    setFilters((p) => ({ ...p, [name]: value }))
  }

  const clearAllFilters = () => {
    setFilters({
      gender: "",
      specialization: "",
      name: "",
      experience: "",
      stories: "",
      sort: "relevance",
    })
  }

  const handleGetToken = (doctor) => {
    redirect("/book/" + (doctor?.doctorId ?? doctor?.id))
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
     
      {/* Mobile filter button (only visible on small screens) */}
      <div className={styles.mobileFilterToggle}>
        <button
          className={styles.filterToggleBtn}
          onClick={() => setShowMobileFilters(true)}
          aria-label="Open filters"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.66667 12H9.33333V10.6667H6.66667V12ZM0 4V5.33333H16V4H0ZM2.66667 8.66667H13.3333V7.33333H2.66667V8.66667Z" fill="currentColor" />
          </svg>
          Filters
          {(filters.gender || filters.specialization || filters.name || filters.experience || filters.stories) && (
            <span className={styles.filterIndicator}></span>
          )}
        </button>

        <div className={styles.mobileResultsCount}>
          Showing {filteredDoctors.length} of {doctors.length}
        </div>
      </div>

 {/* Desktop filter bar */}
 {doctors.length > 0 && (
        <div className={styles.filterBarWrap}>
          <div className={styles.filterBar}>
            <div className={styles.filterChip}>
              <span className={styles.chipLabel}>Gender</span>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className={styles.chipSelect}
                aria-label="Gender"
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className={styles.filterChip}>
              <span className={styles.chipLabel}>Specialization</span>
                    <select
                      id="specFilter"
                      value={filters.specialization}
                      className={styles.chipSelect}
                      onChange={(e) => handleFilterChange("specialization", e.target.value)}
                    >
                      <option value="">All</option>
                      {specializations.map((s, i) => (
                        <option key={i} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
            </div>

            <div className={styles.filterChip}>
              <span className={styles.chipLabel}>Doctor name</span>
                    <input
                      id="nameFilter"
                      type="text"
                      placeholder="Search by name"
                      value={filters.name}
                      className={styles.chipInput}
                      onChange={(e) => handleFilterChange("name", e.target.value)}
                    />
            </div>

            

            <div className={styles.filterChip}>
              <span className={styles.chipLabel}>Experience</span>
              <select
                value={filters.experience}
                onChange={(e) => handleFilterChange("experience", e.target.value)}
                className={styles.chipSelect}
                aria-label="Experience"
              >
                <option value="">Any</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
                <option value="15">15+ years</option>
                <option value="20">20+ years</option>
              </select>
            </div>


          </div>
        </div>
      )}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Available Doctors
        </h1>
        <p className={styles.subtitle}>Get tokens instantly & book with trusted doctors</p>
      </div>

     

      {/* Mobile sidebar overlay */}
      {showMobileFilters && (
        <>
          <div className={styles.mobileFiltersPanel}>
            <div className={styles.filtersHeader}>
              <h3>Filter Doctors</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className={styles.closeFiltersBtn}
                aria-label="Close filters"
              >
                &times;
              </button>
            </div>

            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label htmlFor="mobile-name-filter">Doctor Name</label>
                <input
                  id="mobile-name-filter"
                  type="text"
                  placeholder="Search by name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="mobile-spec-filter">Specialization</label>
                <select
                  id="mobile-spec-filter"
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange("specialization", e.target.value)}
                >
                  <option value="">All</option>
                  {specializations.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="mobile-gender-filter">Gender</label>
                <select
                  id="mobile-gender-filter"
                  value={filters.gender}
                  onChange={(e) => handleFilterChange("gender", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="mobile-experience-filter">Experience</label>
                <select
                  id="mobile-experience-filter"
                  value={filters.experience}
                  onChange={(e) => handleFilterChange("experience", e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="5">5+ years</option>
                  <option value="10">10+ years</option>
                  <option value="15">15+ years</option>
                  <option value="20">20+ years</option>
                </select>
              </div>


              {/* <div className={styles.filterGroup}>
                <label htmlFor="mobile-sort">Sort By</label>
                <select
                  id="mobile-sort"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="experience">Experience</option>
                  <option value="feesLow">Fee (Low to High)</option>
                  <option value="feesHigh">Fee (High to Low)</option>
                </select>
              </div> */}
            </div>

            <div className={styles.filterActions}>
              <button className={styles.clearFiltersBtn} onClick={clearAllFilters}>
                Clear All Filters
              </button>
              <button className={styles.applyFiltersBtn} onClick={() => setShowMobileFilters(false)}>
                Apply Filters
              </button>
            </div>
          </div>

          <div className={styles.overlay} onClick={() => setShowMobileFilters(false)}></div>
        </>
      )}

      {/* Results / cards */}
      {filteredDoctors.length === 0 ? (
        <div className={styles.noDoctors}>
          <p>No doctors available in the selected city</p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {filteredDoctors.map((doctor) => {
            const exp = doctor?.doctorProfDetails?.year_of_experience
            const spec = doctor?.doctorProfDetails?.specialization
            const qual = doctor?.doctorProfDetails?.qualifications
            const pct =
              parseInt(
                doctor?.patientStoriesPercentage ??
                  doctor?.positive_reviews_percent ??
                  doctor?.rating_percent ??
                  "0",
                10
              ) || null

            return (
              <div key={doctor.id ?? doctor.doctorId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.photoContainer}>
                    {doctor?.photo_url ? (
                      <img
                        src={`https://api.oneclickhelp.in${doctor.photo_url}`}
                        alt={`${doctor?.name ?? "Doctor"} photo`}
                        className={styles.doctorPhoto}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {(doctor?.name || "D").charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className={styles.doctorInfo}>
                    <h3 className={styles.doctorName}>Dr. {doctor?.name}</h3>
                    <p className={styles.specialty}>{spec}</p>
                    <p className={styles.qualifications}>
                      {qual} • {doctor?.gender}
                    </p>
                    <p className={styles.experience}>{exp} years experience</p>

                    {pct !== null && (
                      <div className={styles.storyBadge}>
                        <span className={styles.storyPct}>{pct}%</span>
                        <span className={styles.storyText}>Patient Stories</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.feesContainer}>
                    <span className={styles.feesLabel}>Consultation Fee:</span>
                    <span className={styles.fees}>₹{doctor?.fees}</span>
                  </div>

                  <div className={styles.hospitalContainer}>
                    <span className={styles.hospitalName}>
                      {doctor?.hospitalDetails?.hospital_name}
                    </span>
                    <p className={styles.hospitalAddress}>
                      {doctor?.hospitalDetails?.address_1}
                      {doctor?.hospitalDetails?.landmark ? `, ${doctor.hospitalDetails.landmark}` : ""}
                    </p>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    onClick={() => handleGetToken(doctor)}
                    className={styles.tokenButton}
                  >
                    {doctor?.is_token ? "Get Token" : "Get Appointment"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
