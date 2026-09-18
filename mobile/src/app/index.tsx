import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const API_URL =
  "https://clinic-management-backend-j84t.onrender.com/api";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

type DashboardStats = {
  totalPatients?: number;
  totalDoctors?: number;
  totalAppointments?: number;
  todayAppointments?: number;
  totalRevenue?: number;
  pendingPayments?: number;
  lowStockItems?: number;
  totalExpenses?: number;
};

type Appointment = {
  _id?: string;
  id?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status?: string;
  reason?: string;
  patient?: {
    name?: string;
  };
  doctor?: {
    user?: {
      name?: string;
    };
  };
};

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("clinic_user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      await fetchDashboardData();
    } catch (error) {
      console.log("INITIALIZATION ERROR:", error);
    }
  };

  const getToken = async () => {
    return await AsyncStorage.getItem("clinic_token");
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [statsResponse, appointmentsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/dashboard/stats`, {
            headers,
          }),

          axios.get(
            `${API_URL}/dashboard/recent-appointments?limit=5`,
            {
              headers,
            }
          ),
        ]);

      console.log(
        "STATS RESPONSE:",
        statsResponse.status,
        statsResponse.data
      );

      console.log(
        "APPOINTMENTS RESPONSE:",
        appointmentsResponse.status,
        appointmentsResponse.data
      );

      const statsData =
        statsResponse.data?.data || {};

      const appointmentData =
        appointmentsResponse.data?.data || [];

      setStats(statsData);

      if (Array.isArray(appointmentData)) {
        setAppointments(appointmentData);
      } else if (
        Array.isArray(appointmentData?.appointments)
      ) {
        setAppointments(
          appointmentData.appointments
        );
      } else {
        setAppointments([]);
      }
    } catch (error: any) {
      console.log(
        "DASHBOARD ERROR:",
        error?.response?.data || error
      );

      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to load dashboard.";

        Alert.alert("Dashboard Error", message);
      } else {
        Alert.alert(
          "Dashboard Error",
          "Something went wrong while loading dashboard."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              "clinic_token",
              "clinic_user",
            ]);

            setUser(null);

            Alert.alert(
              "Logged Out",
              "You have been logged out successfully."
            );
          },
        },
      ]
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "N/A";
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case "completed":
        return styles.completedStatus;

      case "confirmed":
        return styles.confirmedStatus;

      case "cancelled":
        return styles.cancelledStatus;

      case "no-show":
        return styles.noShowStatus;

      default:
        return styles.scheduledStatus;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F5F8FF"
        />

        <View style={styles.loadingBox}>
          <View style={styles.loadingLogo}>
            <Text style={styles.loadingLogoText}>
              +
            </Text>
          </View>

          <ActivityIndicator
            size="large"
            color="#315FEF"
            style={styles.loader}
          />

          <Text style={styles.loadingTitle}>
            Loading CareSync
          </Text>

          <Text style={styles.loadingSubtitle}>
            Preparing your clinic dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F8FF"
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#315FEF"]}
          />
        }
      >
        {/* Header */}

        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>
              CareSync
            </Text>

            <Text style={styles.brandSubtitle}>
              Clinic Management
            </Text>
          </View>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </Pressable>
        </View>

        {/* Welcome */}

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back 👋
          </Text>

          <Text style={styles.userName}>
            {user?.name || "Admin"}
          </Text>

          <Text style={styles.roleText}>
            {user?.role
              ? `${user.role
                  .charAt(0)
                  .toUpperCase()}${user.role.slice(1)}`
              : "Clinic Administrator"}
          </Text>
        </View>

        {/* Stats */}

        <Text style={styles.sectionTitle}>
          Clinic Overview
        </Text>

        <View style={styles.statsGrid}>
          <StatCard
            icon="👥"
            title="Patients"
            value={stats.totalPatients ?? 0}
          />

          <StatCard
            icon="👨‍⚕️"
            title="Doctors"
            value={stats.totalDoctors ?? 0}
          />

          <StatCard
            icon="📅"
            title="Appointments"
            value={
              stats.totalAppointments ?? 0
            }
          />

          <StatCard
            icon="💰"
            title="Revenue"
            value={`₹${Number(
              stats.totalRevenue ?? 0
            ).toLocaleString("en-IN")}`}
          />
        </View>

        {/* Today's appointments */}

        <View style={styles.todayCard}>
          <View style={styles.todayLeft}>
            <Text style={styles.todayIcon}>
              📅
            </Text>

            <View>
              <Text style={styles.todayTitle}>
                Today's Appointments
              </Text>

              <Text style={styles.todaySubtitle}>
                Scheduled for today
              </Text>
            </View>
          </View>

          <Text style={styles.todayCount}>
            {stats.todayAppointments ?? 0}
          </Text>
        </View>

        {/* Financial */}

        <Text style={styles.sectionTitle}>
          Financial Overview
        </Text>

        <View style={styles.financeCard}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>
              Total Revenue
            </Text>

            <Text style={styles.revenueValue}>
              ₹
              {Number(
                stats.totalRevenue ?? 0
              ).toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>
              Pending Payments
            </Text>

            <Text style={styles.pendingValue}>
              ₹
              {Number(
                stats.pendingPayments ?? 0
              ).toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>
              Expenses
            </Text>

            <Text style={styles.expenseValue}>
              ₹
              {Number(
                stats.totalExpenses ?? 0
              ).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Recent appointments */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recent Appointments
          </Text>

          <Text style={styles.viewAll}>
            View All
          </Text>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              📅
            </Text>

            <Text style={styles.emptyTitle}>
              No appointments found
            </Text>

            <Text style={styles.emptySubtitle}>
              Recent appointments will appear here.
            </Text>
          </View>
        ) : (
          appointments.map(
            (appointment, index) => (
              <View
                key={
                  appointment._id ||
                  appointment.id ||
                  index
                }
                style={styles.appointmentCard}
              >
                <View style={styles.appointmentIcon}>
                  <Text style={styles.appointmentIconText}>
                    👤
                  </Text>
                </View>

                <View style={styles.appointmentInfo}>
                  <Text
                    style={styles.patientName}
                    numberOfLines={1}
                  >
                    {appointment.patient?.name ||
                      "Patient"}
                  </Text>

                  <Text
                    style={styles.doctorName}
                    numberOfLines={1}
                  >
                    Dr.{" "}
                    {appointment.doctor?.user?.name ||
                      "Doctor"}
                  </Text>

                  <Text style={styles.appointmentDate}>
                    {formatDate(
                      appointment.appointmentDate
                    )}
                    {appointment.appointmentTime
                      ? ` • ${appointment.appointmentTime}`
                      : ""}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(
                      appointment.status
                    ),
                  ]}
                >
                  <Text style={styles.statusText}>
                    {appointment.status ||
                      "scheduled"}
                  </Text>
                </View>
              </View>
            )
          )
        )}

        {/* Quick Actions */}

        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="👤"
            title="Add Patient"
          />

          <QuickAction
            icon="📅"
            title="Appointment"
          />

          <QuickAction
            icon="💊"
            title="Prescription"
          />

          <QuickAction
            icon="💳"
            title="Billing"
          />
        </View>

        {/* System status */}

        <View style={styles.systemCard}>
          <View style={styles.systemHeader}>
            <View style={styles.onlineDot} />

            <Text style={styles.systemTitle}>
              System Status
            </Text>

            <Text style={styles.onlineText}>
              Online
            </Text>
          </View>

          <Text style={styles.systemSubtitle}>
            CareSync services are connected and
            operating normally.
          </Text>
        </View>

        <Text style={styles.footer}>
          CareSync • Clinic Management
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string | number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Text style={styles.statIconText}>
          {icon}
        </Text>
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statTitle}>
        {title}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>
          {icon}
        </Text>
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8FF",
  },

  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingBox: {
    alignItems: "center",
    padding: 30,
  },

  loadingLogo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#315FEF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },

  loadingLogoText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
  },

  loader: {
    marginTop: 25,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
  },

  loadingSubtitle: {
    marginTop: 6,
    color: "#8490A3",
    fontSize: 13,
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#172033",
  },

  brandSubtitle: {
    marginTop: 2,
    color: "#8792A6",
    fontSize: 11,
    fontWeight: "600",
  },

  logoutButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E0E5ED",
  },

  logoutText: {
    color: "#315FEF",
    fontSize: 12,
    fontWeight: "800",
  },

  welcomeSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 22,
    backgroundColor: "#315FEF",
    borderRadius: 22,
    padding: 22,
    elevation: 5,
  },

  welcomeText: {
    color: "#DCE5FF",
    fontSize: 13,
    fontWeight: "600",
  },

  userName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 5,
  },

  roleText: {
    color: "#DCE5FF",
    fontSize: 12,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#172033",
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
  },

  statCard: {
    width: "46%",
    marginHorizontal: "2%",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    elevation: 3,
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  statIconText: {
    fontSize: 21,
  },

  statValue: {
    marginTop: 13,
    fontSize: 23,
    fontWeight: "900",
    color: "#172033",
  },

  statTitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#8792A6",
    fontWeight: "600",
  },

  todayCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },

  todayLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  todayIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  todayTitle: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
  },

  todaySubtitle: {
    color: "#8B96A8",
    fontSize: 11,
    marginTop: 3,
  },

  todayCount: {
    color: "#315FEF",
    fontSize: 26,
    fontWeight: "900",
  },

  financeCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    elevation: 3,
  },

  financeItem: {
    paddingVertical: 4,
  },

  financeLabel: {
    color: "#8994A7",
    fontSize: 11,
    fontWeight: "600",
  },

  revenueValue: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },

  pendingValue: {
    color: "#E68A00",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },

  expenseValue: {
    color: "#D64545",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#EDF0F5",
    marginVertical: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 20,
  },

  viewAll: {
    color: "#315FEF",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
  },

  appointmentCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  appointmentIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  appointmentIconText: {
    fontSize: 21,
  },

  appointmentInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  patientName: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
  },

  doctorName: {
    color: "#66748A",
    fontSize: 11,
    marginTop: 3,
  },

  appointmentDate: {
    color: "#96A0B0",
    fontSize: 10,
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "capitalize",
    color: "#FFFFFF",
  },

  scheduledStatus: {
    backgroundColor: "#315FEF",
  },

  confirmedStatus: {
    backgroundColor: "#159A68",
  },

  completedStatus: {
    backgroundColor: "#667085",
  },

  cancelledStatus: {
    backgroundColor: "#D64545",
  },

  noShowStatus: {
    backgroundColor: "#E68A00",
  },

  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    marginBottom: 24,
    elevation: 2,
  },

  emptyIcon: {
    fontSize: 30,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
    color: "#172033",
  },

  emptySubtitle: {
    marginTop: 5,
    color: "#8994A7",
    fontSize: 11,
    textAlign: "center",
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  quickAction: {
    width: "46%",
    marginHorizontal: "2%",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  quickIconText: {
    fontSize: 19,
  },

  quickTitle: {
    marginLeft: 9,
    color: "#344054",
    fontSize: 11,
    fontWeight: "800",
    flex: 1,
  },

  systemCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    elevation: 2,
  },

  systemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#159A68",
    marginRight: 8,
  },

  systemTitle: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },

  onlineText: {
    color: "#159A68",
    fontSize: 11,
    fontWeight: "800",
  },

  systemSubtitle: {
    color: "#8994A7",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },

  footer: {
    textAlign: "center",
    color: "#A0A9B8",
    fontSize: 10,
    marginTop: 25,
  },

  bottomSpace: {
    height: 30,
  },

  pressed: {
    opacity: 0.7,
  },
});