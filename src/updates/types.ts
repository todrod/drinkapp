export type UpdateSnapshot = {
  supported: boolean;
  checking: boolean;
  checkResult: 'idle' | 'current' | 'offline' | 'error';
  available: boolean;
  applying: boolean;
  dismissed: boolean;
  error: string | null;
};

export type AppUpdate = {
  snapshot: UpdateSnapshot;
  dismiss: () => void;
  apply: () => void;
  check: () => Promise<void>;
};
