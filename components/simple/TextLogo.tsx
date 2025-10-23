interface TextLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function TextLogo({ className = '', size = 'small' }: TextLogoProps) {
  const sizeClasses = {
    small: 'text-lg font-bold',
    medium: 'text-xl font-bold', 
    large: 'text-2xl font-bold'
  };

  return (
    <div className={`${sizeClasses[size]} text-blue-600 ${className}`}>
      LOFT ALGÉRIE
    </div>
  );
}