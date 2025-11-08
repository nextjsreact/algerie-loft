'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface MenuPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export default function MenuPortal({ children, isOpen }: MenuPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div style={{ zIndex: 999999 }}>
      {children}
    </div>,
    document.body
  );
}