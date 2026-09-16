import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Banknote,
  CalendarDays,
  Check,
  CircleDollarSign,
  Eye,
  FileText,
  Plus,
  Search,
  Tag,
  UserRound,
  X,
} from "lucide-react";

import "./Expenses.css";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
  category: "medical-supplies",
  amount: "",
  description: "",
  vendor: "",
  paymentMethod: "upi",
  expenseDate: new Date().toISOString().split("T")[0],
  receiptNumber: "",
  notes: "",
};

const categories = [
  ["rent", "Rent"],
  ["salary", "Salary"],
  ["utilities", "Utilities"],
  ["medical-supplies", "Medical Supplies"],
  ["equipment", "Equipment"],
  ["maintenance", "Maintenance"],
  ["marketing", "Marketing"],
  ["transport", "Transport"],
  ["office-supplies", "Office Supplies"],
  ["other", "Other"],
];

const paymentMethods = [
  ["cash", "Cash"],
  ["card", "Card"],
  ["upi", "UPI"],
  ["bank-transfer", "Bank Transfer"],
  ["other", "Other"],
];

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("clinic_token")}`,
  },
});

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/expenses`,
        getAuthConfig()
      );

      const data = response.data?.data;

      setExpenses(Array.isArray(data?.expenses) ? data.expenses : []);
    } catch (err) {
      setExpenses([]);
      setError(
        err.response?.data?.message ||
          "Unable to load expenses."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/expenses/summary`,
        getAuthConfig()
      );

      setSummary(response.data?.data || null);
    } catch {
      setSummary(null);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, []);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !query ||
        expense.expenseNumber?.toLowerCase().includes(query) ||
        expense.description?.toLowerCase().includes(query) ||
        expense.vendor?.toLowerCase().includes(query) ||
        expense.category?.toLowerCase().includes(query) ||
        expense.receiptNumber?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      ),
    [expenses]
  );

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();

    return expenses
      .filter((expense) => {
        const date = new Date(expense.expenseDate);

        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      );
  }, [expenses]);

  const categoryCount = useMemo(
    () => new Set(expenses.map((expense) => expense.category)).size,
    [expenses]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    if (!form.description.trim()) {
      setError("Expense description is required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        category: form.category,
        amount: Number(form.amount),
        description: form.description.trim(),
        vendor: form.vendor.trim(),
        paymentMethod: form.paymentMethod,
        expenseDate: form.expenseDate,
        receiptNumber: form.receiptNumber.trim(),
        notes: form.notes.trim(),
      };

      await axios.post(
        `${API_URL}/expenses`,
        payload,
        getAuthConfig()
      );

      setSuccess("Expense created successfully.");
      setShowAddModal(false);
      setForm(initialForm);

      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create expense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (value) =>
    categories.find(([key]) => key === value)?.[1] || value;

  const getPaymentLabel = (value) =>
    paymentMethods.find(([key]) => key === value)?.[1] || value;

  return (
    <div className="expenses-page">
      <div className="expenses-container">
        <div className="expenses-breadcrumb">
          <span>Clinic</span>
          <b>/</b>
          <strong>Expenses</strong>
        </div>

        <div className="expenses-header">
          <div>
            <h1>Expenses</h1>
            <p>
              Track clinic expenses, payments, vendors and
              financial records.
            </p>
          </div>

          <button
            className="expenses-primary-button"
            onClick={() => {
              setError("");
              setShowAddModal(true);
            }}
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>

        {success && (
          <div className="expenses-alert success">
            <Check size={18} />
            <span>{success}</span>

            <button onClick={() => setSuccess("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {error && !showAddModal && (
          <div className="expenses-alert error">
            <span>{error}</span>

            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <div className="expenses-stats">
          <div className="expense-stat-card">
            <div className="expense-stat-icon blue">
              <CircleDollarSign size={21} />
            </div>

            <div>
              <span>Total Expenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>
          </div>

          <div className="expense-stat-card">
            <div className="expense-stat-icon green">
              <Banknote size={21} />
            </div>

            <div>
              <span>This Month</span>
              <strong>
                {formatCurrency(currentMonthExpenses)}
              </strong>
            </div>
          </div>

          <div className="expense-stat-card">
            <div className="expense-stat-icon purple">
              <FileText size={21} />
            </div>

            <div>
              <span>Total Records</span>
              <strong>{expenses.length}</strong>
            </div>
          </div>

          <div className="expense-stat-card">
            <div className="expense-stat-icon orange">
              <Tag size={21} />
            </div>

            <div>
              <span>Categories</span>
              <strong>{categoryCount}</strong>
            </div>
          </div>
        </div>

        {summary?.categoryBreakdown?.length > 0 && (
          <div className="expense-summary-card">
            <div className="expense-summary-title">
              <div>
                <h2>Expense Breakdown</h2>
                <p>Expenses grouped by category</p>
              </div>
            </div>

            <div className="expense-breakdown">
              {summary.categoryBreakdown.map((item) => (
                <div
                  className="expense-breakdown-item"
                  key={item.category}
                >
                  <div>
                    <span>
                      {getCategoryLabel(item.category)}
                    </span>
                    <small>{item.count} records</small>
                  </div>

                  <strong>
                    {formatCurrency(item.total)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="expenses-directory">
          <div className="expenses-directory-header">
            <div>
              <h2>Expense Directory</h2>
              <p>
                {filteredExpenses.length} expense
                {filteredExpenses.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="expenses-filters">
              <div className="expenses-search">
                <Search size={17} />

                <input
                  type="text"
                  placeholder="Search expense, vendor, receipt..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
              >
                <option value="all">All Categories</option>

                {categories.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="expenses-loading">
              <div className="expenses-loader" />
              <span>Loading expenses...</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="expenses-empty">
              <div className="expenses-empty-icon">
                <FileText size={30} />
              </div>

              <h3>No expenses found</h3>

              <p>
                Add your first clinic expense to get started.
              </p>

              <button
                className="expenses-primary-button"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={17} />
                Add Expense
              </button>
            </div>
          ) : (
            <div className="expenses-table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>EXPENSE</th>
                    <th>CATEGORY</th>
                    <th>DATE</th>
                    <th>VENDOR</th>
                    <th>PAYMENT</th>
                    <th>AMOUNT</th>
                    <th>CREATED BY</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id}>
                      <td>
                        <div className="expense-number-cell">
                          <div className="expense-row-icon">
                            <FileText size={17} />
                          </div>

                          <div>
                            <strong>
                              {expense.expenseNumber}
                            </strong>

                            <span>
                              {expense.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="expense-category">
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>

                      <td>
                        <div className="expense-date">
                          <CalendarDays size={15} />
                          {formatDate(expense.expenseDate)}
                        </div>
                      </td>

                      <td>
                        <span className="expense-vendor">
                          {expense.vendor || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="expense-payment">
                          {getPaymentLabel(
                            expense.paymentMethod
                          )}
                        </span>
                      </td>

                      <td>
                        <strong className="expense-amount">
                          {formatCurrency(expense.amount)}
                        </strong>
                      </td>

                      <td>
                        <div className="expense-created-by">
                          <UserRound size={15} />

                          <span>
                            {expense.createdBy?.name ||
                              "Unknown"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <button
                          className="expense-view-button"
                          onClick={() =>
                            setSelectedExpense(expense)
                          }
                          title="View expense"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div
          className="expenses-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="expenses-modal">
            <div className="expenses-modal-header">
              <div>
                <h2>Add Expense</h2>
                <p>Record a new clinic expense.</p>
              </div>

              <button
                className="expenses-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="expenses-form"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="expenses-form-error">
                  {error}
                </div>
              )}

              <div className="expenses-form-grid">
                <div className="expenses-field">
                  <label>
                    Category <span>*</span>
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    {categories.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="expenses-field">
                  <label>
                    Amount <span>*</span>
                  </label>

                  <div className="expense-input-with-symbol">
                    <span>₹</span>

                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 2500"
                      value={form.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="expenses-field">
                <label>
                  Description <span>*</span>
                </label>

                <textarea
                  name="description"
                  placeholder="Describe the expense..."
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="expenses-form-grid">
                <div className="expenses-field">
                  <label>Vendor</label>

                  <input
                    name="vendor"
                    placeholder="Vendor / supplier name"
                    value={form.vendor}
                    onChange={handleChange}
                  />
                </div>

                <div className="expenses-field">
                  <label>Receipt Number</label>

                  <input
                    name="receiptNumber"
                    placeholder="e.g. REC-2026-001"
                    value={form.receiptNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="expenses-form-grid">
                <div className="expenses-field">
                  <label>
                    Payment Method <span>*</span>
                  </label>

                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                  >
                    {paymentMethods.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="expenses-field">
                  <label>
                    Expense Date <span>*</span>
                  </label>

                  <input
                    name="expenseDate"
                    type="date"
                    value={form.expenseDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="expenses-field">
                <label>Notes</label>

                <textarea
                  name="notes"
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="expenses-modal-footer">
                <button
                  type="button"
                  className="expenses-secondary-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="expenses-primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Check size={17} />
                      Create Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedExpense && (
        <div
          className="expenses-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedExpense(null);
            }
          }}
        >
          <div className="expenses-modal expense-details-modal">
            <div className="expenses-modal-header">
              <div>
                <h2>Expense Details</h2>
                <p>
                  {selectedExpense.expenseNumber}
                </p>
              </div>

              <button
                className="expenses-modal-close"
                onClick={() => setSelectedExpense(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="expense-detail-content">
              <div className="expense-detail-hero">
                <div className="expense-detail-icon">
                  <CircleDollarSign size={27} />
                </div>

                <div>
                  <span>Expense Amount</span>
                  <strong>
                    {formatCurrency(selectedExpense.amount)}
                  </strong>
                </div>
              </div>

              <div className="expense-detail-grid">
                <div>
                  <span>Category</span>
                  <strong>
                    {getCategoryLabel(
                      selectedExpense.category
                    )}
                  </strong>
                </div>

                <div>
                  <span>Expense Date</span>
                  <strong>
                    {formatDate(
                      selectedExpense.expenseDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>Payment Method</span>
                  <strong>
                    {getPaymentLabel(
                      selectedExpense.paymentMethod
                    )}
                  </strong>
                </div>

                <div>
                  <span>Vendor</span>
                  <strong>
                    {selectedExpense.vendor || "—"}
                  </strong>
                </div>

                <div>
                  <span>Receipt Number</span>
                  <strong>
                    {selectedExpense.receiptNumber || "—"}
                  </strong>
                </div>

                <div>
                  <span>Created By</span>
                  <strong>
                    {selectedExpense.createdBy?.name ||
                      "Unknown"}
                  </strong>
                </div>
              </div>

              <div className="expense-detail-section">
                <span>Description</span>
                <p>
                  {selectedExpense.description || "—"}
                </p>
              </div>

              <div className="expense-detail-section">
                <span>Notes</span>
                <p>
                  {selectedExpense.notes || "No additional notes."}
                </p>
              </div>

              <div className="expense-detail-footer">
                <span>
                  Created{" "}
                  {formatDate(selectedExpense.createdAt)}
                </span>

                <button
                  className="expenses-secondary-button"
                  onClick={() => setSelectedExpense(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;