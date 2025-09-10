"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import styles from "./styles/header.module.scss"

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userName, setUserName] = useState(null)
  const [userId, setUserId] = useState(null)
  const [roleId, setRoleId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId')
    const storedUserName = sessionStorage.getItem('userName')
    const storedRoleId = sessionStorage.getItem('userRole')

    if (storedUserId && storedUserName) {
      setUserId(storedUserId)
      setUserName(storedUserName)
      setRoleId(storedRoleId)
    }
  }, [])

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('userName')
    sessionStorage.removeItem('userRole')
    setUserId(null)
    setUserName(null)
    setRoleId(null)
    closeDropdown()
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

        <div className={styles.userSection}>
          <div className={styles.userActions}>
            <Link
              className={styles.doctorLoginButton}
              href="/doctor/login">
              For Doctor
            </Link>

            {userName ? (
            <button
              className={styles.userButton}
              onClick={toggleDropdown}
              onBlur={() => setTimeout(closeDropdown, 150)}
            >
              <span className={styles.userName}>
                {userName}
              </span>
            </button>
            ) : (
            <Link href="/login"
              className={styles.userButton}
              onBlur={() => setTimeout(closeDropdown, 150)}
            >
              <span className={styles.userName}>
                For Patient
              </span>
            </Link>
            )}
          </div>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              {userId ? (
                <>
                  <Link href={roleId == '2' ? "/doctor/dashboard" : "/user/dashboard"} className={styles.dropdownItem} onClick={closeDropdown}>
                    View Dashboard
                  </Link>
                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/" className={styles.dropdownItem} onClick={closeDropdown}>
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