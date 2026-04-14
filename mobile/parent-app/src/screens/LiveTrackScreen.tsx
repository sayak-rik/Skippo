import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { useTripTracking } from "../hooks/useTripTracking";
import { palette } from "../theme/palette";

export function LiveTrackScreen() {
  const { data } = useParentDashboard();
  const tracking = useTripTracking(data?.trip?.id);

  if (!data) {
    return null;
  }

  const location = tracking.data?.result?.latest_location ?? data.trip.busLocation;

  return (
    <Screen scroll={false}>
      <SectionTitle
        title="Live Tracking"
        subtitle={`${data.trip.busLabel} on ${data.trip.routeName}`}
      />

      <View style={styles.mapShell}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={data.trip.busLabel}
            description="Live bus position"
          />
        </MapView>
      </View>

      <InfoCard title="Trip details" subtitle="Updated from Google Maps coordinates">
        <Text style={styles.detail}>ETA: {data.trip.etaMinutes} minutes</Text>
        <Text style={styles.detail}>Speed: {location.speed} km/h</Text>
        <Text style={styles.detail}>Last update: {location.created_at ?? location.updatedAt}</Text>
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    flex: 1,
    minHeight: 360,
  },
  map: {
    flex: 1,
  },
  detail: {
    color: palette.inkSoft,
    fontSize: 14,
  },
});
