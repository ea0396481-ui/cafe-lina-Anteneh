import React from 'react';
import { CareerPosting } from '../types';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';

interface CareerPageProps {
  careers: CareerPosting[];
}

export const CareerPage: React.FC<CareerPageProps> = ({ careers }) => {
  return (
    <div className="py-16 bg-[#0f0f0f] text-[#FDF5E6] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Join Our Passionate Team</span>
          <h1 className="text-4xl font-serif font-bold text-[#FDF5E6]">Careers at Cafe Lina</h1>
          <p className="text-sm text-[#A8A095]">We are always seeking talented baristas, chefs, and hospitality specialists</p>
        </div>

        <div className="space-y-4">
          {careers.map((car) => (
            <div key={car.id} className="bg-[#181818] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 text-[#FDF5E6]">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#FDF5E6]">{car.title}</h2>
                  <p className="text-xs text-[#A8A095] mt-1">{car.location} • {car.type}</p>
                </div>
                <span className="bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold px-3 py-1 rounded-full">
                  {car.department}
                </span>
              </div>

              <p className="text-xs text-[#A8A095] leading-relaxed">{car.description}</p>

              <div>
                <h4 className="text-xs font-bold text-[#D4AF37] uppercase mb-1">Key Requirements:</h4>
                <ul className="list-disc list-inside text-xs text-[#A8A095] space-y-1">
                  {car.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => alert(`Thank you for your interest in ${car.title}! Please send your CV to careers@cafelina.com`)}
                className="bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <span>Apply For Position</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
