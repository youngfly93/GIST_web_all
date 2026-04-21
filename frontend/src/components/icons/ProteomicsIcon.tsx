import React from 'react';

interface ProteomicsIconProps {
  size?: number;
  color?: string;
}

/**
 * Proteomics Icon - represents protein structure
 * Design: Protein secondary structure with alpha helix and beta sheet
 * Features characteristic protein folding patterns
 */
const ProteomicsIcon: React.FC<ProteomicsIconProps> = ({ 
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
      aria-label="Proteomics icon"
    >
      {/* Alpha helix (left side - spiral ribbon) */}
      <g>
        {/* Helix ribbon path */}
        <path
          d="M 10 8 Q 8 10, 10 12 Q 12 14, 10 16 Q 8 18, 10 20 Q 12 22, 10 24 Q 8 26, 10 28 Q 12 30, 10 32 Q 8 34, 10 36 Q 12 38, 10 40"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Helix shadow/depth */}
        <path
          d="M 13 9 Q 11 11, 13 13 Q 15 15, 13 17 Q 11 19, 13 21 Q 15 23, 13 25 Q 11 27, 13 29 Q 15 31, 13 33 Q 11 35, 13 37 Q 15 39, 13 41"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </g>

      {/* Beta sheet (middle - pleated structure) */}
      <g>
        {/* Horizontal strands */}
        <path
          d="M 20 12 L 28 12"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 20 18 L 28 18"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 20 24 L 28 24"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 20 30 L 28 30"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 20 36 L 28 36"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Vertical connections (hydrogen bonds) */}
        <line x1="22" y1="12" x2="22" y2="36" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="2,2" />
        <line x1="26" y1="12" x2="26" y2="36" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="2,2" />
        
        {/* Arrow indicators for strand direction */}
        <path d="M 27 11 L 29 12 L 27 13" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 21 35 L 19 36 L 21 37" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Random coil (right side - flexible loop) */}
      <g>
        <path
          d="M 34 10 Q 36 12, 35 15 Q 34 18, 36 20 Q 38 22, 36 25 Q 34 28, 36 31 Q 38 34, 36 37 Q 34 40, 36 42"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </g>

      {/* Amino acid residue markers */}
      <g>
        <circle cx="10" cy="12" r="1.5" fill={color} />
        <circle cx="10" cy="20" r="1.5" fill={color} />
        <circle cx="10" cy="28" r="1.5" fill={color} />
        <circle cx="10" cy="36" r="1.5" fill={color} />
        
        <circle cx="24" cy="12" r="1.5" fill={color} />
        <circle cx="24" cy="24" r="1.5" fill={color} />
        <circle cx="24" cy="36" r="1.5" fill={color} />
        
        <circle cx="36" cy="15" r="1.5" fill={color} />
        <circle cx="36" cy="25" r="1.5" fill={color} />
        <circle cx="36" cy="37" r="1.5" fill={color} />
      </g>

      {/* Protein label badge */}
      <g>
        <rect
          x="38"
          y="4"
          width="8"
          height="8"
          rx="1.5"
          fill={color}
        />
        <text
          x="42"
          y="10"
          fontSize="6"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          P
        </text>
      </g>
    </svg>
  );
};

export default ProteomicsIcon;

