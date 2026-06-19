import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { View, Text } from 'react-native';
import { T } from '../theme';

type IconProps = {
  size?: number;
  color?: string;
};

export function WalletIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="wallet-outline" size={size} color={color} />;
}

export function ShieldIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="shield-outline" size={size} color={color} />;
}

export function VaultIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="lock-closed-outline" size={size} color={color} />;
}

export function SendIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="arrow-up-outline" size={size} color={color} />;
}

export function ReceiveIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="arrow-down-outline" size={size} color={color} />;
}

export function SwapIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="swap-horizontal-outline" size={size} color={color} />;
}

export function MoreIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="ellipsis-horizontal" size={size} color={color} />;
}

export function CloseIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="close-outline" size={size} color={color} />;
}

export function CheckIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="checkmark-outline" size={size} color={color} />;
}

export function AlertIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="alert-circle-outline" size={size} color={color} />;
}

export function ArrowUpIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="arrow-up-outline" size={size} color={color} />;
}

export function ArrowDownIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="arrow-down-outline" size={size} color={color} />;
}

export function SettingsIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="settings-outline" size={size} color={color} />;
}

export function HistoryIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="time-outline" size={size} color={color} />;
}

export function PlusIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="add-outline" size={size} color={color} />;
}

export function CopyIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="copy-outline" size={size} color={color} />;
}

export function PercentIcon({ size = 24, color = T.ink }: IconProps) {
  return <Feather name="percent" size={size} color={color} />;
}

export function SearchIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="search-outline" size={size} color={color} />;
}

export function GlobeIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="globe-outline" size={size} color={color} />;
}

export function QrCodeIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="qr-code-outline" size={size} color={color} />;
}

export function ChevronLeftIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="chevron-back-outline" size={size} color={color} />;
}

export function ZapIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="flash-outline" size={size} color={color} />;
}

export function SparklesIcon({ size = 24, color = T.ink }: IconProps) {
  return <Ionicons name="sparkles-outline" size={size} color={color} />;
}

export function DisciFiLogo({ size = 48 }: { size?: number }) {
  const logoSize = size;
  const fontSize = Math.round(size * 0.44);
  const radius = Math.round(size * 0.25);
  return (
    <View
      style={{
        width: logoSize,
        height: logoSize,
        borderRadius: radius,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '900',
          color: '#FFFFFF',
          letterSpacing: -1,
          fontFamily: T.fontBold,
        }}
      >
        D
      </Text>
    </View>
  );
}
