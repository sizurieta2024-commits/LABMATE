import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space, type } from "./theme";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}) {
  const bg = variant === "primary" ? colors.accent : variant === "secondary" ? colors.accentSoft : "transparent";
  const fg = variant === "primary" ? "#fff" : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone = "default" }: { label: string; selected?: boolean; onPress?: () => void; tone?: "default" | "fresh" | "warn" }) {
  const toneBg = tone === "fresh" ? colors.freshSoft : tone === "warn" ? colors.warnSoft : selected ? colors.ink : colors.card;
  const toneFg = tone === "fresh" ? colors.fresh : tone === "warn" ? colors.warn : selected ? "#fff" : colors.ink;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.chip, { backgroundColor: toneBg, borderColor: tone === "default" ? colors.faint : toneBg }]}>
      <Text style={{ color: toneFg, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={type.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: "top" }, props.style]} />
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={{ alignItems: "center", padding: space.xxl, gap: space.md }}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={{ borderColor: colors.danger, gap: space.sm }}>
      <Text style={[type.body, { color: colors.danger }]}>{message}</Text>
      {onRetry && <Button title="Try again" variant="secondary" onPress={onRetry} />}
    </Card>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={type.label}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.faint,
  },
  button: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: space.lg, alignItems: "center" },
  buttonText: { fontSize: 16, fontWeight: "700" },
  chip: { borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.faint,
    padding: space.md,
    fontSize: 16,
    color: colors.ink,
  },
});
