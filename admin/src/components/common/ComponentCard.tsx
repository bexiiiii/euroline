import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  description?: string; // Alternative description prop
  action?: React.ReactNode; // Action component (like toolbar)
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  description = "",
  action,
}) => {
  const text = description || desc;

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      {(title || text || action) && (
        <div className="flex flex-col gap-3 px-4 pt-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                {title}
              </h3>
            )}
            {text && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {text}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 sm:p-5">
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
