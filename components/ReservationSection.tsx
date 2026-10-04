import React, { useState } from 'react';
import { Reservation } from '../types';
import { Calendar, Clock, Users, MapPin, CheckCircle2, Sparkles, UtensilsCrossed } from 'lucide-react';

interface ReservationSectionProps {
  onAddReservation: (res: Reservation) => void;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({ onAddReservation }) => {
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('2026-08-04');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState(2);
  const [seatingPreference, setSeatingPreference] = useState<'Indoors' | 'Terrace' | 'Private Booth' | 'Bar Area'>('Terrace');
  const [specialRequests, setSpecialRequests] = useState('');
  const [confirmedRes, setConfirmedRes] = useState<Reservation | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) {
      alert('Please enter your name and phone number');
      return;
    }

    const newRes: Reservation = {
      id: `RES-${Math.floor(300 + Math.random() * 700)}`,
      customerName,
      email: email || 'guest@example.com',
      phone,
      date,
      time,
      guests,
      seatingPreference,
      specialRequests,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    onAddReservation(newRes);
    setConfirmedRes(newRes);
  };

  return (
    <section className="py-16 bg-[#0f0f0f] text-[#FDF5E6] relative min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-1">
            <Sparkles size={14} /> VIP Dining & Lounge
          </span>
          <h1 className="text-4xl font-serif font-bold text-[#FDF5E6] mt-1 mb-2">
            Reserve A Table at Cafe Lina
          </h1>
          <p className="text-sm text-[#A8A095] max-w-lg mx-auto">
            Book your private booth or scenic outdoor terrace spot on Bole Road. Instant confirmation.
          </p>
        </div>

        {confirmedRes ? (
          <div className="bg-[#181818] rounded-3xl p-8 border border-[#D4AF37]/30 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                Reservation Confirmed
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#FDF5E6] mt-1">
                We're Expecting You, {confirmedRes.customerName}!
              </h2>
              <p className="text-xs text-[#A8A095] mt-1">
                Booking ID: <span className="font-mono font-bold text-[#D4AF37]">{confirmedRes.id}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#121212] p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <p className="text-[#A8A095]">Date</p>
                <p className="font-bold text-[#D4AF37]">{confirmedRes.date}</p>
              </div>
              <div>
                <p className="text-[#A8A095]">Time</p>
                <p className="font-bold text-[#D4AF37]">{confirmedRes.time}</p>
              </div>
              <div>
                <p className="text-[#A8A095]">Guests</p>
                <p className="font-bold text-[#D4AF37]">{confirmedRes.guests} Persons</p>
              </div>
              <div>
                <p className="text-[#A8A095]">Seating</p>
                <p className="font-bold text-[#D4AF37]">{confirmedRes.seatingPreference}</p>
              </div>
            </div>

            <button
              onClick={() => setConfirmedRes(null)}
              className="bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 px-8 py-3 rounded-xl font-bold text-xs uppercase"
            >
              Book Another Table
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[#181818] rounded-3xl p-8 shadow-2xl border border-[#D4AF37]/20 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Abebe Bikila"
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 911 000 000"
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Guests Count */}
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Number of Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#D4AF37] font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                    <option key={n} value={n} className="bg-[#181818] text-[#FDF5E6]">
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Reservation Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Time Slot</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#D4AF37] font-bold"
                >
                  {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:30', '21:00'].map((t) => (
                    <option key={t} value={t} className="bg-[#181818] text-[#FDF5E6]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seating Preference Selector */}
            <div>
              <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-2">Seating Preference</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['Terrace', 'Indoors', 'Private Booth', 'Bar Area'] as const).map((pref) => (
                  <button
                    type="button"
                    key={pref}
                    onClick={() => setSeatingPreference(pref)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      seatingPreference === pref
                        ? 'border-[#D4AF37] bg-[#6B1D1D] text-white shadow-md'
                        : 'border-white/10 bg-[#222222] text-[#A8A095] hover:border-white/20'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Request */}
            <div>
              <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Special Requests or Occasion</label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Birthday celebration, High chair required..."
                className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 py-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              CONFIRM TABLE RESERVATION
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
