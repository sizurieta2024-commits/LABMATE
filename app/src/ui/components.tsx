import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, rounded, space, squircle, type } from "./theme";

const glassOK = Platform.OS === "ios" && isGlassEffectAPIAvailable();

export const tap = () => {
  if (Platform.OS === "ios") Haptics.selectionAsync();
};

/** SF Symbol with a plain-text fallback off iOS. */
export function Icon({ name, size = 20, color = colors.tint, weight = "semibold" }: {
  name: SFSymbol; size?: number; color?: ColorValue; weight?: "regular" | "medium" | "semibold" | "bold";
}) {
  return <SymbolView name={name} size={size} tintColor={color} weight={weight} fallback={<View style={{ width: size, height: size }} />} />;
}

/** Scrolling page under a native (large-title) header. Leaves room for a floating bar. */
export function Screen({ children, bottomInset = 0, ...props }: ScrollViewProps & { children: ReactNode; bottomInset?: number }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      {...props}
      contentContainerStyle={[{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxxl + bottomInset, gap: space.xxl }, props.contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}

/** Inset grouped section, like Settings: optional header above, footer below. */
export function Group({ header, footer, children, style }: { header?: string; footer?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View>
      {header ? <Text style={[type.section, { marginLeft: space.lg, marginBottom: space.sm }]}>{header}</Text> : null}
      <View style={[styles.group, style]}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={styles.separator} />}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? <Text style={[type.footnote, { marginHorizontal: space.lg, marginTop: space.sm }]}>{footer}</Text> : null}
    </View>
  );
}

/** A plain content card (no row separators). */
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [styles.card, style, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}>
      {children}
    </Pressable>
  );
}

/** List row: leading symbol tile, title/subtitle, trailing accessory. */
export function Row({ icon, iconBg, title, subtitle, value, accessory, onPress, titleStyle, lines = 2 }: {
  icon?: SFSymbol; iconBg?: ColorValue; title: string; subtitle?: string; value?: string;
  accessory?: "chevron" | "check" | "none" | ReactNode; onPress?: () => void; titleStyle?: object;
  /** Max lines for title and subtitle; 0 shows everything. */
  lines?: number;
}) {
  const content = (pressed: boolean) => (
    <View style={[styles.row, pressed && { backgroundColor: colors.fill }]}>
      {icon && (
        <View style={[styles.tile, { backgroundColor: iconBg ?? colors.tint }]}>
          <Icon name={icon} size={16} color="#FFFFFF" />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, titleStyle]} numberOfLines={lines || undefined}>{title}</Text>
        {subtitle ? <Text style={[type.footnote, !lines && { fontSize: 15, lineHeight: 20 }]} numberOfLines={lines || undefined}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[type.body, { color: colors.secondary }]}>{value}</Text> : null}
      {accessory === "chevron" && <Icon name="chevron.right" size={13} color={colors.tertiary} weight="bold" />}
      {accessory === "check" && <Icon name="checkmark" size={16} color={colors.tint} weight="bold" />}
      {accessory && typeof accessory !== "string" ? accessory : null}
    </View>
  );
  if (!onPress) return content(false);
  return <Pressable onPress={() => { tap(); onPress(); }}>{({ pressed }) => content(pressed)}</Pressable>;
}

type ButtonKind = "prominent" | "tinted" | "plain" | "glass";

/** iOS 26 capsule buttons. `glass` is real Liquid Glass (control layer only). */
export function Button({ title, onPress, kind = "prominent", icon, disabled, loading, size = "large" }: {
  title: string; onPress: () => void; kind?: ButtonKind; icon?: SFSymbol; disabled?: boolean; loading?: boolean; size?: "large" | "small";
}) {
  const h = size === "large" ? 52 : 36;
  const fg = kind === "prominent" ? colors.onTint : colors.tint;
  const bg = kind === "prominent" ? colors.tint : kind === "tinted" ? colors.tintSoft : "transparent";
  const inner = (
    <View style={styles.btnInner}>
      {loading ? <ActivityIndicator color={fg as string} /> : (
        <>
          {icon && <Icon name={icon} size={size === "large" ? 17 : 14} color={fg} />}
          <Text style={[size === "large" ? type.headline : { ...type.subhead, fontWeight: "600" }, { color: fg }]}>{title}</Text>
        </>
      )}
    </View>
  );
  const press = () => { tap(); onPress(); };
  if (kind === "glass" && glassOK) {
    return (
      <Pressable onPress={press} disabled={disabled || loading} style={{ opacity: disabled ? 0.4 : 1 }}>
        <GlassView isInteractive glassEffectStyle="regular" style={[styles.btn, { height: h }]}>{inner}</GlassView>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={press}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, { height: h, backgroundColor: kind === "glass" ? colors.card : bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 }]}
    >
      {inner}
    </Pressable>
  );
}

/**
 * Floating Liquid Glass action bar pinned to the bottom, over scrolling content.
 * The primary action is blue-tinted glass (Apple's "glass prominent").
 */
export function ActionBar({ title, onPress, icon, disabled, loading }: {
  title: string; onPress: () => void; icon?: SFSymbol; disabled?: boolean; loading?: boolean;
}) {
  const insets = useSafeAreaInsets();
  // Disabled = neutral glass with secondary text, the way iOS dims a prominent glass button.
  const fg = disabled ? colors.secondary : "#FFFFFF";
  const inner = (
    <View style={[styles.btnInner, { height: 56 }]}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : (
        <>
          {icon && <Icon name={icon} size={18} color={fg} />}
          <Text style={[type.headline, { color: fg }]}>{title}</Text>
        </>
      )}
    </View>
  );
  return (
    <View pointerEvents="box-none" style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      <Pressable onPress={() => { tap(); onPress(); }} disabled={disabled || loading}>
        {glassOK ? (
          <GlassView
            isInteractive={!disabled}
            glassEffectStyle="regular"
            tintColor={disabled ? undefined : colors.tintHex}
            style={styles.barBtn}
          >
            {inner}
          </GlassView>
        ) : (
          <View style={[styles.barBtn, { backgroundColor: disabled ? colors.fillStrong : colors.tint }]}>{inner}</View>
        )}
      </Pressable>
    </View>
  );
}
export const ACTION_BAR_SPACE = 110;

/** Small capsule label. `green` is reserved for fresh funding. */
export function Capsule({ label, tone = "neutral", icon }: { label: string; tone?: "neutral" | "green" | "orange" | "blue"; icon?: SFSymbol }) {
  const map = {
    neutral: [colors.fill, colors.secondary],
    green: [colors.greenSoft, colors.green],
    orange: [colors.orangeSoft, colors.orange],
    blue: [colors.tintSoft, colors.tint],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.capsule, { backgroundColor: bg }]}>
      {icon && <Icon name={icon} size={11} color={fg} weight="bold" />}
      <Text style={{ fontSize: 13, lineHeight: 16, fontWeight: "600", color: fg }}>{label}</Text>
    </View>
  );
}

/** Text field row inside a Group. */
export function FieldRow({ label, multiline, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={[styles.row, multiline && { alignItems: "flex-start" }]}>
      {label ? <Text style={[type.body, { width: 92 }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.tertiary as string}
        {...props}
        multiline={multiline}
        style={[type.body, { flex: 1, padding: 0, minHeight: multiline ? 88 : undefined, textAlignVertical: multiline ? "top" : "center" }, props.style]}
      />
    </View>
  );
}

/** Big rounded number with a small caption, like Health. */
export function Stat({ value, label, color = colors.label }: { value: string; label: string; color?: ColorValue }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[type.title2, rounded, { fontWeight: "800", color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={type.footnote}>{label}</Text>
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 80, gap: space.md }}>
      <ActivityIndicator />
      <Text style={type.subhead}>{label}</Text>
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={{ gap: space.md, alignItems: "flex-start" }}>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
        <Icon name="exclamationmark.triangle.fill" size={17} color={colors.orange} />
        <Text style={type.headline}>Something went wrong</Text>
      </View>
      <Text style={type.subhead}>{message}</Text>
      {onRetry && <Button title="Try Again" kind="tinted" size="small" onPress={onRetry} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden", ...squircle },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: space.xl, ...squircle },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: space.lg },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: 13, minHeight: 52 },
  tile: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", ...squircle },
  btn: { borderRadius: radius.pill, overflow: "hidden", paddingHorizontal: space.xl, justifyContent: "center" },
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  barWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl },
  barBtn: { borderRadius: radius.pill, overflow: "hidden" },
  capsule: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, alignSelf: "flex-start" },
});
