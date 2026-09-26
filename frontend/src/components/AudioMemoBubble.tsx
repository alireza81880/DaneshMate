import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface AudioMemoBubbleProps {
  durationSeconds: number;
  time: string;
}

export const AudioMemoBubble: React.FC<AudioMemoBubbleProps> = React.memo(
  ({ durationSeconds, time }) => {
    const { palette } = useTheme();

    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

    const waveAnim = useRef(new Animated.Value(0)).current;
    const totalDuration = durationSeconds > 0 ? durationSeconds : 45;

    // Independent timer ticker for audio memo playback without triggering list re-renders
    useEffect(() => {
      let interval: any;
      if (isPlaying) {
        interval = setInterval(() => {
          setElapsedSeconds((prev) => {
            if (prev >= totalDuration) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }, 1000 / playbackSpeed);
      }
      return () => clearInterval(interval);
    }, [isPlaying, totalDuration, playbackSpeed]);

    // Waveform loop animation with GPU-accelerated driver
    useEffect(() => {
      if (isPlaying) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(waveAnim, {
              toValue: 1,
              duration: 380,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(waveAnim, {
              toValue: 0,
              duration: 380,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ])
        ).start();
      } else {
        waveAnim.setValue(0);
      }
    }, [isPlaying, waveAnim]);

    const handleTogglePlay = useCallback(() => {
      setIsPlaying((prev) => !prev);
    }, []);

    const handleToggleSpeed = useCallback(() => {
      setPlaybackSpeed((curr) => {
        if (curr === 1) return 1.5;
        if (curr === 1.5) return 2;
        return 1;
      });
    }, []);

    const formatTimer = useCallback((secs: number) => {
      const mins = Math.floor(secs / 60);
      const remainder = secs % 60;
      return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
    }, []);

    const progressPercent = useMemo(
      () => Math.min(100, Math.round((elapsedSeconds / totalDuration) * 100)),
      [elapsedSeconds, totalDuration]
    );

    const waveHeights = useMemo(
      () => [35, 75, 25, 95, 60, 100, 45, 80, 50, 70, 90, 40, 85],
      []
    );

    const gpuAcceleratedCardStyle = useMemo(
      () => [
        styles.chatBubble,
        {
          backgroundColor: palette.surfaceCard,
          borderColor: palette.borderLuminous,
          transform: Platform.OS === 'web' ? ([{ translateZ: 0 }] as any) : [{ perspective: 1000 }],
        },
      ],
      [palette.surfaceCard, palette.borderLuminous]
    );

    return (
      <View style={styles.messageRowLeft}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarIcon}>🎙</Text>
        </View>

        <View style={gpuAcceleratedCardStyle}>
          <View style={styles.bubbleHeader}>
            <Text style={styles.bubbleSender}>صوت زنده جلسه کلاسی</Text>
            <Text style={[styles.bubbleTime, { color: palette.textMuted }]}>{time}</Text>
          </View>

          {/* Inline Audio Player Widget */}
          <View
            style={[
              styles.inlineAudioCard,
              {
                backgroundColor: palette.surfaceInner,
                borderColor: palette.borderLuminous,
              },
            ]}
          >
            <View style={styles.audioControlsRow}>
              <Pressable
                onPress={handleTogglePlay}
                style={[styles.audioPlayBtn, { backgroundColor: palette.primary }]}
                hitSlop={8}
              >
                {Platform.OS === 'web' ? (
                  isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )
                ) : (
                  <Text style={styles.audioPlayIconText}>{isPlaying ? '❚❚' : '▶'}</Text>
                )}
              </Pressable>

              <View style={styles.audioWaveAndProgress}>
                {/* Waveform Visualization */}
                <View style={styles.waveformContainer}>
                  {waveHeights.map((height, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.waveBar,
                        {
                          height: isPlaying ? height * (idx % 2 === 0 ? 0.9 : 0.6) : 8,
                          backgroundColor: isPlaying ? palette.primary : palette.borderLuminous,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Scrubber / Progress Track */}
                <View style={[styles.progressBarTrack, { backgroundColor: palette.surfaceCard }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: palette.primary,
                      },
                    ]}
                  />
                </View>

                {/* Dynamic Status / Elapsed Duration */}
                <View style={styles.audioTimeRow}>
                  <Text style={[styles.audioDurationText, { color: palette.textMuted }]}>
                    {formatTimer(elapsedSeconds)} / {formatTimer(totalDuration)}
                  </Text>
                  <Text
                    style={[
                      styles.audioStatusText,
                      { color: isPlaying ? palette.primary : palette.textMuted },
                    ]}
                  >
                    {isPlaying ? 'در حال پخش...' : 'متوقف'}
                  </Text>
                </View>
              </View>

              {/* Speed Controller */}
              <Pressable
                onPress={handleToggleSpeed}
                style={[
                  styles.speedBtn,
                  {
                    backgroundColor: palette.surfaceCard,
                    borderColor: palette.borderLuminous,
                  },
                ]}
                hitSlop={6}
              >
                <Text style={[styles.speedText, { color: palette.primary }]}>
                  {playbackSpeed}x
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

AudioMemoBubble.displayName = 'AudioMemoBubble';

const styles = StyleSheet.create({
  messageRowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '92%',
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  avatarIcon: {
    fontSize: 16,
  },
  chatBubble: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  bubbleSender: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
    color: '#8B5CF6',
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inlineAudioCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  audioWaveAndProgress: {
    flex: 1,
    gap: 6,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 18,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  audioTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioDurationText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  audioStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
