import React from "react";

/** Контурные иконки 24x24 для StatCard и кнопок (stroke 1.75). */
const Svg = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

type P = { className?: string };

export const UsersIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
    <circle cx="9.5" cy="7.5" r="3.5" />
    <path d="M21 19v-1a4 4 0 0 0-3-3.87M15.5 4.13a3.5 3.5 0 0 1 0 6.74" />
  </Svg>
);

export const CartIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.76L20 8H6.2" />
    <circle cx="9" cy="20" r="1" />
    <circle cx="17" cy="20" r="1" />
  </Svg>
);

export const BoxIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </Svg>
);

export const WalletIcon = ({ className }: P) => (
  <Svg className={className}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M16 14.5h2" />
  </Svg>
);

export const ChartIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M4 20V4M4 20h16" />
    <path d="m8 15 4-4 3 3 5-6" />
  </Svg>
);

export const ListIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  </Svg>
);

export const AlertIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 3 2.5 20h19L12 3Z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
);

export const CheckCircleIcon = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Svg>
);

export const ClockIcon = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const KeyIcon = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9M17 6l3 3M15 8l2 2" />
  </Svg>
);

export const ServerIcon = ({ className }: P) => (
  <Svg className={className}>
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </Svg>
);

export const DiskIcon = ({ className }: P) => (
  <Svg className={className}>
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </Svg>
);

export const RefreshIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" />
  </Svg>
);

export const EyeIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const TrashIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Svg>
);

export const CopyIcon = ({ className }: P) => (
  <Svg className={className}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);

export const BellIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
    <path d="M10 21h4" />
  </Svg>
);

export const PowerIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 3v8" />
    <path d="M6.3 7.3a8 8 0 1 0 11.4 0" />
  </Svg>
);

export const PlusIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

/** Квадратная иконочная кнопка для действий в строках таблиц. */
export const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 [&>svg]:size-4";

export const iconButtonDangerClass =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:text-error-400 [&>svg]:size-4";

/** Иконочная кнопка в тулбаре (высота как у полей ввода). */
export const toolbarIconButtonClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] [&>svg]:size-4";

/** Общие классы таблиц. */
export const thClass = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
export const tdClass = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";

/** Общая обёртка карточки. */
export const cardClass =
  "rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]";
