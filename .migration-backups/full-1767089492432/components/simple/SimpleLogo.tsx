import Image from 'next/image';

interface SimpleLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function SimpleLogo({ 
  width = 80, 
  height = 24, 
  className = '' 
}: SimpleLogoProps) {
  return (
    <Image
      src="/logo.jpg"
      alt="Loft Algérie"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority
    />
  );
}