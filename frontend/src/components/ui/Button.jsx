import { motion } from 'framer-motion';
import clsx from 'clsx';

const variants = {
  primary: 'btn-primary px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 text-base shadow-lg',
  secondary: 'btn-secondary bg-gray-600 text-white border-2 border-gray-600 hover:bg-transparent hover:text-gray-600 focus:ring-gray-500',
  outline: 'btn-outline px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-full font-semibold hover:border-gray-300 transition-all inline-flex items-center gap-2 text-base',
  ghost: 'btn-ghost',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  cancel: 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className,
  ...props
}) {
  return (
    <button
      className={clsx(
        'btn rounded-full cursor-pointer',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        'inline-flex items-center justify-center gap-2',
        loading && 'opacity-70 cursor-not-allowed',
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}
