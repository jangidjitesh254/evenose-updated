import clsx from 'clsx';

const variants = {
  primary: 'bg-indigo-100 text-indigo-800',
  secondary: 'bg-gray-200 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export default function Badge({ children, variant = 'primary', className }) {
  return (
    <span className={clsx('badge flex px-3 py-1 justify-center items-center rounded-xl capitalize gap-1 text-sm', variants[variant], className)}>
      {children}
    </span>
  );
}
