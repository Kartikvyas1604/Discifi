import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { T } from '../theme';

type IconProps = {
  size?: number;
  color?: string;
};

export function WalletIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="1.5" />
      <Rect x="14" y="10" width="8" height="6" rx="2" stroke={color} strokeWidth="1.5" />
      <Circle cx="17" cy="13" r="1" fill={color} />
    </Svg>
  );
}

export function ShieldIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L3 7V12C3 17.25 6.75 21.75 12 23C17.25 21.75 21 17.25 21 12V7L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VaultIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="7" width="18" height="14" rx="3" stroke={color} strokeWidth="1.5" />
      <Circle cx="12" cy="14" r="3" stroke={color} strokeWidth="1.5" />
      <Path d="M12 12L12 14L14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="5" y1="7" x2="5" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="19" y1="7" x2="19" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function SendIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M8 8L12 4L16 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ReceiveIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M8 16L12 20L16 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 8V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function SwapIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 16L3 20L7 24" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 20H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M17 8L21 4L17 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 4H7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function MoreIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M18 6L6 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AlertIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 19H22L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="0.75" fill={color} />
    </Svg>
  );
}

export function ArrowUpIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M5 12L12 5L19 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowDownIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M19 12L12 19L5 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <Path d="M12 1V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M12 19V23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M4.22 4.22L7.05 7.05" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M16.95 16.95L19.78 19.78" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M1 12H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M19 12H23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M4.22 19.78L7.05 16.95" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M16.95 7.05L19.78 4.22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function HistoryIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Path d="M12 6V12L16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function CopyIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="12" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <Path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function PercentIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="19" y1="5" x2="5" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="7" cy="7" r="2.5" stroke={color} strokeWidth="1.5" />
      <Circle cx="17" cy="17" r="2.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function GlobeIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Path d="M2 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22C9.5 19.5 8 16 8 12C8 8 9.5 4.5 12 2Z" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function QrCodeIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <Rect x="14" y="14" width="3" height="3" rx="0.5" stroke={color} strokeWidth="1" />
      <Rect x="18" y="14" width="3" height="3" rx="0.5" stroke={color} strokeWidth="1" />
      <Rect x="14" y="18" width="3" height="3" rx="0.5" stroke={color} strokeWidth="1" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ZapIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

export function SparklesIcon({ size = 24, color = T.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L13.09 8.26L18 6L14.78 11.22L20 12L14.78 12.78L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.22 12.78L4 12L9.22 11.22L6 6L10.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}
