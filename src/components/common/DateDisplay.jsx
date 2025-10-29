"use client";
import React from "react";

const DateDisplay = ({ date }) => {
  if (!date) return <span className="text-gray-500 italic">N/A</span>;

  // 🕐 Step 1: Parse DB UTC date correctly
  // Append 'Z' → ensures JS treats it as UTC (not local)
  const utcDate = new Date(date.endsWith("Z") ? date : date + "Z");

  // 🧭 Step 2: Detect user's local timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 🗓 Step 3: Format date in user's local time
  const formatted = utcDate.toLocaleString("en-GB", {
    timeZone: userTimeZone, // auto-detect user’s time zone (e.g., Asia/Kolkata)
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // ⏳ Step 4: "time ago" helper
  const getTimeAgo = (givenDate) => {
    const localDate = new Date(givenDate.endsWith("Z") ? givenDate : givenDate + "Z");
    const now = new Date();
    const diffMs = now - localDate;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    return localDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col">
      <span className="text-gray-800">{formatted}</span>
      <span className="text-xs text-gray-500 italic">{getTimeAgo(date)}</span>
    </div>
  );
};

export default DateDisplay;