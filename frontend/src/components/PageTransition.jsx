import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.35,
  ease: [0.19, 1, 0.22, 1],
};

const noAnimation = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 1, y: 0 },
  transition: { duration: 0 },
};

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.19, 1, 0.22, 1] } },
};

export default function PageTransition({ children }) {
  const prefersReduced = useReducedMotion();
  const motionProps = useMemo(() => (prefersReduced ? noAnimation : {
    variants: pageVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit",
    transition: pageTransition,
  }), [prefersReduced]);

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
}
