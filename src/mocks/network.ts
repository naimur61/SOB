// How slow and unreliable the mock /price endpoint is. Tests change these.
export const network = {
  minDelay: 200,
  maxDelay: 1500,
  failRate: 0.15,
};
