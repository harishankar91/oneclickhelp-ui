"use client";

import Link from "next/link";

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 mb-6">
                    About <span className="text-indigo-600">OneClickHelp</span>
                </h1>
                <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                    Making healthcare access simple, transparent, and stress-free
                </p>
            </section>

            {/* Mission Section */}
            <section className="max-w-7xl mx-auto mb-20">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="lg:w-1/2">
                        <h2 className="text-3xl font-bold text-indigo-800 mb-6">Our Mission</h2>
                        <blockquote className="text-xl italic text-indigo-700 border-l-4 border-indigo-500 pl-6 mb-8">
                            "To empower every patient with easy access to healthcare and enable doctors to serve better through digital innovation."
                        </blockquote>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Simplify Healthcare Access</h3>
                                <p className="text-gray-600">Make doctor appointments and OPD bookings convenient for everyone.</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Reduce Waiting Time</h3>
                                <p className="text-gray-600">Ensure patients spend more time with doctors, not in queues.</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Enhance Transparency</h3>
                                <p className="text-gray-600">Provide verified doctor details and reliable appointment schedules.</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Bridge the Gap</h3>
                                <p className="text-gray-600">Connect patients and doctors seamlessly through technology.</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <div className="justify-center flex">
                            <img
                                src="https://www.shutterstock.com/image-vector/male-doctor-smiling-happy-face-600nw-2481032615.jpg"
                                alt="Healthcare professionals using technology"
                                className="rounded-lg w-100"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* For Patients Section */}
            <section className="max-w-7xl mx-auto mb-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-indigo-800 mb-4">For Patients</h2>
                    <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                        With just a few clicks, patients can access comprehensive healthcare services
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-indigo-800 mb-4">Book Appointments</h3>
                        <p className="text-gray-600">Book appointments or OPD tokens with verified doctors effortlessly.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-indigo-800 mb-4">Real-time Updates</h3>
                        <p className="text-gray-600">Get real-time updates about your consultation schedule.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-lg transition-shadow">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-indigo-800 mb-4">Save Time</h3>
                        <p className="text-gray-600">Save valuable time by avoiding long waiting hours at hospitals and clinics.</p>
                    </div>
                </div>
            </section>

            {/* For Doctors Section */}
            <section className="max-w-7xl mx-auto mb-20">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="lg:w-1/2 order-2 lg:order-1">
                        <div className="justify-center flex">
                            <img
                                src="https://png.pngtree.com/png-vector/20230928/ourmid/pngtree-young-afro-professional-doctor-png-image_10148632.png"
                                alt="Doctor using digital platform"
                                className="rounded-lg w-100"
                            />
                        </div>
                    </div>
                    <div className="lg:w-1/2 order-1 lg:order-2">
                        <h2 className="text-3xl font-bold text-indigo-800 mb-6">For Healthcare Providers</h2>
                        <p className="text-lg text-gray-700 mb-6">
                            OneClickHelp makes it easier for doctors and healthcare providers to manage patient flow, improve efficiency, and deliver better care.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Streamlined patient management system</span>
                            </li>
                            <li className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Efficient scheduling and appointment tracking</span>
                            </li>
                            <li className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Digital tools to enhance patient care</span>
                            </li>
                            <li className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Reduced administrative workload</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-indigo-800 mb-4">Why Choose OneClickHelp?</h2>
                    <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                        We're committed to making healthcare accessible and stress-free for everyone
                    </p>
                </div>
                <div className="bg-indigo-700 text-white rounded-2xl p-8 md:p-12 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-start">
                            <div className="bg-indigo-600 p-3 rounded-lg mr-4 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Easy and quick doctor booking</h3>
                                <p className="text-indigo-100">Find and book appointments with verified doctors in just a few clicks.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-indigo-600 p-3 rounded-lg mr-4 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Verified doctor details</h3>
                                <p className="text-indigo-100">Access comprehensive and verified information about healthcare providers.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-indigo-600 p-3 rounded-lg mr-4 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Real-time token tracking</h3>
                                <p className="text-indigo-100">Monitor your appointment status in real-time and plan your visit accordingly.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-indigo-600 p-3 rounded-lg mr-4 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Patient-first approach</h3>
                                <p className="text-indigo-100">Our services are designed with your comfort and trust as the top priority.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto mt-20 text-center">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
                    <h2 className="text-3xl font-bold text-indigo-800 mb-6">
                        ✨ With OneClickHelp, healthcare is no longer complicated
                    </h2>
                    <p className="text-xl text-gray-700 mb-8">
                        It's just one click away!
                    </p>
                    <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-full transition duration-300 transform hover:-translate-y-1">
                        Get Started Today
                    </Link>
                </div>
            </section>
        </div>
    );
};
