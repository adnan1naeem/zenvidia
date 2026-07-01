import { CategoryId } from './category-id.enum';

export enum ServiceId {
  NatalChartReading = 'natal-chart-reading',
  CompatibilityReading = 'compatibility-reading',
  YearAheadForecast = 'year-ahead-forecast',
  WellnessConsultation = 'wellness-consultation',
  GuidedMeditation = 'guided-meditation',
  LifeCoaching = 'life-coaching',
  TibetanBowlSession = 'tibetan-bowl-session',
  CrystalBowlHealing = 'crystal-bowl-healing',
  GongMeditation = 'gong-meditation',
  ReikiHealingSession = 'reiki-healing-session',
  ReikiLevel1 = 'reiki-level-1',
  ReikiLevel2 = 'reiki-level-2',
  InfraredSauna = 'infrared-sauna',
  ColdPlunge = 'cold-plunge',
  CompressionTherapy = 'compression-therapy',
  ReikiMasterTraining = 'reiki-master-training',
  ReikiTeacherCert = 'reiki-teacher-cert',
  MobileYoga = 'mobile-yoga',
  OutdoorMeditation = 'outdoor-meditation',
  CorporateWellness = 'corporate-wellness',
}

export const SERVICE_CATEGORY: Record<ServiceId, CategoryId> = {
  [ServiceId.NatalChartReading]: CategoryId.AstrologyServices,
  [ServiceId.CompatibilityReading]: CategoryId.AstrologyServices,
  [ServiceId.YearAheadForecast]: CategoryId.AstrologyServices,
  [ServiceId.WellnessConsultation]: CategoryId.PrivateSessions,
  [ServiceId.GuidedMeditation]: CategoryId.PrivateSessions,
  [ServiceId.LifeCoaching]: CategoryId.PrivateSessions,
  [ServiceId.TibetanBowlSession]: CategoryId.PrivateSoundHealing,
  [ServiceId.CrystalBowlHealing]: CategoryId.PrivateSoundHealing,
  [ServiceId.GongMeditation]: CategoryId.PrivateSoundHealing,
  [ServiceId.ReikiHealingSession]: CategoryId.PrivateReikiHealingTraining,
  [ServiceId.ReikiLevel1]: CategoryId.PrivateReikiHealingTraining,
  [ServiceId.ReikiLevel2]: CategoryId.PrivateReikiHealingTraining,
  [ServiceId.InfraredSauna]: CategoryId.RecoverySuite,
  [ServiceId.ColdPlunge]: CategoryId.RecoverySuite,
  [ServiceId.CompressionTherapy]: CategoryId.RecoverySuite,
  [ServiceId.ReikiMasterTraining]: CategoryId.ReikiLevel3Training,
  [ServiceId.ReikiTeacherCert]: CategoryId.ReikiLevel3Training,
  [ServiceId.MobileYoga]: CategoryId.ZenvidaOnTheMove,
  [ServiceId.OutdoorMeditation]: CategoryId.ZenvidaOnTheMove,
  [ServiceId.CorporateWellness]: CategoryId.ZenvidaOnTheMove,
};

export function isServiceId(value: string): value is ServiceId {
  return Object.values(ServiceId).includes(value as ServiceId);
}
