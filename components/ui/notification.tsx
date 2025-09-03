import React from 'react';
import { cn } from '@/lib/utils'; // Assuming cn is a utility for class names

import Link from 'next/link';

interface NotificationProps {
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  onClick?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  isRead,
  link,
  onClick,
  onDismiss,
  className,
}) => {
  const NotificationContent = (
    <>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "ml-4 p-1 rounded-full",
            isRead ? "text-gray-500 hover:bg-gray-200" : "text-white hover:bg-blue-600"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </>
  );

  const renderContent = () => (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 border rounded-md shadow-sm",
        isRead ? "bg-gray-100 text-gray-600" : "bg-blue-500 text-white",
        "cursor-pointer",
        className
      )}
    >
      {NotificationContent}
    </div>
  );

  return link ? <Link href={link}>{renderContent()}</Link> : renderContent();
};

export { Notification };
