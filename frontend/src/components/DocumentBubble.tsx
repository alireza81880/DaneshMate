import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AttachedFile, FileCategory } from './ClassSessionCaptureModal';

interface DocumentBubbleProps {
  file: AttachedFile;
  time: string;
  onOpenNotify?: (fileName: string) => void;
}

export const DocumentBubble: React.FC<DocumentBubbleProps> = React.memo(
  ({ file, time, onOpenNotify }) => {
    const { palette } = useTheme();

    const formattedFileName = useMemo(() => {
      const name = file.name || 'فایل_پیوست';
      if (name.length <= 22) return name;
      const lastDot = name.lastIndexOf('.');
      const ext = lastDot !== -1 ? name.slice(lastDot) : '';
      const base = lastDot !== -1 ? name.slice(0, lastDot) : name;
      if (base.length <= 12) return name;
      return `${base.slice(0, 8)}...${base.slice(-4)}${ext}`;
    }, [file.name]);

    const handleOpenFile = useCallback(async () => {
      const sampleUrls: Record<FileCategory, string> = {
        pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        powerpoint: 'https://view.officeapps.live.com/op/view.aspx?src=sample.pptx',
        word: 'https://view.officeapps.live.com/op/view.aspx?src=sample.docx',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
        audio: '',
        other: '',
      };

      const targetUrl = file.uri || file.url || sampleUrls[file.type] || sampleUrls.pdf;

      if (onOpenNotify) {
        onOpenNotify(file.name);
      }

      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined') {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          }
        } catch (err) {
          console.warn('Web file opening error', err);
        }
      } else {
        try {
          const supported = await Linking.canOpenURL(targetUrl);
          if (supported) {
            await Linking.openURL(targetUrl);
          } else {
            await Linking.openURL(targetUrl);
          }
        } catch (err) {
          console.warn('Native Linking error', err);
        }
      }
    }, [file, onOpenNotify]);

    const fileIcon = useMemo(() => {
      switch (file.type) {
        case 'pdf':
          return '📄';
        case 'powerpoint':
          return '📊';
        case 'word':
          return '📝';
        case 'image':
          return '🖼️';
        case 'audio':
          return '🎵';
        default:
          return '📎';
      }
    }, [file.type]);

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
          <Text style={styles.avatarIcon}>📎</Text>
        </View>

        <View style={gpuAcceleratedCardStyle}>
          <View style={styles.bubbleHeader}>
            <Text style={styles.bubbleSender}>مستند کلاسی پیوست‌شده</Text>
            <Text style={[styles.bubbleTime, { color: palette.textMuted }]}>
              {time.includes('-') ? time.split('-')[0].trim() : (time.includes('/') ? time : '1405/7/5')}
            </Text>
          </View>

          <Pressable
            onPress={handleOpenFile}
            style={({ pressed }) => [
              styles.fileCardButton,
              {
                backgroundColor: pressed ? palette.surfaceCard : palette.surfaceInner,
                borderColor: palette.borderLuminous,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            hitSlop={6}
          >
            <View style={styles.fileIconWrapper}>
              <Text style={styles.fileIconSymbol}>{fileIcon}</Text>
              <View style={[styles.fileTypeTag, { backgroundColor: palette.surfaceCard }]}>
                <Text style={[styles.fileTypeTagText, { color: palette.primary }]}>
                  {file.type.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.fileDetailsWrapper}>
              <Text
                style={[styles.fileNameText, { color: palette.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {formattedFileName}
              </Text>
              <View style={styles.fileSubDetails}>
                <Text style={[styles.fileSizeText, { color: palette.textMuted }]}>
                  {file.sizeText}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Bubble Footer: Time on Bottom-Left */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingTop: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: palette.textMuted }}>
              {time.includes('-') ? time.split('-').pop()?.trim() : time}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

DocumentBubble.displayName = 'DocumentBubble';

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
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
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
    color: '#3B82F6',
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fileCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  fileIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconSymbol: {
    fontSize: 20,
  },
  fileTypeTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  fileTypeTagText: {
    fontSize: 8,
    fontWeight: '900',
  },
  fileDetailsWrapper: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  fileSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  fileSizeText: {
    fontSize: 10,
  },
  openIntentHint: {
    fontSize: 10,
    fontWeight: '800',
  },
});
