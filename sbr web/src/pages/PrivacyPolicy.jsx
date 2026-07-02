import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f0f5fa] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-white/50">
        {/* Header Banner */}
        <div className="bg-brand-dark-blue text-white px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#00529B,transparent)] opacity-40"></div>
          <h1 className="text-3xl sm:text-4xl font-extrabold relative z-10">Privacy Policy</h1>
          <p className="mt-2 text-blue-200 relative z-10">Last Updated: July 2, 2026</p>
          <div className="mt-4 w-20 h-1 bg-brand-yellow mx-auto relative z-10"></div>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-10 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-brand-dark-blue mb-3 border-b border-gray-100 pb-2">1. Introduction</h2>
            <p>
              Sri Balaji Renewables ("we", "us", "our") is dedicated to protecting your privacy. This Privacy Policy describes how we collect, use, process, and disclose your information when you use our website, customer portals, and the Sri Balaji Renewables Service Management Application (our "Service" or "Apps").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-dark-blue mb-3 border-b border-gray-100 pb-2">2. Information We Collect</h2>
            <p className="mb-3">
              We collect information to provide better services to all our users. The types of information we collect include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> When you register on our app or web portal, we collect your name, email address, phone number, and password.</li>
              <li><strong>Location Information:</strong> For the purpose of tracking installation locations and coordinates of service agents during a request, our App may request access to location data (even in the background when updating jobs). You can choose to allow or deny location permissions.</li>
              <li><strong>Camera & Photo Access:</strong> The App requires camera access to capture before-and-after installation or repair pictures to keep record of the completed service.</li>
              <li><strong>Device Information:</strong> We may collect standard details such as IP address, operating system, and push notification tokens (for sending job updates via Firebase Cloud Messaging).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-dark-blue mb-3 border-b border-gray-100 pb-2">3. How We Use Your Information</h2>
            <p className="mb-3">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create, configure, and maintain your account profile.</li>
              <li>To allow customer service booking, assignment, and processing of requests.</li>
              <li>To allow real-time location updates of service agents for better job delivery.</li>
              <li>To send service confirmations, billing updates, and push notifications.</li>
              <li>To ensure safety, compliance, and prevent fraudulent actions.</li>
            </ul>
          </section>

          <section className="bg-red-50 border border-red-100 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              4. Account Deletion & Data Retention
            </h2>
            <p className="mb-3 text-red-950">
              We respect your right to control your personal data. In compliance with mobile app distribution guidelines:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-red-950">
              <li><strong>Self-Service Account Deletion:</strong> You can permanently delete your account at any time. To do this, simply log into the mobile app (or web customer portal), navigate to <strong>My Profile Settings</strong>, and click the <strong>Delete Account</strong> option.</li>
              <li><strong>Data Removal:</strong> Deleting your account will immediately remove your name, email, phone, credentials, and FCM tokens from our database. Transaction records and historical invoices may be kept for accounting purposes but will be disassociated from your profile details.</li>
              <li><strong>Alternate Request:</strong> Alternatively, you can email us at <a href="mailto:info@sribalajirenewables.com" className="underline font-semibold hover:text-red-700">info@sribalajirenewables.com</a> with the subject line "Account Deletion Request", and our support team will delete your account manually within 48 hours.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-dark-blue mb-3 border-b border-gray-100 pb-2">5. Data Security</h2>
            <p>
              We implement industry-standard administrative, physical, and technical security measures (including SSL/TLS transmission encryption) to safeguard your data from unauthorized access, loss, or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-dark-blue mb-3 border-b border-gray-100 pb-2">6. Contact Information</h2>
            <p className="mb-2">
              If you have any questions or feedback regarding this Privacy Policy or your data privacy rights, please contact us:
            </p>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 space-y-2 text-sm">
              <p><strong>Company:</strong> Sri Balaji Renewables</p>
              <p><strong>Email:</strong> <a href="mailto:info@sribalajirenewables.com" className="text-brand-blue hover:underline">info@sribalajirenewables.com</a></p>
              <p><strong>Address:</strong> Tirupati, Andhra Pradesh, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
