import { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { T } from '../theme';
import { CloseIcon, CopyIcon } from '../components/Icons';
import { useWallet } from '../services/WalletContext';
import { useNetwork } from '../services/NetworkContext';
import { NETWORK_LABELS } from '../services/constants';

function QrCode({ data, size = 200 }: { data: string; size?: number }) {
  const canvasRef = useRef<SVGRectElement[]>([]);
  const modules = 25;

  function generateQR(text: string): boolean[][] {
    const len = text.length;
    const bitLength = len * 8 + 16;
    const side = Math.ceil(Math.sqrt(bitLength)) + 2;
    const matrix: boolean[][] = Array.from({ length: side + 8 }, () =>
      Array.from({ length: side + 8 }, () => false),
    );
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++)
        matrix[i][j] = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++)
        matrix[i][side + 1 - 7 + j] = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++)
        matrix[side + 1 - 7 + i][j] = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);

    const bytes = new TextEncoder().encode(text);
    let bitIdx = 0;
    for (const byte of bytes) {
      for (let b = 7; b >= 0; b--) {
        const bit = (byte >> b) & 1;
        const x = 8 + Math.floor(bitIdx / (side - 8));
        const y = 8 + (bitIdx % (side - 8));
        if (x < side + 1 && y < side + 1) matrix[x][y] = bit === 1;
        bitIdx++;
      }
    }

    return matrix;
  }

  const pattern = generateQR(data);

  const moduleSize = size / (pattern.length || 25);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${pattern.length} ${pattern.length}`}>
      {pattern.map((row, r) =>
        row.map((v, c) =>
          v ? <Rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={T.ink} /> : null
        )
      )}
    </Svg>
  );
}

export default function ReceiveScreen({ navigation }: any) {
  const [copied, setCopied] = useState(false);
  const { hotAddress } = useWallet();
  const { network } = useNetwork();

  const handleCopy = () => {
    Clipboard.setStringAsync(hotAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Share.share({ message: hotAddress });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrContainer}>
          <View style={styles.qrCard}>
            <QrCode data={hotAddress} size={200} />
          </View>
        </View>

        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>{NETWORK_LABELS[network]} Address</Text>
        </View>

        <Text style={styles.label}>Your Address</Text>
        <View style={styles.addressCard}>
          <Text style={styles.addressText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
            {hotAddress}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
            {copied ? (
              <Text style={styles.copyCheck}>✓</Text>
            ) : (
              <CopyIcon size={18} color={T.ink} />
            )}
            <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.networkWarning}>
          <Text style={styles.warningText}>
            Only send {NETWORK_LABELS[network]} (SPL) tokens to this address. Sending other network tokens may result in loss.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: T.s4, paddingTop: 56, paddingBottom: T.s4 },
  headerTitle: { fontFamily: T.fontBold, fontSize: 18, color: T.ink },
  content: { flex: 1, paddingHorizontal: T.s4, alignItems: 'center' },
  qrContainer: { marginTop: T.s5, marginBottom: T.s3 },
  qrCard: { backgroundColor: T.ink, padding: T.s4, borderRadius: T.radius },
  networkBadge: { backgroundColor: T.accent + '20', paddingHorizontal: T.s4, paddingVertical: T.s1, borderRadius: T.radiusFull, marginBottom: T.s4 },
  networkBadgeText: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.accent },
  label: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted, marginBottom: T.s2, alignSelf: 'flex-start' },
  addressCard: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, width: '100%', marginBottom: T.s4 },
  addressText: { fontFamily: T.fontFamily, fontSize: 14, color: T.ink, lineHeight: 20, letterSpacing: 0.3 },
  buttonRow: { flexDirection: 'row', gap: T.s3, marginBottom: T.s5, width: '100%' },
  copyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: T.s2, backgroundColor: T.accent, paddingVertical: T.s3, borderRadius: T.radius },
  copyText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  copyCheck: { fontFamily: T.fontBold, fontSize: 18, color: T.ink },
  shareBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: T.s3, borderRadius: T.radius, borderWidth: 1, borderColor: T.accent },
  shareText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.accent },
  networkWarning: { backgroundColor: T.warning + '10', borderRadius: T.radius, padding: T.s4, borderWidth: 1, borderColor: T.warning + '30' },
  warningText: { fontFamily: T.fontFamily, fontSize: 12, color: T.warning, lineHeight: 18, textAlign: 'center' },
});
