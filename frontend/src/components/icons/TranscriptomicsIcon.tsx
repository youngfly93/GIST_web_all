import React from 'react';

interface TranscriptomicsIconProps {
  size?: number;
  color?: string;
}

/**
 * Transcriptomics Icon - represents RNA transcription
 * Design: DNA double helix with RNA strand being transcribed
 * Features wavy RNA strand emerging from DNA structure
 */
const TranscriptomicsIcon: React.FC<TranscriptomicsIconProps> = ({ 
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
      aria-label="Transcriptomics icon"
    >
      {/* DNA double helix (left side) */}
      <g opacity="0.8">
        {/* Left strand */}
        <path
          d="M 8 6 Q 10 12, 8 18 Q 6 24, 8 30 Q 10 36, 8 42"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right strand */}
        <path
          d="M 16 6 Q 14 12, 16 18 Q 18 24, 16 30 Q 14 36, 16 42"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Connecting base pairs */}
        <line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="15" x2="16" y2="15" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="27" x2="16" y2="27" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="33" x2="16" y2="33" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="39" x2="16" y2="39" stroke={color} strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* Transcription arrow (middle) */}
      <g>
        <path
          d="M 20 24 L 26 24"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 24 21 L 27 24 L 24 27"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* RNA single strand (right side - wavy) */}
      <g>
        <path
          d="M 30 10 Q 32 14, 30 18 Q 28 22, 30 26 Q 32 30, 30 34 Q 28 38, 30 42"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* RNA nucleotide dots */}
        <circle cx="30" cy="12" r="1.5" fill={color} />
        <circle cx="30" cy="20" r="1.5" fill={color} />
        <circle cx="30" cy="28" r="1.5" fill={color} />
        <circle cx="30" cy="36" r="1.5" fill={color} />
      </g>

      {/* mRNA label badge (top right) */}
      <g>
        <rect
          x="34"
          y="4"
          width="10"
          height="8"
          rx="2"
          fill={color}
        />
        <text
          x="39"
          y="10"
          fontSize="6"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          m
        </text>
      </g>
    </svg>
  );
};

export default TranscriptomicsIcon;

