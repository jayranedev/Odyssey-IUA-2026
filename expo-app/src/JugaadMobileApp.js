import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const palette = {
  paper: '#F2EDE2',
  paper2: '#EBE5D6',
  card: '#FBF7EC',
  ink: '#0E2C5A',
  ink2: '#143768',
  grid: 'rgba(14, 44, 90, 0.08)',
  yellow: '#F4C61E',
  yellowDeep: '#D9AC0A',
  brick: '#C24F2C',
  graphite: '#3D3A33',
  mute: '#7A7468',
  white: '#FFFFFF',
  sage: '#4D7A4A',
  sageLight: '#E7F2E6',
  kraft: '#D8CDBA',
  kraftDeep: '#B8A88E',
};

const navItems = [
  { id: 'workshop', label: 'WORKSHOP', icon: 'hammer-wrench' },
  { id: 'blueprints', label: 'BLUEPRINTS', icon: 'compass-outline' },
  { id: 'bazaari', label: 'BAZAARI', icon: 'storefront-outline' },
  { id: 'archive', label: 'ARCHIVE', icon: 'archive-outline' },
];

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

function GridPaper() {
  const lines = Array.from({ length: 40 }, (_, index) => index);
  return (
    <View pointerEvents="none" style={styles.gridLayer}>
      {lines.map((index) => (
        <View
          key={`v-${index}`}
          style={[styles.gridLineVertical, { left: index * 24 }]}
        />
      ))}
      {lines.map((index) => (
        <View
          key={`h-${index}`}
          style={[styles.gridLineHorizontal, { top: index * 24 }]}
        />
      ))}
    </View>
  );
}

// ─── SCREENS ──────────────────────────────────────────────────

function WorkshopScreen({ budget, setBudget, scannedImage, setScannedImage, openCamera, openGallery, scraps, onGenerate }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Image source={{ uri: scannedImage || defaultScannerImage }} style={styles.scannedPhoto} resizeMode="cover" />
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
          <View key={scrap.id} style={styles.scrapCard}>
            <View style={styles.scrapRow}>
              <View style={styles.scrapRowLeft}>
                <Ico name="recycle" size={26} />
                <Text style={styles.scrapLabel}>{scrap.label}</Text>
              </View>
              <Ico name="close" size={28} color="#C61E1E" />
            </View>
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
            <Pressable style={styles.budgetButton} onPress={() => setBudget((v) => v + 50)}>
              <Ico name="plus" size={28} color={palette.white} />
            </Pressable>
            <Pressable style={styles.budgetButton} onPress={() => setBudget((v) => Math.max(0, v - 50))}>
              <Ico name="minus" size={28} color={palette.white} />
            </Pressable>
          </View>
        </BlueprintFrame>

        <Text style={styles.allowanceText}>* DAILY FABRICATION ALLOWANCE</Text>

        <Pressable style={styles.generateButton} onPress={onGenerate}>
          <View style={styles.generateLeft}>
            <Ico name="hammer-wrench" size={28} color="#111111" />
            <Text style={styles.generateText}>GENERATE SOLUTION</Text>
          </View>
          <Ico name="cog" size={28} color="#111111" />
        </Pressable>

        <Text style={styles.footerCaption}>AI will analyze scrap availability...</Text>
      </View>
    </ScrollView>
  );
}

function BlueprintsScreen() {
  const steps = [
    { n: 1, title: 'BASE FRAME', body: 'Secure the bicycle frame to the heavy wooden base using iron clamps.' },
    { n: 2, title: 'DRIVE CHAIN', body: 'Connect the rear sprocket to the pump impeller using a standard cycle chain.' },
    { n: 3, title: 'INLET VALVE', body: 'Attach the 2-inch PVC pipe to the suction end of the pump.' },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={{ padding: 24 }}>
        <Text style={styles.screenTitle}>BLUEPRINTS</Text>
        <Text style={styles.screenSubtitle}>Verified fabrication schematics</Text>

        <BlueprintFrame style={styles.schematicCard}>
          <View style={styles.schematicHeader}>
            <Text style={styles.schematicId}>ID: BP-772-IND</Text>
            <Text style={styles.schematicStatus}>VERIFIED TOOL</Text>
          </View>
          <View style={styles.schematicCanvas}>
             <Ico name="image-filter-center-focus" size={80} color="#A9C4E5" />
             <Text style={styles.schematicPlaceholderText}>PEDAL-POWERED PUMP SCHEMATIC</Text>
          </View>
          <Pressable style={styles.schematicCallout}>
            <Text style={styles.schematicCalloutText}>USE 12MM BOLTS</Text>
          </Pressable>
        </BlueprintFrame>

        <View style={styles.assemblyBox}>
          <View style={styles.assemblyHeader}>
            <Text style={styles.assemblyTitle}>ASSEMBLY STEPS</Text>
            <Ico name="wrench" size={18} />
          </View>
          {steps.map(s => (
            <View key={s.n} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.n}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepBody}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function BazaariScreen() {
  const transactions = [
    { id: 1, item: 'Mild Steel Pipe (1")', qty: '12 Feet', cost: '₹1,440' },
    { id: 2, item: 'L-Angle Iron (25mm)', qty: '6 Feet', cost: '₹480' },
    { id: 3, item: 'Welding Rods (6013)', qty: '1 Box', cost: '₹350' },
    { id: 4, item: 'Cycle Hub (Rear)', qty: '2 Units', cost: '₹800' },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={{ padding: 24 }}>
        <Text style={styles.screenTitle}>THE BAZAARI</Text>
        
        <View style={styles.brassBill}>
          <View style={styles.billHeader}>
            <Text style={styles.billId}>BILL NO: #JG-2024-089</Text>
            <Text style={styles.billDate}>24 OCT 2024</Text>
          </View>
          
          <View style={styles.billTable}>
            <View style={styles.billTableRowHeader}>
              <Text style={styles.billTableLabel}>MATERIAL</Text>
              <Text style={[styles.billTableLabel, { textAlign: 'right' }]}>EST. PRICE</Text>
            </View>
            {transactions.map(t => (
              <View key={t.id} style={styles.billTableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billTableValue}>{t.item}</Text>
                  <Text style={styles.billTableQty}>{t.qty}</Text>
                </View>
                <Text style={[styles.billTableValue, { fontWeight: '900', textAlign: 'right' }]}>{t.cost}</Text>
              </View>
            ))}
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>TOTAL ESTIMATED COST</Text>
              <Text style={styles.billTotalValue}>₹3,070</Text>
            </View>
          </View>
        </View>

        <View style={styles.dealerSection}>
          <Text style={styles.sectionTitle}>NEAREST DEALERS</Text>
          <View style={styles.dealerCard}>
            <Ico name="storefront" size={24} color={palette.yellow} />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.dealerName}>SHARMA STEEL SCRAP</Text>
              <Text style={styles.dealerMeta}>2.4KM · OPEN NOW</Text>
            </View>
            <Ico name="map-marker" size={24} color={palette.yellow} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function ArchiveScreen() {
  const items = [
    { id: 1, title: 'Zeer Pot Cooler', date: '22 MAY', type: 'SOLVED' },
    { id: 2, title: 'Manual Grain Thresher', date: '15 APR', type: 'LOGGED' },
    { id: 3, title: 'Solar Cycle Frame', date: '08 MAR', type: 'VERIFIED' },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={{ padding: 24 }}>
        <Text style={styles.screenTitle}>ARCHIVES</Text>
        <Text style={styles.screenSubtitle}>History of logs and solutions</Text>

        {items.map(item => (
          <View key={item.id} style={styles.archiveCard}>
            <View style={styles.archiveType}>
              <Text style={styles.archiveTypeText}>{item.type}</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              <Text style={styles.archiveTitle}>{item.title}</Text>
              <Text style={styles.archiveDate}>LOGGED: {item.date}</Text>
            </View>
            <Ico name="chevron-right" size={24} />
          </View>
        ))}

        <BlueprintFrame style={styles.proTipCard}>
          <Text style={styles.proTipTitle}>PRO TIP</Text>
          <Text style={styles.proTipText}>
            "Source MS Square Pipes from Mandi scrap heaps to save up to 40% on fabrication costs."
          </Text>
        </BlueprintFrame>
      </View>
    </ScrollView>
  );
}

// ─── AI HUB (MODAL/OVERLAY) ──────────────────────────────────

function AIHub({ visible, onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, type: 'assistant', text: 'What are you trying to build? Tell me your constraints.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const assistantMsg = { 
        id: Date.now() + 1, 
        type: 'assistant', 
        text: 'I found a solution based on traditional Rajasthani methods. Check the BLUEPRINTS for the Zeer Pot cooler details.',
        isSolution: input.toLowerCase().includes('cooler')
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 1500);
  };

  if (!visible) return null;

  return (
    <View style={styles.aiOverlay}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiHeaderTitle}>JUGAAD AI HUB</Text>
          <Pressable onPress={onClose}><Ico name="close" size={28} /></Pressable>
        </View>
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgBubble, msg.type === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.msgText, msg.type === 'user' ? styles.userMsgText : styles.assistantMsgText]}>{msg.text}</Text>
            </View>
          ))}
          {isTyping && (
            <View style={[styles.msgBubble, styles.assistantBubble]}>
              <Text style={styles.assistantMsgText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput style={styles.chatInput} placeholder="Describe your problem..." value={input} onChangeText={setInput} multiline />
            <Pressable style={styles.sendBtn} onPress={handleSend}><Ico name="arrow-up" color={palette.ink} size={24} /></Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────

export default function JugaadMobileApp() {
  const [activeTab, setActiveTab] = useState('workshop');
  const [budget, setBudget] = useState(500);
  const [scannedImage, setScannedImage] = useState(null);
  const [aiVisible, setAiVisible] = useState(false);
  const [scraps] = useState([
    { id: 1, label: 'OLD CYCLE RIM' },
    { id: 2, label: 'PVC PIPE (2M)' },
    { id: 3, label: 'RUSTED TIN SHEET' },
  ]);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) setScannedImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) setScannedImage(result.assets[0].uri);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'workshop': return <WorkshopScreen budget={budget} setBudget={setBudget} scannedImage={scannedImage} openCamera={openCamera} openGallery={openGallery} scraps={scraps} onGenerate={() => setAiVisible(true)} />;
      case 'blueprints': return <BlueprintsScreen />;
      case 'bazaari': return <BazaariScreen />;
      case 'archive': return <ArchiveScreen />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon}><Ico name="menu" size={28} /></Pressable>
          <Text style={styles.headerTitle}>JUGAAD {activeTab.toUpperCase()}</Text>
          <Pressable style={styles.headerIcon}><Ico name="account-circle-outline" size={28} /></Pressable>
        </View>
        <View style={styles.headerRule} />

        {renderScreen()}

        <View style={styles.bottomNav}>
          {navItems.map((item) => (
            <Pressable key={item.id} style={styles.bottomNavItem} onPress={() => setActiveTab(item.id)}>
              <View style={[styles.bottomTile, activeTab === item.id ? styles.bottomTileActive : null]}>
                <Ico name={item.icon} size={22} color={palette.ink} />
              </View>
              <Text style={styles.bottomLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <AIHub visible={aiVisible} onClose={() => setAiVisible(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  root: { flex: 1, backgroundColor: palette.paper },
  header: { height: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 30, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, marginLeft: 10, color: palette.ink, fontSize: 20, fontWeight: '900', letterSpacing: 0.8 },
  headerRule: { height: 8, backgroundColor: palette.ink },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  gridBackground: { position: 'relative', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  gridLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gridLineVertical: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: palette.grid },
  gridLineHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: palette.grid },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionHeaderCompact: { flexDirection: 'row', alignItems: 'center' },
  sectionHeaderBudget: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  sectionNumber: { color: palette.ink, fontSize: 18, marginRight: 8, fontWeight: '900' },
  sectionTitle: { color: palette.ink, fontSize: 22, fontWeight: '900', letterSpacing: 0.4 },
  urgentText: { marginLeft: 'auto', color: palette.brick, fontSize: 15, fontStyle: 'italic' },
  blueprintFrame: { position: 'relative', borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.card, marginBottom: 22 },
  blueprintShadow: { position: 'absolute', right: -6, bottom: -6, left: 6, top: 6, backgroundColor: palette.ink2, zIndex: -1 },
  cornerTape: { position: 'absolute', top: -10, width: 44, height: 18, backgroundColor: '#B8C5D9', zIndex: 3 },
  cornerTapeLeft: { left: -12, transform: [{ rotate: '-45deg' }] },
  cornerTapeRight: { right: -12, transform: [{ rotate: '45deg' }] },
  problemCard: { minHeight: 200, padding: 20 },
  problemInput: { flex: 1, minHeight: 120, color: palette.graphite, fontSize: 18, lineHeight: 30, textTransform: 'uppercase' },
  problemFooter: { marginTop: 12 },
  dashedLine: { color: palette.ink, fontSize: 14, letterSpacing: 1.6, opacity: 0.3 },
  dateText: { marginTop: 10, alignSelf: 'flex-end', color: palette.mute, fontSize: 12, fontWeight: '700' },
  scannerCard: { padding: 12 },
  scannerBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: palette.brick, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  scannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.white, marginRight: 8 },
  scannerBadgeText: { color: palette.white, fontSize: 12, fontWeight: '900' },
  scannerImageArea: { height: 160, borderWidth: 2, borderColor: palette.ink, backgroundColor: '#333', overflow: 'hidden' },
  scannedPhoto: { ...StyleSheet.absoluteFillObject },
  cameraBadge: { position: 'absolute', right: 12, bottom: 12, width: 48, height: 48, backgroundColor: palette.yellow, borderWidth: 3, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  scannerActions: { marginTop: 10, flexDirection: 'row', gap: 8 },
  scannerActionButton: { flex: 1, height: 40, backgroundColor: palette.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  scannerActionGhost: { backgroundColor: 'transparent', borderWidth: 2, borderColor: palette.ink },
  scannerActionText: { color: palette.white, fontSize: 12, fontWeight: '900' },
  scannerActionGhostText: { color: palette.ink },
  scrapHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  scrapCard: { backgroundColor: palette.card, borderWidth: 2, borderColor: palette.ink, marginBottom: 8 },
  scrapRow: { height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scrapRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  scrapLabel: { marginLeft: 12, color: palette.ink, fontSize: 14, fontWeight: '900' },
  budgetCard: { height: 100, flexDirection: 'row', alignItems: 'stretch' },
  budgetCurrency: { width: 60, borderRightWidth: 1, borderRightColor: palette.ink, opacity: 0.2, alignItems: 'center', justifyContent: 'center' },
  currencyLabel: { fontSize: 10, fontWeight: '900' },
  currencySymbol: { fontSize: 24, fontWeight: '900' },
  budgetValueWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  budgetValue: { fontSize: 48, fontWeight: '900', color: palette.ink },
  budgetDash: { width: '60%', height: 2, backgroundColor: palette.ink, opacity: 0.1 },
  budgetControls: { padding: 10, justifyContent: 'center', gap: 4 },
  budgetButton: { width: 40, height: 35, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  allowanceText: { alignSelf: 'flex-end', color: palette.mute, fontSize: 10, fontWeight: '900', marginTop: 4, marginBottom: 20 },
  generateButton: { height: 70, backgroundColor: palette.yellow, borderWidth: 3, borderColor: palette.ink, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  generateLeft: { flexDirection: 'row', alignItems: 'center' },
  generateText: { marginLeft: 12, color: palette.ink, fontSize: 18, fontWeight: '900' },
  footerCaption: { marginTop: 16, textAlign: 'center', color: palette.mute, fontSize: 12, fontStyle: 'italic' },
  bottomNav: { height: 80, flexDirection: 'row', borderTopWidth: 3, borderTopColor: palette.ink, backgroundColor: palette.paper2 },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomTile: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bottomTileActive: { backgroundColor: palette.yellow, borderWidth: 2, borderColor: palette.ink },
  bottomLabel: { fontSize: 10, fontWeight: '900', color: palette.ink },
  screenTitle: { fontSize: 32, fontWeight: '900', color: palette.ink, marginBottom: 4 },
  screenSubtitle: { fontSize: 14, color: palette.mute, marginBottom: 24 },
  schematicCard: { minHeight: 300, padding: 0 },
  schematicHeader: { padding: 12, borderBottomWidth: 2, borderColor: palette.ink, flexDirection: 'row', justifyContent: 'space-between' },
  schematicId: { fontSize: 12, fontWeight: '900' },
  schematicStatus: { fontSize: 10, color: palette.brick, fontWeight: '900' },
  schematicCanvas: { flex: 1, backgroundColor: '#0A1830', alignItems: 'center', justifyContent: 'center', padding: 20 },
  schematicPlaceholderText: { color: '#A9C4E5', fontSize: 14, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  schematicCallout: { position: 'absolute', top: '40%', left: '10%', backgroundColor: palette.yellow, borderWidth: 1.5, borderColor: palette.ink, padding: 6 },
  schematicCalloutText: { fontSize: 10, fontWeight: '900' },
  assemblyBox: { backgroundColor: '#E0DCCE', borderWidth: 2, borderColor: palette.ink, padding: 16 },
  assemblyHeader: { borderBottomWidth: 2, borderColor: palette.ink, paddingBottom: 8, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' },
  assemblyTitle: { fontSize: 14, fontWeight: '900' },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: palette.white, fontSize: 12, fontWeight: '900' },
  stepTitle: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  stepBody: { fontSize: 13, color: palette.graphite, lineHeight: 18 },
  brassBill: { backgroundColor: palette.kraft, borderWidth: 3, borderColor: palette.ink, padding: 16 },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderColor: palette.ink, paddingBottom: 10, marginBottom: 14 },
  billId: { fontWeight: '900', fontSize: 14 },
  billDate: { fontSize: 12, fontWeight: '700' },
  billTable: { backgroundColor: 'rgba(0,0,0,0.06)' },
  billTableRowHeader: { flexDirection: 'row', backgroundColor: palette.ink, padding: 8 },
  billTableLabel: { color: palette.white, fontSize: 10, fontWeight: '900', flex: 1 },
  billTableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  billTableValue: { fontSize: 13, fontWeight: '700', color: palette.ink },
  billTableQty: { fontSize: 11, color: palette.mute },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(255,255,255,0.5)', borderTopWidth: 1.5, borderColor: palette.ink },
  billTotalLabel: { fontSize: 12, fontWeight: '900' },
  billTotalValue: { fontSize: 16, fontWeight: '900' },
  dealerSection: { marginTop: 24 },
  dealerCard: { backgroundColor: palette.card, borderWidth: 2, borderColor: palette.ink, padding: 16, flexDirection: 'row', alignItems: 'center' },
  dealerName: { fontWeight: '900', fontSize: 14 },
  dealerMeta: { fontSize: 12, color: palette.mute, marginTop: 2 },
  archiveCard: { backgroundColor: palette.card, borderWidth: 2, borderColor: palette.ink, marginBottom: 12, padding: 16, flexDirection: 'row', alignItems: 'center' },
  archiveType: { width: 60, height: 60, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  archiveTypeText: { color: palette.white, fontSize: 10, fontWeight: '900', textAlign: 'center' },
  archiveTitle: { fontSize: 16, fontWeight: '900' },
  archiveDate: { fontSize: 12, color: palette.mute, marginTop: 4 },
  proTipCard: { padding: 16, marginTop: 20, backgroundColor: 'rgba(194, 79, 44, 0.1)', borderStyle: 'dashed' },
  proTipTitle: { color: palette.brick, fontWeight: '900', fontSize: 12, marginBottom: 8 },
  proTipText: { fontStyle: 'italic', color: palette.graphite, lineHeight: 20 },
  aiOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.paper, zIndex: 100 },
  aiHeader: { height: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.grid },
  aiHeaderTitle: { fontSize: 18, fontWeight: '900' },
  msgBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: palette.ink },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: palette.white, borderWidth: 1, borderColor: palette.ink },
  msgText: { fontSize: 15, lineHeight: 22 },
  userMsgText: { color: palette.white },
  assistantMsgText: { color: palette.ink },
  inputContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: palette.paper, padding: 12, borderTopWidth: 1, borderColor: palette.grid },
  inputWrapper: { flexDirection: 'row', backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  chatInput: { flex: 1, fontSize: 16, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, backgroundColor: palette.yellow, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
