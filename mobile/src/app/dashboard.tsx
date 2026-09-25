import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getPatients,
  getDoctors,
  getAppointments,
  getBilling,
} from "../api/api";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const COLORS = {
  navy: "#0B1736",
  navy2: "#111F45",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  blueSoft: "#DBEAFE",
  cyan: "#0891B2",
  green: "#059669",
  greenLight: "#ECFDF5",
  orange: "#EA580C",
  orangeLight: "#FFF7ED",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  red: "#DC2626",
  redLight: "#FEF2F2",
  white: "#FFFFFF",
  bg: "#F5F8FC",
  border: "#E5EAF1",
  text: "#172033",
  text2: "#475569",
  muted: "#94A3B8",
  muted2: "#CBD5E1",
};

function asArray(value: any, keys: string[] = []): any[] {
  if (Array.isArray(value)) return value;

  if (!value || typeof value !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }

  for (const key of [
    "data",
    "results",
    "items",
    "records",
    "patients",
    "doctors",
    "appointments",
    "bills",
    "billing",
    "expenses",
  ]) {
    if (Array.isArray(value[key])) return value[key];
  }

  return [];
}

function num(value: any): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const n = Number(value.replace(/[₹,\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
}

function amountFromBill(bill: any): number {
  if (!bill || typeof bill !== "object") return 0;

  for (const key of [
    "pendingAmount",
    "pending",
    "remainingAmount",
    "balance",
    "dueAmount",
    "totalAmount",
    "grandTotal",
    "amount",
    "total",
    "netAmount",
  ]) {
    const n = num(bill[key]);
    if (n) return n;
  }

  return 0;
}

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function initials(name: any) {
  const text = String(name || "User").trim();

  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0] || "")
    .join("")
    .toUpperCase();
}

function isToday(value: any) {
  if (!value) return false;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();

  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function appointmentDate(a: any) {
  return (
    a?.appointmentDate ||
    a?.date ||
    a?.scheduledDate ||
    a?.startDate ||
    a?.createdAt
  );
}

function appointmentTime(a: any) {
  const value =
    a?.appointmentTime ||
    a?.time ||
    a?.scheduledTime ||
    "";

  if (!value) return "Time not set";

  const parts = String(value).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);

  if (!Number.isFinite(h)) return String(value);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
}

function patientName(a: any) {
  return (
    a?.patient?.name ||
    a?.patientName ||
    a?.patient?.user?.name ||
    a?.name ||
    "Patient"
  );
}

function doctorName(a: any) {
  return (
    a?.doctor?.name ||
    a?.doctor?.user?.name ||
    a?.doctorName ||
    "Doctor"
  );
}

function prettyStatus(status: any) {
  return String(status || "Scheduled")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (x) => x.toUpperCase());
}

function statusColor(status: any) {
  const value = String(status || "").toLowerCase();

  if (value.includes("completed")) {
    return {
      bg: COLORS.greenLight,
      text: COLORS.green,
    };
  }

  if (value.includes("cancel")) {
    return {
      bg: COLORS.redLight,
      text: COLORS.red,
    };
  }

  if (value.includes("confirm")) {
    return {
      bg: COLORS.blueLight,
      text: COLORS.blue,
    };
  }

  return {
    bg: "#FFF7ED",
    text: "#C2410C",
  };
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [drawer, setDrawer] = useState(false);
  const [notifications, setNotifications] = useState(false);

  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [p, d, a, b] = await Promise.all([
        getPatients(),
        getDoctors(),
        getAppointments(),
        getBilling(),
      ]);

      setPatients(asArray(p, ["patients"]));
      setDoctors(asArray(d, ["doctors"]));
      setAppointments(asArray(a, ["appointments"]));
      setBills(asArray(b, ["billing", "bills"]));
    } catch (e: any) {
      console.log(
        "Dashboard load error:",
        e?.response?.status,
        e?.message
      );

      setPatients([]);
      setDoctors([]);
      setAppointments([]);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const todayAppointments = useMemo(() => {
    return appointments.filter((a) =>
      isToday(appointmentDate(a))
    ).length;
  }, [appointments]);

  const pendingAmount = useMemo(() => {
    return bills.reduce((sum, bill) => {
      const status = String(
        bill?.paymentStatus || bill?.status || ""
      ).toLowerCase();

      if (
        status.includes("paid") &&
        !status.includes("partial")
      ) {
        return sum;
      }

      const explicitPending =
        num(bill?.pendingAmount) ||
        num(bill?.remainingAmount) ||
        num(bill?.balance) ||
        num(bill?.dueAmount);

      if (explicitPending) {
        return sum + explicitPending;
      }

      return sum + amountFromBill(bill);
    }, 0);
  }, [bills]);

  const completedAppointments = useMemo(() => {
    return appointments.filter(
      (a) =>
        String(a?.status || "").toLowerCase() === "completed"
    ).length;
  }, [appointments]);

  const scheduledAppointments = useMemo(() => {
    return appointments.filter((a) =>
      ["scheduled", "confirmed"].includes(
        String(a?.status || "").toLowerCase()
      )
    ).length;
  }, [appointments]);

  const revenue = useMemo(() => {
    return bills.reduce((sum, bill) => {
      const paid =
        num(bill?.paidAmount) ||
        num(bill?.amountPaid);

      if (paid) return sum + paid;

      if (
        String(bill?.paymentStatus || "").toLowerCase() ===
        "paid"
      ) {
        return sum + amountFromBill(bill);
      }

      return sum;
    }, 0);
  }, [bills]);

  const recentAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const da = new Date(
          appointmentDate(a)
        ).getTime();

        const db = new Date(
          appointmentDate(b)
        ).getTime();

        return db - da;
      })
      .slice(0, 5);
  }, [appointments]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (q.length < 2) return [];

    const p = patients
      .filter((x) =>
        [
          x?.name,
          x?.email,
          x?.phone,
          x?.patientId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 5)
      .map((x) => ({
        title: x?.name || "Patient",
        sub:
          x?.patientId ||
          x?.phone ||
          "Patient",
        type: "Patient",
        route: "/patients",
      }));

    const d = doctors
      .filter((x) =>
        [
          x?.name,
          x?.user?.name,
          x?.email,
          x?.user?.email,
          x?.phone,
          x?.user?.phone,
          x?.specialization,
          x?.licenseNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 5)
      .map((x) => ({
        title:
          x?.name ||
          x?.user?.name ||
          "Doctor",
        sub:
          x?.specialization ||
          "Medical Specialist",
        type: "Doctor",
        route: "/doctors",
      }));

    return [...p, ...d];
  }, [search, patients, doctors]);

  const go = (route: string) => {
    setDrawer(false);
    setNotifications(false);
    router.push(route as any);
  };

  const doLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/role-selection" as any);
    }
  };

  const userRole = String(
    user?.role || "admin"
  );

  const userName =
    user?.name ||
    (userRole === "doctor"
      ? "Doctor"
      : "Admin");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      <View style={styles.root}>

        {/* TOP BAR */}
        <View
          style={[
            styles.topbar,
            {
              paddingTop: insets.top,
              height: 70 + insets.top,
            },
          ]}
        >

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawer(true)}
            activeOpacity={0.8}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          <View style={styles.topBrand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>C</Text>
            </View>

            <View>
              <Text style={styles.brandName}>
                CareSync
              </Text>

              <Text style={styles.brandCaption}>
                CLINIC MANAGEMENT
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() =>
              setNotifications(true)
            }
            activeOpacity={0.8}
          >
            <Text style={styles.notificationIcon}>
              Bell
            </Text>

            {todayAppointments > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.notificationDotText}>
                  {todayAppointments > 9
                    ? "9+"
                    : todayAppointments}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.blue}
            />
          }
        >
          {/* SEARCH */}
          <View style={styles.searchContainer}>

            <View style={styles.searchIconBox}>
              <Text style={styles.searchIcon}>
                Search
              </Text>
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search patients, doctors..."
              placeholderTextColor="#A0AEC0"
              style={styles.searchInput}
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                style={styles.clearSearch}
              >
                <Text style={styles.clearSearchText}>
                  X
                </Text>
              </TouchableOpacity>
            )}

          </View>

          {/* SEARCH RESULTS */}
          {search.trim().length >= 2 && (
            <View style={styles.searchResults}>

              <View style={styles.searchResultHeader}>
                <Text style={styles.searchResultHeaderText}>
                  SEARCH RESULTS
                </Text>

                <Text style={styles.searchResultCount}>
                  {searchResults.length}
                </Text>
              </View>

              {searchResults.length === 0 ? (
                <View style={styles.noResultBox}>
                  <Text style={styles.noResultTitle}>
                    No results found
                  </Text>

                  <Text style={styles.noResultSub}>
                    Try another patient or doctor name.
                  </Text>
                </View>
              ) : (
                searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.title}-${index}`}
                    style={styles.searchResultRow}
                    onPress={() => {
                      setSearch("");
                      go(item.route);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.searchResultAvatar,
                        {
                          backgroundColor:
                            item.type === "Doctor"
                              ? COLORS.purpleLight
                              : COLORS.blueLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.searchResultAvatarText,
                          {
                            color:
                              item.type === "Doctor"
                                ? COLORS.purple
                                : COLORS.blue,
                          },
                        ]}
                      >
                        {initials(item.title)}
                      </Text>
                    </View>

                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultTitle}>
                        {item.title}
                      </Text>

                      <Text style={styles.searchResultSub}>
                        {item.type} • {item.sub}
                      </Text>
                    </View>

                    <Text style={styles.resultArrow}>{"›"}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* WELCOME */}
          <View style={styles.welcomeSection}>

            <Text style={styles.currentDate}>
              {formatDate()}
            </Text>

            <Text style={styles.welcomeTitle}>
              Good afternoon, {userName}
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Here's what's happening at your clinic today.
            </Text>

            <View style={styles.welcomeActions}>

              <TouchableOpacity
                style={styles.newAppointmentButton}
                onPress={() =>
                  go("/appointments")
                }
                activeOpacity={0.85}
              >
                <Text style={styles.newAppointmentPlus}>
                  +
                </Text>

                <Text style={styles.newAppointmentText}>
                  New Appointment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={refresh}
                activeOpacity={0.8}
              >
                <Text style={styles.refreshButtonText}>
                  Refresh
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsGrid}>

            <StatCard
              title="Total Patients"
              value={
                loading
                  ? "..."
                  : String(patients.length)
              }
              subtitle="Registered patients"
              icon="P"
              color={COLORS.blue}
              background={COLORS.blueLight}
            />

            <StatCard
              title="Today's Appointments"
              value={
                loading
                  ? "..."
                  : String(todayAppointments)
              }
              subtitle="Appointments today"
              icon="A"
              color={COLORS.green}
              background={COLORS.greenLight}
            />

            <StatCard
              title="Total Doctors"
              value={
                loading
                  ? "..."
                  : String(doctors.length)
              }
              subtitle="Active doctors"
              icon="D"
              color={COLORS.purple}
              background={COLORS.purpleLight}
            />

            <StatCard
              title="Pending Payments"
              value={
                loading
                  ? "..."
                  : money(pendingAmount)
              }
              subtitle="Outstanding amount"
              icon="₹"
              color={COLORS.orange}
              background={COLORS.orangeLight}
            />

          </View>

          {/* RECENT APPOINTMENTS */}
          <SectionCard
            title="Recent Appointments"
            subtitle="Latest appointments from your clinic"
            action="View all"
            onAction={() => go("/appointments")}
          >
            {loading ? (
              <LoadingBox />
            ) : recentAppointments.length === 0 ? (
              <EmptyState
                title="No appointments found"
                subtitle="Appointments will appear here once created."
                action="Book Appointment"
                onPress={() =>
                  go("/appointments")
                }
              />
            ) : (
              recentAppointments.map(
                (appointment, index) => {
                  const status = statusColor(
                    appointment?.status
                  );

                  return (
                    <TouchableOpacity
                      key={
                        appointment?._id ||
                        appointment?.id ||
                        index
                      }
                      style={[
                        styles.appointmentRow,
                        index ===
                          recentAppointments.length - 1 &&
                          styles.lastRow,
                      ]}
                      onPress={() =>
                        go("/appointments")
                      }
                      activeOpacity={0.75}
                    >
                      <View style={styles.patientAvatar}>
                        <Text style={styles.patientAvatarText}>
                          {initials(
                            patientName(
                              appointment
                            )
                          )}
                        </Text>
                      </View>

                      <View style={styles.appointmentInfo}>
                        <Text
                          style={styles.appointmentPatient}
                          numberOfLines={1}
                        >
                          {patientName(
                            appointment
                          )}
                        </Text>

                        <Text
                          style={styles.appointmentDoctor}
                          numberOfLines={1}
                        >
                          {doctorName(
                            appointment
                          )}
                        </Text>

                        <Text style={styles.appointmentDate}>
                          {isToday(
                            appointmentDate(
                              appointment
                            )
                          )
                            ? "Today"
                            : new Date(
                                appointmentDate(
                                  appointment
                                )
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                }
                              )}
                        </Text>
                      </View>

                      <View style={styles.appointmentRight}>
                        <Text style={styles.appointmentTime}>
                          {appointmentTime(
                            appointment
                          )}
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                status.bg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: status.text,
                              },
                            ]}
                          >
                            {prettyStatus(
                              appointment?.status
                            )}
                          </Text>
                        </View>
                      </View>

                    </TouchableOpacity>
                  );
                }
              )
            )}

          </SectionCard>

          {/* QUICK ACTIONS */}
          <SectionCard
            title="Quick Actions"
            subtitle="Frequently used clinic actions"
          >
            <QuickAction
              title="Add Patient"
              subtitle="Register a new patient"
              icon="+"
              color={COLORS.blue}
              background={COLORS.blueLight}
              onPress={() => go("/patients")}
            />

            <QuickAction
              title="Book Appointment"
              subtitle="Schedule consultation"
              icon="A"
              color={COLORS.green}
              background={COLORS.greenLight}
              onPress={() =>
                go("/appointments")
              }
            />

            <QuickAction
              title="Create Medical Record"
              subtitle="Add patient EMR"
              icon="M"
              color={COLORS.purple}
              background={COLORS.purpleLight}
              onPress={() =>
                go("/medical-records")
              }
            />

            <QuickAction
              title="Create Invoice"
              subtitle="Generate patient bill"
              icon="₹"
              color={COLORS.orange}
              background={COLORS.orangeLight}
              onPress={() => go("/billing")}
              last
            />

          </SectionCard>

          {/* CLINIC OVERVIEW */}
          <SectionCard
            title="Clinic Overview"
            subtitle="Current operational snapshot"
          >
            <View style={styles.overviewGrid}>

              <OverviewCard
                title="Completed Visits"
                value={completedAppointments}
                subtitle="Completed"
                icon="C"
                color={COLORS.green}
                background={COLORS.greenLight}
              />

              <OverviewCard
                title="Scheduled"
                value={scheduledAppointments}
                subtitle="Upcoming"
                icon="S"
                color={COLORS.blue}
                background={COLORS.blueLight}
              />

              <OverviewCard
                title="Total Records"
                value={appointments.length}
                subtitle="Appointments"
                icon="R"
                color={COLORS.purple}
                background={COLORS.purpleLight}
              />

              <OverviewCard
                title="Revenue"
                value={money(revenue)}
                subtitle="Collected"
                icon="₹"
                color={COLORS.orange}
                background={COLORS.orangeLight}
              />

            </View>

          </SectionCard>

          {/* DATABASE SNAPSHOT */}
          <View style={styles.databaseCard}>

            <View style={styles.databaseHeader}>
              <View style={styles.databaseIcon}>
                <Text style={styles.databaseIconText}>
                  DB
                </Text>
              </View>

              <View style={styles.databaseInfo}>
                <Text style={styles.databaseTitle}>
                  Database Connected
                </Text>

                <Text style={styles.databaseSubtitle}>
                  Live data from clinic backend
                </Text>
              </View>

              <View style={styles.connectedBadge}>
                <View style={styles.connectedDot} />

                <Text style={styles.connectedText}>
                  Online
                </Text>
              </View>
            </View>

            <View style={styles.databaseStats}>

              <MiniDatabaseStat
                value={patients.length}
                label="Patients"
              />

              <MiniDatabaseStat
                value={doctors.length}
                label="Doctors"
              />

              <MiniDatabaseStat
                value={appointments.length}
                label="Appointments"
              />

              <MiniDatabaseStat
                value={bills.length}
                label="Bills"
              />

            </View>

          </View>

          {/* SYSTEM STATUS */}
          <View style={styles.systemCard}>

            <View style={styles.systemLeft}>

              <View style={styles.systemIcon}>
                <Text style={styles.systemIconText}>
                  OK
                </Text>
              </View>

              <View>
                <Text style={styles.systemTitle}>
                  System Status
                </Text>

                <Text style={styles.systemSubtitle}>
                  CareSync services
                </Text>
              </View>

            </View>

            <View style={styles.systemOnline}>
              <View style={styles.systemOnlineDot} />

              <Text style={styles.systemOnlineText}>
                All Systems Online
              </Text>
            </View>

          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              CareSync
            </Text>

            <Text style={styles.footerDot}>
              •
            </Text>

            <Text style={styles.footerText}>
              Clinic Management
            </Text>
          </View>

        </ScrollView>

        {/* SIDE DRAWER */}
        <Modal
          visible={drawer}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setDrawer(false)
          }
        >
          <View style={styles.drawerOverlay}>

            <View style={styles.drawer}>

              {/* DRAWER HEADER */}
              <View style={styles.drawerHeader}>

                <View style={styles.drawerBrand}>
                  <View style={styles.drawerLogo}>
                    <Text style={styles.drawerLogoText}>
                      C
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.drawerBrandName}>
                      CareSync
                    </Text>

                    <Text style={styles.drawerBrandSub}>
                      CLINIC MANAGEMENT
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setDrawer(false)
                  }
                  style={styles.drawerClose}
                >
                  <Text style={styles.drawerCloseText}>
                    X
                  </Text>
                </TouchableOpacity>

              </View>

              {/* CLINIC CARD */}
              <View style={styles.clinicCard}>

                <View style={styles.clinicLogo}>
                  <Text style={styles.clinicLogoText}>
                    +
                  </Text>
                </View>

                <View style={styles.clinicInfo}>
                  <Text style={styles.clinicName}>
                    CityCare Clinic
                  </Text>

                  <Text style={styles.clinicRole}>
                    {userRole}
                  </Text>
                </View>

                <View style={styles.activeDot} />

              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.drawerScroll
                }
              >
                {/* MAIN */}
                <DrawerHeading text="MAIN" />

                <DrawerItem
                  title="Dashboard"
                  icon="H"
                  active
                  onPress={() =>
                    go("/dashboard")
                  }
                />

                <DrawerItem
                  title="Patients"
                  icon="P"
                  onPress={() =>
                    go("/patients")
                  }
                />

                <DrawerItem
                  title="Doctors"
                  icon="D"
                  onPress={() =>
                    go("/doctors")
                  }
                />

                <DrawerItem
                  title="Appointments"
                  icon="A"
                  onPress={() =>
                    go("/appointments")
                  }
                />

                {/* CLINICAL */}
                <DrawerHeading text="CLINICAL" />

                <DrawerItem
                  title="Medical Records"
                  icon="M"
                  onPress={() =>
                    go("/medical-records")
                  }
                />

                <DrawerItem
                  title="Prescriptions"
                  icon="Rx"
                  onPress={() =>
                    go("/prescriptions")
                  }
                />

                {/* FINANCE */}
                <DrawerHeading text="FINANCE & STOCK" />

                <DrawerItem
                  title="Billing"
                  icon="₹"
                  onPress={() =>
                    go("/billing")
                  }
                />

                <DrawerItem
                  title="Inventory"
                  icon="I"
                  onPress={() =>
                    go("/inventory")
                  }
                />

                <DrawerItem
                  title="Expenses"
                  icon="E"
                  onPress={() =>
                    go("/expenses")
                  }
                />

                {/* ACCOUNT */}
                <DrawerHeading text="ACCOUNT" />

                <DrawerItem
                  title="Settings"
                  icon="S"
                  onPress={() => go("/settings")}
                />

                {/* USER */}
                <View style={styles.drawerUser}>

                  <View style={styles.drawerUserAvatar}>
                    <Text style={styles.drawerUserAvatarText}>
                      {initials(userName)}
                    </Text>
                  </View>

                  <View style={styles.drawerUserInfo}>
                    <Text
                      style={styles.drawerUserName}
                      numberOfLines={1}
                    >
                      {userName}
                    </Text>

                    <Text style={styles.drawerUserRole}>
                      {userRole}
                    </Text>
                  </View>

                </View>

                {/* LOGOUT */}
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={doLogout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutIcon}>
                    →
                  </Text>

                  <Text style={styles.logoutText}>
                    Logout
                  </Text>
                </TouchableOpacity>

              </ScrollView>

            </View>

            <TouchableOpacity
              style={styles.drawerOutside}
              onPress={() =>
                setDrawer(false)
              }
              activeOpacity={1}
            />

          </View>
        </Modal>

        {/* NOTIFICATIONS MODAL */}
        <Modal
          visible={notifications}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setNotifications(false)
          }
        >
          <View style={styles.notificationOverlay}>

            <TouchableOpacity
              style={styles.notificationOutside}
              onPress={() =>
                setNotifications(false)
              }
              activeOpacity={1}
            />

            <View style={styles.notificationPanel}>

              <View style={styles.notificationHeader}>

                <View>
                  <Text style={styles.notificationTitle}>
                    Notifications
                  </Text>

                  <Text style={styles.notificationSubtitle}>
                    Clinic activity
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setNotifications(false)
                  }
                  style={styles.notificationClose}
                >
                  <Text style={styles.notificationCloseText}>
                    X
                  </Text>
                </TouchableOpacity>

              </View>

              <View style={styles.notificationItem}>

                <View style={styles.notificationItemIcon}>
                  <Text style={styles.notificationItemIconText}>
                    A
                  </Text>
                </View>

                <View style={styles.notificationItemInfo}>
                  <Text style={styles.notificationItemTitle}>
                    Today's appointments
                  </Text>

                  <Text style={styles.notificationItemSub}>
                    {todayAppointments} appointment
                    {todayAppointments === 1
                      ? ""
                      : "s"} scheduled today.
                  </Text>
                </View>

              </View>

              <View style={styles.notificationItem}>

                <View
                  style={[
                    styles.notificationItemIcon,
                    {
                      backgroundColor:
                        COLORS.orangeLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.notificationItemIconText,
                      {
                        color:
                          COLORS.orange,
                      },
                    ]}
                  >
                    ₹
                  </Text>
                </View>

                <View style={styles.notificationItemInfo}>
                  <Text style={styles.notificationItemTitle}>
                    Pending payments
                  </Text>

                  <Text style={styles.notificationItemSub}>
                    {money(pendingAmount)} outstanding.
                  </Text>
                </View>

              </View>

              <View style={styles.notificationItem}>

                <View
                  style={[
                    styles.notificationItemIcon,
                    {
                      backgroundColor:
                        COLORS.greenLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.notificationItemIconText,
                      {
                        color:
                          COLORS.green,
                      },
                    ]}
                  >
                    DB
                  </Text>
                </View>

                <View style={styles.notificationItemInfo}>
                  <Text style={styles.notificationItemTitle}>
                    Backend connected
                  </Text>

                  <Text style={styles.notificationItemSub}>
                    Clinic data is synchronized.
                  </Text>
                </View>

              </View>

              <TouchableOpacity
                style={styles.notificationDone}
                onPress={() =>
                  setNotifications(false)
                }
              >
                <Text style={styles.notificationDoneText}>
                  Done
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  background,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  background: string;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          borderTopColor: color,
        },
      ]}
    >
      <View style={styles.statHeader}>

        <View
          style={[
            styles.statIcon,
            {
              backgroundColor: background,
            },
          ]}
        >
          <Text
            style={[
              styles.statIconText,
              {
                color,
              },
            ]}
          >
            {icon}
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.liveText}>
            LIVE
          </Text>
        </View>

      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statTitle}>
        {title}
      </Text>

      <Text style={styles.statSubtitle}>
        {subtitle}
      </Text>

    </View>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>

      <View style={styles.sectionHeader}>

        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        </View>

        {action && onAction && (
          <TouchableOpacity
            onPress={onAction}
            style={styles.sectionAction}
          >
            <Text style={styles.sectionActionText}>
              {action}
            </Text>

            <Text style={styles.sectionActionArrow}>{"›"}</Text>
          </TouchableOpacity>
        )}

      </View>

      {children}

    </View>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  title,
  subtitle,
  icon,
  color,
  background,
  onPress,
  last,
}: {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  background: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        last && styles.quickActionLast,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.quickActionIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <Text
          style={[
            styles.quickActionIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={styles.quickActionInfo}>

        <Text style={styles.quickActionTitle}>
          {title}
        </Text>

        <Text style={styles.quickActionSubtitle}>
          {subtitle}
        </Text>

      </View>

      <View style={styles.quickArrowBox}>
        <Text style={styles.quickArrow}>{"›"}</Text>
      </View>

    </TouchableOpacity>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewCard({
  title,
  value,
  subtitle,
  icon,
  color,
  background,
}: {
  title: string;
  value: any;
  subtitle: string;
  icon: string;
  color: string;
  background: string;
}) {
  return (
    <View style={styles.overviewCard}>

      <View
        style={[
          styles.overviewIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <Text
          style={[
            styles.overviewIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.overviewTitle}>
        {title}
      </Text>

      <Text style={styles.overviewValue}>
        {String(value)}
      </Text>

      <Text style={styles.overviewSubtitle}>
        {subtitle}
      </Text>

    </View>
  );
}

/* =========================================================
   DATABASE MINI STAT
========================================================= */

function MiniDatabaseStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View style={styles.miniDatabaseStat}>

      <Text style={styles.miniDatabaseValue}>
        {String(value)}
      </Text>

      <Text style={styles.miniDatabaseLabel}>
        {label}
      </Text>

    </View>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  title,
  subtitle,
  action,
  onPress,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.emptyState}>

      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>
          A
        </Text>
      </View>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text style={styles.emptySubtitle}>
        {subtitle}
      </Text>

      {action && onPress && (
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={onPress}
        >
          <Text style={styles.emptyActionText}>
            {action}
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingBox() {
  return (
    <View style={styles.loadingBox}>
      <ActivityIndicator
        size="small"
        color={COLORS.blue}
      />

      <Text style={styles.loadingText}>
        Loading clinic data...
      </Text>
    </View>
  );
}

/* =========================================================
   DRAWER
========================================================= */

function DrawerHeading({
  text,
}: {
  text: string;
}) {
  return (
    <Text style={styles.drawerHeading}>
      {text}
    </Text>
  );
}

function DrawerItem({
  title,
  icon,
  active,
  onPress,
}: {
  title: string;
  icon: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.drawerItem,
        active && styles.drawerItemActive,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.drawerItemIcon,
          active &&
            styles.drawerItemIconActive,
        ]}
      >
        <Text
          style={[
            styles.drawerItemIconText,
            active &&
              styles.drawerItemIconTextActive,
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={[
          styles.drawerItemText,
          active &&
            styles.drawerItemTextActive,
        ]}
      >
        {title}
      </Text>

      {active && (
        <View style={styles.drawerActiveBar} />
      )}

    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* TOP BAR */

  topbar: {
    height: 70,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: COLORS.text2,
    marginVertical: 2,
    borderRadius: 2,
  },

  topBrand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 11,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  logoText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },

  brandName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  brandCaption: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 2,
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationIcon: {
    color: COLORS.text2,
    fontSize: 10,
    fontWeight: "900",
  },

  notificationDot: {
    position: "absolute",
    right: -2,
    top: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 10,
    paddingHorizontal: 3,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  notificationDotText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: "900",
  },

  /* CONTENT */

  content: {
    padding: 16,
    paddingBottom: 45,
  },

  /* SEARCH */

  searchContainer: {
    height: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  searchIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  searchIcon: {
    color: COLORS.blue,
    fontSize: 7,
    fontWeight: "900",
  },

  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 9,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "500",
  },

  clearSearch: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  clearSearchText: {
    color: COLORS.text2,
    fontSize: 10,
    fontWeight: "900",
  },

  /* SEARCH RESULTS */

  searchResults: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    marginTop: -8,
    marginBottom: 18,
    overflow: "hidden",
  },

  searchResultHeader: {
    minHeight: 38,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  searchResultHeaderText: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  searchResultCount: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: "900",
  },

  searchResultRow: {
    minHeight: 62,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  searchResultAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  searchResultAvatarText: {
    fontSize: 10,
    fontWeight: "900",
  },

  searchResultInfo: {
    flex: 1,
    marginLeft: 10,
  },

  searchResultTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  searchResultSub: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  resultArrow: {
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "300",
  },

  noResultBox: {
    padding: 22,
    alignItems: "center",
  },

  noResultTitle: {
    color: COLORS.text2,
    fontSize: 11,
    fontWeight: "800",
  },

  noResultSub: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 5,
  },

  /* WELCOME */

  welcomeSection: {
    marginBottom: 20,
  },

  currentDate: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 7,
  },

  welcomeTitle: {
    color: COLORS.text,
    fontSize: width < 380 ? 23 : 25,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  welcomeSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  welcomeActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  newAppointmentButton: {
    minHeight: 45,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.blue,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  newAppointmentPlus: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "300",
    marginRight: 6,
  },

  newAppointmentText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  refreshButton: {
    minHeight: 45,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 9,
  },

  refreshButtonText: {
    color: COLORS.text2,
    fontSize: 10,
    fontWeight: "800",
  },

  /* STATS */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  statCard: {
    width: "48.2%",
    minHeight: 160,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 3,
    padding: 14,
    marginBottom: 11,
  },

  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statIcon: {
    width: 41,
    height: 41,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statIconText: {
    fontSize: 12,
    fontWeight: "900",
  },

  liveBadge: {
    height: 23,
    paddingHorizontal: 7,
    borderRadius: 99,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    marginRight: 4,
  },

  liveText: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 18,
  },

  statTitle: {
    color: COLORS.text2,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 5,
  },

  statSubtitle: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 4,
  },

  /* SECTION */

  sectionCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 18,
  },

  sectionHeader: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  sectionAction: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: COLORS.blueLight,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionActionText: {
    color: COLORS.blue,
    fontSize: 8,
    fontWeight: "900",
  },

  sectionActionArrow: {
    color: COLORS.blue,
    fontSize: 12,
    marginLeft: 4,
  },

  /* APPOINTMENTS */

  appointmentRow: {
    minHeight: 86,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  patientAvatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  patientAvatarText: {
    color: "#3157D5",
    fontSize: 10,
    fontWeight: "900",
  },

  appointmentInfo: {
    flex: 1,
    marginLeft: 11,
  },

  appointmentPatient: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  appointmentDoctor: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  appointmentDate: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 4,
  },

  appointmentRight: {
    alignItems: "flex-end",
    marginLeft: 7,
  },

  appointmentTime: {
    color: COLORS.text2,
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 5,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },

  statusText: {
    fontSize: 7,
    fontWeight: "900",
  },

  /* QUICK ACTIONS */

  quickAction: {
    minHeight: 76,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  quickActionLast: {
    borderBottomWidth: 0,
  },

  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionIconText: {
    fontSize: 13,
    fontWeight: "900",
  },

  quickActionInfo: {
    flex: 1,
    marginLeft: 11,
  },

  quickActionTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  quickActionSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  quickArrowBox: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  quickArrow: {
    color: COLORS.muted,
    fontSize: 16,
  },

  /* OVERVIEW */

  overviewGrid: {
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  overviewCard: {
    width: "48%",
    minHeight: 135,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 13,
    marginBottom: 10,
  },

  overviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  overviewIconText: {
    fontSize: 9,
    fontWeight: "900",
  },

  overviewTitle: {
    color: COLORS.text2,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 10,
  },

  overviewValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },

  overviewSubtitle: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  /* DATABASE */

  databaseCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    overflow: "hidden",
  },

  databaseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  databaseIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "rgba(96,165,250,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  databaseIconText: {
    color: "#60A5FA",
    fontSize: 9,
    fontWeight: "900",
  },

  databaseInfo: {
    flex: 1,
    marginLeft: 11,
  },

  databaseTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  databaseSubtitle: {
    color: "#7F8DA8",
    fontSize: 8,
    marginTop: 4,
  },

  connectedBadge: {
    height: 27,
    paddingHorizontal: 8,
    borderRadius: 99,
    backgroundColor: "rgba(16,185,129,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },

  connectedDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#34D399",
    marginRight: 4,
  },

  connectedText: {
    color: "#34D399",
    fontSize: 7,
    fontWeight: "900",
  },

  databaseStats: {
    flexDirection: "row",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  miniDatabaseStat: {
    flex: 1,
    alignItems: "center",
  },

  miniDatabaseValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  miniDatabaseLabel: {
    color: "#73819C",
    fontSize: 7,
    marginTop: 4,
  },

  /* SYSTEM */

  systemCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  systemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  systemIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  systemIconText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "900",
  },

  systemTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
  },

  systemSubtitle: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  systemOnline: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 99,
    backgroundColor: COLORS.greenLight,
    flexDirection: "row",
    alignItems: "center",
  },

  systemOnlineDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    marginRight: 4,
  },

  systemOnlineText: {
    color: COLORS.green,
    fontSize: 7,
    fontWeight: "900",
  },

  /* EMPTY */

  emptyState: {
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "900",
  },

  emptyTitle: {
    color: COLORS.text2,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 10,
  },

  emptySubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 5,
    textAlign: "center",
  },

  emptyAction: {
    marginTop: 12,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: COLORS.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyActionText: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: "800",
  },

  loadingBox: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 9,
    marginLeft: 8,
  },

  /* FOOTER */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
    marginBottom: 14,
  },

  footerBrand: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: "900",
  },

  footerDot: {
    color: COLORS.muted2,
    fontSize: 8,
    marginHorizontal: 5,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 8,
  },

  /* DRAWER */

  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.5)",
  },

  drawer: {
    width: "83%",
    backgroundColor: COLORS.navy,
    paddingTop: 25,
    paddingHorizontal: 14,
  },

  drawerOutside: {
    flex: 1,
  },

  drawerHeader: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  drawerBrand: {
    flexDirection: "row",
    alignItems: "center",
  },

  drawerLogo: {
    width: 41,
    height: 41,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  drawerLogoText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },

  drawerBrandName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  drawerBrandSub: {
    color: "#71809A",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 2,
  },

  drawerClose: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  drawerCloseText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
  },

  clinicCard: {
    minHeight: 68,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  clinicLogo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(37,99,235,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  clinicLogoText: {
    color: "#60A5FA",
    fontSize: 18,
    fontWeight: "300",
  },

  clinicInfo: {
    flex: 1,
    marginLeft: 10,
  },

  clinicName: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "800",
  },

  clinicRole: {
    color: "#71809A",
    fontSize: 8,
    marginTop: 3,
    textTransform: "capitalize",
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#34D399",
  },

  drawerScroll: {
    paddingBottom: 35,
  },

  drawerHeading: {
    color: "#52617C",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    paddingLeft: 9,
    marginTop: 16,
    marginBottom: 6,
  },

  drawerItem: {
    minHeight: 46,
    borderRadius: 11,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    position: "relative",
  },

  drawerItemActive: {
    backgroundColor: "rgba(37,99,235,0.18)",
  },

  drawerItemIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  drawerItemIconActive: {
    backgroundColor: COLORS.blue,
  },

  drawerItemIconText: {
    color: "#7E8BA4",
    fontSize: 9,
    fontWeight: "900",
  },

  drawerItemIconTextActive: {
    color: COLORS.white,
  },

  drawerItemText: {
    color: "#8E9BB2",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 8,
  },

  drawerItemTextActive: {
    color: COLORS.white,
    fontWeight: "800",
  },

  drawerActiveBar: {
    position: "absolute",
    right: 0,
    width: 3,
    height: 22,
    borderRadius: 3,
    backgroundColor: "#60A5FA",
  },

  drawerUser: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingTop: 15,
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  drawerUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  drawerUserAvatarText: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: "900",
  },

  drawerUserInfo: {
    flex: 1,
    marginLeft: 10,
  },

  drawerUserName: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  drawerUserRole: {
    color: "#687791",
    fontSize: 8,
    marginTop: 3,
    textTransform: "capitalize",
  },

  logoutButton: {
    height: 45,
    borderRadius: 11,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },

  logoutIcon: {
    color: "#F87171",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 6,
  },

  logoutText: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "800",
  },

  /* NOTIFICATION MODAL */

  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },

  notificationOutside: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  },

  notificationPanel: {
    width: Math.min(width - 30, 370),
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginTop: 78,
    marginRight: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 10,
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  notificationTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },

  notificationSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 3,
  },

  notificationClose: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationCloseText: {
    color: COLORS.text2,
    fontSize: 9,
    fontWeight: "900",
  },

  notificationItem: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  notificationItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationItemIconText: {
    color: COLORS.blue,
    fontSize: 8,
    fontWeight: "900",
  },

  notificationItemInfo: {
    flex: 1,
    marginLeft: 10,
  },

  notificationItemTitle: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "800",
  },

  notificationItemSub: {
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  notificationDone: {
    height: 42,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },

  notificationDoneText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },

});


