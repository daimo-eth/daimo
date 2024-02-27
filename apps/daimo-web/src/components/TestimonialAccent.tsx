"use client";
import { motion } from "framer-motion";

export default function TestimonialAccent() {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        default: { duration: 2, ease: "easeInOut" },
        pathLength: { duration: 2, ease: "easeInOut" },
      },
    },
  };

  return (
    <svg
      width="718"
      height="817"
      viewBox="0 0 718 817"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M716.041 2H263.235C118.959 2 2 118.959 2 263.235V624.609C2 754.457 107.263 859.72 237.111 859.72V859.72C366.959 859.72 472.222 754.457 472.222 624.609V428.683"
        className="stroke-[#aaa]/20"
        strokeWidth="3"
        variants={draw}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      />
      <motion.path
        d="M2.00574 1060L454.812 1060C599.088 1060 716.047 943.041 716.047 798.765L716.047 437.391C716.047 307.543 610.784 202.28 480.936 202.28V202.28C351.088 202.28 245.825 307.543 245.825 437.391L245.825 633.317"
        className="stroke-[#aaa]/20"
        strokeWidth="3"
        variants={draw}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      />
    </svg>
  );
}
