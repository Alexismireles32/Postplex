'use client';

import { Shield, Zap, Flame } from 'lucide-react';
import { PresetConfig } from '@/lib/uniquify';
import { Button } from '@/components/ui/button';

interface PresetCardProps {
  preset: PresetConfig;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

const iconMap = {
  Shield,
  Zap,
  Flame
};

const colorClasses = {
  cyan: {
    bg: 'bg-cyan-100',
    icon: 'text-cyan-600',
    border: 'border-cyan-500',
    indicator: 'bg-cyan-500'
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    border: 'border-purple-500',
    indicator: 'bg-purple-500'
  },
  pink: {
    bg: 'bg-pink-100',
    icon: 'text-pink-600',
    border: 'border-pink-500',
    indicator: 'bg-pink-500'
  }
};

export function PresetCard({ preset, selected, onSelect, onPreview }: PresetCardProps) {
  const IconComponent = iconMap[preset.icon as keyof typeof iconMap];
  const colors = colorClasses[preset.color as keyof typeof colorClasses];

  return (
    <div
      className={`relative bg-white rounded-2xl p-6 shadow-lg transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
        selected ? `ring-4 ${colors.border}` : ''
      }`}
      onClick={onSelect}
    >
      {/* Recommended badge for Smart Mode */}
      {preset.name === 'smart' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
          ⭐ Recommended
        </div>
      )}

      {/* Icon */}
      <div className={`w-16 h-16 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
        <IconComponent className={`w-8 h-8 ${colors.icon}`} />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold mb-2">
        {preset.displayName} {preset.emoji}
      </h3>

      {/* Description */}
      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
        {preset.description}
      </p>

      {/* Detection Risk */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-500 mb-1">Detection Risk</div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < preset.detectionRisk ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
          <span className="text-xs text-gray-600 ml-2">Lowest risk</span>
        </div>
      </div>

      {/* Visual Change */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 mb-1">Visual Change</div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < preset.visualChange ? colors.indicator : 'bg-gray-200'
              }`}
            />
          ))}
          <span className="text-xs text-gray-600 ml-2">
            {preset.visualChange === 1 && 'Minimal change'}
            {preset.visualChange === 3 && 'Noticeable but natural'}
            {preset.visualChange === 5 && 'Obvious changes'}
          </span>
        </div>
      </div>

      {/* Best For */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="text-xs font-medium text-gray-500 mb-2">Best For:</div>
        <ul className="space-y-1">
          {preset.bestFor.map((item, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI note for Smart Mode */}
      {preset.name === 'smart' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-purple-700">
            ✨ AI optimizes each video differently for best results
          </p>
        </div>
      )}

      {/* Preview Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
      >
        Preview Example →
      </Button>
    </div>
  );
}
