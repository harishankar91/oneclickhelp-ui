"use client"

import { useEffect, useState } from "react"
import styles from "./styles/homeForm.module.scss"

export default function HomeForm({ onDistrictSelect }) {
  const [states, setStates] = useState([{ id: "", name: "Select State" }])
  const [districts, setDistricts] = useState([{ id: "", name: "Select City" }])
  const [selectedState, setSelectedState] = useState("8") // Default to Haryana (stateId 8)
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [loadingDistricts, setLoadingDistricts] = useState(true) // Start loading districts immediately
  const [error, setError] = useState(null)

  // Fetch States on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setError(null)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getStatesList`, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Keep only enabled states
        const enabledStates = Array.isArray(data) ? data.filter((s) => s.is_enable) : []

        const mappedStates = [
          { id: "", name: "Select State" },
          ...enabledStates.map((s) => ({ id: String(s.stateId), name: s.stateName })),
        ]

        setStates(mappedStates)

        // If current selectedState is not enabled (or empty), pick first enabled state (if any)
        const selectedStillEnabled =
          selectedState && enabledStates.some((s) => String(s.stateId) === String(selectedState))

        if (!selectedStillEnabled) {
          const fallback = mappedStates[1]?.id ?? ""
          setSelectedState(fallback)
          // Clear district selection and notify parent
          setSelectedDistrict("")
          onDistrictSelect(null)
        }
      } catch (err) {
        console.error("Failed to load states", err)
        setError("Failed to load states. Please try again later.")
        setStates([{ id: "", name: "Select State" }])
        setSelectedState("")
        setSelectedDistrict("")
        onDistrictSelect(null)
      }
    }

    fetchStates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  // Fetch Districts on state change (including initial load)
  useEffect(() => {
    if (!selectedState) {
      setDistricts([{ id: "", name: "Select City" }])
      setSelectedDistrict("")
      onDistrictSelect(null)
      setLoadingDistricts(false)
      return
    }

    const fetchDistricts = async () => {
      try {
        setLoadingDistricts(true)
        setError(null)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}api/getDistrictsList?stateId=${selectedState}`,
          {
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Keep only enabled districts
        const enabledDistricts = Array.isArray(data) ? data.filter((d) => d.is_enable) : []

        const mappedDistricts = [
          { id: "", name: "Select City" },
          ...enabledDistricts.map((d) => ({ id: String(d.districtId), name: d.districtName })),
        ]

        setDistricts(mappedDistricts)

        // Auto-select first enabled district if the state is default "8" and we have enabled ones
        if (String(selectedState) === "8" && enabledDistricts.length > 0) {
          const firstId = String(enabledDistricts[0].districtId)
          setSelectedDistrict(firstId)
          onDistrictSelect(firstId)
        } else {
          // if current selectedDistrict is not part of enabled list, clear it
          const stillValid =
            selectedDistrict && enabledDistricts.some((d) => String(d.districtId) === String(selectedDistrict))

          if (!stillValid) {
            setSelectedDistrict("")
            onDistrictSelect(null)
          }
        }
      } catch (err) {
        console.error("Failed to load districts", err)
        setError("Failed to load cities. Please try again.")
        setDistricts([{ id: "", name: "Select City" }])
        setSelectedDistrict("")
        onDistrictSelect(null)
      } finally {
        setLoadingDistricts(false)
      }
    }

    fetchDistricts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]) // when state changes

  // Handle district selection
  const handleDistrictChange = (e) => {
    const districtId = e.target.value
    setSelectedDistrict(districtId)
    onDistrictSelect(districtId)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <div className={styles.inputField}>
              <select
                id="state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className={styles.select}
                disabled={!!error}
              >
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputField}>
              <select
                id="district"
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className={styles.select}
                disabled={!selectedState || loadingDistricts || !!error}
              >
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
              {loadingDistricts && <div className={styles.loadingSpinner}></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
