export const StableVersion = "stable" as const;
export const BetaVersion = "beta" as const;
export const DevVersion = "dev" as const;
export const CanaryVersion = "canary" as const;

export type Version =
  | typeof StableVersion
  | typeof BetaVersion
  | typeof DevVersion
  | typeof CanaryVersion;

export const valueOfVersion = (value: string): Version => {
  switch (value) {
    case StableVersion:
    case BetaVersion:
    case DevVersion:
    case CanaryVersion:
      return value;
    default:
      throw new Error(`Unsupported versions: ${value}`);
  }
};
