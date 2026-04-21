import React from 'react';

interface NcRNAIconProps {
  size?: number;
  color?: string;
}

/**
 * Non-coding RNA Icon
 * Design: Multiple types of non-coding RNA structures
 * Features: miRNA (hairpin), lncRNA (long chain), circRNA (circular)
 */
const NcRNAIcon: React.FC<NcRNAIconProps> = ({ 
  size = 48, 
  color = '#1C484C' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Non-coding RNA icon"
    >
      {/* miRNA - hairpin structure (left) */}
      <g>
        {/* Stem */}
        <path
          d="M 8 28 L 8 18"
          stroke="#E74C3C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 12 28 L 12 18"
          stroke="#E74C3C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Base pairs in stem */}
        <line x1="8" y1="26" x2="12" y2="26" stroke="#E74C3C" strokeWidth="1" opacity="0.6" />
        <line x1="8" y1="23" x2="12" y2="23" stroke="#E74C3C" strokeWidth="1" opacity="0.6" />
        <line x1="8" y1="20" x2="12" y2="20" stroke="#E74C3C" strokeWidth="1" opacity="0.6" />
        
        {/* Loop */}
        <path
          d="M 8 18 Q 10 14, 12 18"
          stroke="#E74C3C"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* miRNA label */}
        <text x="10" y="35" fontSize="4" fontWeight="bold" fill="#E74C3C" textAnchor="middle">miRNA</text>
      </g>

      {/* lncRNA - long wavy chain (middle) */}
      <g>
        <path
          d="M 18 10 Q 20 12, 19 15 Q 18 18, 20 20 Q 22 22, 20 25 Q 18 28, 20 31 Q 22 34, 20 37"
          stroke="#3498DB"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* RNA nucleotide markers */}
        <circle cx="19" cy="13" r="1" fill="#3498DB" />
        <circle cx="20" cy="18" r="1" fill="#3498DB" />
        <circle cx="20" cy="23" r="1" fill="#3498DB" />
        <circle cx="20" cy="28" r="1" fill="#3498DB" />
        <circle cx="20" cy="33" r="1" fill="#3498DB" />
        
        {/* lncRNA label */}
        <text x="20" y="42" fontSize="4" fontWeight="bold" fill="#3498DB" textAnchor="middle">lncRNA</text>
      </g>

      {/* circRNA - circular structure (right) */}
      <g>
        <circle
          cx="32"
          cy="20"
          r="8"
          stroke="#9B59B6"
          strokeWidth="2.5"
          fill="none"
        />
        {/* RNA nucleotide markers around circle */}
        <circle cx="32" cy="12" r="1" fill="#9B59B6" />
        <circle cx="38" cy="16" r="1" fill="#9B59B6" />
        <circle cx="40" cy="20" r="1" fill="#9B59B6" />
        <circle cx="38" cy="24" r="1" fill="#9B59B6" />
        <circle cx="32" cy="28" r="1" fill="#9B59B6" />
        <circle cx="26" cy="24" r="1" fill="#9B59B6" />
        <circle cx="24" cy="20" r="1" fill="#9B59B6" />
        <circle cx="26" cy="16" r="1" fill="#9B59B6" />
        
        {/* Back-splice junction indicator */}
        <path
          d="M 32 12 L 32 8"
          stroke="#9B59B6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="32" cy="8" r="2" fill="#9B59B6" />
        
        {/* circRNA label */}
        <text x="32" y="35" fontSize="4" fontWeight="bold" fill="#9B59B6" textAnchor="middle">circRNA</text>
      </g>

      {/* DNA strand with X (indicating no translation) */}
      <g opacity="0.5">
        <path
          d="M 38 38 L 44 44"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 44 38 L 38 44"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* ncRNA label badge */}
      <g>
        <rect
          x="2"
          y="2"
          width="14"
          height="8"
          rx="1.5"
          fill={color}
        />
        <text
          x="9"
          y="8"
          fontSize="4.5"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          ncRNA
        </text>
      </g>
    </svg>
  );
};

export default NcRNAIcon;

