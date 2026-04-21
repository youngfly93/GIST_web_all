import React from 'react';

interface SingleCellIconProps {
  size?: number;
  color?: string;
}

/**
 * Single-cell Transcriptomics Icon
 * Design: Multiple individual cells with distinct gene expression patterns
 * Features: Cell clusters with expression heatmap visualization
 */
const SingleCellIcon: React.FC<SingleCellIconProps> = ({ 
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
      aria-label="Single-cell Transcriptomics icon"
    >
      {/* Cell 1 - Top left (high expression - red) */}
      <g>
        <circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="12" cy="12" r="6" fill="#E74C3C" opacity="0.3" />
        {/* Nucleus */}
        <circle cx="12" cy="12" r="3" fill={color} opacity="0.6" />
        {/* RNA dots */}
        <circle cx="9" cy="10" r="0.8" fill="#E74C3C" />
        <circle cx="14" cy="11" r="0.8" fill="#E74C3C" />
        <circle cx="11" cy="14" r="0.8" fill="#E74C3C" />
      </g>

      {/* Cell 2 - Top right (medium expression - orange) */}
      <g>
        <circle cx="36" cy="12" r="8" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="36" cy="12" r="6" fill="#F39C12" opacity="0.3" />
        {/* Nucleus */}
        <circle cx="36" cy="12" r="3" fill={color} opacity="0.6" />
        {/* RNA dots */}
        <circle cx="33" cy="10" r="0.8" fill="#F39C12" />
        <circle cx="38" cy="13" r="0.8" fill="#F39C12" />
      </g>

      {/* Cell 3 - Bottom left (low expression - yellow) */}
      <g>
        <circle cx="12" cy="36" r="8" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="12" cy="36" r="6" fill="#F1C40F" opacity="0.3" />
        {/* Nucleus */}
        <circle cx="12" cy="36" r="3" fill={color} opacity="0.6" />
        {/* RNA dots */}
        <circle cx="10" cy="34" r="0.8" fill="#F1C40F" />
      </g>

      {/* Cell 4 - Bottom right (very low expression - green) */}
      <g>
        <circle cx="36" cy="36" r="8" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="36" cy="36" r="6" fill="#2ECC71" opacity="0.3" />
        {/* Nucleus */}
        <circle cx="36" cy="36" r="3" fill={color} opacity="0.6" />
        {/* RNA dots */}
        <circle cx="34" cy="38" r="0.8" fill="#2ECC71" />
      </g>

      {/* Central cell (medium-high expression - orange-red) */}
      <g>
        <circle cx="24" cy="24" r="9" fill="none" stroke={color} strokeWidth="2.5" />
        <circle cx="24" cy="24" r="7" fill="#E67E22" opacity="0.3" />
        {/* Nucleus */}
        <circle cx="24" cy="24" r="3.5" fill={color} opacity="0.6" />
        {/* RNA dots */}
        <circle cx="21" cy="22" r="0.8" fill="#E67E22" />
        <circle cx="26" cy="23" r="0.8" fill="#E67E22" />
        <circle cx="23" cy="26" r="0.8" fill="#E67E22" />
      </g>

      {/* Expression legend bar (right side) */}
      <g>
        <defs>
          <linearGradient id="expressionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E74C3C" />
            <stop offset="33%" stopColor="#F39C12" />
            <stop offset="66%" stopColor="#F1C40F" />
            <stop offset="100%" stopColor="#2ECC71" />
          </linearGradient>
        </defs>
        <rect x="44" y="8" width="2" height="32" fill="url(#expressionGradient)" rx="1" />
        {/* Legend labels */}
        <text x="43" y="7" fontSize="3" fill={color} textAnchor="end">High</text>
        <text x="43" y="42" fontSize="3" fill={color} textAnchor="end">Low</text>
      </g>

      {/* Single-cell label badge */}
      <g>
        <rect
          x="2"
          y="2"
          width="10"
          height="8"
          rx="1.5"
          fill={color}
        />
        <text
          x="7"
          y="8"
          fontSize="4.5"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          SC
        </text>
      </g>
    </svg>
  );
};

export default SingleCellIcon;

