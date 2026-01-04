import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Card({ 
  children, 
  title, 
  subtitle,
  actions,
  className,
  hoverable = true,
  noTransform = false,
  ...props 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'card bg-white border-2 border-gray-100 rounded-lg transition-all',
        hoverable && 'hover:border-indigo-200 hover:-translate-y-1',
        noTransform && 'hover:translate-y-0',
        className
      )}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-dark-100">
          <div className="flex items-start justify-between">
            <div>
              {title && <h3 className="text-xl font-bold text-dark-900">{title}</h3>}
              {subtitle && <p className="text-sm text-dark-600 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
}
