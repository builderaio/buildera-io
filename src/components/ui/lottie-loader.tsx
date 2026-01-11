import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

// Inline Lottie animations for smooth loading experience
// These are lightweight, custom animations that don't require external files

// Pulsing circles animation data
const pulsingCirclesAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "Pulsing Circles",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle 1",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [100] }, { t: 60, s: [30] }, { t: 120, s: [100] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 60, s: [120, 120, 100] }, { t: 120, s: [100, 100, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [80, 80] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse"
        },
        {
          ty: "st",
          c: { a: 0, k: [0.235, 0.275, 0.698, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 4 },
          lc: 2,
          lj: 1,
          nm: "Stroke"
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Circle 2",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [60] }, { t: 60, s: [100] }, { t: 120, s: [60] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [80, 80, 100] }, { t: 60, s: [100, 100, 100] }, { t: 120, s: [80, 80, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [120, 120] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse"
        },
        {
          ty: "st",
          c: { a: 0, k: [0.945, 0.329, 0.220, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3 },
          lc: 2,
          lj: 1,
          nm: "Stroke"
        }
      ]
    }
  ]
};

// Data processing animation
const dataProcessingAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 180,
  w: 200,
  h: 200,
  nm: "Data Processing",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Dot 1",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [100] }, { t: 30, s: [30] }, { t: 60, s: [100] }] },
        p: { a: 1, k: [{ t: 0, s: [60, 100, 0] }, { t: 90, s: [140, 100, 0] }, { t: 180, s: [60, 100, 0] }] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 45, s: [130, 130, 100] }, { t: 90, s: [100, 100, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [20, 20] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.235, 0.275, 0.698, 1] },
          o: { a: 0, k: 100 },
          nm: "Fill"
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Dot 2",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 30, s: [100] }, { t: 60, s: [30] }, { t: 90, s: [100] }] },
        p: { a: 1, k: [{ t: 0, s: [100, 80, 0] }, { t: 90, s: [100, 120, 0] }, { t: 180, s: [100, 80, 0] }] },
        s: { a: 1, k: [{ t: 30, s: [100, 100, 100] }, { t: 75, s: [130, 130, 100] }, { t: 120, s: [100, 100, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [20, 20] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.945, 0.329, 0.220, 1] },
          o: { a: 0, k: 100 },
          nm: "Fill"
        }
      ]
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Dot 3",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 60, s: [100] }, { t: 90, s: [30] }, { t: 120, s: [100] }] },
        p: { a: 1, k: [{ t: 0, s: [140, 100, 0] }, { t: 90, s: [60, 100, 0] }, { t: 180, s: [140, 100, 0] }] },
        s: { a: 1, k: [{ t: 60, s: [100, 100, 100] }, { t: 105, s: [130, 130, 100] }, { t: 150, s: [100, 100, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [20, 20] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.235, 0.275, 0.698, 1] },
          o: { a: 0, k: 100 },
          nm: "Fill"
        }
      ]
    }
  ]
};

// Success checkmark animation
const successAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Success",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Check",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [0] }, { t: 20, s: [100] }] },
        p: { a: 0, k: [100, 100, 0] },
        s: { a: 1, k: [{ t: 0, s: [0, 0, 100] }, { t: 30, s: [110, 110, 100] }, { t: 45, s: [100, 100, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              d: 1,
              ks: {
                a: 0,
                k: {
                  c: false,
                  v: [[-30, 0], [-10, 20], [30, -20]],
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]]
                }
              }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.235, 0.275, 0.698, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 8 },
              lc: 2,
              lj: 2
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Check Mark"
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        p: { a: 0, k: [100, 100, 0] },
        s: { a: 1, k: [{ t: 0, s: [0, 0, 100] }, { t: 20, s: [105, 105, 100] }, { t: 35, s: [100, 100, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [100, 100] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.235, 0.275, 0.698, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 4 },
          lc: 2,
          lj: 1
        }
      ]
    }
  ]
};

// AI Brain animation
const aiBrainAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "AI Brain",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Pulse 1",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [80] }, { t: 30, s: [20] }, { t: 60, s: [80] }, { t: 90, s: [20] }, { t: 120, s: [80] }] },
        p: { a: 0, k: [100, 100, 0] },
        s: { a: 1, k: [{ t: 0, s: [50, 50, 100] }, { t: 60, s: [120, 120, 100] }, { t: 120, s: [50, 50, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [100, 100] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.235, 0.275, 0.698, 0.3] },
          o: { a: 0, k: 100 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Pulse 2",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [60] }, { t: 40, s: [100] }, { t: 80, s: [60] }, { t: 120, s: [60] }] },
        p: { a: 0, k: [100, 100, 0] },
        s: { a: 1, k: [{ t: 0, s: [70, 70, 100] }, { t: 60, s: [90, 90, 100] }, { t: 120, s: [70, 70, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [80, 80] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.945, 0.329, 0.220, 0.4] },
          o: { a: 0, k: 100 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Core",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        p: { a: 0, k: [100, 100, 0] },
        r: { a: 1, k: [{ t: 0, s: [0] }, { t: 120, s: [360] }] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 60, s: [110, 110, 100] }, { t: 120, s: [100, 100, 100] }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [50, 50] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.235, 0.275, 0.698, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

export type LottieAnimationType = 'pulsing' | 'processing' | 'success' | 'brain';

interface LottieLoaderProps {
  type?: LottieAnimationType;
  size?: number;
  className?: string;
  loop?: boolean;
}

const animations: Record<LottieAnimationType, object> = {
  pulsing: pulsingCirclesAnimation,
  processing: dataProcessingAnimation,
  success: successAnimation,
  brain: aiBrainAnimation
};

export const LottieLoader = ({ 
  type = 'processing', 
  size = 120, 
  className = '',
  loop = true 
}: LottieLoaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Lottie
        animationData={animations[type]}
        loop={loop}
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
};

export { pulsingCirclesAnimation, dataProcessingAnimation, successAnimation, aiBrainAnimation };
