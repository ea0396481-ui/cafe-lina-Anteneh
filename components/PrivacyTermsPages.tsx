import React from 'react';

export const PrivacyTermsPages: React.FC<{ type: 'privacy' | 'terms' }> = ({ type }) => {
  return (
    <div className="py-16 bg-[#0f0f0f] text-[#FDF5E6] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#181818] p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl space-y-6 text-xs leading-relaxed text-[#A8A095]">
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">
          {type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
        </h1>
        <p className="text-[#A8A095]/60">Last updated: August 2026</p>

        {type === 'privacy' ? (
          <>
            <p>
              At Cafe Lina, we prioritize the protection of your personal data. This privacy policy outlines how we collect, store, and utilize information provided when you browse our website, place online orders, or book table reservations.
            </p>
            <h3 className="font-bold text-sm text-[#FDF5E6]">1. Data Collection</h3>
            <p>
              We collect information necessary for order fulfillment, including your name, telephone number, delivery address in Addis Ababa, and email address.
            </p>
            <h3 className="font-bold text-sm text-[#FDF5E6]">2. Payment Security</h3>
            <p>
              All online transactions processed via Stripe, Telebirr, or CBE Birr are encrypted using industry-standard SSL encryption.
            </p>
          </>
        ) : (
          <>
            <p>
              Welcome to Cafe Lina. By placing an online order or reserving a table through our platform, you agree to comply with the following terms and conditions.
            </p>
            <h3 className="font-bold text-sm text-[#FDF5E6]">1. Orders & Deliveries</h3>
            <p>
              Orders placed for delivery within Addis Ababa are subject to availability and localized traffic conditions. Estimated delivery times are provided as guidelines.
            </p>
            <h3 className="font-bold text-sm text-[#FDF5E6]">2. Table Reservations</h3>
            <p>
              Table reservations are held for 15 minutes past the scheduled arrival time before being released during peak dining hours.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
