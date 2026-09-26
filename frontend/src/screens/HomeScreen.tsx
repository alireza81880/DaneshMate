import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  Platform,
  Pressable,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
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

  // Load persistent snapshot on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const snapshot = await mobilePersistenceAdapter.loadSnapshot();
        if (isMounted && snapshot) {
          if (snapshot.studentProfile && !userProfile) {
            setUserProfile(snapshot.studentProfile);
          }
          if (snapshot.classes && snapshot.classes.length > 0 && classes.length === 0) {
            setClasses(snapshot.classes as DynamicClassItemData[]);
          }
          if (snapshot.sessionLogs && snapshot.sessionLogs.length > 0 && sessionLogs.length === 0) {
            setSessionLogs(snapshot.sessionLogs as ClassSessionLog[]);
          }
        }
        const queued = await mobilePersistenceAdapter.getQueuedMutations();
        if (isMounted) setQueuedCount(queued.length);
      } catch {
        // Fallback gracefully
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
  }, []);

  const handleRetrySync = async () => {
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
    hapticFeedback.light();
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (item: DynamicClassItemData) => {
    hapticFeedback.light();
    setEditingClass({
      id: item.id,
      name: item.name,
      day: item.day,
      time: item.time,
      recurrence: item.recurrence,
      professor: item.professor,
      location: item.location,
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (formData: ClassFormData) => {
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
    if (!deletingClassId) return;
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
    hapticFeedback.success();
    const updatedLogs = [log, ...sessionLogs];
    setSessionLogs(updatedLogs);

    mobileSyncBridge.performOptimisticSync(userProfile, classes, updatedLogs).then(() => {
      mobilePersistenceAdapter.getQueuedMutations().then((q) => setQueuedCount(q.length));
    });
  };

  const handleDeleteSessionLog = (id: string) => {
    hapticFeedback.heavy();
    const updatedLogs = sessionLogs.filter((l) => l.id !== id);
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

  if (!userProfile) {
    return (
      <ProfileSetupModal
        isFirstTime={true}
        onSave={(data) => {
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                    {Platform.OS === 'web' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <Text style={[styles.avatarText, { color: palette.primary }]}>
                        DM
                      </Text>
                    )}
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
              </NeumorphicCard>
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

            {/* Cyber-Luxe Liquid Bento Branding Footer */}
            <NullSparkleLink />
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
  scrollContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 24 : 12, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeTextGroup: { flex: 1 },
  appKicker: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2, textAlign: 'right' },
  userName: { fontSize: 20, fontWeight: '900', textAlign: 'right' },
  userSubtitle: { fontSize: 12, marginTop: 2, textAlign: 'right' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 },
  iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionIcon: { fontSize: 18 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, paddingVertical: 0, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 13, fontWeight: '900' },
  overviewGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metricCard: { flex: 1, padding: 16 },
  metricCardFull: { flexBasis: '100%' },
  metricLabel: { fontSize: 11, fontWeight: '600', textAlign: 'right', marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: '900', textAlign: 'right' },
  metricFootnote: { fontSize: 10, textAlign: 'right', marginTop: 4 },
  filterSection: { marginBottom: 16 },
  filterScroll: { gap: 8, paddingVertical: 4 },
  filterTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  filterTabText: { fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textAlign: 'right' },
  sectionSubtitle: { fontSize: 11, textAlign: 'right', marginTop: 2 },
  emptyStateCard: { padding: 24, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  emptyIconCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyStateSymbol: { fontSize: 22, fontWeight: '900' },
  emptyStateTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  emptyStateSubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  classesList: { gap: 12 },
});
