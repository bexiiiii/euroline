import React, { ReactNode, cloneElement, isValidElement } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "xs" | "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: React.MouseEventHandler<HTMLButtonElement>; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Custom className
  type?: "button" | "submit" | "reset";
  asChild?: boolean; // Render provided child instead of button
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  asChild = false,
}) => {
  // Size Classes
  const sizeClasses = {
    xs: "px-3 py-2 text-xs",
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
  };

  const baseClasses = `inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${
    sizeClasses[size]
  } ${variantClasses[variant]} ${
    disabled ? "cursor-not-allowed opacity-50" : ""
  } ${className}`.trim();

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      onClick?: React.MouseEventHandler<HTMLElement>;
    }>;
    const childClassName = child.props.className ?? "";

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (child.props.onClick) {
        child.props.onClick(event);
      }

      if (onClick) {
        // Cast is safe because the consumer opts into asChild behaviour.
        (onClick as unknown as React.MouseEventHandler<HTMLElement>)(event);
      }
    };

    return cloneElement(child, {
      className: `${baseClasses} ${childClassName}`.trim(),
      onClick: handleClick,
    });
  }

  return (
    <button
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
