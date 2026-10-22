export type UpdateSnapshot = {
  available: boolean;
  applying: boolean;
  dismissed: boolean;
  error: string | null;
};

export type AppUpdate = {
  snapshot: UpdateSnapshot;
  dismiss: () => void;
  apply: () => void;
};
