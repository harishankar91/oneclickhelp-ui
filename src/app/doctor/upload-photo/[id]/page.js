"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Footer from "@/components/footer/footer";
import Link from "next/link";

export default function UploadPhoto() {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const router = useRouter();
  const params = useParams();
  const doctorId = params.id;

  // Get user data from session storage
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem("userId") : null;
  const userName = typeof window !== 'undefined' ? sessionStorage.getItem("userName") : null;

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    fetchDoctorData();
  }, [userId, router, doctorId]);

  const fetchDoctorData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/getDoctorsById?doctorId=${doctorId}`);
      const data = await response.json();
      setDoctorData(data);

      // If doctor has a photo, set it as preview
      if (data.doctorPhoto) {
        setPreviewUrl(data.doctorPhoto);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size should be less than 5MB' });
      return;
    }

    setSelectedFile(file);
    setMessage({ type: '', text: '' });

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/uploadDoctorPhoto?doctorId=${doctorId}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
        // Refresh doctor data to get updated photo
        fetchDoctorData();
        setSelectedFile(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setMessage({ type: 'error', text: 'Error uploading photo. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    router.push('/doctor/login');
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
      <header className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/"> <img src="/logo.png" className="w-30" alt="Company Logo" /></Link>
              </div>
            </div>

            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right cursor-pointer">
                    <p className="text-sm font-medium text-gray-700">Dr. {userName}</p>
                    <p className="text-xs font-medium text-blue-500">
                      {doctorData?.doctorProfDetails?.specialization || 'Doctor'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <Link
                href="/doctor/dashboard"
                className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Dashboard
              </Link>

              <h1 className="text-2xl font-bold text-gray-900">Upload Profile Photo</h1>
              <p className="text-gray-600 mt-2">Update your professional profile picture</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Doctor Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">Dr. {doctorData?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Specialization</p>
                    <p className="font-medium">{doctorData?.doctorProfDetails?.specialization || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Doctor ID</p>
                    <p className="font-medium">{doctorData?.doctorId}</p>
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>

                <div className="flex flex-col items-center">
                  {/* Photo Preview */}
                  <div className="relative mb-6">
                    <div className="h-40 w-40 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (

                        <img
                          src={doctorData.photo_url ? `${process.env.NEXT_PUBLIC_API_URL}${doctorData.photo_url}` : "https://www.iconpacks.net/icons/1/free-doctor-icon-313-thumb.png"}
                          className="h-full w-full object-fill"
                        />
                      )}
                    </div>

                    {/* Edit Icon */}
                    <label htmlFor="photo-upload" className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 cursor-pointer shadow-md hover:bg-blue-700 transition-colors">

                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>

                  {/* File Info and Upload Button */}
                  {selectedFile && (
                    <div className="w-full mb-4">
                      <p className="text-sm text-gray-600 mb-2">Selected file: {selectedFile.name}</p>
                      <p className="text-xs text-gray-500">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center ${uploading || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      'Upload Photo'
                    )}
                  </button>

                  {/* Message */}
                  {message.text && (
                    <div className={`mt-4 p-3 rounded-md w-full text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                      {message.text}
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="mt-6 text-xs text-gray-500">
                    <p>• Supported formats: JPG, PNG, GIF</p>
                    <p>• Maximum file size: 5MB</p>
                    <p>• Recommended dimensions: 400x400 pixels</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}