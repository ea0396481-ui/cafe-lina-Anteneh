import React, { useState } from 'react';

export const GalleryPage: React.FC = () => {
  const [filter, setFilter] = useState('All');

  const galleryImages = [
    { title: 'Ethiopian Yirgacheffe Pour-Over', category: 'Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
    { title: 'Silky Cappuccino Latte Art', category: 'Coffee', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80' },
    { title: 'Artisan Butter Croissants', category: 'Bakery', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80' },
    { title: 'Belgian Chocolate Cake', category: 'Bakery', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
    { title: 'Lina Signature Breakfast Platter', category: 'Breakfast', url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80' },
    { title: 'Luxury Outdoor Terrace Lounge', category: 'Ambiance', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80' },
  ];

  const filtered = filter === 'All' ? galleryImages : galleryImages.filter((img) => img.category === filter);

  return (
    <div className="py-16 bg-[#0f0f0f] text-[#FDF5E6] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Visual Atmosphere</span>
          <h1 className="text-4xl font-serif font-bold text-[#FDF5E6]">Cafe Lina Gallery</h1>
          <p className="text-sm text-[#A8A095]">A glimpse into our specialty drinks, baked goods and cozy atmosphere</p>
        </div>

        <div className="flex justify-center gap-2">
          {['All', 'Coffee', 'Bakery', 'Breakfast', 'Ambiance'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === cat
                  ? 'bg-[#6B1D1D] text-white border border-[#D4AF37]/30'
                  : 'bg-[#181818] text-[#A8A095] border border-white/10 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((img, idx) => (
            <div key={idx} className="group relative rounded-2xl overflow-hidden shadow-md h-64 cursor-pointer">
              <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37]">{img.category}</span>
                <h3 className="font-serif font-bold text-sm">{img.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
