import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  containerClassName?: string;
}

/**
 * LazyImage component with native lazy loading, 
 * width/height for CLS prevention, and fade-in animation.
 */
const LazyImage = ({ src, alt, width, height, className, containerClassName }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className={cn("overflow-hidden", containerClassName)}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
};

export default LazyImage;
