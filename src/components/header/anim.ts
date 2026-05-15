const transition = { duration: 1, ease: [0.76, 0, 0.24, 1] as const };

export const opacity = {
  initial: {
    opacity: 0
  },
  open: {
    opacity: 1,
    transition: { duration: 0.35 }
  },
  closed: {
    opacity: 0,
    transition: { duration: 0.35 }
  }
};

export const height = {
  initial: {
    height: 0
  },
  enter: {
    height: 'auto',
    transition
  },
  exit: {
    height: 0,
    transition
  }
};

export const background = {
  initial: {
    height: 0
  },
  open: {
    height: '100dvh',
    transition
  },
  closed: {
    height: 0,
    transition
  }
};

export const blur = {
  initial: {
    opacity: 1,
    scale: 1
  },
  open: {
    opacity: 0.35,
    scale: 0.985,
    transition: { duration: 0.18 }
  },
  closed: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.18 }
  }
};

export const translate = {
  initial: {
    y: '100%',
    opacity: 0
  },
  enter: (i: any[]) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 1, ease: [0.76, 0, 0.24, 1] as const, delay: i[0] }
  }),
  exit: (i: any[]) => ({
    y: '100%',
    opacity: 0,
    transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] as const, delay: i[1] }
  })
};
