export const cardBase =
  "relative overflow-hidden rounded-[26px] border border-white/20 bg-white/80 px-8 py-8 shadow-[0_28px_75px_rgba(15,23,42,0.14)] ring-1 ring-white/30 backdrop-blur-2xl transition-shadow duration-300 dark:border-white/10 dark:bg-[rgba(15,25,44,0.72)] dark:ring-white/10 dark:shadow-[0_32px_90px_rgba(2,6,23,0.6)]";

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
