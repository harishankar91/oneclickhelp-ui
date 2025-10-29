"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/footer/footer";
import { useRouter } from "next/navigation";
import DateDisplay from "@/components/common/DateDisplay";

export default function ReminderHistoryPage() {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const router = useRouter();
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;
  const userName = typeof window !== "undefined" ? sessionStorage.getItem("userName") : null;

  useEffect(() => {
    if (!userId) {
      router.push("/login");
      return;
    }
    fetchDoctorData();

    // Get today's date
    const today = new Date();

    // Go back 7 days
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 7);

    // Convert to YYYY-MM-DD format for input[type="date"]
    const fromDate = pastDate.toISOString().split("T")[0];

    const toDate = today.toISOString().split("T")[0];

    setFromDate(fromDate);
    setToDate(toDate);

    //handleFetchReminders();

  }, [userId, router]);

  const fetchDoctorData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorsById?doctorId=${userId}`);
      const data = await response.json();
      setDoctorData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      setLoading(false);
    }
  };

  const handleFetchReminders = async () => {
    if (!fromDate || !toDate) {
      setMessage({ type: "error", text: "Please select both start and end dates." });
      return;
    }

    setFetching(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/get-Follow-up-reminder?doctorId=${userId}&fromDate=${fromDate}&toDate=${toDate}`
      );
      const result = await response.json();

      if (result.status) {
        setReminders(result.data || []);
        setMessage({ type: "success", text: "Reminders fetched successfully!" });
      } else {
        setReminders([]);
        setMessage({ type: "error", text: result.message || "No reminders found." });
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      setMessage({ type: "error", text: "Error fetching reminders. Please try again." });
    } finally {
      setFetching(false);
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
            <p className="text-xs text-blue-500">
              {doctorData?.doctorProfDetails?.specialization || "Doctor"}
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-4 py-8">
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
              Reminder History
            </h1>
            <p className="text-gray-600 mb-6">
              View reminders sent to your patients based on date range.
            </p>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFetchReminders}
                  disabled={fetching}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium cursor-pointer ${
                    fetching ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {fetching ? "Loading..." : "Fetch Reminders"}
                </button>
              </div>
            </div>

            {message.text && (
              <div
                className={`mb-4 p-3 rounded-md text-center ${
                  message.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Data Table */}
            {reminders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left text-blue-600">#</th>
                      <th className="px-4 py-2 border-b text-left text-blue-600">Patient Name</th>
                      <th className="px-4 py-2 border-b text-left text-blue-600">Phone Number</th>
                      {/* <th className="px-4 py-2 border-b text-left text-blue-600">Doctor</th> */}
                      <th className="px-4 py-2 border-b text-left text-blue-600">Sent On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b">{index + 1}</td>
                        <td className="px-4 py-2 border-b">{item.patientName}</td>
                        <td className="px-4 py-2 border-b">{item.patientPhone}</td>
                        {/* <td className="px-4 py-2 border-b">{item.doctorName}</td> */}
                        {/* <td className="px-4 py-2 border-b">{item.sentOn}</td> */}
                        <td className="px-4 py-2 border-b">
                          <DateDisplay date={item.sentOn} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !fetching && <p className="text-gray-500 text-center mt-4">No reminders found.</p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
