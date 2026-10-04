import React from 'react';
import { Coffee, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  return (
    <div className="min-h-[70vh] bg-[#0f0f0f] text-[#FDF5E6] flex items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto shadow-lg">
          <Coffee size={40} />
        </div>
        <h1 className="text-5xl font-serif font-bold text-[#D4AF37]">404</h1>
        <h2 className="text-xl font-bold text-[#FDF5E6]">Page Not Found</h2>
        <p className="text-xs text-[#A8A095]">
          The cup you're looking for seems to have been emptied! Return to our main menu or home page.
        </p>
        <button
          onClick={onGoHome}
          className="bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} /> Return To Cafe Lina Home
        </button>
      </div>
    </div>
  );
};
