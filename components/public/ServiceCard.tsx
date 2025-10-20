interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 h-full">
      <div className="text-4xl sm:text-5xl mb-4 text-center sm:text-left">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white text-center sm:text-left">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center sm:text-left">{description}</p>
    </div>
  );
}