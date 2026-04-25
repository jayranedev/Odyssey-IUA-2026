import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const palette = {
  paper: '#F2EDE2',
  paper2: '#EBE5D6',
  card: '#FBF7EC',
  ink: '#0E2C5A',
  ink2: '#143768',
  grid: 'rgba(14, 44, 90, 0.08)',
  gridStrong: 'rgba(14, 44, 90, 0.16)',
  yellow: '#F4C61E',
  yellowDeep: '#D9AC0A',
  brick: '#C24F2C',
  brickSoft: '#F0B89F',
  graphite: '#3D3A33',
  mute: '#7A7468',
  white: '#FFFFFF',
};

const navItems = [
  { id: 'workshop', label: 'WORKSHOP', icon: 'hammer-wrench', active: true },
  { id: 'scrap', label: 'SCRAP', icon: 'recycle' },
  { id: 'ledger', label: 'LEDGER', icon: 'cash-multiple' },
  { id: 'ai', label: 'AI HUB', icon: 'robot-industrial' },
];

const scraps = [
  'OLD CYCLE RIM',
  'PVC PIPE (2M)',
  'RUSTED TIN SHEET',
];

const gridLines = Array.from({ length: 20 }, (_, index) => index);
const defaultScannerImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDAmKED5mqquku6Up5tE3HA3ge0yEC1CL9RqRb1_1AyHVjXRjEenY5m2wZDxW-afyaOfPnSZTlUz3Vq6oMWFBC84UN0DVvo9Ihdmhh6v-7706Ft4Xkmv6TaZ_0IHpfCL6dKqUPe1QYteiq3eZCeStFQ4Gxtf7GGPWYBGNkfq38YP4TLjq-4L23JBu2c3sell55DYUuWGU2DH8j1XmQGsIUDZKWrz2QiVKgXG0JcUj-qI-7A3_8qP9Eb5W0RCyVZNoqk0NOBg04_4F0';

function Ico({ name, size = 20, color = palette.ink }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

function CornerTape({ side }) {
  return (
    <View
      style={[
        styles.cornerTape,
        side === 'left' ? styles.cornerTapeLeft : styles.cornerTapeRight,
      ]}
    />
  );
}

function BlueprintFrame({ children, style }) {
  return (
    <View style={[styles.blueprintFrame, style]}>
      <View style={styles.blueprintShadow} />
      <CornerTape side="left" />
      <CornerTape side="right" />
      {children}
    </View>
  );
}

function ScrapRow({ label }) {
  return (
    <View style={styles.scrapRow}>
      <View style={styles.scrapRowLeft}>
        <Ico name="recycle" size={26} />
        <Text style={styles.scrapLabel}>{label}</Text>
      </View>
      <Ico name="close" size={28} color="#C61E1E" />
    </View>
  );
}

function BottomNav() {
  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <Pressable key={item.id} style={styles.bottomNavItem}>
          <View style={[styles.bottomTile, item.active ? styles.bottomTileActive : null]}>
            <Ico name={item.icon} size={22} color={palette.ink} />
          </View>
          <Text style={styles.bottomLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function GridPaper() {
  return (
    <View pointerEvents="none" style={styles.gridLayer}>
      {gridLines.map((index) => (
        <View
          key={`v-${index}`}
          style={[styles.gridLineVertical, { left: index * 24 }]}
        />
      ))}
      {gridLines.map((index) => (
        <View
          key={`h-${index}`}
          style={[styles.gridLineHorizontal, { top: index * 24 }]}
        />
      ))}
    </View>
  );
}

export default function JugaadMobileApp() {
  const [budget, setBudget] = useState(500);
  const [scannedImage, setScannedImage] = useState(null);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to click a scrap photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setScannedImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setScannedImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon}>
            <Ico name="menu" size={28} />
          </Pressable>
          <Text style={styles.headerTitle}>JUGAAD WORKSHOP</Text>
          <Pressable style={styles.headerIcon}>
            <Ico name="account-circle-outline" size={28} />
          </Pressable>
        </View>

        <View style={styles.headerRule} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridBackground}>
            <GridPaper />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>01</Text>
              <Text style={styles.sectionTitle}>LOG THE ISSUE</Text>
              <Text style={styles.urgentText}>Urgent?</Text>
            </View>

            <BlueprintFrame style={styles.problemCard}>
              <TextInput
                multiline
                placeholder="DESCRIBE THE BROKEN MACHINE OR DESIRED TOOL HERE..."
                placeholderTextColor="#BDC5D6"
                style={styles.problemInput}
                textAlignVertical="top"
              />
              <View style={styles.problemFooter}>
                <Text style={styles.dashedLine}>- - - - - - - - - - - - - - - - - - - - - -</Text>
                <Text style={styles.dateText}>DATE: 24/05/2024</Text>
              </View>
            </BlueprintFrame>

            <BlueprintFrame style={styles.scannerCard}>
              <View style={styles.scannerBadge}>
                <View style={styles.scannerDot} />
                <Text style={styles.scannerBadgeText}>SCANNER ACTIVE</Text>
              </View>

              <Pressable style={styles.scannerImageArea} onPress={openCamera}>
                <Image
                  source={{ uri: scannedImage || defaultScannerImage }}
                  style={styles.scannedPhoto}
                  resizeMode="cover"
                />

                <View style={styles.cameraBadge}>
                  <Ico name="camera-outline" size={28} color={palette.paper} />
                </View>
              </Pressable>

              <View style={styles.scannerActions}>
                <Pressable style={styles.scannerActionButton} onPress={openCamera}>
                  <Ico name="camera" size={16} color={palette.card} />
                  <Text style={styles.scannerActionText}>TAKE PHOTO</Text>
                </Pressable>
                <Pressable style={[styles.scannerActionButton, styles.scannerActionGhost]} onPress={openGallery}>
                  <Ico name="image-outline" size={16} color={palette.ink} />
                  <Text style={[styles.scannerActionText, styles.scannerActionGhostText]}>USE GALLERY</Text>
                </Pressable>
              </View>
            </BlueprintFrame>

            <View style={styles.scrapHeaderRow}>
              <View style={styles.sectionHeaderCompact}>
                <Text style={styles.sectionNumber}>02.</Text>
                <Text style={styles.sectionTitle}>SCRAP INVENTORY</Text>
              </View>
            </View>

            {scraps.map((scrap) => (
              <View key={scrap} style={styles.scrapCard}>
                <ScrapRow label={scrap} />
              </View>
            ))}

            <View style={styles.sectionHeaderBudget}>
              <Text style={styles.sectionNumber}>03.</Text>
              <Text style={styles.sectionTitle}>BUDGET LIMIT</Text>
            </View>

            <BlueprintFrame style={styles.budgetCard}>
              <View style={styles.budgetCurrency}>
                <Text style={styles.currencyLabel}>CURR</Text>
                <Text style={styles.currencySymbol}>R</Text>
              </View>

              <View style={styles.budgetValueWrap}>
                <Text style={styles.budgetValue}>{budget}</Text>
                <View style={styles.budgetDash} />
              </View>

              <View style={styles.budgetControls}>
                <Pressable style={styles.budgetButton} onPress={() => setBudget((value) => value + 50)}>
                  <Ico name="plus" size={28} color={palette.white} />
                </Pressable>
                <Pressable style={styles.budgetButton} onPress={() => setBudget((value) => Math.max(0, value - 50))}>
                  <Ico name="minus" size={28} color={palette.white} />
                </Pressable>
              </View>
            </BlueprintFrame>

            <Text style={styles.allowanceText}>* DAILY FABRICATION ALLOWANCE</Text>

            <Pressable style={styles.generateButton}>
              <View style={styles.generateLeft}>
                <Ico name="hammer-wrench" size={28} color="#111111" />
                <Text style={styles.generateText}>GENERATE SOLUTION</Text>
              </View>
              <Ico name="cog" size={28} color="#111111" />
            </Pressable>

            <Text style={styles.footerCaption}>AI will analyze scrap availability...</Text>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  root: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.paper,
  },
  headerIcon: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 10,
    color: palette.ink,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'Arial', android: 'sans-serif-condensed' }),
  },
  headerRule: {
    height: 8,
    backgroundColor: palette.ink,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.ink2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  gridBackground: {
    position: 'relative',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: palette.paper,
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: palette.grid,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: palette.grid,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionNumber: {
    color: palette.ink,
    fontSize: 18,
    lineHeight: 22,
    marginRight: 8,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  urgentText: {
    marginLeft: 'auto',
    color: '#A45A24',
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  blueprintFrame: {
    position: 'relative',
    borderWidth: 3,
    borderColor: palette.ink,
    backgroundColor: palette.card,
    marginBottom: 22,
  },
  blueprintShadow: {
    position: 'absolute',
    right: -8,
    top: -2,
    bottom: -8,
    width: 8,
    backgroundColor: palette.ink2,
  },
  cornerTape: {
    position: 'absolute',
    top: -10,
    width: 44,
    height: 18,
    backgroundColor: '#B8C5D9',
    zIndex: 3,
  },
  cornerTapeLeft: {
    left: -12,
    transform: [{ rotate: '-46deg' }],
  },
  cornerTapeRight: {
    right: -12,
    transform: [{ rotate: '46deg' }],
  },
  problemCard: {
    minHeight: 320,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 16,
  },
  problemInput: {
    flex: 1,
    minHeight: 220,
    color: palette.graphite,
    fontSize: 22,
    lineHeight: 40,
    textTransform: 'uppercase',
  },
  problemFooter: {
    marginTop: 12,
  },
  dashedLine: {
    color: '#111111',
    fontSize: 14,
    letterSpacing: 1.6,
  },
  dateText: {
    marginTop: 18,
    alignSelf: 'flex-end',
    color: '#9CB3CE',
    fontSize: 14,
    fontWeight: '700',
  },
  scannerCard: {
    padding: 12,
  },
  scannerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9271C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  scannerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.paper,
    marginRight: 8,
  },
  scannerBadgeText: {
    color: palette.white,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
  },
  scannerImageArea: {
    height: 205,
    borderWidth: 2,
    borderColor: palette.ink,
    backgroundColor: '#5E5E5E',
    overflow: 'hidden',
    position: 'relative',
  },
  scannedPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 62,
    height: 62,
    backgroundColor: '#8F7800',
    borderWidth: 4,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  scannerActionButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: palette.ink,
    borderWidth: 2,
    borderColor: palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scannerActionGhost: {
    backgroundColor: palette.card,
  },
  scannerActionText: {
    color: palette.card,
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  scannerActionGhostText: {
    color: palette.ink,
  },
  scrapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  scrapCard: {
    backgroundColor: palette.card,
    borderWidth: 3,
    borderColor: palette.ink,
    marginBottom: 12,
  },
  scrapRow: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrapRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scrapLabel: {
    marginLeft: 16,
    color: palette.ink,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.4,
  },
  budgetCard: {
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingRight: 16,
  },
  budgetCurrency: {
    width: 74,
    borderRightWidth: 1,
    borderRightColor: '#C7D0DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyLabel: {
    color: '#839AB5',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  currencySymbol: {
    color: palette.ink,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
  },
  budgetValueWrap: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  budgetValue: {
    color: palette.ink,
    fontSize: 64,
    lineHeight: 70,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  budgetDash: {
    marginTop: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
    borderStyle: 'dashed',
  },
  budgetControls: {
    justifyContent: 'center',
  },
  budgetButton: {
    width: 50,
    height: 50,
    backgroundColor: palette.ink,
    borderWidth: 2,
    borderColor: '#071B3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  allowanceText: {
    alignSelf: 'flex-end',
    color: '#9AA7BA',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 38,
  },
  generateButton: {
    minHeight: 92,
    backgroundColor: palette.yellow,
    borderWidth: 4,
    borderColor: '#111111',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  generateText: {
    marginLeft: 14,
    color: '#111111',
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 1,
    flexShrink: 1,
  },
  footerCaption: {
    marginTop: 18,
    textAlign: 'center',
    color: '#26345A',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  bottomNav: {
    height: 86,
    flexDirection: 'row',
    borderTopWidth: 3,
    borderTopColor: palette.ink,
    backgroundColor: palette.paper2,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: palette.ink,
  },
  bottomTile: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTileActive: {
    backgroundColor: palette.yellow,
    borderWidth: 2,
    borderColor: '#111111',
  },
  bottomLabel: {
    marginTop: 6,
    color: palette.ink,
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '900',
  },
});
