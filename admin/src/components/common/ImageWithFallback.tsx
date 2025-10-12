/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from "react";
import { buildImageUrlCandidates, resolveImageUrl } from "@/lib/utils/image";

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src">;

interface ImageWithFallbackProps extends ImgProps {
  src?: string | null;
  fallback?: React.ReactNode;
}

const defaultFallback = (
  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400 dark:bg-white/[0.04] dark:text-gray-500">
    Изображение недоступно
  </div>
);

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = "",
  className,
  fallback = defaultFallback,
  ...rest
}) => {
  const candidates = useMemo(() => buildImageUrlCandidates(src), [src]);
  const [index, setIndex] = useState(0);

  if (!candidates.length || index >= candidates.length) {
    return <>{fallback}</>;
  }

  const currentSrc = candidates[index] ?? resolveImageUrl(src) ?? "";

  const handleError = () => {
    setIndex((prev) => prev + 1);
  };

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default ImageWithFallback;
