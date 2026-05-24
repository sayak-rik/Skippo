import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export interface Country {
  name: string;
  flag: string;
  code: string; // e.g. "+91"
}

const COUNTRIES: Country[] = [
  { name: "India",        flag: "🇮🇳", code: "+91"  },
  { name: "USA",          flag: "🇺🇸", code: "+1"   },
  { name: "UK",           flag: "🇬🇧", code: "+44"  },
  { name: "UAE",          flag: "🇦🇪", code: "+971" },
  { name: "Singapore",    flag: "🇸🇬", code: "+65"  },
  { name: "Australia",    flag: "🇦🇺", code: "+61"  },
  { name: "Canada",       flag: "🇨🇦", code: "+1"   },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "+966" },
  { name: "Qatar",        flag: "🇶🇦", code: "+974" },
  { name: "Kuwait",       flag: "🇰🇼", code: "+965" },
  { name: "Bahrain",      flag: "🇧🇭", code: "+973" },
  { name: "Oman",         flag: "🇴🇲", code: "+968" },
  { name: "Malaysia",     flag: "🇲🇾", code: "+60"  },
  { name: "New Zealand",  flag: "🇳🇿", code: "+64"  },
  { name: "South Africa", flag: "🇿🇦", code: "+27"  },
];

interface Props {
  value: string;
  onChangePhone: (fullPhone: string) => void;
  editable?: boolean;
}

export function PhoneInput({ value, onChangePhone, editable = true }: Props) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState(
    // Strip the country code prefix if value already has one
    value.startsWith(country.code) ? value.slice(country.code.length).trim() : value
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setPickerOpen(false);
    onChangePhone(`${c.code}${localNumber}`);
  }

  function handleLocalNumberChange(text: string) {
    // Strip any leading zeros for E.164 compatibility
    setLocalNumber(text);
    onChangePhone(`${country.code}${text}`);
  }

  return (
    <>
      <View style={[styles.row, !editable && styles.rowDisabled]}>
        {/* Country code picker */}
        <TouchableOpacity
          style={styles.codeBtn}
          onPress={() => editable && setPickerOpen(true)}
          activeOpacity={editable ? 0.7 : 1}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={styles.code}>{country.code}</Text>
          {editable && <Text style={styles.chevron}>▾</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Local number */}
        <TextInput
          style={styles.input}
          placeholder="98765 43210"
          placeholderTextColor={palette.inkSoft}
          keyboardType="phone-pad"
          value={localNumber}
          onChangeText={handleLocalNumberChange}
          editable={editable}
        />
      </View>

      {/* Country picker modal */}
      <Modal visible={pickerOpen} transparent animationType="slide">
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Select country</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(c) => c.name}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const active = item.name === country.name;
              return (
                <TouchableOpacity
                  style={[styles.countryRow, active && styles.countryRowActive]}
                  onPress={() => handleCountrySelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={[styles.countryName, active && styles.countryNameActive]}>
                    {item.name}
                  </Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                  {active && <Text style={styles.tick}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.stroke,
    overflow: "hidden",
  },
  rowDisabled: { opacity: 0.55 },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 4,
  },
  flag:    { fontSize: 18 },
  code:    { fontSize: 14, fontWeight: "700", color: palette.ink },
  chevron: { fontSize: 10, color: palette.inkSoft, marginTop: 2 },
  divider: { width: 1, height: 20, backgroundColor: palette.stroke },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: palette.ink,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: palette.stroke,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
    marginBottom: spacing.md,
  },
  separator:       { height: 1, backgroundColor: palette.stroke },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  countryRowActive: { },
  countryFlag:      { fontSize: 20 },
  countryName: {
    flex: 1,
    fontSize: 14,
    color: palette.ink,
    fontWeight: "500",
  },
  countryNameActive: { color: palette.brand, fontWeight: "700" },
  countryCode: { fontSize: 13, color: palette.inkSoft, fontWeight: "600" },
  tick:        { fontSize: 15, color: palette.brand, fontWeight: "900" },
});
