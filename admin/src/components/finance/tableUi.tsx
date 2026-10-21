import React from "react";

/** Общие классы компактных таблиц и тулбаров финансового раздела. */
export const thClass = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
export const tdClass = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
export const tableWrapClass =
  "overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800";
export const tbodyClass = "divide-y divide-gray-100 dark:divide-gray-800";
export const theadClass = "border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]";
export const rowClass = "hover:bg-gray-50 dark:hover:bg-white/[0.02]";
export const controlClass =
  "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";
export const fieldLabelClass = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

interface RowActionProps {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

/** Иконочная кнопка действия в строке таблицы. */
export function RowAction({ label, onClick, destructive = false, disabled = false, children }: RowActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/[0.06] [&>svg]:size-4 ${
        destructive ? "hover:text-error-600 dark:hover:text-error-500" : "hover:text-gray-800 dark:hover:text-white/90"
      }`}
    >
      {children}
    </button>
  );
}

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ViewIcon = () => (
  <svg {...svgProps}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EditIcon = () => (
  <svg {...svgProps}>
    <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" />
    <path d="m14 8 2 2" />
  </svg>
);

export const DeleteIcon = () => (
  <svg {...svgProps}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...svgProps}>
    <path d="m5 12 5 5L19 7" />
  </svg>
);

export const RejectIcon = () => (
  <svg {...svgProps}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const RefreshIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" />
  </svg>
);

export const PlusIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
