export default function RefundPolicy() {
    return (
      <div className="min-h-screen bg-white text-gray-800 p-6 md:p-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Refund & Cancellation Policy</h1>
  
        <p className="mb-6">
          At <strong>OneClickHelp.in</strong>, we strive to offer a smooth and transparent booking experience. This policy outlines the terms and procedures for cancelling appointments and requesting refunds for services booked through our platform.
        </p>
  
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Appointment Cancellations</h2>
  
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Patient-Initiated Cancellations:</strong> <br />
                You may cancel your appointment at least <strong>2 hours</strong> prior to the scheduled OPD or consultation start time to be eligible for a full refund.
              </li>
              <li>
                <strong>Doctor-Initiated Cancellations:</strong> <br />
                If the consultation is cancelled by the doctor, you are entitled to a full refund, regardless of timing.
              </li>
              <li>
                <strong>Cancellations After Consultation Start:</strong> <br />
                Cancellations cannot be guaranteed if the consultation has already started, even if another patient has begun the session.
              </li>
            </ul>
          </div>
  
          <div>
            <h2 className="text-xl font-semibold mb-2">2. Refund Process</h2>
  
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Approved Refunds:</strong> <br />
                Once your cancellation is approved, the refund amount will be processed and credited to your bank account within <strong>5–6 business days</strong>.
              </li>
              <li>
                <strong>Service Complaints:</strong> <br />
                If you are dissatisfied with the consultation or experience any issues, please contact our customer support team within <strong>3 days</strong> of the appointment date. We will investigate the matter and determine an appropriate resolution, which may include a full or partial refund.
              </li>
            </ul>
          </div>
  
          <div>
            <h2 className="text-xl font-semibold mb-2">3. How to Request a Cancellation or Refund</h2>
  
            <p className="mb-2">To request a cancellation or refund, please send an email to:</p>
            <p className="font-semibold mb-4">📧 <a href="mailto:info@oneclickhelp.in" className="text-blue-600 underline">info@oneclickhelp.in</a></p>
  
            <p className="mb-2">Please include the following details in your email:</p>
  
            <p className="font-semibold">Option 1 (Appointment Details):</p>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Name</li>
              <li>Mobile Number</li>
              <li>Token / Booking Number</li>
              <li>Doctor's Name</li>
              <li>Appointment Date</li>
            </ul>
  
            <p className="font-semibold">OR</p>
  
            <p className="font-semibold mt-4">Option 2 (Transaction Details):</p>
            <ul className="list-disc list-inside ml-4 mb-4">
              <li>Name</li>
              <li>Transaction ID</li>
            </ul>
          </div>
  
          <div>
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> We reserve the right to modify this policy at any time without prior notice. All refund decisions are at the discretion of OneClickHelp after a thorough review.
            </p>
          </div>
        </section>
      </div>
    );
  }
  