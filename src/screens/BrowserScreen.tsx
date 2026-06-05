import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import { T } from '../theme';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = (SCREEN_W - T.s4 * 2 - T.s3) / 2;
import { CloseIcon, SearchIcon, GlobeIcon, ZapIcon, SparklesIcon, ShieldIcon, SwapIcon } from '../components/Icons';

interface DApp {
  id: string;
  name: string;
  url: string;
  category: string;
  icon: string;
  color: string;
}

const DAPPS: DApp[] = [
  { id: '1', name: 'Jupiter', url: 'jup.ag', category: 'Swap', icon: 'J', color: '#F7931A' },
  { id: '2', name: 'Magic Eden', url: 'magiceden.io', category: 'NFTs', icon: 'M', color: '#E42575' },
  { id: '3', name: 'Orca', url: 'orca.so', category: 'Swap', icon: 'O', color: '#4DC9F6' },
  { id: '4', name: 'Kamino', url: 'kamino.finance', category: 'Lending', icon: 'K', color: '#7C3AED' },
  { id: '5', name: 'Solend', url: 'solend.fi', category: 'Lending', icon: 'S', color: '#9945FF' },
  { id: '6', name: 'Drift', url: 'drift.trade', category: 'Perps', icon: 'D', color: '#FF6B35' },
  { id: '7', name: 'Sanctum', url: 'sanctum.so', category: 'Staking', icon: 'S', color: '#30D158' },
  { id: '8', name: 'Meteora', url: 'meteora.ag', category: 'Yield', icon: 'M', color: '#FFD60A' },
];

const CATEGORIES = ['All', 'Swap', 'NFTs', 'Lending', 'Perps', 'Staking', 'Yield'];

export default function BrowserScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = DAPPS.filter((dapp) => {
    const matchesSearch = dapp.name.toLowerCase().includes(search.toLowerCase()) ||
      dapp.url.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || dapp.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browser</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <SearchIcon size={16} color={T.inkMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dApps or enter URL"
          placeholderTextColor={T.inkFaint}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catRow}
        contentContainerStyle={{ paddingHorizontal: T.s4, gap: T.s2 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* DApp Grid */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dappGrid}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <GlobeIcon size={40} color={T.inkFaint} />
              <Text style={styles.emptyText}>No dApps found</Text>
            </View>
          ) : (
            filtered.map((dapp) => (
              <TouchableOpacity
                key={dapp.id}
                style={styles.dappCard}
                activeOpacity={0.8}
              >
                <View style={[styles.dappIcon, { backgroundColor: dapp.color + '20' }]}>
                  <Text style={[styles.dappInitial, { color: dapp.color }]}>{dapp.icon}</Text>
                </View>
                <Text style={styles.dappName} numberOfLines={1}>{dapp.name}</Text>
                <Text style={styles.dappUrl} numberOfLines={1}>{dapp.url}</Text>
                <View style={[styles.dappCategory, { backgroundColor: dapp.color + '15' }]}>
                  <Text style={[styles.dappCategoryText, { color: dapp.color }]}>{dapp.category}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Connected Section */}
        <View style={styles.connectedSection}>
          <Text style={styles.connectedTitle}>Connected</Text>
          <View style={styles.connectedCard}>
            <ZapIcon size={16} color={T.safe} />
            <Text style={styles.connectedText}>No dApps currently connected</Text>
          </View>
        </View>
      </ScrollView>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    marginHorizontal: T.s4,
    borderRadius: T.radius,
    paddingHorizontal: T.s4,
    gap: T.s2,
    marginBottom: T.s3,
  },
  searchInput: {
    flex: 1,
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.ink,
    paddingVertical: T.s3,
  },
  catRow: {
    maxHeight: 40,
    marginBottom: T.s4,
  },
  catChip: {
    paddingHorizontal: T.s3,
    paddingVertical: T.s1,
    borderRadius: T.radiusFull,
    backgroundColor: T.surface,
  },
  catChipActive: {
    backgroundColor: T.accent,
  },
  catText: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  catTextActive: {
    color: T.ink,
    fontFamily: T.fontSemiBold,
  },
  dappGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.s3,
    marginBottom: T.s6,
  },
  dappCard: {
    width: CARD_W,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  dappIcon: {
    width: 48,
    height: 48,
    borderRadius: T.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.s2,
  },
  dappInitial: {
    fontFamily: T.fontBold,
    fontSize: 20,
  },
  dappName: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.ink,
    marginBottom: 2,
  },
  dappUrl: {
    fontFamily: T.fontFamily,
    fontSize: 10,
    color: T.inkMuted,
    marginBottom: T.s1,
  },
  dappCategory: {
    paddingHorizontal: T.s2,
    paddingVertical: 1,
    borderRadius: T.radiusSm - 4,
  },
  dappCategoryText: {
    fontFamily: T.fontFamily,
    fontSize: 9,
  },
  connectedSection: {
    marginBottom: T.s6,
  },
  connectedTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: 16,
    color: T.ink,
    marginBottom: T.s2,
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s2,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
  },
  connectedText: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: T.s7,
    gap: T.s3,
  },
  emptyText: {
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.inkFaint,
  },
});
