import React from 'react';
import { BlogPost } from '../types';
import { Clock, User, ArrowRight } from 'lucide-react';

interface BlogPageProps {
  posts: BlogPost[];
}

export const BlogPage: React.FC<BlogPageProps> = ({ posts }) => {
  return (
    <div className="py-16 bg-[#0f0f0f] text-[#FDF5E6] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Stories & Insights</span>
          <h1 className="text-4xl font-serif font-bold text-[#FDF5E6]">Cafe Lina Journal</h1>
          <p className="text-sm text-[#A8A095]">Discover coffee brewing guides, roasting secrets and pastry recipes</p>
        </div>

        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-[#181818] rounded-3xl overflow-hidden border border-white/10 shadow-xl grid grid-cols-1 md:grid-cols-3">
              <img src={post.image} alt={post.title} className="h-full w-full object-cover md:col-span-1 border-r border-white/5" />
              <div className="p-6 md:col-span-2 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-[#A8A095] mb-2">
                    <span className="bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full font-bold">
                      {post.category}
                    </span>
                    <span>{post.date}</span>
                    <span>• {post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-[#FDF5E6] hover:text-[#D4AF37] cursor-pointer transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs text-[#A8A095] leading-relaxed mt-2 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#A8A095] font-bold">By {post.author}</span>
                  <button className="text-[#D4AF37] font-bold flex items-center gap-1 hover:underline">
                    Read Article <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
