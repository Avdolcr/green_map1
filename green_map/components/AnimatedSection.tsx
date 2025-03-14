"use client";
import { ReactNode, useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  type?: "fade" | "slide" | "scale" | "bounce";
  duration?: number;
  threshold?: number;
  once?: boolean;
}

type AnimationVariant = {
  opacity: number;
  y?: number;
  x?: number;
  scale?: number;
  transition?: {
    duration?: number;
    delay?: number;
    type?: string;
    stiffness?: number;
    damping?: number;
  };
};

const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  type = "fade",
  duration = 0.5,
  threshold = 0.1,
  once = true,
}: AnimatedSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once,
    amount: threshold // Using 'amount' which is the correct property name for threshold
  });

  // Define animation variants based on type and direction
  const getVariants = (): Variants => {
    // Base hidden and visible states
    const hidden: AnimationVariant = { opacity: 0 };
    const visible: AnimationVariant = { 
      opacity: 1,
      transition: {
        duration,
        delay
      }
    };

    // Add direction based transforms
    if (direction === "up") {
      hidden.y = 50;
      visible.y = 0;
    } else if (direction === "down") {
      hidden.y = -50;
      visible.y = 0;
    } else if (direction === "left") {
      hidden.x = 50;
      visible.x = 0;
    } else if (direction === "right") {
      hidden.x = -50;
      visible.x = 0;
    }

    // Modify based on animation type
    if (type === "scale") {
      hidden.scale = 0.8;
      visible.scale = 1;
    } else if (type === "bounce") {
      visible.transition = {
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay
      };
    }

    return {
      hidden,
      visible
    };
  };

  const variants = getVariants();

  return (
    <div ref={ref} className={className}>
      <motion.div
        variants={variants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AnimatedSection; 