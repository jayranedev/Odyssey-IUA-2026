import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
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

// ── API config ────────────────────────────────────────────────
// Android emulator: 10.0.2.2 → host machine localhost
// Physical device: replace with your machine's local IP e.g. 192.168.1.x
const API_BASE = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';

function genId() {
  return `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Palette ───────────────────────────────────────────────────
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

function Ico({ name, size = 20, color = palette.ink }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

function CornerTape({ side }) {
  return (
    <View style={[styles.cornerTape, side === 'left' ? styles.cornerTapeLeft : styles.cornerTapeRight]} />
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
  const lines = Array.from({ length: 40 }, (_, i) => i);
  return (
    <View pointerEvents="none" style={styles.gridLayer}>
      {lines.map(i => <View key={`v-${i}`} style={[styles.gridLineVertical, { left: i * 24 }]} />)}
      {lines.map(i => <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: i * 24 }]} />)}
    </View>
  );
}

// ─── SOLUTION CARD ────────────────────────────────────────────

function SolutionCard({ solution, onBlueprint, onBazaari }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.solutionCard}>
      <View style={styles.solutionHeader}>
        <Text style={styles.solutionTitle}>{solution.title}</Text>
        {solution.total_cost_inr > 0 && (
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>₹{Math.round(solution.total_cost_inr)}</Text>
          </View>
        )}
      </View>

      {solution.summary ? (
        <Text style={styles.solutionSummary}>{solution.summary}</Text>
      ) : null}

      {expanded && (
        <>
          {solution.materials?.length > 0 && (
            <View style={styles.solutionSection}>
              <Text style={styles.solutionSectionLabel}>MATERIALS</Text>
              {solution.materials.map((m, i) => (
                <View key={i} style={styles.materialRow}>
                  <Text style={styles.materialItem}>{m.item}</Text>
                  <Text style={styles.materialCost}>₹{Math.round(m.cost_inr ?? m.estimated_cost_inr ?? 0)}</Text>
                </View>
              ))}
            </View>
          )}

          {solution.build_steps?.length > 0 && (
            <View style={styles.solutionSection}>
              <Text style={styles.solutionSectionLabel}>STEPS</Text>
              {solution.build_steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                  <Text style={styles.stepBody}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {solution.expected_outcome ? (
            <View style={[styles.solutionSection, { backgroundColor: '#E7F2E6', padding: 10 }]}>
              <Text style={[styles.solutionSectionLabel, { color: palette.sage }]}>EXPECTED RESULT</Text>
              <Text style={styles.stepBody}>{solution.expected_outcome}</Text>
            </View>
          ) : null}
        </>
      )}

      <Pressable onPress={() => setExpanded(e => !e)} style={styles.expandBtn}>
        <Text style={styles.expandBtnText}>{expanded ? '▲ Less' : '▼ Full solution'}</Text>
      </Pressable>

      <View style={styles.solutionActions}>
        {solution.build_steps?.length > 0 && (
          <Pressable style={styles.actionBtn} onPress={onBlueprint}>
            <Ico name="floor-plan" size={16} color={palette.ink} />
            <Text style={styles.actionBtnText}>BLUEPRINT</Text>
          </Pressable>
        )}
        {solution.materials?.length > 0 && (
          <Pressable style={[styles.actionBtn, { backgroundColor: palette.ink }]} onPress={onBazaari}>
            <Ico name="storefront-outline" size={16} color={palette.white} />
            <Text style={[styles.actionBtnText, { color: palette.white }]}>BAZAARI</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── SCREENS ──────────────────────────────────────────────────

function WorkshopScreen({ budget, setBudget, scannedImage, openCamera, openGallery, scraps, onGenerate }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.gridBackground}>
        <GridPaper />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>
          <Text style={styles.sectionTitle}>LOG THE ISSUE</Text>
          <Text style={styles.urgentText}>Urgent?</Text>
        </View>

        <BlueprintFrame style={styles.scannerCard}>
          <View style={styles.scannerBadge}>
            <View style={styles.scannerDot} />
            <Text style={styles.scannerBadgeText}>SCANNER ACTIVE</Text>
          </View>
          <Pressable style={styles.scannerImageArea} onPress={openCamera}>
            {scannedImage ? (
              <Image source={{ uri: scannedImage }} style={styles.scannedPhoto} resizeMode="cover" />
            ) : (
              <View style={[styles.scannedPhoto, { backgroundColor: '#1a2a4a', alignItems: 'center', justifyContent: 'center' }]}>
                <Ico name="camera-plus-outline" size={48} color="#A9C4E5" />
                <Text style={{ color: '#A9C4E5', fontSize: 11, fontWeight: '900', marginTop: 8 }}>TAP TO SCAN SCRAPS</Text>
              </View>
            )}
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

        <View style={styles.sectionHeaderBudget}>
          <Text style={styles.sectionNumber}>02.</Text>
          <Text style={styles.sectionTitle}>BUDGET LIMIT</Text>
        </View>

        <BlueprintFrame style={styles.budgetCard}>
          <View style={styles.budgetCurrency}>
            <Text style={styles.currencyLabel}>CURR</Text>
            <Text style={styles.currencySymbol}>₹</Text>
          </View>
          <View style={styles.budgetValueWrap}>
            <Text style={styles.budgetValue}>{budget}</Text>
            <View style={styles.budgetDash} />
          </View>
          <View style={styles.budgetControls}>
            <Pressable style={styles.budgetButton} onPress={() => setBudget(v => v + 50)}>
              <Ico name="plus" size={28} color={palette.white} />
            </Pressable>
            <Pressable style={styles.budgetButton} onPress={() => setBudget(v => Math.max(0, v - 50))}>
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

function BlueprintsScreen({ blueprint }) {
  if (!blueprint) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
          <Ico name="floor-plan" size={64} color={palette.mute} />
          <Text style={[styles.screenTitle, { textAlign: 'center', marginTop: 16 }]}>NO BLUEPRINT</Text>
          <Text style={{ color: palette.mute, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Generate a solution in the AI Hub and tap BLUEPRINT to load it here.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={{ padding: 24 }}>
        <Text style={styles.screenTitle}>BLUEPRINT</Text>
        <Text style={styles.screenSubtitle}>{blueprint.title}</Text>

        {blueprint.total_cost_inr > 0 && (
          <View style={[styles.costBadge, { alignSelf: 'flex-start', marginBottom: 16 }]}>
            <Text style={styles.costBadgeText}>TOTAL: ₹{Math.round(blueprint.total_cost_inr)}</Text>
          </View>
        )}

        {blueprint.summary ? (
          <Text style={{ color: palette.graphite, lineHeight: 22, marginBottom: 20 }}>{blueprint.summary}</Text>
        ) : null}

        <View style={styles.assemblyBox}>
          <View style={styles.assemblyHeader}>
            <Text style={styles.assemblyTitle}>ASSEMBLY STEPS</Text>
            <Ico name="wrench" size={18} />
          </View>
          {blueprint.build_steps?.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepBody}>{step}</Text>
            </View>
          ))}
        </View>

        {blueprint.failure_modes?.length > 0 && (
          <View style={[styles.assemblyBox, { backgroundColor: '#FDECEA', borderColor: palette.brick, marginTop: 16 }]}>
            <Text style={[styles.assemblyTitle, { color: palette.brick }]}>⚠ FAILURE MODES</Text>
            {blueprint.failure_modes.map((f, i) => (
              <Text key={i} style={{ fontSize: 13, color: palette.graphite, marginTop: 6, lineHeight: 18 }}>• {f}</Text>
            ))}
          </View>
        )}

        {blueprint.expected_outcome ? (
          <View style={[styles.assemblyBox, { backgroundColor: palette.sageLight, borderColor: palette.sage, marginTop: 16 }]}>
            <Text style={[styles.assemblyTitle, { color: palette.sage }]}>EXPECTED RESULT</Text>
            <Text style={{ fontSize: 13, color: palette.graphite, marginTop: 8, lineHeight: 18 }}>{blueprint.expected_outcome}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function BazaariScreen({ bazaari }) {
  if (!bazaari) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
          <Ico name="storefront-outline" size={64} color={palette.mute} />
          <Text style={[styles.screenTitle, { textAlign: 'center', marginTop: 16 }]}>NO BILL YET</Text>
          <Text style={{ color: palette.mute, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Generate a solution in the AI Hub and tap BAZAARI to load the materials bill.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={{ padding: 24 }}>
        <Text style={styles.screenTitle}>THE BAZAARI</Text>
        <Text style={styles.screenSubtitle}>{bazaari.title}</Text>

        <View style={styles.brassBill}>
          <View style={styles.billHeader}>
            <Text style={styles.billId}>MATERIALS BILL</Text>
            <Text style={styles.billDate}>{new Date().toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={styles.billTable}>
            <View style={styles.billTableRowHeader}>
              <Text style={styles.billTableLabel}>MATERIAL</Text>
              <Text style={[styles.billTableLabel, { textAlign: 'right' }]}>EST. PRICE</Text>
            </View>
            {bazaari.materials?.map((m, i) => (
              <View key={i} style={styles.billTableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billTableValue}>{m.item}</Text>
                  <Text style={styles.billTableQty}>{m.quantity} · {m.source}</Text>
                </View>
                <Text style={[styles.billTableValue, { fontWeight: '900', textAlign: 'right' }]}>
                  ₹{Math.round(m.cost_inr ?? m.estimated_cost_inr ?? 0)}
                </Text>
              </View>
            ))}
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>TOTAL ESTIMATED COST</Text>
              <Text style={styles.billTotalValue}>₹{Math.round(bazaari.total_cost_inr ?? 0)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dealerSection}>
          <Text style={styles.sectionTitle}>NEAREST DEALERS</Text>
          {['Hardware Store', 'Kabadiwala', 'Agriculture Shop'].map((type, i) => (
            <View key={i} style={[styles.dealerCard, { marginBottom: 8 }]}>
              <Ico name="storefront" size={24} color={palette.yellow} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.dealerName}>{type.toUpperCase()}</Text>
                <Text style={styles.dealerMeta}>Nearby · Check Google Maps</Text>
              </View>
              <Ico name="map-marker" size={24} color={palette.yellow} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function ArchiveScreen({ onSelectCard }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/archive`)
      .then(r => r.json())
      .then(data => { setCards(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={{ padding: 24 }}>
        <Text style={styles.screenTitle}>ARCHIVES</Text>
        <Text style={styles.screenSubtitle}>History of logs and solutions</Text>

        {loading && <ActivityIndicator color={palette.ink} style={{ marginTop: 40 }} />}

        {cards.map(card => (
          <Pressable key={card.id} style={styles.archiveCard} onPress={() => onSelectCard(card)}>
            <View style={styles.archiveType}>
              <Text style={styles.archiveTypeText}>{card.status}</Text>
            </View>
            {card.image_base64 ? (
              <Image
                source={{ uri: `data:image/png;base64,${card.image_base64}` }}
                style={{ width: 60, height: 60, marginHorizontal: 4 }}
                resizeMode="cover"
              />
            ) : null}
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={styles.archiveTitle} numberOfLines={2}>{card.title}</Text>
              <Text style={styles.archiveDate}>{card.annotation}</Text>
            </View>
            <Ico name="chevron-right" size={24} />
          </Pressable>
        ))}

        {!loading && cards.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ico name="archive-outline" size={48} color={palette.mute} />
            <Text style={{ color: palette.mute, marginTop: 12, textAlign: 'center' }}>
              No saved solutions yet.{'\n'}Generate one in the AI Hub!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── AI HUB ──────────────────────────────────────────────────

function AIHub({ visible, onClose, onSolution, budget, scannedImage }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, type: 'assistant', text: 'Kya banana chahte ho? Budget aur jagah batao — main jugaad solution dhoondta hoon.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => genId());
  const scrollRef = useRef();

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { id: Date.now(), type: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages
        .filter(m => m.type === 'user' || m.type === 'assistant')
        .map(m => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');

      const payload = {
        session_id: sessionId,
        message: text,
        lang: 'hinglish',
        budget_inr: budget,
        history,
      };

      const resp = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(payload),
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let tokenAccum = '';
      let tokenMsgId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const ev = JSON.parse(raw);

            if (ev.type === 'status') {
              // silent
            } else if (ev.type === 'token') {
              tokenAccum += ev.content || '';
              if (!tokenMsgId) {
                tokenMsgId = Date.now();
                setMessages(prev => [...prev, { id: tokenMsgId, type: 'assistant', text: tokenAccum }]);
              } else {
                setMessages(prev => prev.map(m => m.id === tokenMsgId ? { ...m, text: tokenAccum } : m));
              }
            } else if (ev.type === 'clarification') {
              tokenMsgId = null;
              tokenAccum = '';
              setIsTyping(false);
              setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', text: ev.question || ev.text }]);
            } else if (ev.type === 'solution') {
              tokenMsgId = null;
              tokenAccum = '';
              setIsTyping(false);
              const sol = ev.solution;
              setMessages(prev => [...prev, { id: Date.now(), type: 'solution', solution: sol }]);
              onSolution(sol);
            } else if (ev.type === 'error') {
              setIsTyping(false);
              setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', text: ev.message || 'Kuch error ho gaya. Dobara try karo.' }]);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', text: 'Server se connect nahi ho paya. Check karo ki backend chal raha hai.' }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, sessionId, budget]);

  if (!visible) return null;

  return (
    <View style={styles.aiOverlay}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiHeaderTitle}>JUGAAD AI HUB</Text>
          <Pressable onPress={onClose}><Ico name="close" size={28} /></Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => {
            if (msg.type === 'solution') {
              return (
                <View key={msg.id} style={{ marginBottom: 12 }}>
                  <SolutionCard
                    solution={msg.solution}
                    onBlueprint={() => { onClose(); }}
                    onBazaari={() => { onClose(); }}
                  />
                </View>
              );
            }
            return (
              <View
                key={msg.id}
                style={[styles.msgBubble, msg.type === 'user' ? styles.userBubble : styles.assistantBubble]}
              >
                <Text style={[styles.msgText, msg.type === 'user' ? styles.userMsgText : styles.assistantMsgText]}>
                  {msg.text}
                </Text>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.msgBubble, styles.assistantBubble, { flexDirection: 'row', gap: 6 }]}>
              <ActivityIndicator size="small" color={palette.ink} />
              <Text style={styles.assistantMsgText}>Soch raha hoon...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          {scannedImage && (
            <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image source={{ uri: scannedImage }} style={{ width: 40, height: 40, borderRadius: 4 }} />
              <Text style={{ fontSize: 11, color: palette.mute, flex: 1 }}>Photo attached from Workshop</Text>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.chatInput}
              placeholder="Kya banana chahte ho..."
              placeholderTextColor={palette.mute}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={handleSend}
            />
            <Pressable style={[styles.sendBtn, isTyping && { opacity: 0.4 }]} onPress={handleSend} disabled={isTyping}>
              <Ico name="arrow-up" color={palette.ink} size={24} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── ARCHIVE SOLUTION MODAL ───────────────────────────────────

function ArchiveModal({ card, onClose, onBlueprint, onBazaari }) {
  if (!card) return null;
  let solution = null;
  try {
    const parsed = JSON.parse(card.solution_json);
    solution = parsed.solution || parsed;
  } catch { /* ignore */ }

  return (
    <View style={[styles.aiOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: palette.paper, maxHeight: '85%', borderTopWidth: 3, borderColor: palette.ink }}>
          <View style={[styles.aiHeader, { borderBottomWidth: 2, borderColor: palette.ink }]}>
            <Text style={[styles.aiHeaderTitle, { flex: 1 }]} numberOfLines={1}>{card.title}</Text>
            <Pressable onPress={onClose}><Ico name="close" size={28} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {solution ? (
              <SolutionCard
                solution={solution}
                onBlueprint={() => { onBlueprint(solution); onClose(); }}
                onBazaari={() => { onBazaari(solution); onClose(); }}
              />
            ) : (
              <Text style={{ color: palette.mute }}>No solution data stored.</Text>
            )}
          </ScrollView>
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
  const [blueprint, setBlueprint] = useState(null);
  const [bazaari, setBazaari] = useState(null);
  const [archiveCard, setArchiveCard] = useState(null);

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

  const handleSolution = (solution) => {
    setBlueprint(solution);
    setBazaari({ title: solution.title, materials: solution.materials, total_cost_inr: solution.total_cost_inr });
  };

  const handleLoadBlueprint = (solution) => {
    setBlueprint(solution);
    setActiveTab('blueprints');
  };

  const handleLoadBazaari = (solution) => {
    setBazaari({ title: solution.title, materials: solution.materials, total_cost_inr: solution.total_cost_inr });
    setActiveTab('bazaari');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'workshop':
        return (
          <WorkshopScreen
            budget={budget}
            setBudget={setBudget}
            scannedImage={scannedImage}
            openCamera={openCamera}
            openGallery={openGallery}
            scraps={[]}
            onGenerate={() => setAiVisible(true)}
          />
        );
      case 'blueprints':
        return <BlueprintsScreen blueprint={blueprint} />;
      case 'bazaari':
        return <BazaariScreen bazaari={bazaari} />;
      case 'archive':
        return <ArchiveScreen onSelectCard={setArchiveCard} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon}><Ico name="menu" size={28} /></Pressable>
          <Text style={styles.headerTitle}>JUGAAD {activeTab.toUpperCase()}</Text>
          <Pressable style={styles.headerIcon} onPress={() => setAiVisible(true)}>
            <Ico name="robot-outline" size={28} />
          </Pressable>
        </View>
        <View style={styles.headerRule} />

        {renderScreen()}

        <View style={styles.bottomNav}>
          {navItems.map(item => (
            <Pressable key={item.id} style={styles.bottomNavItem} onPress={() => setActiveTab(item.id)}>
              <View style={[styles.bottomTile, activeTab === item.id ? styles.bottomTileActive : null]}>
                <Ico name={item.icon} size={22} color={palette.ink} />
              </View>
              <Text style={styles.bottomLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <AIHub
          visible={aiVisible}
          onClose={() => setAiVisible(false)}
          onSolution={handleSolution}
          budget={budget}
          scannedImage={scannedImage}
        />

        {archiveCard && (
          <ArchiveModal
            card={archiveCard}
            onClose={() => setArchiveCard(null)}
            onBlueprint={handleLoadBlueprint}
            onBazaari={handleLoadBazaari}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

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
  sectionHeaderBudget: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  sectionNumber: { color: palette.ink, fontSize: 18, marginRight: 8, fontWeight: '900' },
  sectionTitle: { color: palette.ink, fontSize: 22, fontWeight: '900', letterSpacing: 0.4 },
  urgentText: { marginLeft: 'auto', color: palette.brick, fontSize: 15, fontStyle: 'italic' },
  blueprintFrame: { position: 'relative', borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.card, marginBottom: 22 },
  blueprintShadow: { position: 'absolute', right: -6, bottom: -6, left: 6, top: 6, backgroundColor: palette.ink2, zIndex: -1 },
  cornerTape: { position: 'absolute', top: -10, width: 44, height: 18, backgroundColor: '#B8C5D9', zIndex: 3 },
  cornerTapeLeft: { left: -12, transform: [{ rotate: '-45deg' }] },
  cornerTapeRight: { right: -12, transform: [{ rotate: '45deg' }] },
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
  budgetCard: { height: 100, flexDirection: 'row', alignItems: 'stretch' },
  budgetCurrency: { width: 60, borderRightWidth: 1, borderRightColor: palette.ink, opacity: 0.4, alignItems: 'center', justifyContent: 'center' },
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
  assemblyBox: { backgroundColor: '#E0DCCE', borderWidth: 2, borderColor: palette.ink, padding: 16 },
  assemblyHeader: { borderBottomWidth: 2, borderColor: palette.ink, paddingBottom: 8, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' },
  assemblyTitle: { fontSize: 14, fontWeight: '900' },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: palette.white, fontSize: 12, fontWeight: '900' },
  stepBody: { fontSize: 13, color: palette.graphite, lineHeight: 18, flex: 1 },
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
  archiveCard: { backgroundColor: palette.card, borderWidth: 2, borderColor: palette.ink, marginBottom: 12, padding: 12, flexDirection: 'row', alignItems: 'center' },
  archiveType: { width: 56, height: 56, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  archiveTypeText: { color: palette.white, fontSize: 9, fontWeight: '900', textAlign: 'center' },
  archiveTitle: { fontSize: 14, fontWeight: '900', color: palette.ink },
  archiveDate: { fontSize: 11, color: palette.mute, marginTop: 3 },
  aiOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.paper, zIndex: 100 },
  aiHeader: { height: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.grid },
  aiHeaderTitle: { fontSize: 18, fontWeight: '900' },
  msgBubble: { maxWidth: '85%', padding: 12, borderRadius: 4, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: palette.ink },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: palette.white, borderWidth: 1.5, borderColor: palette.ink },
  msgText: { fontSize: 15, lineHeight: 22 },
  userMsgText: { color: palette.white },
  assistantMsgText: { color: palette.ink },
  inputContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: palette.paper, padding: 12, borderTopWidth: 1, borderColor: palette.grid },
  inputWrapper: { flexDirection: 'row', backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  chatInput: { flex: 1, fontSize: 16, maxHeight: 100, color: palette.ink },
  sendBtn: { width: 40, height: 40, backgroundColor: palette.yellow, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  solutionCard: { backgroundColor: palette.card, borderWidth: 2.5, borderColor: palette.ink, padding: 14, marginBottom: 4 },
  solutionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  solutionTitle: { fontSize: 16, fontWeight: '900', color: palette.ink, flex: 1, marginRight: 8 },
  solutionSummary: { fontSize: 13, color: palette.graphite, lineHeight: 18, marginBottom: 10 },
  solutionSection: { marginBottom: 12 },
  solutionSectionLabel: { fontSize: 10, fontWeight: '900', color: palette.mute, letterSpacing: 1, marginBottom: 6 },
  materialRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },
  materialItem: { fontSize: 13, color: palette.ink, flex: 1 },
  materialCost: { fontSize: 13, fontWeight: '700', color: palette.ink },
  costBadge: { backgroundColor: palette.yellow, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 8, paddingVertical: 3 },
  costBadgeText: { fontSize: 11, fontWeight: '900', color: palette.ink },
  expandBtn: { paddingVertical: 8, alignItems: 'center' },
  expandBtnText: { fontSize: 12, color: palette.mute, fontWeight: '700' },
  solutionActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.1)', paddingTop: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: palette.yellow, borderWidth: 2, borderColor: palette.ink, paddingVertical: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '900', color: palette.ink },
});
