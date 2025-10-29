"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/footer/footer";
import Swal from "sweetalert2";
import DateDisplay from "@/components/common/DateDisplay";

export default function DoctorCoinsPage() {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [history, setHistory] = useState([]);
  const [buyCoins, setBuyCoins] = useState(100);
  const [buying, setBuying] = useState(false);

  const router = useRouter();
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;
  const userName = typeof window !== "undefined" ? sessionStorage.getItem("userName") : null;

  useEffect(() => {
    if (!userId) {
      router.push("/login");
      return;
    }
    fetchDoctorData();
    fetchWallet();
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

  const fetchWallet = async () => {
    try {
      const bal = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getCoinBalance?doctorId=${userId}`);
      const balJson = await bal.json();
      setCoins(balJson.data.coinBalance);

      const hist = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getCoinsUsageHistory?doctorId=${userId}`);
      
      const histJson = await hist.json();
      setHistory(histJson);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const handleBuyCoins = async () => {
    if (buyCoins <= 0) return;
    setBuying(true);

    try 
    {
      const amount = buyCoins * 100;

      console.log("🔄 Creating Razorpay order for coins with amount:", amount, "paise");

      const orderResponse = await fetch(`/api/create-razorpay-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            'purchaseType': 'coins',
            doctor_id: userId
          }
        })
      });

      //const order = await orderRes.json();

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

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResult.data.amount.toString(),
        currency: orderResult.data.currency,
        name: "Oneclickhelp",
        order_id: orderId,
        handler: async function (response) {
        console.log("💰 Payment successful:", response);

        try 
        {
          const purchaseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/purchase-subscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              doctorId: userId,
              coins: buyCoins,
              transactionId: response.razorpay_payment_id
            })
          });

          const result = await purchaseRes.json();

          if (result?.status || purchaseRes.ok) {
            // ✅ Success Animation
            await Swal.fire({
              title: "🎉 Payment Successful!",
              html: `<p class='text-gray-700'>You have successfully purchased <b>${buyCoins} Coins</b>.</p>`,
              icon: "success",
              confirmButtonText: "OK",
              confirmButtonColor: "#2563eb",
              timer: 4000,
              timerProgressBar: true,
            });

            // Reset and refresh balance
            setBuyCoins(100);
            fetchWallet();
          } else {
            Swal.fire("⚠ Something went wrong", "Your payment was captured, but coins could not be credited. Please contact support.", "warning");
          }

        } catch (err) {
          console.error("❌ Error crediting coins:", err);
          Swal.fire("Error", "Coins could not be credited. Please contact support.", "error");
        }

        setBuying(false);
      },
        theme: { color: '#3399cc' },
        modal: {
          ondismiss: function () {
            setBuying(false);
            Swal.fire(
              "Payment Cancelled",
              "You cancelled the payment before completing it.",
              "info"
            );
          }
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response) {
      console.error("❌ Payment failed:", response.error);
      setBuying(false);
      Swal.fire(
        "Payment Failed",
        response.error.description || "Payment failed. Please try again.",
        "error"
      );
    });

      razorpay.open();
    } catch (error) {
          console.error("💥 Payment initiation failed:", error);
          setBuying(false);
          Swal.fire(
            "Payment Error",
            error.message || "Failed to initialize payment. Please try again.",
            "error"
          );
        }

    setBuying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

//   const getTimeAgo = (dateString) => {
//   const date = new Date(dateString);
//   const now = new Date();
//   const diffMs = now - date;

//   const seconds = Math.floor(diffMs / 1000);
//   const minutes = Math.floor(seconds / 60);
//   const hours = Math.floor(minutes / 60);
//   const days = Math.floor(hours / 24);

//   if (seconds < 60) return "just now";
//   if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
//   if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
//   if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

//   // If more than 7 days, return formatted date
//   return date.toLocaleDateString(undefined, {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };


  return (
  <div className="min-h-screen flex flex-col bg-gray-50">
    {/* HEADER */}
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
        </Link>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">Dr. {userName}</p>
          <p className="text-xs text-blue-500">{doctorData?.doctorProfDetails?.specialization || "Doctor"}</p>
        </div>
      </div>
    </header>

    {/* MAIN */}
    <main className="flex-grow">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Back link */}
        <Link href="/doctor/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Wallet Summary */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coin Wallet</h1>
              <p className="text-gray-500 text-sm">Manage your OneClickHelp wallet coins.</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-green-600">{coins}</p>
              <p className="text-sm text-gray-600">Available Coins</p>
            </div>
          </div>
          {coins < 10 && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              ⚠ Low balance! Please recharge soon.
            </div>
          )}
        </div>

        {/* Buy Coins */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
          {/* Left: Title with Icon */}
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            {/* Rupee Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* Outer coin circle */}
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />

              {/* ₹ symbol */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 8h6M9 11h6M9 8c1.5 0 3 1 3 3s-1.5 3-3 3h3m-3 0l3 3"
              />
            </svg>
            Buy Coins
          </h2>

          {/* Right: Conversion Info */}
          <p className="text-xs text-gray-500 mt-1 sm:mt-0">₹1 = 1 Coin</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={buyCoins}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1 || e.target.value === "") setBuyCoins(value);
              }}
              className="border border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter coins"
              min="1"
            />
          </div>

          <button
            onClick={handleBuyCoins}
            disabled={buying || buyCoins < 1}
            className={`w-full sm:w-auto py-2 px-5 rounded-md text-white font-medium ${
              buying
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {buying ? "Processing..." : `Buy ${buyCoins} Coins`}
          </button>
        </div>
      </div>


        {/* Usage History */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Coins Usage History</h2>

          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-6">No history found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-t border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 font-semibold text-blue-600">Date</th>
                    <th className="px-3 py-2 font-semibold text-blue-600">Action</th>
                    <th className="px-3 py-2 font-semibold text-blue-600">Patient</th>
                    <th className="px-3 py-2 font-semibold text-blue-600">Coins Used</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2"><DateDisplay date={item.usedOn} /></td>
                      {/* <td className="px-3 py-2 text-gray-800">
                        <div className="flex flex-col">
                          <span>
                            {new Date(item.usedOn).toLocaleString(undefined, {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          <span className="text-xs text-gray-500 italic">{getTimeAgo(item.usedOn)}</span>
                        </div>
                      </td> */}

                      <td className="px-3 py-2">{item.actionType}</td>
                      <td className="px-3 py-2">{item.patientName}</td>
                      <td className="px-3 py-2 font-medium text-green-600">{item.coinUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>

    <Footer />
  </div>
);
}
