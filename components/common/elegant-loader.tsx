"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ElegantLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  variant?: "default" | "minimal" | "full";
}

export function ElegantLoader({
  size = "md",
  text,
  className,
  variant = "default",
}: ElegantLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <motion.div
            className={cn(
              "rounded-full border-2 border-transparent border-t-red-500 border-r-red-400",
              sizeClasses[size],
            )}
            animate={{ rotate: 360 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-2 border-red-200/30",
              sizeClasses[size],
            )}
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div
        className={cn(
          "min-h-[400px] flex flex-col items-center justify-center gap-6",
          className,
        )}
      >
        <div className="relative">
          {/* Outer ring */}
          <motion.div
            className="w-20 h-20 rounded-full border-2 border-red-100"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-red-500 border-r-red-400"
            animate={{ rotate: -360 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* Inner ring */}
          <motion.div
            className="absolute inset-5 rounded-full border-2 border-red-200"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Center dot */}
          <motion.div
            className="absolute inset-[30%] rounded-full bg-gradient-to-br from-red-500 to-rose-600"
            animate={{
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Pulse effect */}
          <motion.div
            className="absolute -inset-4 rounded-full bg-red-500/10"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        {text && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative flex items-center justify-center">
        {/* Background glow */}
        <motion.div
          className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main spinner */}
        <div className="relative">
          <motion.div
            className={cn(
              "rounded-full border-[3px] border-red-100",
              sizeClasses[size],
            )}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className={cn(
              "absolute top-0 left-0 rounded-full border-[3px] border-transparent border-t-red-500 border-r-red-400",
              sizeClasses[size],
            )}
            animate={{ rotate: 360 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-[3px] border-transparent border-b-rose-400 border-l-orange-400",
              sizeClasses[size],
            )}
            animate={{ rotate: -360 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Animated dots */}
        <div className="absolute -bottom-8 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "rounded-full bg-gradient-to-r from-red-500 to-rose-500",
                dotSizes[size],
              )}
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-slate-500 mt-6"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Specialized infinite scroll loader
export function InfiniteScrollLoader({
  loading,
  hasMore,
  className,
}: {
  loading: boolean;
  hasMore: boolean;
  className?: string;
}) {
  if (!loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("py-8 flex justify-center", className)}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-rose-500/20 blur-2xl rounded-full" />

        {/* Main loader */}
        <div className="relative flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-red-100">
          <div className="relative w-5 h-5">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-200"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500 border-r-rose-400"
              animate={{ rotate: 360 }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <span className="text-sm font-medium text-slate-700">
            Loading more rooms...
          </span>

          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-red-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
