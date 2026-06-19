import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { T } from '../theme';
import { CloseIcon, CopyIcon } from '../components/Icons';

function QrCode({ size = 200 }: { size?: number }) {
  const modules = 21;
  const moduleSize = size / modules;
  const pattern = new Array(modules).fill(null).map(() =>
    new Array(modules).fill(null).map(() => Math.random() > 0.55)
  );
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++)
      pattern[r][c] = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++)
      pattern[r][modules - 7 + c] = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++)
      pattern[modules - 7 + r][c] = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${modules} ${modules}`}>
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
  const address = '4f3c9a8b7c6d5e4f3c2b1a0d9e8f7c6b5a4f3c2b1a0d9e8f7c6b5a4f3c2b';

  const handleCopy = () => {
    Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <QrCode size={200} />
          </View>
        </View>

        <Text style={styles.label}>Your Address</Text>
        <View style={styles.addressCard}>
          <Text style={styles.addressText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
            {address}
          </Text>
        </View>

        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
          {copied ? (
            <>
              <Text style={styles.copyCheck}>✓</Text>
              <Text style={styles.copyText}>Copied!</Text>
            </>
          ) : (
            <>
              <CopyIcon size={18} color={T.ink} />
              <Text style={styles.copyText}>Copy Address</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.networkWarning}>
          <Text style={styles.warningText}>
            Only send Solana (SPL) tokens to this address. Sending other network tokens may result in loss.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.s4,
    paddingTop: 56,
    paddingBottom: T.s4,
  },
  headerTitle: {
    fontFamily: T.fontBold,
    fontSize: 18,
    color: T.ink,
  },
  content: {
    flex: 1,
    paddingHorizontal: T.s4,
    alignItems: 'center',
  },
  qrContainer: {
    marginTop: T.s5,
    marginBottom: T.s5,
  },
  qrCard: {
    backgroundColor: T.ink,
    padding: T.s4,
    borderRadius: T.radius,
  },
  label: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
    marginBottom: T.s2,
    alignSelf: 'flex-start',
  },
  addressCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    width: '100%',
    marginBottom: T.s5,
  },
  addressText: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.ink,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s2,
    backgroundColor: T.accent,
    paddingVertical: T.s3,
    paddingHorizontal: T.s6,
    borderRadius: T.radius,
    marginBottom: T.s5,
  },
  copyText: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  copyCheck: {
    fontFamily: T.fontBold,
    fontSize: 18,
    color: T.ink,
  },
  networkWarning: {
    backgroundColor: T.warning + '10',
    borderRadius: T.radius,
    padding: T.s4,
    borderWidth: 1,
    borderColor: T.warning + '30',
  },
  warningText: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.warning,
    lineHeight: 18,
    textAlign: 'center',
  },
});
