import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'burgundy';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'burgundy',
  showSubtitle = true,
}) => {
  const pixelSizes = {
    xs: { circle: 32, fontMain: 'text-sm', fontSub: 'text-[8px]' },
    sm: { circle: 42, fontMain: 'text-base', fontSub: 'text-[9px]' },
    md: { circle: 56, fontMain: 'text-2xl', fontSub: 'text-[10px]' },
    lg: { circle: 72, fontMain: 'text-3xl', fontSub: 'text-xs' },
    xl: { circle: 100, fontMain: 'text-5xl', fontSub: 'text-sm' },
  };

  const sizeObj = pixelSizes[size] || pixelSizes.md;

  const isDark = variant === 'dark' || variant === 'light';
  const strokeColor = isDark ? '#D4AF37' : '#6B1D1D';
  const fillColor = isDark ? '#FDF5E6' : '#6B1D1D';

  return (
    <div className="flex items-center gap-3 select-none group cursor-pointer">
      {/* Exact Circular Seal Emblem SVG matching uploaded logo */}
      <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
        <svg
          width={sizeObj.circle}
          height={sizeObj.circle}
          viewBox="0 0 200 200"
          className="drop-shadow-md"
        >
          {/* Outer Ring */}
          <circle cx="100" cy="100" r="95" fill="none" stroke={strokeColor} strokeWidth="5" />
          <circle cx="100" cy="100" r="88" fill="none" stroke={strokeColor} strokeWidth="1.5" />

          {/* Inner Ring */}
          <circle cx="100" cy="100" r="62" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="1, 1" />

          {/* Arc Text Path Definitions */}
          <defs>
            <path id="topArcPath" d="M 32 100 A 68 68 0 0 1 168 100" />
            <path id="bottomArcPath" d="M 168 100 A 68 68 0 0 1 32 100" />
          </defs>

          {/* Top Arc Text: CAFE */}
          <text fill={fillColor} fontSize="22" fontWeight="bold" fontFamily="serif" letterSpacing="6">
            <textPath href="#topArcPath" startOffset="50%" textAnchor="middle">
              CAFE
            </textPath>
          </text>

          {/* Bottom Arc Text: LINA */}
          <text fill={fillColor} fontSize="22" fontWeight="bold" fontFamily="serif" letterSpacing="6">
            <textPath href="#bottomArcPath" startOffset="50%" textAnchor="middle">
              LINA
            </textPath>
          </text>

          {/* Left Coffee Bean Icon */}
          <g transform="translate(25, 94) rotate(-30) scale(0.7)">
            <ellipse cx="10" cy="10" rx="8" ry="12" fill={fillColor} />
            <path d="M 10 2 Q 13 10 10 18" stroke={isDark ? '#181818' : '#FDFBF7'} strokeWidth="2" fill="none" />
          </g>

          {/* Right Coffee Bean Icon */}
          <g transform="translate(160, 94) rotate(30) scale(0.7)">
            <ellipse cx="10" cy="10" rx="8" ry="12" fill={fillColor} />
            <path d="M 10 2 Q 7 10 10 18" stroke={isDark ? '#181818' : '#FDFBF7'} strokeWidth="2" fill="none" />
          </g>

          {/* Center Monogram LC + Steam Cup */}
          <g transform="translate(100, 102)">
            {/* Steam Trails above Cup */}
            <path d="M -8 -30 C -6 -35 -10 -38 -8 -42" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 0 -32 C 2 -37 -2 -40 0 -45" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 8 -30 C 10 -35 6 -38 8 -42" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Coffee Cup atop L */}
            <path d="M -16 -28 L 12 -28 C 12 -16 -4 -12 -12 -16 Z" fill={fillColor} />
            <path d="M 12 -25 C 18 -25 18 -18 12 -16" stroke={fillColor} strokeWidth="2.5" fill="none" />

            {/* Monogram L */}
            <text x="-24" y="16" fill={fillColor} fontSize="46" fontFamily="serif" fontWeight="bold">
              L
            </text>

            {/* Monogram C (intertwined) */}
            <text x="-8" y="26" fill={fillColor} fontSize="52" fontFamily="serif" fontWeight="bold">
              C
            </text>
          </g>

          {/* Inner Separator Line and Star */}
          <line x1="50" y1="152" x2="88" y2="152" stroke={strokeColor} strokeWidth="1" />
          <polygon points="100,148 102,152 106,152 103,155 104,159 100,156 96,159 97,155 94,152 98,152" fill={strokeColor} />
          <line x1="112" y1="152" x2="150" y2="152" stroke={strokeColor} strokeWidth="1" />
        </svg>
      </div>

      {/* Text Branding beside Emblem */}
      <div className="flex flex-col">
        <span
          className={`font-serif font-bold tracking-widest leading-none uppercase ${sizeObj.fontMain} ${
            isDark ? 'text-[#FDF5E6]' : 'text-[#6B1D1D]'
          }`}
        >
          CAFE LINA
        </span>
        {showSubtitle && (
          <span
            className={`font-semibold tracking-[0.2em] uppercase mt-1 ${sizeObj.fontSub} ${
              isDark ? 'text-[#D4AF37]' : 'text-[#6B1D1D]/90'
            }`}
          >
            Coffee • Bakery • Breakfast
          </span>
        )}
      </div>
    </div>
  );
};

