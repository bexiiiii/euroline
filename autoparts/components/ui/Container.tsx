// app/components/ui/container.tsx

import { cn } from "@/lib/utils";
import { ReactNode } from "react";


interface ContainerProps {
    children?: ReactNode,
    className?: string
}

function Container({ children, className }: ContainerProps) {
    return (
        <div className="container mx-auto px-4">
  {children}
</div>
    );
}

export default Container;