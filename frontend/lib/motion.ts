export const pillSpring = {
  type: "spring" as const,
  stiffness: 150,
  damping: 22,
  mass: 1.1,
};

export const paneEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const paneDuration = 0.55;
export const fadeDuration = 0.48;
export const slideDuration = 0.72;
export const stagger = 0.09;
export const staggerDelay = 0.1;
