// How slow and unreliable the mock server is. Tests change these.
export const network = {
  minDelay: 200,
  maxDelay: 1500,
  failRate: 0.15,
  reserveFailRate: 0.1,
};
