export enum CategoryId {
  AstrologyServices = 'astrology-services',
  PrivateSessions = 'private-sessions',
  PrivateSoundHealing = 'private-sound-healing',
  PrivateReikiHealingTraining = 'private-reiki-healing-training',
  RecoverySuite = 'recovery-suite',
  ReikiLevel3Training = 'reiki-level-3-training',
  ZenvidaOnTheMove = 'zenvida-on-the-move',
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  [CategoryId.AstrologyServices]: 'Astrology Services',
  [CategoryId.PrivateSessions]: 'Private Sessions',
  [CategoryId.PrivateSoundHealing]: 'Private Sound Healing',
  [CategoryId.PrivateReikiHealingTraining]: 'Prv Reiki Healing /Training',
  [CategoryId.RecoverySuite]: 'Recovery Suite',
  [CategoryId.ReikiLevel3Training]: 'Reiki Level 3 Training',
  [CategoryId.ZenvidaOnTheMove]: 'ZenVida On The Move Session',
};

export function isCategoryId(value: string): value is CategoryId {
  return Object.values(CategoryId).includes(value as CategoryId);
}
