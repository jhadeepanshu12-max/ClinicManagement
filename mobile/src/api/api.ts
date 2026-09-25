import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL =
  "https://clinic-management-backend-j84t.onrender.com/api";

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

async function authConfig() {
  const token = await AsyncStorage.getItem("clinic_token");

  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
}

function unwrap(data: any, key?: string): any {
  if (key && data?.data?.[key] !== undefined) {
    return data.data[key];
  }

  if (data?.data !== undefined) {
    return data.data;
  }

  return data;
}

function list(data: any, key: string): any[] {
  const value = data?.data;

  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.[key])) {
    return value[key];
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  return [];
}

/* =========================================================
   AUTH
========================================================= */

export async function login(email: string, password: string) {
  const response = await client.post("/auth/login", {
    email,
    password,
  });

  const payload = unwrap(response.data);

  const token =
    payload?.token ||
    response.data?.token ||
    response.data?.data?.token;

  const user =
    payload?.user ||
    response.data?.user ||
    response.data?.data?.user;

  if (!token) {
    throw new Error(
      response.data?.message || "Login failed: token not received."
    );
  }

  await AsyncStorage.setItem("clinic_token", token);

  if (user) {
    await AsyncStorage.setItem(
      "clinic_user",
      JSON.stringify(user)
    );
  }

  return {
    token,
    user,
  };
}

export async function logout() {
  await AsyncStorage.multiRemove([
    "clinic_token",
    "clinic_user",
    "authenticated_role",
    "selected_login_role",
  ]);
}

export const signOut = logout;

export async function getMe() {
  return unwrap(
    (await client.get("/users/me", await authConfig())).data,
    "user"
  );
}

/* =========================================================
   PATIENTS - ADMIN / STAFF
========================================================= */

export async function getPatients() {
  return list(
    (await client.get("/patients", await authConfig())).data,
    "patients"
  );
}

export async function createPatient(payload: any) {
  return unwrap(
    (
      await client.post(
        "/patients",
        payload,
        await authConfig()
      )
    ).data,
    "patient"
  );
}

export async function updatePatient(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/patients/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "patient"
  );
}

export async function deletePatient(id: string) {
  return (
    await client.delete(
      `/patients/${id}`,
      await authConfig()
    )
  ).data;
}

/* =========================================================
   DOCTORS
========================================================= */

export async function getDoctors() {
  return list(
    (await client.get("/doctors", await authConfig())).data,
    "doctors"
  );
}

export async function createDoctor(payload: any) {
  return unwrap(
    (
      await client.post(
        "/doctors",
        payload,
        await authConfig()
      )
    ).data,
    "doctor"
  );
}

export async function updateDoctor(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/doctors/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "doctor"
  );
}

export async function deleteDoctor(id: string) {
  return (
    await client.delete(
      `/doctors/${id}`,
      await authConfig()
    )
  ).data;
}

export async function restoreDoctor(id: string) {
  return (
    await client.patch(
      `/doctors/${id}/restore`,
      {},
      await authConfig()
    )
  ).data;
}

/* =========================================================
   APPOINTMENTS
========================================================= */

export async function getAppointments() {
  return list(
    (
      await client.get(
        "/appointments",
        await authConfig()
      )
    ).data,
    "appointments"
  );
}

export async function createAppointment(
  payload: any
) {
  return unwrap(
    (
      await client.post(
        "/appointments",
        payload,
        await authConfig()
      )
    ).data,
    "appointment"
  );
}

export async function updateAppointment(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/appointments/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "appointment"
  );
}

export async function deleteAppointment(id: string) {
  return (
    await client.delete(
      `/appointments/${id}`,
      await authConfig()
    )
  ).data;
}

/* =========================================================
   MEDICAL RECORDS
========================================================= */

export async function getMedicalRecords() {
  return list(
    (
      await client.get(
        "/medical-records",
        await authConfig()
      )
    ).data,
    "medicalRecords"
  );
}

export async function createMedicalRecord(
  payload: any
) {
  return unwrap(
    (
      await client.post(
        "/medical-records",
        payload,
        await authConfig()
      )
    ).data,
    "medicalRecord"
  );
}

export async function updateMedicalRecord(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/medical-records/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "medicalRecord"
  );
}

export async function deleteMedicalRecord(id: string) {
  return (
    await client.delete(
      `/medical-records/${id}`,
      await authConfig()
    )
  ).data;
}

/* =========================================================
   PRESCRIPTIONS
========================================================= */

export async function getPrescriptions() {
  return list(
    (
      await client.get(
        "/prescriptions",
        await authConfig()
      )
    ).data,
    "prescriptions"
  );
}

export async function createPrescription(
  payload: any
) {
  return unwrap(
    (
      await client.post(
        "/prescriptions",
        payload,
        await authConfig()
      )
    ).data,
    "prescription"
  );
}

export async function updatePrescription(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/prescriptions/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "prescription"
  );
}

export async function deletePrescription(
  id: string
) {
  return (
    await client.delete(
      `/prescriptions/${id}`,
      await authConfig()
    )
  ).data;
}

/* =========================================================
   BILLING
========================================================= */

export async function getBilling() {
  return list(
    (
      await client.get(
        "/billing",
        await authConfig()
      )
    ).data,
    "billings"
  );
}

export async function createBill(payload: any) {
  return unwrap(
    (
      await client.post(
        "/billing",
        payload,
        await authConfig()
      )
    ).data,
    "billing"
  );
}

export async function updateBill(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/billing/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "billing"
  );
}

export async function deleteBill(id: string) {
  return (
    await client.delete(
      `/billing/${id}`,
      await authConfig()
    )
  ).data;
}

/* =========================================================
   INVENTORY
========================================================= */

export async function getInventory() {
  return list(
    (
      await client.get(
        "/inventory",
        await authConfig()
      )
    ).data,
    "inventory"
  );
}

export async function createInventoryItem(
  payload: any
) {
  return unwrap(
    (
      await client.post(
        "/inventory",
        payload,
        await authConfig()
      )
    ).data,
    "inventoryItem"
  );
}

export async function updateInventoryItem(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/inventory/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "inventoryItem"
  );
}

export async function deleteInventoryItem(
  id: string
) {
  return (
    await client.delete(
      `/inventory/${id}`,
      await authConfig()
    )
  ).data;
}

export async function addStock(
  id: string,
  quantity: number
) {
  return (
    await client.patch(
      `/inventory/${id}/add-stock`,
      { quantity },
      await authConfig()
    )
  ).data;
}

export async function removeStock(
  id: string,
  quantity: number
) {
  return (
    await client.patch(
      `/inventory/${id}/remove-stock`,
      { quantity },
      await authConfig()
    )
  ).data;
}

/* =========================================================
   EXPENSES
========================================================= */

export async function getExpenses() {
  return list(
    (
      await client.get(
        "/expenses",
        await authConfig()
      )
    ).data,
    "expenses"
  );
}

export async function createExpense(
  payload: any
) {
  return unwrap(
    (
      await client.post(
        "/expenses",
        payload,
        await authConfig()
      )
    ).data,
    "expense"
  );
}

export async function updateExpense(
  id: string,
  payload: any
) {
  return unwrap(
    (
      await client.put(
        `/expenses/${id}`,
        payload,
        await authConfig()
      )
    ).data,
    "expense"
  );
}

export async function deleteExpense(id: string) {
  return (
    await client.delete(
      `/expenses/${id}`,
      await authConfig()
    )
  ).data;
}

/* =========================================================
   DASHBOARD
========================================================= */

export async function getDashboardStats() {
  return unwrap(
    (
      await client.get(
        "/dashboard/stats",
        await authConfig()
      )
    ).data
  );
}

export async function getRecentAppointments() {
  return list(
    (
      await client.get(
        "/dashboard/recent-appointments?limit=5",
        await authConfig()
      )
    ).data,
    "appointments"
  );
}

/* =========================================================
   PATIENT AUTHENTICATION
========================================================= */

export async function registerPatient(
  payload: any
) {
  const response = await client.post(
    "/patient-auth/register",
    payload
  );

  const root =
    response.data?.data ?? response.data;

  const token = root?.token;
  const user = root?.user;

  if (token) {
    await AsyncStorage.setItem(
      "clinic_token",
      token
    );
  }

  if (user) {
    await AsyncStorage.setItem(
      "clinic_user",
      JSON.stringify(user)
    );
  }

  return root;
}

/* =========================================================
   PATIENT PORTAL
========================================================= */

/**
 * Complete patient dashboard.
 */
export async function getPatientPortal() {
  return unwrap(
    (
      await client.get(
        "/patient-portal/dashboard",
        await authConfig()
      )
    ).data
  );
}

/**
 * Patient dashboard alias.
 */
export async function getPatientDashboard() {
  return getPatientPortal();
}

/**
 * Logged-in patient's own profile.
 */
export async function getPatientProfile() {
  return unwrap(
    (
      await client.get(
        "/patient-portal/me",
        await authConfig()
      )
    ).data
  );
}

/**
 * Logged-in patient's appointments.
 */
export async function getPatientAppointments() {
  return list(
    (
      await client.get(
        "/patient-portal/appointments",
        await authConfig()
      )
    ).data,
    "appointments"
  );
}

/**
 * Logged-in patient's medical records.
 */
export async function getPatientMedicalRecords() {
  return list(
    (
      await client.get(
        "/patient-portal/medical-records",
        await authConfig()
      )
    ).data,
    "medicalRecords"
  );
}

/**
 * Logged-in patient's prescriptions.
 */
export async function getPatientPrescriptions() {
  return list(
    (
      await client.get(
        "/patient-portal/prescriptions",
        await authConfig()
      )
    ).data,
    "prescriptions"
  );
}

/**
 * Logged-in patient's billing.
 */
export async function getPatientBilling() {
  return list(
    (
      await client.get(
        "/patient-portal/billing",
        await authConfig()
      )
    ).data,
    "billing"
  );
}