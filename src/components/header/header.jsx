"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import styles from "./styles/header.module.scss"

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userName, setUserName] = useState(null)
  const [userId, setUserId] = useState(null)
  const [roleId, setRoleId] = useState(null)
  const router = useRouter()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId')
    const storedUserName = sessionStorage.getItem('userName')
    const storedRoleId = sessionStorage.getItem('userRole')

    if (storedUserId && storedUserName) {
      setUserId(storedUserId)
      setUserName(storedUserName)
      setRoleId(storedRoleId)
    }
    
    // Add click outside listener
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleLogout = () => {
    console.log('Logging out')
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('userName')
    sessionStorage.removeItem('userRole')
    setUserId(null)
    setUserName(null)
    setRoleId(null)
    setIsDropdownOpen(false)
    router.push('/')
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}><img src="/logo.png" className="w-30" /></span>
          </Link>
        </div>

        <div className={styles.userSection} ref={dropdownRef}>
          <div className={styles.userActions}>

            {userName ? (
              <>

                {roleId === '2' ? (
                  <Link
                    className={styles.doctorLoginButton}
                    href="/login"
                  >
                    For Patient
                  </Link>
                ) : (
                  <Link
                    className={styles.doctorLoginButton}
                    href="/doctor/login"
                  >
                    For Doctor
                  </Link>
                )}

                <button
                  className={styles.userButton}
                  onClick={toggleDropdown}
                >
                  <span className={styles.userName}>
                    {userName}
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  className={styles.doctorLoginButton}
                  href="/doctor/login"
                >
                  For Doctor
                </Link>

                <Link
                  href="/login"
                  className={styles.userButton}
                >
                  <span className={styles.userName}>
                    For Patient
                  </span>
                </Link>
              </>
            )}

          </div>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              {userId ? (
                <>
                  <Link href={roleId == '2' ? "/doctor/dashboard" : "/user/dashboard"} className={styles.dropdownItem}>
                    View Dashboard
                  </Link>
                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/" className={styles.dropdownItem}>
                  My Appointment
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}