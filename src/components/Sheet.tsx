import React, { createContext, useContext } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R, S } from '../theme';
import { GhostButton, Label } from './ui';

const EmbeddedSheet = createContext(false);

/** One native modal stays mounted as the host moves between preparation views. */
export function OverlayLayer({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <EmbeddedSheet.Provider value={true}>{children}</EmbeddedSheet.Provider>
  </Modal>;
}

export function Sheet({ title, eyebrow, onClose, closeLabel = 'Close', children, status }: {
  title: string; eyebrow?: string; onClose: () => void; closeLabel?: string; children: React.ReactNode; status?: React.ReactNode;
}) {
  const embedded = useContext(EmbeddedSheet);
  const body = <SafeAreaView style={styles.backdrop}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 5 }}>{eyebrow ? <Label color={C.text}>{eyebrow}</Label> : null}
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          </View>
          <GhostButton label={closeLabel} onPress={onClose} />
        </View>
        {status ? <View style={{ paddingHorizontal: S.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line2 }}>{status}</View> : null}
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>;
  return embedded ? body : <Modal visible transparent animationType="slide" onRequestClose={onClose}>{body}</Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000B', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { backgroundColor: C.ink2, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, borderWidth: 1, borderColor: C.line2, width: '100%', maxWidth: 800, maxHeight: '96%', flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: S.lg, borderBottomWidth: 1, borderBottomColor: C.line2 },
  title: { color: C.text, fontFamily: F.semibold, fontSize: 26, lineHeight: 31 },
  body: { padding: S.lg, paddingBottom: 40, gap: 18 },
});
