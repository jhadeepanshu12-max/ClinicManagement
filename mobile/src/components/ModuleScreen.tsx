import React from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";

import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,

  getDoctors,

  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,

  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,

  getPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,

  getBilling,
  createBill,
  updateBill,
  deleteBill,

  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,

  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,

  getPatientAppointments,
  getPatientMedicalRecords,
  getPatientPrescriptions,
  getPatientBilling,
} from "../api/api";

import { useAuth } from "../context/AuthContext";

type Props = {
  module: string;
};

const configs: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  patients: {
    title: "Patients",
    description: "Manage clinic patients",
  },

  doctors: {
    title: "Doctors",
    description: "View clinic doctors",
  },

  appointments: {
    title: "Appointments",
    description: "Manage patient appointments",
  },

  "medical-records": {
    title: "Medical Records",
    description: "Manage patient medical records",
  },

  prescriptions: {
    title: "Prescriptions",
    description: "Manage prescriptions",
  },

  billing: {
    title: "Billing",
    description: "Manage clinic billing",
  },

  inventory: {
    title: "Inventory",
    description: "Manage inventory items",
  },

  expenses: {
    title: "Expenses",
    description: "Track clinic expenses",
  },
};

function getArray(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.patients)) {
    return data.patients;
  }

  if (Array.isArray(data?.doctors)) {
    return data.doctors;
  }

  if (Array.isArray(data?.appointments)) {
    return data.appointments;
  }

  if (Array.isArray(data?.records)) {
    return data.records;
  }

  if (Array.isArray(data?.prescriptions)) {
    return data.prescriptions;
  }

  if (Array.isArray(data?.bills)) {
    return data.bills;
  }

  if (Array.isArray(data?.inventory)) {
    return data.inventory;
  }

  if (Array.isArray(data?.expenses)) {
    return data.expenses;
  }

  return [];
}

function getId(item: any) {
  return item?._id || item?.id;
}

function displayValue(value: any): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "object") {
    return (
      value?.name ||
      value?.email ||
      value?._id ||
      "-"
    );
  }

  return String(value);
}

export default function ModuleScreen({
  module,
}: Props) {
  const { user } = useAuth();

  const config =
    configs[module] || {
      title: module,
      description: "",
    };

  const [items, setItems] =
    React.useState<any[]>([]);

  const [loading, setLoading] =
    React.useState(true);

  const [refreshing, setRefreshing] =
    React.useState(false);

  const [search, setSearch] =
    React.useState("");

  const [showForm, setShowForm] =
    React.useState(false);

  const [editingId, setEditingId] =
    React.useState<string | null>(null);

  const [form, setForm] =
    React.useState<Record<string, string>>(
      {}
    );

  const isPatient =
    user?.role === "patient";

  const loadData = async () => {
    try {
      setLoading(true);

      let result: any;

      if (
        module === "appointments" &&
        isPatient
      ) {
        result = await getPatientAppointments();
      } else if (
        module === "medical-records" &&
        isPatient
      ) {
        result =
          await getPatientMedicalRecords();
      } else if (
        module === "prescriptions" &&
        isPatient
      ) {
        result =
          await getPatientPrescriptions();
      } else if (
        module === "billing" &&
        isPatient
      ) {
        result = await getPatientBilling();
      } else {
        switch (module) {
          case "patients":
            result = await getPatients();
            break;

          case "doctors":
            result = await getDoctors();
            break;

          case "appointments":
            result = await getAppointments();
            break;

          case "medical-records":
            result = await getMedicalRecords();
            break;

          case "prescriptions":
            result = await getPrescriptions();
            break;

          case "billing":
            result = await getBilling();
            break;

          case "inventory":
            result = await getInventory();
            break;

          case "expenses":
            result = await getExpenses();
            break;
        }
      }

      setItems(getArray(result));
    } catch (error: any) {
      console.log(
        `${module} load error:`,
        error
      );

      Alert.alert(
        "Unable to load",
        error?.response?.data?.message ||
          "Could not fetch data from server."
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [module, isPatient]);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({});
    setShowForm(true);
  };

  const startEdit = (item: any) => {
    const next: Record<string, string> = {};

    Object.entries(item || {})
      .filter(([key]) => {
        return ![
          "_id",
          "id",
          "__v",
          "createdAt",
          "updatedAt",
        ].includes(key);
      })
      .forEach(([key, value]) => {
        if (
          typeof value !== "object" &&
          value !== null
        ) {
          next[key] = String(value);
        }
      });

    setEditingId(getId(item));
    setForm(next);
    setShowForm(true);
  };

  const save = async () => {
    try {
      if (editingId) {
        switch (module) {
          case "patients":
            await updatePatient(
              editingId,
              form
            );
            break;

          case "appointments":
            await updateAppointment(
              editingId,
              form
            );
            break;

          case "medical-records":
            await updateMedicalRecord(
              editingId,
              form
            );
            break;

          case "prescriptions":
            await updatePrescription(
              editingId,
              form
            );
            break;

          case "billing":
            await updateBill(
              editingId,
              form
            );
            break;

          case "inventory":
            await updateInventoryItem(
              editingId,
              form
            );
            break;

          case "expenses":
            await updateExpense(
              editingId,
              form
            );
            break;
        }
      } else {
        switch (module) {
          case "patients":
            await createPatient(form);
            break;

          case "appointments":
            await createAppointment(form);
            break;

          case "medical-records":
            await createMedicalRecord(form);
            break;

          case "prescriptions":
            await createPrescription(form);
            break;

          case "billing":
            await createBill(form);
            break;

          case "inventory":
            await createInventoryItem(form);
            break;

          case "expenses":
            await createExpense(form);
            break;
        }
      }

      setShowForm(false);
      setEditingId(null);
      setForm({});

      await loadData();

      Alert.alert(
        "Success",
        editingId
          ? "Record updated successfully."
          : "Record created successfully."
      );
    } catch (error: any) {
      Alert.alert(
        "Save failed",
        error?.response?.data?.message ||
          error?.message ||
          "Could not save record."
      );
    }
  };

  const remove = async (item: any) => {
    const id = getId(item);

    if (!id) {
      return;
    }

    Alert.alert(
      "Delete record",
      "Are you sure you want to delete this record?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              switch (module) {
                case "patients":
                  await deletePatient(id);
                  break;

                case "appointments":
                  await deleteAppointment(id);
                  break;

                case "medical-records":
                  await deleteMedicalRecord(id);
                  break;

                case "prescriptions":
                  await deletePrescription(id);
                  break;

                case "billing":
                  await deleteBill(id);
                  break;

                case "inventory":
                  await deleteInventoryItem(id);
                  break;

                case "expenses":
                  await deleteExpense(id);
                  break;
              }

              await loadData();
            } catch (error: any) {
              Alert.alert(
                "Delete failed",
                error?.response?.data?.message ||
                  "Could not delete record."
              );
            }
          },
        },
      ]
    );
  };

  const filtered = items.filter((item) => {
    if (!search.trim()) {
      return true;
    }

    return JSON.stringify(item)
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const canWrite =
    !isPatient &&
    module !== "doctors";

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {config.title}
            </Text>

            <Text style={styles.description}>
              {config.description}
            </Text>
          </View>

          {canWrite && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={startCreate}
            >
              <Text style={styles.addText}>
                + Add
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.search}
          placeholder={`Search ${config.title.toLowerCase()}...`}
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />

        {showForm && canWrite && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingId
                ? `Edit ${config.title}`
                : `Add ${config.title}`}
            </Text>

            {Object.keys(form).length === 0 ? (
              <Text style={styles.helper}>
                Add fields below. Use the exact
                field names expected by your API.
              </Text>
            ) : null}

            {Object.entries(form).map(
              ([key, value]) => (
                <View key={key}>
                  <Text style={styles.label}>
                    {key}
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={(text) =>
                      setForm((previous) => ({
                        ...previous,
                        [key]: text,
                      }))
                    }
                  />
                </View>
              )
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                setForm((previous) => ({
                  ...previous,
                  name: previous.name || "",
                }))
              }
            >
              <Text style={styles.secondaryText}>
                Add Name Field
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={save}
            >
              <Text style={styles.primaryText}>
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                setShowForm(false)
              }
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <Text style={styles.status}>
            Loading...
          </Text>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No records found
            </Text>

            <Text style={styles.emptyText}>
              There is no data available here yet.
            </Text>
          </View>
        ) : (
          filtered.map((item, index) => {
            const id = getId(item);

            const entries = Object.entries(
              item || {}
            ).filter(([key]) => {
              return ![
                "_id",
                "id",
                "__v",
                "createdAt",
                "updatedAt",
              ].includes(key);
            });

            return (
              <View
                key={id || index}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {displayValue(
                      item.name ||
                        item.title ||
                        item.patientName ||
                        item.patient?.name ||
                        `${config.title} #${index + 1}`
                    )}
                  </Text>

                  <Text style={styles.number}>
                    #{index + 1}
                  </Text>
                </View>

                {entries
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <View
                      key={key}
                      style={styles.row}
                    >
                      <Text style={styles.rowKey}>
                        {key}
                      </Text>

                      <Text style={styles.rowValue}>
                        {displayValue(value)}
                      </Text>
                    </View>
                  ))}

                {canWrite && id && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() =>
                        startEdit(item)
                      }
                    >
                      <Text
                        style={styles.editText}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        remove(item)
                      }
                    >
                      <Text
                        style={styles.deleteText}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#111827",
  },

  description: {
    color: "#6B7280",
    marginTop: 4,
  },

  addButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 11,
    marginLeft: 10,
  },

  addText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  search: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    color: "#111827",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  number: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  rowKey: {
    width: "40%",
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },

  rowValue: {
    flex: 1,
    color: "#111827",
    fontSize: 13,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#DBEAFE",
    padding: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  editText: {
    color: "#2563EB",
    fontWeight: "800",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    padding: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteText: {
    color: "#DC2626",
    fontWeight: "800",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  formTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },

  helper: {
    color: "#6B7280",
    marginBottom: 10,
  },

  label: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#111827",
  },

  primaryButton: {
    height: 48,
    backgroundColor: "#2563EB",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  primaryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  secondaryButton: {
    height: 45,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  secondaryText: {
    color: "#2563EB",
    fontWeight: "700",
  },

  cancelButton: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  cancelText: {
    color: "#6B7280",
    fontWeight: "700",
  },

  status: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 30,
  },

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    marginTop: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  emptyText: {
    color: "#6B7280",
    marginTop: 5,
    textAlign: "center",
  },
});