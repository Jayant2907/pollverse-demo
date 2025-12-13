import React from 'react';

interface SvgPlaceholderProps {
  w: number;
  h: number;
  text: string;
  bgColor: string;
  textColor: string;
}

const SvgPlaceholder: React.FC<SvgPlaceholderProps> = ({ w, h, text, bgColor, textColor }) => (
  <svg width={w} height={h} xmlns="http://www.w3.org/2000/svg" className="w-full h-auto object-cover aspect-[2/3]">
    <rect width="100%" height="100%" fill={bgColor} />
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={textColor} fontSize="24" fontFamily="Inter, sans-serif" fontWeight="bold">
      {text}
    </text>
  </svg>
);

export default SvgPlaceholder;