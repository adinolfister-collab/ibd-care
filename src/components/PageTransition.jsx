import { motion } from 'framer-motion';

// Animates `left` (position: relative) instead of `x` (transform) so the
// transformed ancestor never becomes the containing block for AppLayout's
// fixed sidebar / bottom nav — web layout stays intact.
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, left: 24 }}
      animate={{ opacity: 1, left: 0 }}
      exit={{ opacity: 0, left: -24 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ position: 'relative' }}
    >
      {children}
    </motion.div>
  );
}