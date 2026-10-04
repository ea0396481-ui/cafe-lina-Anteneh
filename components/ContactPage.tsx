import React, { useState } from 'react';
import { PhoneCall, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-16 bg-[#0f0f0f] text-[#FDF5E6] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Get In Touch</span>
          <h1 className="text-4xl font-serif font-bold text-[#FDF5E6]">Contact Cafe Lina</h1>
          <p className="text-sm text-[#A8A095]">We would love to hear from you. Visit us in Bole Road or send a message.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="bg-[#181818] text-[#FDF5E6] p-8 rounded-3xl space-y-6 shadow-xl border border-[#D4AF37]/30">
            <h2 className="text-2xl font-serif font-bold text-[#D4AF37]">Flagship Location</h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="text-[#D4AF37] shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="font-bold block text-[#FDF5E6]">Bole Road Branch</span>
                  <span className="text-[#A8A095]">Near Rwanda Embassy / Bole Atlas Junction, Addis Ababa, Ethiopia</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PhoneCall className="text-[#D4AF37] shrink-0" size={18} />
                <div>
                  <span className="font-bold block text-[#FDF5E6]">Hotline & Delivery</span>
                  <span className="text-[#A8A095]">+251 900 123 456</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="text-[#D4AF37] shrink-0" size={18} />
                <div>
                  <span className="font-bold block text-[#FDF5E6]">Email Inquiries</span>
                  <span className="text-[#A8A095]">info@cafelina.com</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-white/10">
                <Clock className="text-[#D4AF37] shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="font-bold block text-[#FDF5E6]">Operating Hours</span>
                  <span className="text-[#A8A095]">Monday - Sunday: 06:00 AM - 11:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-[#181818] p-8 rounded-3xl border border-white/10 shadow-xl text-[#FDF5E6]">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
                <h3 className="font-serif font-bold text-xl text-[#D4AF37]">Message Sent!</h3>
                <p className="text-xs text-[#A8A095]">Thank you for contacting Cafe Lina. Our team will respond shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h2 className="text-xl font-serif font-bold text-[#FDF5E6]">Send Us A Message</h2>

                <div>
                  <label className="font-bold text-[#D4AF37] block mb-1">Your Name</label>
                  <input type="text" required placeholder="Full Name" className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-3 focus:ring-1 focus:ring-[#D4AF37]" />
                </div>

                <div>
                  <label className="font-bold text-[#D4AF37] block mb-1">Email / Phone</label>
                  <input type="text" required placeholder="Email or Phone" className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-3 focus:ring-1 focus:ring-[#D4AF37]" />
                </div>

                <div>
                  <label className="font-bold text-[#D4AF37] block mb-1">Message</label>
                  <textarea rows={4} required placeholder="How can we help you?" className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-3 focus:ring-1 focus:ring-[#D4AF37]" />
                </div>

                <button type="submit" className="w-full bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 py-3.5 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
