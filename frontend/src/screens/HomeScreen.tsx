import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
  Platform,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { NeumorphicCard } from '../components/NeumorphicCard';
import { LiquidBentoCard } from '../components/LiquidBentoCard';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { DynamicClassItem, DynamicClassItemData } from '../components/DynamicClassItem';
import { LiveDateCard } from '../components/LiveDateCard';
import { ProfileSetupModal, UserProfileData } from '../components/ProfileSetupModal';
import { ClassFormModal, ClassFormData, WeekDay } from '../components/ClassFormModal';
import { SettingsModal } from '../components/SettingsModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { NeumorphicSearchBar } from '../components/NeumorphicSearchBar';
import { FloatingRadialMenu, MainTabType } from '../components/FloatingRadialMenu';
import { NullSparkleLink } from '../components/NullSparkleLink';
import { DonationBadge } from '../components/DonationBadge';
import {
  ClassSessionCaptureModal,
  ClassSessionLog,
} from '../components/ClassSessionCaptureModal';
import { OfflineSyncBanner } from '../components/OfflineSyncBanner';
import { AnalyticsScreen } from './AnalyticsScreen';
import { NotesScreen } from './NotesScreen';
import { ProfileScreen } from './ProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { hapticFeedback } from '../utils/haptics';
import { mobilePersistenceAdapter } from '../storage/persistenceAdapter';
import { mobileSyncBridge, SyncState } from '../api/syncBridge';
import { updateChecker, UpdateCheckResult } from '../services/updateChecker';
import { UpdateNotificationModal } from '../components/UpdateNotificationModal';
import { getRtlRow, rtlStyles } from '../utils/rtl';

const DAYS_FILTER: ('همه' | WeekDay)[] = [
  'همه',
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
];

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<MainTabType>('home');

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Classes State (CRUD)
  const [classes, setClasses] = useState<DynamicClassItemData[]>([]);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassFormData | null>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState<'همه' | WeekDay>('همه');

  // In-Class Session Logs (Multimodal Capture)
  const [sessionLogs, setSessionLogs] = useState<ClassSessionLog[]>([]);
  const [isSessionCaptureOpen, setIsSessionCaptureOpen] = useState(false);
  const [targetClassForSession, setTargetClassForSession] = useState<string | undefined>();

  // Real-time Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Deletion Confirmation State
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  // Network Resilience & Offline Sync State
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [queuedCount, setQueuedCount] = useState<number>(0);

  // In-App GitHub Releases Update State
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Storage Hydration & Loading Gate
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [storageLoadError, setStorageLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Load persistent snapshot on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setStorageLoadError(null);
        const snapshot = await mobilePersistenceAdapter.loadAppSnapshot();
        if (isMounted) {
          if (snapshot) {
            if (snapshot.studentProfile !== undefined) {
              setUserProfile(snapshot.studentProfile);
            }
            if (snapshot.classes !== undefined) {
              setClasses(snapshot.classes as DynamicClassItemData[]);
            }
            if (snapshot.sessionLogs !== undefined) {
              setSessionLogs(snapshot.sessionLogs as ClassSessionLog[]);
            }

            // Prime the Rust core in-memory cache with the snapshot loaded from AsyncStorage
            mobileSyncBridge.pushLocalDeltas(
              snapshot.studentProfile,
              snapshot.classes || [],
              snapshot.sessionLogs || [],
              snapshot.activeThemeId
            ).catch((err) => console.warn('[HomeScreen] Rust core cache priming error:', err));
          }
          const queued = await mobilePersistenceAdapter.getQueuedMutations();
          if (isMounted) setQueuedCount(queued.length);
          if (isMounted) setIsStorageReady(true);
        }
      } catch (err: any) {
        console.error('[HomeScreen] Startup snapshot loading error:', err);
        if (isMounted) {
          setStorageLoadError('خطا در دسترسی به حافظه دستگاه. جهت حفاظت از اطلاعات، بارگذاری متوقف شد.');
        }
      }
    })();

    // Subscribe to sync bridge status changes
    const unsubscribe = mobileSyncBridge.subscribe((state) => {
      if (isMounted) {
        setSyncState(state);
        mobilePersistenceAdapter.getQueuedMutations().then((q) => {
          if (isMounted) setQueuedCount(q.length);
        });
      }
    });

    // Non-intrusive in-app update check (delayed 2.5s after launch, zero startup latency)
    const updateTimer = setTimeout(async () => {
      try {
        const result = await updateChecker.checkForUpdates();
        if (isMounted && result.hasUpdate) {
          setUpdateInfo(result);
          setIsUpdateModalOpen(true);
        }
      } catch {
        // Silent error suppression
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(updateTimer);
      unsubscribe();
    };
  }, [reloadKey]);

  const handleRetrySync = async () => {
    if (!isStorageReady) return;
    const res = await mobileSyncBridge.pushLocalDeltas(userProfile, classes, sessionLogs);
    const queued = await mobilePersistenceAdapter.getQueuedMutations();
    setQueuedCount(queued.length);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 3, speed: 16, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleOpenAddClass = () => {
    if (!isStorageReady) return;
    hapticFeedback.light();
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (item: DynamicClassItemData) => {
    if (!isStorageReady) return;
    hapticFeedback.light();
    setEditingClass({
      id: item.id,
      name: item.name,
      day: item.day,
      time: item.time,
      recurrence: item.recurrence,
      professor: item.professor,
      location: item.location,
      midtermExamDate: item.midtermExamDate,
      finalExamDate: item.finalExamDate,
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (formData: ClassFormData) => {
    if (!isStorageReady) return;
    hapticFeedback.success();
    let updated: DynamicClassItemData[];
    if (editingClass) {
      updated = classes.map((c) =>
        c.id === formData.id
          ? {
              id: c.id,
              name: formData.name,
              day: formData.day,
              time: formData.time,
              recurrence: formData.recurrence,
              professor: formData.professor,
              location: formData.location,
              midtermExamDate: formData.midtermExamDate,
              finalExamDate: formData.finalExamDate,
            }
          : c
      );
    } else {
      const newClass: DynamicClassItemData = {
        id: Date.now().toString(),
        name: formData.name,
        day: formData.day,
        time: formData.time,
        recurrence: formData.recurrence,
        professor: formData.professor,
        location: formData.location,
        midtermExamDate: formData.midtermExamDate,
        finalExamDate: formData.finalExamDate,
      };
      updated = [newClass, ...classes];
    }
    setClasses(updated);
    setIsClassModalOpen(false);
    setEditingClass(null);

    // Optimistic background sync with persistent storage & Rust bridge
    mobileSyncBridge.performOptimisticSync(userProfile, updated, sessionLogs).then(() => {
      mobilePersistenceAdapter.getQueuedMutations().then((q) => setQueuedCount(q.length));
    });
  };

  const handleConfirmDelete = () => {
    if (!isStorageReady || !deletingClassId) return;
    hapticFeedback.heavy();
    const updatedClasses = classes.filter((c) => c.id !== deletingClassId);
    const updatedLogs = sessionLogs.filter((l) => l.classId !== deletingClassId);
    setClasses(updatedClasses);
    setSessionLogs(updatedLogs);
    setDeletingClassId(null);

    mobileSyncBridge.performOptimisticSync(userProfile, updatedClasses, updatedLogs).then(() => {
      mobilePersistenceAdapter.getQueuedMutations().then((q) => setQueuedCount(q.length));
    });
  };

  // Add in-class multimodal session log
  const handleSaveSessionLog = (log: ClassSessionLog) => {
    if (!isStorageReady) return;
    hapticFeedback.success();
    const updatedLogs = [log, ...sessionLogs];
    setSessionLogs(updatedLogs);

    mobileSyncBridge.performOptimisticSync(userProfile, classes, updatedLogs).then(() => {
      mobilePersistenceAdapter.getQueuedMutations().then((q) => setQueuedCount(q.length));
    });
  };

  const handleDeleteSessionLog = (id: string) => {
    if (!isStorageReady) return;
    hapticFeedback.heavy();
    const updatedLogs = sessionLogs.filter((l) => l.id !== id);
    setSessionLogs(updatedLogs);

    mobileSyncBridge.performOptimisticSync(userProfile, classes, updatedLogs).then(() => {
      mobilePersistenceAdapter.getQueuedMutations().then((q) => setQueuedCount(q.length));
    });
  };

  const handleUpdateSessionLog = (updatedLog: ClassSessionLog) => {
    if (!isStorageReady) return;
    const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setSessionLogs(updatedLogs);

    mobileSyncBridge.performOptimisticSync(userProfile, classes, updatedLogs).then(() => {
      mobilePersistenceAdapter.getQueuedMutations().then((q) => setQueuedCount(q.length));
    });
  };

  // Tab navigation bar click handler
  const handleTabPress = (tab: MainTabType) => {
    hapticFeedback.light();
    setActiveTab(tab);
  };

  // 1. Storage Loading Error State: Block all interaction to prevent overwriting
  if (storageLoadError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle={palette.isDark ? 'light-content' : 'dark-content'} backgroundColor={palette.background} />
        <View style={{ alignItems: 'center', maxWidth: 320 }}>
          <Text style={{ color: palette.danger || '#EF4444', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
            خطا در دسترسی به حافظه
          </Text>
          <Text style={{ color: palette.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 22 }}>
            {storageLoadError}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setStorageLoadError(null);
              setIsStorageReady(false);
              setReloadKey((k) => k + 1);
            }}
            style={{ backgroundColor: palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>تلاش مجدد</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Storage Loading Gate: Render clean loading indicator until storage hydration finishes
  if (!isStorageReady) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={palette.isDark ? 'light-content' : 'dark-content'} backgroundColor={palette.background} />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.textSecondary, fontSize: 14, marginTop: 16, fontWeight: '500' }}>
          در حال بارگذاری اطلاعات...
        </Text>
      </SafeAreaView>
    );
  }

  // 3. First-Time Setup Modal: Only displayed if storage is ready AND studentProfile is truly empty
  if (!userProfile) {
    return (
      <ProfileSetupModal
        isFirstTime={true}
        onSave={(data) => {
          if (!isStorageReady) return;
          hapticFeedback.success();
          setUserProfile(data);
          mobileSyncBridge.performOptimisticSync(data, classes, sessionLogs);
        }}
      />
    );
  }

  const initials = `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase();

  // Filtered classes by day and search
  const filteredClasses = classes.filter((c) => {
    const matchesDay = selectedDayFilter === 'همه' || c.day === selectedDayFilter;
    if (!matchesDay) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const nameMatch = c.name.toLowerCase().includes(query);
    const profMatch = c.professor ? c.professor.toLowerCase().includes(query) : false;
    return nameMatch || profMatch;
  });

  const targetDeleteClass = classes.find((c) => c.id === deletingClassId);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={palette.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={palette.background}
      />

      {/* Subtle Neumorphic Network Resilience Toast / Banner */}
      <OfflineSyncBanner
        syncState={syncState}
        queuedCount={queuedCount}
        onRetrySync={handleRetrySync}
      />

      {/* Main Tab Screen Router */}
      {activeTab === 'home' && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: 14,
              paddingBottom: Math.max(insets.bottom + 96, 120),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header: Clean Brand Title & Student Name */}
            <View style={styles.header}>
              <View style={styles.welcomeTextGroup}>
                <Text style={[styles.appKicker, { color: palette.primary }]}>DaneshMate</Text>
                <Text style={[styles.userName, { color: palette.textPrimary }]}>
                  {userProfile.firstName} {userProfile.lastName}
                </Text>
                <Text style={[styles.userSubtitle, { color: palette.textSecondary }]}>
                  برنامه هفتگی و یادداشت‌های تحصیلی
                </Text>
              </View>

              <View style={styles.headerActions}>
                {/* Profile Avatar Button */}
                <NeumorphicButton
                  onPress={() => setActiveTab('profile')}
                  style={styles.avatarButton}
                  title=""
                >
                  <View style={[styles.avatarInner, { backgroundColor: palette.surfaceInner }]}>
                    <Icon name="profile" size={20} color={palette.primary} />
                  </View>
                </NeumorphicButton>
              </View>
            </View>

            <LiveDateCard />

            {/* Overview Bento Cards */}
            <View style={styles.overviewGrid}>
              {userProfile.passedUnits ? (
                <LiquidBentoCard style={styles.metricCard} borderRadius={24}>
                  <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                    کل واحدهای گذرانده
                  </Text>
                  <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                    {userProfile.passedUnits}
                  </Text>
                  <Text style={[styles.metricFootnote, { color: palette.textMuted }]}>
                    واحدهای ثبت شده شما
                  </Text>
                </LiquidBentoCard>
              ) : null}

              <LiquidBentoCard
                style={[styles.metricCard, !userProfile.passedUnits && styles.metricCardFull]}
                borderRadius={24}
              >
                <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                  کلاس‌های ثبت‌شده
                </Text>
                <Text style={[styles.metricValue, { color: palette.primary }]}>
                  {classes.length} درس
                </Text>
                <Text style={[styles.metricFootnote, { color: palette.textMuted }]}>
                  برنامه فعال هفتگی
                </Text>
              </LiquidBentoCard>
            </View>

            {/* Real-time Search Bar */}
            <NeumorphicSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="جستجوی سریع درس یا نام استاد..."
            />

            {/* Day Filter Carousel */}
            <View style={styles.filterSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {DAYS_FILTER.map((d) => {
                  const isActive = selectedDayFilter === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setSelectedDayFilter(d)}
                      style={[
                        styles.filterTab,
                        {
                          backgroundColor: isActive ? palette.surfaceInner : palette.surfaceCard,
                          borderColor: isActive ? palette.primary : 'transparent',
                          borderWidth: isActive ? 1.5 : 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          {
                            color: isActive ? palette.primary : palette.textSecondary,
                            fontWeight: isActive ? '900' : '700',
                          },
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Classes Section Header */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  {selectedDayFilter === 'همه'
                    ? 'تمامی کلاس‌های هفتگی'
                    : `کلاس‌های روز ${selectedDayFilter}`}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                  {filteredClasses.length} جلسه {searchQuery.trim() ? `(فیلتر جستجو)` : `در این بازه ثبت شده است`}
                </Text>
              </View>

              <NeumorphicButton
                title="+ افزودن کلاس"
                variant="primary"
                size="sm"
                onPress={handleOpenAddClass}
              />
            </View>

            {/* Classes List */}
            {filteredClasses.length === 0 ? (
              <LiquidBentoCard style={styles.emptyStateCard} borderRadius={24}>
                <View style={[styles.emptyIconCircle, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
                  <Text style={[styles.emptyStateSymbol, { color: palette.primary }]}>✦</Text>
                </View>
                <Text style={[styles.emptyStateTitle, { color: palette.textPrimary }]}>
                  {searchQuery.trim()
                    ? `نتیجه‌ای برای «${searchQuery}» یافت نشد`
                    : classes.length === 0
                    ? 'هنوز کلاسی ثبت نکرده‌اید'
                    : `برای روز ${selectedDayFilter} کلاسی ثبت نشده است`}
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: palette.textSecondary }]}>
                  {searchQuery.trim()
                    ? 'می‌توانید عبارت جستجو را پاک کرده یا نام استاد/درس دیگری را امتحان کنید.'
                    : 'برای تعریف درس جدید و تنظیم ساعت و روز، روی دکمه «+ افزودن کلاس» ضربه بزنید.'}
                </Text>
                {searchQuery.trim() ? (
                  <NeumorphicButton
                    title="پاک کردن جستجو"
                    size="md"
                    onPress={() => setSearchQuery('')}
                    style={{ marginTop: 14 }}
                  />
                ) : (
                  <NeumorphicButton
                    title="افزودن کلاس"
                    variant="primary"
                    size="md"
                    onPress={handleOpenAddClass}
                    style={{ marginTop: 14 }}
                  />
                )}
              </LiquidBentoCard>
            ) : (
              <View style={styles.classesList}>
                {filteredClasses.map((item) => (
                  <DynamicClassItem
                    key={item.id}
                    item={item}
                    onEdit={handleOpenEditClass}
                    onDelete={(id) => setDeletingClassId(id)}
                  />
                ))}
              </View>
            )}

            {/* Cyber-Luxe Liquid Bento Branding & Support Footer */}
            <DonationBadge style={{ marginTop: 16 }} />
            <NullSparkleLink style={{ marginTop: 4, marginBottom: 20 }} />
          </Animated.View>
        </ScrollView>
      )}

      {/* Notes & Multimedia Screen */}
      {activeTab === 'notes' && (
        <NotesScreen
          classes={classes}
          sessionLogs={sessionLogs}
          onAddLog={handleSaveSessionLog}
          onDeleteLog={handleDeleteSessionLog}
          onUpdateLog={handleUpdateSessionLog}
        />
      )}

      {/* Reports & Analytics Screen */}
      {activeTab === 'reports' && (
        <AnalyticsScreen
          classes={classes}
          sessionLogs={sessionLogs}
          passedUnits={userProfile.passedUnits}
        />
      )}

      {/* Profile Screen */}
      {activeTab === 'profile' && (
        <ProfileScreen
          userProfile={userProfile}
          onUpdateProfile={(updated) => setUserProfile(updated)}
          totalClasses={classes.length}
          totalNotes={sessionLogs.length}
          onOpenSettings={() => setActiveTab('settings')}
        />
      )}

      {/* Settings Screen (12-Theme Cyber-Luxe Engine) */}
      {activeTab === 'settings' && (
        <SettingsScreen />
      )}

      {/* 2026 Floating Circular Radial Menu (Circle Menu) */}
      <FloatingRadialMenu
        activeTab={activeTab}
        onTabSelect={handleTabPress}
        notesCount={sessionLogs.length}
      />

      {/* Settings Modal (15-Preset 2026 Theme Engine) */}
      <SettingsModal visible={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {/* Profile Modal */}
      <Modal visible={isProfileModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsProfileModalOpen(false)}>
        <ProfileSetupModal
          initialProfile={userProfile}
          isFirstTime={false}
          onSave={(updated) => {
            setUserProfile(updated);
            setIsProfileModalOpen(false);
          }}
          onCancel={() => setIsProfileModalOpen(false)}
        />
      </Modal>

      {/* Class Form Modal */}
      <Modal visible={isClassModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setIsClassModalOpen(false); setEditingClass(null); }}>
        <ClassFormModal
          initialData={editingClass}
          isEditing={!!editingClass}
          onSave={handleSaveClass}
          onCancel={() => { setIsClassModalOpen(false); setEditingClass(null); }}
        />
      </Modal>

      {/* In-Class Fast Session Capture Modal */}
      <ClassSessionCaptureModal
        visible={isSessionCaptureOpen}
        classes={classes}
        initialClassId={targetClassForSession}
        onSaveLog={handleSaveSessionLog}
        onClose={() => setIsSessionCaptureOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={!!deletingClassId}
        className={targetDeleteClass?.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingClassId(null)}
      />

      {/* Non-Intrusive GitHub Releases In-App Update Modal */}
      {updateInfo && (
        <UpdateNotificationModal
          visible={isUpdateModalOpen}
          currentVersion={updateInfo.currentVersion}
          latestVersion={updateInfo.latestVersion || ''}
          releaseNotes={updateInfo.releaseNotes}
          downloadUrl={updateInfo.downloadUrl}
          onClose={() => setIsUpdateModalOpen(false)}
          onSnooze={() => setIsUpdateModalOpen(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: getRtlRow(), justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeTextGroup: { flex: 1, alignItems: 'flex-end' },
  appKicker: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'right',
  },
  userName: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  userSubtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerActions: { flexDirection: getRtlRow(), alignItems: 'center', gap: 8, marginHorizontal: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionIcon: { fontSize: 18 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, paddingVertical: 0, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  overviewGrid: { flexDirection: getRtlRow(), flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metricCard: { flex: 1, minWidth: 120, padding: 16 },
  metricCardFull: { flexBasis: '100%' },
  metricLabel: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'right',
  },
  metricFootnote: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  filterSection: { marginBottom: 16 },
  filterScroll: { flexDirection: getRtlRow(), gap: 8, paddingVertical: 4 },
  filterTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  filterTabText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 12,
    writingDirection: 'rtl',
  },
  sectionHeader: { flexDirection: getRtlRow(), justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  emptyStateCard: { padding: 24, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  emptyIconCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyStateSymbol: { fontSize: 22, fontWeight: '900' },
  emptyStateTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: 16,
  },
  classesList: { gap: 12 },
});
