import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  title: string;
  data: any[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

function getValue(item: any, keys: string[]) {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce(
        (obj: any, part: string) =>
          obj?.[part],
        item
      );

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return String(value);
    }
  }

  return "N/A";
}

export default function ModuleList({
  title,
  data,
  loading,
  refreshing,
  onRefresh,
}: Props) {
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Text style={styles.title}>{title}</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>
            No records found
          </Text>
          <Text style={styles.emptyText}>
            Data will appear here when available.
          </Text>
        </View>
      ) : (
        data.map((item, index) => (
          <View
            key={item._id || item.id || index}
            style={styles.card}
          >
            <Text style={styles.primary}>
              {getValue(item, [
                "name",
                "patient.name",
                "patient.user.name",
                "doctor.user.name",
                "title",
                "invoiceNumber",
                "prescriptionNumber",
              ])}
            </Text>

            <Text style={styles.secondary}>
              {getValue(item, [
                "patientId",
                "patient.patientId",
                "appointmentDate",
                "date",
                "status",
                "reason",
                "diagnosis",
                "amount",
                "totalAmount",
              ])}
            </Text>

            {item.status && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {String(item.status)}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#172033",
    marginTop: 24,
    marginBottom: 18,
  },
  loader: {
    marginTop: 50,
  },
  empty: {
    backgroundColor: "#FFFFFF",
    padding: 35,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 12,
    color: "#172033",
  },
  emptyText: {
    color: "#8994A7",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
    elevation: 2,
  },
  primary: {
    fontSize: 16,
    fontWeight: "800",
    color: "#172033",
  },
  secondary: {
    fontSize: 12,
    color: "#7A8699",
    marginTop: 7,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: "#315FEF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },
});
