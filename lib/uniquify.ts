/**
 * Video Uniquification System
 * 
 * This module provides preset configurations and utilities for making videos
 * unique through FFmpeg modifications.
 */

export type PresetName = 'safe' | 'smart' | 'maximum';

export interface PresetConfig {
  name: PresetName;
  displayName: string;
  emoji: string;
  description: string;
  detectionRisk: number; // 1-5, where 5 is lowest risk
  visualChange: number; // 1-5, where 5 is maximum change
  bestFor: string[];
  icon: string;
  color: string;
  ranges: ModificationRanges;
}

export interface ModificationRanges {
  speed: { min: number; max: number }; // Playback speed multiplier
  brightness: { min: number; max: number }; // Percentage change
  saturation: { min: number; max: number }; // Percentage change
  crop: { min: number; max: number }; // Percentage from edges
  audioPitch: { min: number; max: number }; // Percentage change
  flipChance: number; // 0-1 probability
  rotation: { min: number; max: number }; // Degrees
  noise: { min: number; max: number }; // Grain intensity 0-10
}

export interface ModificationSettings {
  speed: number;
  brightness: number;
  saturation: number;
  crop: number;
  audioPitch: number;
  flipped: boolean;
  rotation: number;
  noise: number;
}

// Preset Configurations
export const PRESETS: Record<PresetName, PresetConfig> = {
  safe: {
    name: 'safe',
    displayName: 'Safe Mode',
    emoji: '🛡️',
    description: 'Looks almost identical to the original. Very subtle changes that are nearly invisible.',
    detectionRisk: 5,
    visualChange: 1,
    bestFor: [
      'Testing new accounts',
      'High-quality product videos',
      'Brand-focused content'
    ],
    icon: 'Shield',
    color: 'cyan',
    ranges: {
      speed: { min: 0.98, max: 1.02 },
      brightness: { min: -2, max: 3 },
      saturation: { min: -3, max: 3 },
      crop: { min: 0.5, max: 1.5 },
      audioPitch: { min: -0.5, max: 1 },
      flipChance: 0,
      rotation: { min: 0, max: 0 },
      noise: { min: 0, max: 0 }
    }
  },
  smart: {
    name: 'smart',
    displayName: 'Smart Mode',
    emoji: '⚡',
    description: 'Natural-looking changes. Hard to spot the difference, but definitely unique.',
    detectionRisk: 5,
    visualChange: 3,
    bestFor: [
      'Growing multiple accounts',
      'Reposting popular content',
      'Daily posting 2-3 times per day'
    ],
    icon: 'Zap',
    color: 'purple',
    ranges: {
      speed: { min: 0.95, max: 1.05 },
      brightness: { min: -5, max: 7 },
      saturation: { min: -5, max: 8 },
      crop: { min: 1, max: 3 },
      audioPitch: { min: -1.5, max: 2 },
      flipChance: 0.25,
      rotation: { min: 0.2, max: 0.8 },
      noise: { min: 0, max: 3 }
    }
  },
  maximum: {
    name: 'maximum',
    displayName: 'Maximum Mode',
    emoji: '🔥',
    description: 'Clearly different from original. Maximum protection against detection.',
    detectionRisk: 5,
    visualChange: 5,
    bestFor: [
      'Faceless channels',
      'Compilation content',
      'Aggressive reposting strategies'
    ],
    icon: 'Flame',
    color: 'pink',
    ranges: {
      speed: { min: 0.90, max: 1.10 },
      brightness: { min: -8, max: 12 },
      saturation: { min: -8, max: 12 },
      crop: { min: 2, max: 5 },
      audioPitch: { min: -2.5, max: 3 },
      flipChance: 0.5,
      rotation: { min: 0.5, max: 1.5 },
      noise: { min: 3, max: 7 }
    }
  }
};

/**
 * Generate random modification settings within a preset's ranges
 */
export function generateModificationSettings(presetName: PresetName): ModificationSettings {
  const preset = PRESETS[presetName];
  const ranges = preset.ranges;

  return {
    speed: randomInRange(ranges.speed.min, ranges.speed.max),
    brightness: randomInRange(ranges.brightness.min, ranges.brightness.max),
    saturation: randomInRange(ranges.saturation.min, ranges.saturation.max),
    crop: randomInRange(ranges.crop.min, ranges.crop.max),
    audioPitch: randomInRange(ranges.audioPitch.min, ranges.audioPitch.max),
    flipped: Math.random() < ranges.flipChance,
    rotation: randomInRange(ranges.rotation.min, ranges.rotation.max),
    noise: randomInRange(ranges.noise.min, ranges.noise.max)
  };
}

/**
 * Helper to generate a random number within a range
 */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Format modification settings into human-readable descriptions
 */
export function describeModifications(settings: ModificationSettings): string[] {
  const descriptions: string[] = [];

  // Speed
  if (settings.speed < 0.98) {
    descriptions.push('Slightly slower playback');
  } else if (settings.speed > 1.02) {
    descriptions.push('Slightly faster playback');
  } else if (settings.speed !== 1.0) {
    descriptions.push('Subtle speed adjustment');
  }

  // Brightness
  if (settings.brightness > 3) {
    descriptions.push('Brighter appearance');
  } else if (settings.brightness < -3) {
    descriptions.push('Darker appearance');
  } else if (settings.brightness !== 0) {
    descriptions.push('Subtle brightness adjustment');
  }

  // Saturation
  if (settings.saturation > 3) {
    descriptions.push('More vibrant colors');
  } else if (settings.saturation < -3) {
    descriptions.push('Less vibrant colors');
  } else if (settings.saturation !== 0) {
    descriptions.push('Subtle color adjustment');
  }

  // Crop
  if (settings.crop > 0) {
    descriptions.push('Subtle edge crop');
  }

  // Audio
  if (settings.audioPitch !== 0) {
    descriptions.push('Minor audio adjustment');
  }

  // Flip
  if (settings.flipped) {
    descriptions.push('Horizontally flipped');
  }

  // Rotation
  if (settings.rotation !== 0) {
    descriptions.push('Slight rotation');
  }

  // Noise
  if (settings.noise > 0) {
    descriptions.push('Added film grain');
  }

  return descriptions.length > 0 ? descriptions : ['Minimal processing'];
}

/**
 * Estimate storage size for processed videos
 */
export function estimateProcessedStorage(
  videoCount: number,
  versionsPerVideo: number,
  averageSizePerVideo: number = 5 // MB
): { totalMB: number; totalGB: string } {
  const totalVideos = videoCount * versionsPerVideo;
  const totalMB = totalVideos * averageSizePerVideo;
  const totalGB = (totalMB / 1024).toFixed(1);

  return {
    totalMB,
    totalGB: `${totalGB}GB`
  };
}

/**
 * Estimate processing time
 */
export function estimateProcessingTime(
  videoCount: number,
  versionsPerVideo: number,
  averageDuration: number = 45 // seconds
): { totalMinutes: number; displayTime: string } {
  const totalVideos = videoCount * versionsPerVideo;
  // Estimate: ~10 seconds processing per 45 seconds of video
  const processingSecondsPerVideo = (averageDuration / 45) * 10;
  const totalSeconds = totalVideos * processingSecondsPerVideo;
  const totalMinutes = Math.ceil(totalSeconds / 60);

  let displayTime: string;
  if (totalMinutes < 1) {
    displayTime = 'less than a minute';
  } else if (totalMinutes === 1) {
    displayTime = '1 minute';
  } else if (totalMinutes < 60) {
    displayTime = `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    displayTime = minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return {
    totalMinutes,
    displayTime
  };
}

/**
 * Quality check thresholds
 */
export const QUALITY_THRESHOLDS = {
  brightness: {
    min: 30, // Below this is too dark
    max: 240, // Above this is overexposed
  },
  durationDiff: 2, // Max seconds difference allowed
  resolutionLoss: 10, // Max percentage resolution loss allowed
  audioPeak: -1, // dB - peak level indicating clipping
};

/**
 * Quality flag types
 */
export type QualityFlagType = 
  | 'too_dark'
  | 'overexposed'
  | 'duration_change'
  | 'audio_distorted'
  | 'resolution_reduced';

export interface QualityFlag {
  type: QualityFlagType;
  message: string;
  recommendation: string;
}

/**
 * Generate quality flags based on checks
 */
export function generateQualityFlags(
  averageBrightness: number,
  durationDiff: number,
  resolutionLoss: number,
  audioClipping: boolean
): QualityFlag[] {
  const flags: QualityFlag[] = [];

  if (averageBrightness < QUALITY_THRESHOLDS.brightness.min) {
    flags.push({
      type: 'too_dark',
      message: 'Video may be too dark',
      recommendation: 'Reprocess with increased brightness'
    });
  }

  if (averageBrightness > QUALITY_THRESHOLDS.brightness.max) {
    flags.push({
      type: 'overexposed',
      message: 'Video may be overexposed',
      recommendation: 'Reprocess with decreased brightness'
    });
  }

  if (Math.abs(durationDiff) > QUALITY_THRESHOLDS.durationDiff) {
    flags.push({
      type: 'duration_change',
      message: 'Duration changed significantly',
      recommendation: 'Reprocess with different speed settings'
    });
  }

  if (audioClipping) {
    flags.push({
      type: 'audio_distorted',
      message: 'Audio may be distorted',
      recommendation: 'Reprocess with smaller pitch adjustment'
    });
  }

  if (resolutionLoss > QUALITY_THRESHOLDS.resolutionLoss) {
    flags.push({
      type: 'resolution_reduced',
      message: 'Resolution reduced',
      recommendation: 'Reprocess with smaller crop value'
    });
  }

  return flags;
}
