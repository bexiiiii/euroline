import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface GetStartedButtonProps {
  onClick?: () => void;
  label?: string; // 👈 можно передать текст
  className?: string;
  disabled?: boolean;
}

export function GetStartedButton({
  onClick,
  label = "Добавить в корзину", // 👈 дефолтный текст
  className = "",
  disabled = false,
}: GetStartedButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative overflow-hidden h-14 px-8 text-lg bg-orange-400 hover:bg-orange-500 text-white",
        disabled && "opacity-50 cursor-not-allowed hover:bg-orange-400",
        className
      )}
      size="lg"
    >
      <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
        {label}
      </span>
      <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/20 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95 text-white">
        <ShoppingCart size={24} strokeWidth={2} aria-hidden="true" />
      </i>
    </Button>
  );
}
