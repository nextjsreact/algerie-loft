"use client"

interface NotificationsListProps {
  notifications: any[]
}

export default function NotificationsList({ notifications }: NotificationsListProps) {
  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div key={notification.id} className="p-4 border rounded-lg">
          <h3 className="font-semibold">{notification.title}</h3>
          <p className="text-gray-600">{notification.message}</p>
        </div>
      ))}
    </div>
  )
}