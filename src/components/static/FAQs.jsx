"use client";
import { useState } from "react";
import Head from "next/head";

const faqs = [
  {
    category: "General",
    items: [
      {
        q: "What is OneClickHelp.in?",
        a: "OneClickHelp.in is an online platform that allows patients to book appointments with doctors across various specialties. It offers a fast and convenient way to secure OPD tokens and schedule consultations.",
      },
      {
        q: "How do I book an appointment?",
        a: "Simply visit www.oneclickhelp.in, search for your doctor or specialty, select your preferred date and time, and follow the booking process to confirm.",
      },
    ],
  },
  {
    category: "Booking & Tokens",
    items: [
      {
        q: "What is a token and how does it work?",
        a: "A token is your place in the consultation queue. After booking, you'll receive a token number via SMS or email that you can present during your visit.",
      },
      {
        q: "Can I book appointments for someone else?",
        a: "Yes, you can book an appointment on behalf of a family member or friend. Just fill in their details during the booking process.",
      },
      {
        q: "Will I get a confirmation of my appointment?",
        a: "Yes, you will receive a confirmation via SMS and email with your token number, doctor's details, and appointment time.",
      },
    ],
  },
  {
    category: "Cancellation & Refunds",
    items: [
      {
        q: "How can I cancel an appointment?",
        a: "To cancel, send an email to info@oneclickhelp.in at least 2 hours before the scheduled consultation, including your name, booking number, and doctor's details.",
      },
      {
        q: "Am I eligible for a refund if I cancel?",
        a: "Yes, full refunds are issued if cancellation is made at least 2 hours in advance or if the doctor cancels the consultation.",
      },
      {
        q: "How long does it take to get a refund?",
        a: "Refunds are typically processed within 5–6 business days after approval.",
      },
    ],
  },
  {
    category: "Doctor & Services",
    items: [
      {
        q: "How do I find the right doctor?",
        a: "You can search by name, specialty, city, or hospital to find a doctor that suits your needs. You can also view their profiles, ratings, and available time slots.",
      },
      {
        q: "Are virtual consultations available?",
        a: "We are working to enable online consultations soon. Please stay tuned for updates.",
      },
    ],
  },
  {
    category: "Support & Safety",
    items: [
      {
        q: "Is my personal information secure?",
        a: "Yes, we use advanced security protocols to ensure your personal data is protected and only shared with the selected doctor.",
      },
      {
        q: "What if I face issues during booking?",
        a: "If you face any issues or need help, feel free to reach out to our support team at info@oneclickhelp.in.",
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggle = (sectionIndex, itemIndex) => {
    const id = `${sectionIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>
      <Head>
        <title>FAQs - OneClickHelp.in</title>
        <meta name="description" content="Frequently asked questions about booking doctor appointments through OneClickHelp.in" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about booking appointments, cancellations, and more.
            </p>
          </div>

          {/* FAQ Content */}
          <div className="space-y-8">
            {faqs.map((section, sectionIndex) => (
              <div key={section.category} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Category Header */}
                <div className="bg-blue-600 p-4">
                  <h2 className="text-xl font-semibold text-white">
                    {section.category}
                  </h2>
                </div>
                
                {/* FAQ Items */}
                <div className="divide-y divide-gray-100">
                  {section.items.map((faq, itemIndex) => {
                    const id = `${sectionIndex}-${itemIndex}`;
                    const isOpen = openItems[id];
                    
                    return (
                      <div key={id} className="p-5">
                        <button
                          onClick={() => toggle(sectionIndex, itemIndex)}
                          className="flex justify-between items-center w-full text-left font-medium text-gray-900 group"
                          aria-expanded={isOpen}
                        >
                          <span className="text-lg font-medium group-hover:text-blue-600 transition-colors">
                            {faq.q}
                          </span>
                          <span className="ml-4 flex-shrink-0 text-blue-600 text-xl font-bold">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        
                        {isOpen && (
                          <div className="mt-4 pl-2">
                            <div className="border-l-4 border-blue-500 pl-4">
                              <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        
        </div>
      </div>
    </>
  );
}