import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// SCREEN_WIDTH available if needed for responsive sizing

// ── API config ────────────────────────────────────────────────
// API base URL comes from app.json → expo.extra.apiBaseUrl
// (for LAN dev: ipconfig → Mobile Hotspot IPv4, run backend with --host 0.0.0.0)
import { API_BASE, authHeaders, getDeviceId } from './api';
import { authEnabled, restoreSession, signInWithPassword, signUpWithPassword, signOut, supabase } from './auth';

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
  { id: 'chats', label: 'CHATS', icon: 'forum-outline' },
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

// ─── SPEAK BUTTON ────────────────────────────────────────────

function SpeakButton({ text, lang }) {
  const [state, setState] = useState('idle'); // idle | loading | playing
  const soundRef = useRef(null);

  const stop = async () => {
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch {}
    soundRef.current = null;
    setState('idle');
  };

  const toggle = async () => {
    if (state !== 'idle') { stop(); return; }
    setState('loading');
    try {
      const cleaned = text.replace(/\*+/g, '').replace(/#{1,6}\s*/g, '').replace(/\n+/g, ' ').trim().slice(0, 1000);
      const ttsLang = lang === 'english' ? 'en-IN' : 'hi-IN';
      const resp = await fetch(`${API_BASE}/api/tts-b64`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: cleaned, lang: ttsLang }),
      });
      const { audio_base64 } = await resp.json();
      if (!audio_base64) { setState('idle'); return; }

      const fileUri = FileSystem.cacheDirectory + `tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, audio_base64, { encoding: FileSystem.EncodingType.Base64 });
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;
      setState('playing');
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) { sound.unloadAsync(); soundRef.current = null; setState('idle'); }
      });
    } catch { setState('idle'); }
  };

  return (
    <Pressable onPress={toggle} style={{ padding: 6 }}>
      <Ico
        name={state === 'idle' ? 'volume-high' : state === 'loading' ? 'dots-horizontal' : 'stop-circle'}
        size={18}
        color={state === 'playing' ? palette.brick : palette.mute}
      />
    </Pressable>
  );
}

// ─── SOLUTION CARD ────────────────────────────────────────────

function SolutionCard({ solution, onBlueprint, onBazaari, onSave, saved }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.solutionCard}>
      <View style={styles.solutionHeaderTop}>
        <Text style={styles.solutionHeaderTopText}>JUGAAD SOLUTION</Text>
        {solution.total_cost_inr > 0 && (
          <Text style={styles.solutionHeaderTopCost}>₹{Math.round(solution.total_cost_inr)}</Text>
        )}
      </View>
      
      <View style={{ padding: 16 }}>
        <View style={styles.solutionHeader}>
          <Text style={styles.solutionTitle}>{solution.title}</Text>
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
        {onSave && (
          <Pressable style={[styles.actionBtn, saved && { backgroundColor: palette.kraftLight }]} onPress={saved ? null : onSave}>
            <Ico name={saved ? 'check' : 'archive-plus-outline'} size={14} color={palette.ink} />
            <Text style={styles.actionBtnText}>{saved ? 'SAVED TO ARCHIVE' : 'SAVE TO ARCHIVE'}</Text>
          </Pressable>
        )}
        {solution.build_steps?.length > 0 && (
          <Pressable style={[styles.actionBtn, { backgroundColor: palette.paper }]} onPress={onBlueprint}>
            <Ico name="floor-plan" size={14} color={palette.ink} />
            <Text style={styles.actionBtnText}>LOAD BLUEPRINT</Text>
          </Pressable>
        )}
        {solution.materials?.length > 0 && (
          <Pressable style={[styles.actionBtn, { backgroundColor: palette.paper }]} onPress={onBazaari}>
            <Ico name="storefront-outline" size={14} color={palette.ink} />
            <Text style={styles.actionBtnText}>FIND IN BAZAARI</Text>
          </Pressable>
        )}
      </View>
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
  const [bpImage, setBpImage] = useState(null);
  const [bpImgLoading, setBpImgLoading] = useState(false);

  useEffect(() => {
    if (!blueprint?.title) return;
    let cancelled = false;
    setBpImage(null);
    setBpImgLoading(true);

    const run = async () => {
      try {
        const r = await fetch(
          `${API_BASE}/api/blueprint-image?title=${encodeURIComponent(blueprint.title)}`,
          { headers: authHeaders() }
        );
        const { image_base64 } = await r.json();
        if (image_base64 && !cancelled) {
          setBpImage(`data:image/png;base64,${image_base64}`);
          setBpImgLoading(false);
          return;
        }
      } catch { /* cache miss */ }

      try {
        const r = await fetch(`${API_BASE}/api/generate-image`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ prompt: `Technical blueprint schematic: ${blueprint.title}. Engineering assembly diagram, hand-drawn, blueprint paper style, no text` }),
        });
        const { base64 } = await r.json();
        if (base64 && !cancelled) {
          setBpImage(`data:image/png;base64,${base64}`);
          fetch(`${API_BASE}/api/blueprint-image`, {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ title: blueprint.title, image_base64: base64 }),
          }).catch(() => {});
        }
      } catch { /* generation failed */ }

      if (!cancelled) setBpImgLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [blueprint?.title]);

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

        {/* Schematic image */}
        {(bpImage || bpImgLoading) && (
          <View style={{ borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.kraft, marginBottom: 20, overflow: 'hidden' }}>
            {bpImgLoading && !bpImage ? (
              <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
                <ActivityIndicator color={palette.ink} />
                <Text style={{ fontSize: 12, fontWeight: '900', color: palette.mute }}>GENERATING SCHEMATIC…</Text>
              </View>
            ) : (
              <Image source={{ uri: bpImage }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
            )}
            <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: palette.ink, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: palette.white, fontSize: 9, fontWeight: '900' }}>AI GENERATED</Text>
            </View>
          </View>
        )}

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
    fetch(`${API_BASE}/api/archive`, { headers: authHeaders() })
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

const WELCOME_MSG = { id: 'welcome', type: 'assistant', text: 'Kya banana chahte ho? Budget aur jagah batao — main jugaad solution dhoondta hoon.' };

function AIHub({ visible, sessionIdOverride, onClose, onSolution, budget, scannedImage, scannedImageB64, onSaveToArchive, onShowHistory }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState('hinglish');
  const [savedMsgIds, setSavedMsgIds] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [sessionId, setSessionId] = useState(() => sessionIdOverride || genId());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef();
  const xhrRef = useRef(null);
  const recordingRef = useRef(null);
  const sessionTitleRef = useRef('New Chat'); // tracks first user msg for DB upsert
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (!visible) return;
    if (sessionIdOverride) {
      setSessionId(sessionIdOverride);
      setLoadingHistory(true);
      fetch(`${API_BASE}/api/sessions/${sessionIdOverride}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
          if (data.messages && data.messages.length > 0) {
            const formatted = data.messages.map(m => {
              const parsed = JSON.parse(m.content_json);
              return {
                id: m.id,
                type: m.type,
                text: (m.type === 'user' || m.type === 'assistant') ? parsed.text : null,
                solution: m.type === 'solution' ? parsed : null
              };
            });
            setMessages(formatted);
            sessionTitleRef.current = data.title || 'Loaded Chat';
          } else {
            setMessages([WELCOME_MSG]);
            sessionTitleRef.current = 'New Chat';
          }
          setLoadingHistory(false);
        })
        .catch(() => {
          setMessages([WELCOME_MSG]);
          sessionTitleRef.current = 'New Chat';
          setLoadingHistory(false);
        });
    } else {
      startNewChat();
    }
  }, [sessionIdOverride, visible]);

  // Fire-and-forget: upsert session then append a message to DB
  const persistMessage = useCallback((role, type, content) => {
    const headers = authHeaders({ 'Content-Type': 'application/json' });
    fetch(`${API_BASE}/api/sessions`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: sessionId, title: sessionTitleRef.current, lang: langRef.current }),
    }).then(() => fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ role, type, content_json: JSON.stringify(content) }),
    })).catch(() => {});
  }, [sessionId]);

  const startNewChat = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setMessages([WELCOME_MSG]);
    setSessionId(genId());
    setSavedMsgIds(new Set());
    setInput('');
    setIsTyping(false);
    sessionTitleRef.current = 'New Chat';
  }, []);

  // Parse SSE blocks: backend sends "event: token\ndata: text\n\n" format
  const parseSSE = useCallback((chunk, state) => {
    const blocks = chunk.split('\n\n');
    for (const block of blocks) {
      if (!block.trim()) continue;
      let eventType = '';
      let dataLine = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        else if (line.startsWith('data: ')) dataLine = line.slice(6);
      }
      if (!eventType || dataLine === '') continue;

      if (eventType === 'token') {
        state.tokenAccum += dataLine;
        if (!state.tokenMsgId) {
          const id = `tok_${Date.now()}_${Math.random()}`;
          state.tokenMsgId = id;
          setMessages(prev => [...prev, { id, type: 'assistant', text: state.tokenAccum }]);
        } else {
          const id = state.tokenMsgId;
          setMessages(prev => prev.map(m => m.id === id ? { ...m, text: state.tokenAccum } : m));
        }
      } else if (eventType === 'clarification') {
        try {
          const parsed = JSON.parse(dataLine);
          state.tokenMsgId = null; state.tokenAccum = '';
          setIsTyping(false);
          setMessages(prev => [...prev, { id: `clar_${Date.now()}`, type: 'assistant', text: parsed.question }]);
        } catch { /* skip malformed */ }
      } else if (eventType === 'solution') {
        try {
          const parsed = JSON.parse(dataLine);
          state.tokenMsgId = null; state.tokenAccum = '';
          setIsTyping(false);
          const sol = parsed.solution;
          setMessages(prev => [...prev, { id: `sol_${Date.now()}`, type: 'solution', solution: sol }]);
          onSolution(sol);
          persistMessage('assistant', 'solution', sol);
        } catch { /* skip malformed */ }
      } else if (eventType === 'login_required') {
        state.tokenMsgId = null; state.tokenAccum = '';
        setIsTyping(false);
        let text = 'Aaj ke free jugaad khatam! Log in karke 25/day paayein.';
        try { text = JSON.parse(dataLine).message || text; } catch { /* keep default */ }
        setMessages(prev => [...prev, { id: `lim_${Date.now()}`, type: 'assistant', text }]);
        if (authEnabled) setShowLogin(true);
      } else if (eventType === 'quota_exhausted' || eventType === 'capacity') {
        state.tokenMsgId = null; state.tokenAccum = '';
        setIsTyping(false);
        let text = 'Aaj ki capacity full ho gayi. Raat 12 baje UTC ke baad try karein.';
        try { text = JSON.parse(dataLine).message || text; } catch { /* keep default */ }
        setMessages(prev => [...prev, { id: `cap_${Date.now()}`, type: 'assistant', text }]);
      } else if (eventType === 'error') {
        state.tokenMsgId = null; state.tokenAccum = '';
        setIsTyping(false);
        setMessages(prev => [...prev, { id: `err_${Date.now()}`, type: 'assistant', text: dataLine || 'Kuch error ho gaya.' }]);
      }
    }
  }, [onSolution, persistMessage]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop → transcribe
      setIsRecording(false);
      setTranscribing(true);
      try {
        await recordingRef.current?.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = recordingRef.current?.getURI();
        recordingRef.current = null;
        if (uri) {
          const formData = new FormData();
          formData.append('audio', { uri, type: 'audio/m4a', name: 'voice.m4a' });
          const resp = await fetch(`${API_BASE}/api/transcribe`, {
            method: 'POST',
            headers: authHeaders(),
            body: formData,
          });
          const data = await resp.json();
          if (data.transcript) setInput(data.transcript);
        }
      } catch (e) { /* ignore */ }
      setTranscribing(false);
    } else {
      // Start recording
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording;
        setIsRecording(true);
      } catch (e) { /* permission denied */ }
    }
  }, [isRecording]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;

    setMessages(prev => [...prev, { id: `u_${Date.now()}`, type: 'user', text }]);
    setInput('');
    setIsTyping(true);

    // Set session title from first user message, then persist to DB
    if (sessionTitleRef.current === 'New Chat') sessionTitleRef.current = text.slice(0, 50);
    persistMessage('user', 'user', { text });

    const history = messages
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .map(m => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    // base64 is captured at pick time via ImagePicker's base64: true option
    const imageBase64 = scannedImageB64 || null;

    const payload = JSON.stringify({
      session_id: sessionId,
      message: text,
      lang,
      budget_inr: budget,
      history,
      image_base64: imageBase64,
    });

    // Use XHR for streaming — fetch+getReader() is unreliable on React Native
    const state = { offset: 0, tokenAccum: '', tokenMsgId: null };
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', `${API_BASE}/api/query`);
    const queryHeaders = authHeaders({ 'Content-Type': 'application/json' });
    Object.entries(queryHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.timeout = 60000; // 60s — prevents infinite spinner on network failure

    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(state.offset);
      state.offset = xhr.responseText.length;
      if (newText) parseSSE(newText, state);
    };

    xhr.onload = () => {
      const remaining = xhr.responseText.slice(state.offset);
      if (remaining.trim()) parseSSE(remaining, state);
      // Persist streamed assistant text if not already saved as solution
      if (state.tokenAccum) persistMessage('assistant', 'assistant', { text: state.tokenAccum });
      setIsTyping(false);
      xhrRef.current = null;
    };

    xhr.onerror = () => {
      setMessages(prev => [...prev, { id: `err_${Date.now()}`, type: 'assistant', text: `Connect nahi hua: ${API_BASE} — backend running? IP sahi hai?` }]);
      setIsTyping(false);
      xhrRef.current = null;
    };

    xhr.ontimeout = () => {
      setMessages(prev => [...prev, { id: `err_${Date.now()}`, type: 'assistant', text: `Timeout (60s): ${API_BASE} — backend slow ya unreachable.` }]);
      setIsTyping(false);
      xhrRef.current = null;
    };

    xhr.send(payload);
  }, [input, isTyping, messages, sessionId, budget, lang, scannedImageB64, parseSSE, persistMessage]);

  if (!visible) return null;

  return (
    <View style={styles.aiOverlay}>
      <View style={{ flex: 1 }}>
        <View style={styles.aiHeader}>
          <Pressable onPress={onShowHistory} style={{ padding: 4, marginRight: 8 }}>
            <Ico name="history" size={24} color={palette.ink} />
          </Pressable>
          <Text style={styles.aiHeaderTitle}>JUGAAD AI HUB</Text>
          <Pressable onPress={startNewChat} style={{ padding: 4, marginRight: 8 }}>
            <Ico name="plus-circle-outline" size={24} color={palette.ink} />
          </Pressable>
          <Pressable onPress={onClose}><Ico name="close" size={28} /></Pressable>
        </View>

        {/* Language selector */}
        <View style={styles.langRow}>
          {[['hinglish', 'Hinglish'], ['english', 'EN'], ['hindi', 'हिन्दी']].map(([val, label]) => (
            <Pressable key={val} onPress={() => setLang(val)} style={[styles.langChip, lang === val && styles.langChipActive]}>
              <Text style={[styles.langChipText, lang === val && styles.langChipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {loadingHistory && (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator color={palette.ink} />
              <Text style={{ marginTop: 8, fontSize: 12, color: palette.mute }}>Loading your chat...</Text>
            </View>
          )}
          {!loadingHistory && messages.map(msg => {
            if (msg.type === 'solution') {
              return (
                <View key={msg.id} style={{ marginBottom: 12 }}>
                  <SolutionCard
                    solution={msg.solution}
                    onBlueprint={() => { onClose(messages); }}
                    onBazaari={() => { onClose(messages); }}
                    onSave={() => {
                      setSavedMsgIds(prev => new Set([...prev, msg.id]));
                      onSaveToArchive(msg.solution, sessionId);
                    }}
                    saved={savedMsgIds.has(msg.id)}
                  />
                </View>
              );
            }
            return (
              <View key={msg.id} style={{ alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: 12 }}>
                <View style={[styles.msgBubble, { marginBottom: 0 }, msg.type === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.msgText, msg.type === 'user' ? styles.userMsgText : styles.assistantMsgText]}>
                    {msg.text}
                  </Text>
                </View>
                {msg.type === 'assistant' && (
                  <SpeakButton text={msg.text} lang={lang} />
                )}
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

        {/* Input at bottom via flex — not absolute, so it stays above home indicator */}
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
              placeholder={transcribing ? 'Transcribing...' : isRecording ? '🔴 Recording... tap to stop' : 'Kya banana chahte ho...'}
              placeholderTextColor={isRecording ? palette.brick : palette.mute}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!isRecording && !transcribing}
            />
            <Pressable
              onPress={toggleRecording}
              style={[styles.sendBtn, { backgroundColor: isRecording ? palette.brick : palette.paper2, marginRight: 4 }]}
            >
              <Ico name={isRecording ? 'stop' : 'microphone'} color={isRecording ? palette.white : palette.ink} size={22} />
            </Pressable>
            <Pressable style={[styles.sendBtn, (isTyping || isRecording) && { opacity: 0.4 }]} onPress={handleSend} disabled={isTyping || isRecording}>
              <Ico name="arrow-up" color={palette.ink} size={24} />
            </Pressable>
          </View>
        </View>
      </View>

      {showLogin && <LoginSheet onClose={() => setShowLogin(false)} />}
    </View>
  );
}

// ─── LOGIN SHEET (Email + Password) ──────────────────────────

function LoginSheet({ onClose }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setBusy(true); setError('');
    
    let err = null;
    if (mode === 'login') {
      const res = await signInWithPassword(email.trim(), password);
      err = res.error;
    } else {
      const res = await signUpWithPassword(email.trim(), password);
      err = res.error;
      if (!err && !res.data?.session) {
        // If require email confirmation is on, session will be null.
        setError('Signup successful. Please verify your email.');
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    if (err) { setError(err.message); return; }
    onClose();
  };

  return (
    <View style={[styles.aiOverlay, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200 }]}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: palette.paper, borderTopWidth: 3, borderColor: palette.ink, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: palette.ink }}>
              {mode === 'login' ? 'LOG IN TO JUGAADGPT' : 'CREATE ACCOUNT'}
            </Text>
            <Pressable onPress={onClose}><Ico name="close" size={26} /></Pressable>
          </View>
          <Text style={{ fontSize: 13, color: palette.mute, marginBottom: 14 }}>
            25 jugaads/day + chats saved to your account.
          </Text>
          
          <TextInput
            style={{ borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white, padding: 10, fontSize: 15, marginBottom: 10 }}
            placeholder="you@example.com"
            placeholderTextColor={palette.mute}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={{ borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white, padding: 10, fontSize: 15, marginBottom: 14 }}
            placeholder="Password"
            placeholderTextColor={palette.mute}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            onPress={handleAction}
            disabled={busy}
            style={{ backgroundColor: palette.yellow, borderWidth: 2, borderColor: palette.ink, padding: 12, alignItems: 'center', opacity: busy ? 0.5 : 1 }}
          >
            <Text style={{ fontWeight: '900', color: palette.ink }}>
              {busy ? 'PLEASE WAIT…' : mode === 'login' ? 'LOG IN' : 'SIGN UP'}
            </Text>
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: palette.ink, textDecorationLine: 'underline', fontSize: 13 }}>
              {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
            </Text>
          </Pressable>

          {!!error && <Text style={{ color: error.includes('successful') ? palette.ink : palette.brick, fontSize: 12, marginTop: 12, textAlign: 'center' }}>{error}</Text>}
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

// ─── ACCOUNT SHEET ──────────────────────────────────────────────

function AccountSheet({ user, onClose, onShowLogin, onLogout }) {
  const [showLocalLogin, setShowLocalLogin] = useState(false);

  return (
    <View style={[styles.aiOverlay, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200 }]}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: palette.paper, borderTopWidth: 3, borderColor: palette.ink, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: palette.ink }}>ACCOUNT</Text>
            <Pressable onPress={onClose}><Ico name="close" size={26} /></Pressable>
          </View>
          
          {user ? (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 13, color: palette.mute, marginBottom: 4 }}>LOGGED IN AS</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: palette.ink, marginBottom: 20 }}>{user.email}</Text>
              <Pressable
                onPress={onLogout}
                style={{ backgroundColor: palette.paper, borderWidth: 2, borderColor: palette.ink, padding: 12, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '900', color: palette.brick }}>LOG OUT</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ marginBottom: 10, alignItems: 'center' }}>
              <Ico name="account-circle-outline" size={48} color={palette.mute} />
              <Text style={{ fontSize: 14, color: palette.mute, textAlign: 'center', marginVertical: 12 }}>
                Log in to save chats across devices and get 25 jugaads/day.
              </Text>
              <Pressable
                onPress={() => setShowLocalLogin(true)}
                style={{ backgroundColor: palette.yellow, borderWidth: 2, borderColor: palette.ink, padding: 12, alignItems: 'center', width: '100%' }}
              >
                <Text style={{ fontWeight: '900', color: palette.ink }}>LOG IN</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
      
      {showLocalLogin && (
        <LoginSheet onClose={() => { setShowLocalLogin(false); onClose(); }} />
      )}
    </View>
  );
}

// ─── HISTORY MODAL ───────────────────────────────────────────

// ─── CHATS SCREEN ──────────────────────────────────────────────

function ChatsScreen({ onChatSelected }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/sessions`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setSessions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={{ padding: 24 }}>
        <Text style={styles.screenTitle}>PAST CHATS</Text>
        <Text style={styles.screenSubtitle}>Your previous AI Hub conversations</Text>

        {loading && <ActivityIndicator color={palette.ink} style={{ marginTop: 40 }} />}

        {!loading && sessions.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ico name="forum-outline" size={48} color={palette.mute} />
            <Text style={{ color: palette.mute, marginTop: 12, textAlign: 'center' }}>
              No past chats yet.{'\n'}Start a new one in the AI Hub!
            </Text>
          </View>
        )}

        {sessions.map(s => (
          <Pressable 
            key={s.id} 
            style={[styles.archiveCard, { flexDirection: 'column', alignItems: 'stretch' }]} 
            onPress={() => onChatSelected && onChatSelected(s.id)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.archiveTitle} numberOfLines={1}>{s.title}</Text>
              <Ico name="chevron-right" size={20} color={palette.mute} />
            </View>
            <Text style={styles.archiveDate}>
              {s.message_count} message(s) · {new Date(s.updated_at).toLocaleDateString('en-IN')}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}


// ─── MAIN APP ────────────────────────────────────────────────

function MainApp() {
  const [activeTab, setActiveTab] = useState('workshop');
  const [budget, setBudget] = useState(500);
  const [scannedImage, setScannedImage] = useState(null);       // URI for display
  const [scannedImageB64, setScannedImageB64] = useState(null); // base64 for API
  const [aiVisible, setAiVisible] = useState(false);
  const [aiSessionId, setAiSessionId] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [bazaari, setBazaari] = useState(null);
  const [archiveCard, setArchiveCard] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState(null);

  // Boot: ensure a stable device id (quota identity) and restore any
  // Supabase session so the auth token is attached to API calls.
  useEffect(() => {
    getDeviceId().catch(() => {});
    restoreSession().then(u => setUser(u)).catch(() => {});
    
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return () => subscription?.unsubscribe();
    }
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setShowAccount(false);
    showToast('Logged out successfully');
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true });
    if (!result.canceled && result.assets?.[0]) {
      setScannedImage(result.assets[0].uri);
      setScannedImageB64(result.assets[0].base64 || null);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true });
    if (!result.canceled && result.assets?.[0]) {
      setScannedImage(result.assets[0].uri);
      setScannedImageB64(result.assets[0].base64 || null);
    }
  };

  const handleSolution = (solution) => {
    setBlueprint(solution);
    setBazaari({ title: solution.title, materials: solution.materials, total_cost_inr: solution.total_cost_inr });
  };

  const handleAiClose = () => setAiVisible(false);

  const handleSaveToArchive = async (solution, sessionId) => {
    try {
      const card = {
        session_id: sessionId,
        title: solution.title || 'Jugaad Solution',
        status: 'SUCCESS',
        annotation: `"${(solution.expected_outcome || solution.summary || '').slice(0, 100)}"`,
        image: '',
        solution_json: JSON.stringify({ solution }),
      };
      const res = await fetch(`${API_BASE}/api/archive`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(card),
      });
      showToast(res.ok ? 'Saved to archive ✓' : 'Save failed');
    } catch { showToast('Save failed'); }
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
            onGenerate={() => { setAiSessionId(null); setAiVisible(true); }}
          />
        );
      case 'chats':
        return <ChatsScreen onChatSelected={(id) => {
          setAiSessionId(id);
          setAiVisible(true);
        }} />;
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => setShowAccount(true)}>
            <Ico name="account-circle-outline" size={28} />
          </Pressable>
          <Text style={styles.headerTitle}>JUGAAD {activeTab.toUpperCase()}</Text>
          <Pressable style={styles.headerIcon} onPress={() => { setAiSessionId(null); setAiVisible(true); }}>
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

        {/* Toast */}
        {!!toast && (
          <View style={{ position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: palette.ink, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, zIndex: 999 }}>
            <Text style={{ color: palette.white, fontSize: 13, fontWeight: '700' }}>{toast}</Text>
          </View>
        )}

        <AIHub
          visible={aiVisible}
          onClose={handleAiClose}
          onSolution={handleSolution}
          budget={budget}
          scannedImage={scannedImage}
          scannedImageB64={scannedImageB64}
          onSaveToArchive={handleSaveToArchive}
          onShowHistory={() => setActiveTab('chats')}
        />

        {archiveCard && (
          <ArchiveModal
            card={archiveCard}
            onClose={() => setArchiveCard(null)}
            onBlueprint={handleLoadBlueprint}
            onBazaari={handleLoadBazaari}
          />
        )}
        
        {showAccount && (
          <AccountSheet 
            user={user} 
            onClose={() => setShowAccount(false)} 
            onShowLogin={() => {
              // Re-use the existing LoginSheet via AIHub logic, 
              // or handle a local showLogin state.
              // Wait, we don't have local showLogin state in App!
              // Let's add it or use AIHub's logic. 
              // Actually, I can just mount LoginSheet right here.
            }} 
            onLogout={handleLogout} 
          />
        )}
      </View>
      </KeyboardAvoidingView>
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
  bottomNav: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 74, flexDirection: 'row', borderRadius: 37, overflow: 'hidden', borderWidth: 2, borderColor: palette.ink, backgroundColor: 'rgba(235, 229, 214, 0.95)' },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomTile: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 2, borderRadius: 16 },
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
  aiHeader: { height: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.grid },
  aiHeaderTitle: { flex: 1, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  langRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: palette.paper2, borderBottomWidth: 1, borderColor: palette.grid },
  langChip: { paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 20 },
  langChipActive: { backgroundColor: palette.ink },
  langChipText: { fontSize: 12, fontWeight: '900', color: palette.ink },
  langChipTextActive: { color: palette.white },
  msgBubble: { maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: palette.ink, borderBottomRightRadius: 2 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: palette.card, borderWidth: 1.5, borderColor: palette.kraftDeep, borderBottomLeftRadius: 2 },
  msgText: { fontSize: 14, lineHeight: 22 },
  userMsgText: { color: palette.paper },
  assistantMsgText: { color: palette.graphite },
  inputContainer: { backgroundColor: palette.paper, padding: 12, borderTopWidth: 1, borderColor: palette.grid },
  inputWrapper: { flexDirection: 'row', backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  chatInput: { flex: 1, fontSize: 16, maxHeight: 100, color: palette.ink },
  sendBtn: { width: 40, height: 40, backgroundColor: palette.yellow, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  solutionCard: { backgroundColor: palette.card, borderWidth: 2, borderColor: palette.ink, borderRadius: 12, borderBottomLeftRadius: 2, overflow: 'hidden', marginBottom: 12, borderRightWidth: 3, borderBottomWidth: 3 },
  solutionHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: palette.yellow, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2, borderColor: palette.ink },
  solutionHeaderTopText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: palette.ink },
  solutionHeaderTopCost: { fontSize: 11, fontWeight: '400', color: palette.graphite },
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
  solutionActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.1)', paddingTop: 12, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: palette.yellow, borderWidth: 1.5, borderColor: palette.ink, paddingVertical: 6, paddingHorizontal: 12 },
  actionBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: palette.ink },
});

export default function JugaadMobileApp() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

