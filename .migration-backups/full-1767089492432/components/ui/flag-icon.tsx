import React from 'react';

interface FlagIconProps {
  country: 'DZ' | 'FR' | 'GB' | 'US';
  className?: string;
}

export function FlagIcon({ country, className = "w-4 h-4" }: FlagIconProps) {
  const flags = {
    DZ: (
      <svg className={className} viewBox="0 0 24 16" fill="none">
        <rect width="24" height="16" fill="#006233"/>
        <rect x="12" y="0" width="12" height="16" fill="#FFFFFF"/>
        <g transform="translate(12,8)">
          <circle cx="0" cy="0" r="3" fill="#D21034"/>
          <path d="M-1.5,-1.5 L1.5,0 L-1.5,1.5 Z" fill="#D21034"/>
        </g>
      </svg>
    ),
    FR: (
      <svg className={className} viewBox="0 0 24 16" fill="none">
        <rect width="8" height="16" fill="#002654"/>
        <rect x="8" y="0" width="8" height="16" fill="#FFFFFF"/>
        <rect x="16" y="0" width="8" height="16" fill="#ED2939"/>
      </svg>
    ),
    GB: (
      <svg className={className} viewBox="0 0 24 16" fill="none">
        <rect width="24" height="16" fill="#012169"/>
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFFFFF" strokeWidth="2"/>
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1"/>
        <rect x="10" y="0" width="4" height="16" fill="#FFFFFF"/>
        <rect x="0" y="6" width="24" height="4" fill="#FFFFFF"/>
        <rect x="11" y="0" width="2" height="16" fill="#C8102E"/>
        <rect x="0" y="7" width="24" height="2" fill="#C8102E"/>
      </svg>
    ),
    US: (
      <svg className={className} viewBox="0 0 24 16" fill="none">
        <rect width="24" height="16" fill="#B22234"/>
        <rect y="1" width="24" height="1" fill="#FFFFFF"/>
        <rect y="3" width="24" height="1" fill="#FFFFFF"/>
        <rect y="5" width="24" height="1" fill="#FFFFFF"/>
        <rect y="7" width="24" height="1" fill="#FFFFFF"/>
        <rect y="9" width="24" height="1" fill="#FFFFFF"/>
        <rect y="11" width="24" height="1" fill="#FFFFFF"/>
        <rect y="13" width="24" height="1" fill="#FFFFFF"/>
        <rect width="10" height="8" fill="#3C3B6E"/>
      </svg>
    )
  };

  return flags[country];
}