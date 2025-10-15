// app/components/ui/container.tsx

import { cn } from "@/lib/utils";
import { ReactNode } from "react";


interface ContainerProps {
  children?: ReactNode;
  className?: string;
}

function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("container mx-auto px-4", className)}>
      {children}
    </div>
  );
}

export default Container;
