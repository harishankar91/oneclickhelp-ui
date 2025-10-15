"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/footer/footer";

export default function ReminderPage() {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [patientName, setPatientName] = useState("");
  const [patientMobile, setPatientMobile] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [note, setNote] = useState("");

  const router = useRouter();
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;
  const userName = typeof window !== "undefined" ? sessionStorage.getItem("userName") : null;

  useEffect(() => {
    if (!userId) {
      router.push("/login");
      return;
    }
    fetchDoctorData();
  }, [userId, router]);

  const fetchDoctorData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorsByUserId?userId=${userId}`);
      const data = await response.json();
      setDoctorData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!patientName || !patientMobile || !followupDate) {
      setMessage({ type: "error", text: "Please fill all required fields." });
      return;
    }

    setSending(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        doctorId: doctorData?.doctorId,
        patientName,
        patientMobile,
        followupDate,
        note,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/sendFollowupReminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Reminder sent successfully!" });
        setPatientName("");
        setPatientMobile("");
        setFollowupDate("");
        setNote("");
      } else {
        setMessage({ type: "error", text: "Failed to send reminder to patient. Please try again." });
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      setMessage({ type: "error", text: "Error sending reminder. Please try again." });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </Link>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Dr. {userName}</p>
            <p className="text-xs text-gray-500">
              {doctorData?.doctorProfDetails?.specialization || "Doctor"}
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link
            href="/doctor/dashboard"
            className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back to Dashboard
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Follow-up Reminder
            </h1>
            <p className="text-gray-600 mb-6">
              Send a follow-up checkup reminder to your patient.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter patient name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={patientMobile}
                  onChange={(e) => setPatientMobile(e.target.value)}
                  maxLength={10}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Follow-up Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Please bring your old reports for review."
                />
              </div>

              <button
                onClick={handleSendReminder}
                disabled={sending}
                className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center ${
                  sending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {sending ? "Sending..." : "Send Reminder"}
              </button>

              {message.text && (
                <div
                  className={`mt-4 p-3 rounded-md text-center ${
                    message.type === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
