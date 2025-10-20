interface FormInputProps {
  label: string;
  type: 'text' | 'email' | 'tel';
  name?: string;
  required?: boolean;
  rows?: number;
  disabled?: boolean;
}

export default function FormInput({ label, type, name, required = false, rows, disabled = false }: FormInputProps) {
  const baseClasses = "w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      {rows ? (
        <textarea 
          name={name}
          rows={rows}
          className={baseClasses}
          required={required}
          disabled={disabled}
        />
      ) : (
        <input 
          name={name}
          type={type}
          className={baseClasses}
          required={required}
          disabled={disabled}
        />
      )}
    </div>
  );
}