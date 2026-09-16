import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import "./Inventory.css";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
  name: "",
  category: "Medicine",
  description: "",
  manufacturer: "",
  supplier: "",
  batchNumber: "",
  expiryDate: "",
  purchasePrice: "",
  sellingPrice: "",
  quantity: "",
  unit: "piece",
  reorderLevel: "10",
  location: "",
  notes: "",
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getToken = () => localStorage.getItem("clinic_token");

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [stockAction, setStockAction] = useState("add");
  const [stockAmount, setStockAmount] = useState("");

  const [form, setForm] = useState(initialForm);

  const [submitting, setSubmitting] = useState(false);
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/inventory`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      /*
       * IMPORTANT:
       * Backend response:
       * {
       *   success: true,
       *   message: "...",
       *   count: 4,
       *   data: {
       *     inventoryItems: [...]
       *   }
       * }
       */

      const inventoryItems =
        response.data?.data?.inventoryItems || [];

      setItems(Array.isArray(inventoryItems) ? inventoryItems : []);
    } catch (requestError) {
      console.error("Inventory loading error:", requestError);

      if (requestError.response?.status === 401) {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        window.location.href = "/login";
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load inventory items."
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      return [
        item.name,
        item.category,
        item.manufacturer,
        item.supplier,
        item.batchNumber,
        item.itemCode,
        item.location,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [items, search]);

  const stats = useMemo(() => {
    const now = new Date();

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const lowStock = items.filter(
      (item) =>
        Number(item.quantity || 0) <=
        Number(item.reorderLevel || 0)
    ).length;

    const expired = items.filter(
      (item) =>
        item.expiryDate &&
        new Date(item.expiryDate) < now
    ).length;

    const expiringSoon = items.filter((item) => {
      if (!item.expiryDate) return false;

      const expiry = new Date(item.expiryDate);

      return expiry >= now && expiry <= thirtyDaysLater;
    }).length;

    const suppliers = new Set(
      items
        .map((item) => item.supplier)
        .filter(Boolean)
        .map((supplier) => supplier.toLowerCase())
    );

    const totalUnits = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    return {
      totalItems: items.length,
      totalUnits,
      lowStock,
      expired,
      expiringSoon,
      suppliers: suppliers.size,
    };
  }, [items]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setError("");
  };

  const closeAddModal = () => {
    if (submitting) return;

    setShowAddModal(false);
    resetForm();
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (Number(form.purchasePrice) < 0) {
      setError("Purchase price cannot be negative.");
      return;
    }

    if (Number(form.sellingPrice) < 0) {
      setError("Selling price cannot be negative.");
      return;
    }

    if (Number(form.quantity) < 0) {
      setError("Quantity cannot be negative.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        manufacturer: form.manufacturer.trim(),
        supplier: form.supplier.trim(),
        batchNumber: form.batchNumber.trim(),
        expiryDate: form.expiryDate || undefined,
        purchasePrice: Number(form.purchasePrice || 0),
        sellingPrice: Number(form.sellingPrice || 0),
        quantity: Number(form.quantity || 0),
        unit: form.unit.trim() || "piece",
        reorderLevel: Number(form.reorderLevel || 0),
        location: form.location.trim(),
        notes: form.notes.trim(),
      };

      await axios.post(`${API_URL}/inventory`, payload, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setShowAddModal(false);
      resetForm();

      setMessage("Inventory item created successfully.");

      await loadInventory();
    } catch (requestError) {
      console.error("Create inventory error:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to create inventory item."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (item) => {
    try {
      setError("");

      const response = await axios.get(
        `${API_URL}/inventory/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = response.data?.data;

      setSelectedItem(
        data?.inventoryItem ||
          data?.item ||
          data ||
          item
      );

      setShowViewModal(true);
    } catch (requestError) {
      console.error("Inventory details error:", requestError);

      setSelectedItem(item);
      setShowViewModal(true);
    }
  };

  const openStockModal = (item, action) => {
    setSelectedItem(item);
    setStockAction(action);
    setStockAmount("");
    setError("");
    setShowStockModal(true);
  };

  const handleStockUpdate = async (event) => {
    event.preventDefault();

    const amount = Number(stockAmount);

    if (!amount || amount <= 0) {
      setError("Please enter a valid positive quantity.");
      return;
    }

    try {
      setStockSubmitting(true);
      setError("");

      const endpoint =
        stockAction === "add"
          ? "add-stock"
          : "remove-stock";

      await axios.patch(
        `${API_URL}/inventory/${selectedItem._id}/${endpoint}`,
        {
          quantity: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      setShowStockModal(false);
      setStockAmount("");

      setMessage(
        stockAction === "add"
          ? "Stock added successfully."
          : "Stock removed successfully."
      );

      await loadInventory();
    } catch (requestError) {
      console.error("Stock update error:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to update stock."
      );
    } finally {
      setStockSubmitting(false);
    }
  };

  const handleDeactivate = async (item) => {
    const confirmed = window.confirm(
      `Deactivate "${item.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await axios.delete(
        `${API_URL}/inventory/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      setMessage("Inventory item deactivated successfully.");

      await loadInventory();
    } catch (requestError) {
      console.error("Deactivate inventory error:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to deactivate inventory item."
      );
    }
  };

  const getStockStatus = (item) => {
    const quantity = Number(item.quantity || 0);
    const reorderLevel = Number(item.reorderLevel || 0);

    if (quantity <= reorderLevel) {
      return {
        label: "Low Stock",
        className: "inventory-status-low",
      };
    }

    return {
      label: "In Stock",
      className: "inventory-status-good",
    };
  };

  return (
    <div className="inventory-page">
      <div className="inventory-container">

        <div className="inventory-breadcrumb">
          Clinic <span>/</span> Inventory
        </div>

        <div className="inventory-page-header">
          <div>
            <h1>Inventory & Pharmacy</h1>
            <p>
              Manage medicines, stock levels, suppliers and expiry dates.
            </p>
          </div>

          <button
            className="inventory-primary-button"
            onClick={() => {
              setError("");
              setShowAddModal(true);
            }}
          >
            <Plus size={18} />
            Add Inventory Item
          </button>
        </div>

        {message && (
          <div className="inventory-success-message">
            <Check size={18} />
            <span>{message}</span>

            <button onClick={() => setMessage("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {error && !showAddModal && !showStockModal && (
          <div className="inventory-error-message">
            <AlertTriangle size={18} />
            <span>{error}</span>

            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <div className="inventory-stats-grid">

          <div className="inventory-stat-card">
            <div className="inventory-stat-icon blue">
              <Package size={22} />
            </div>

            <span>Total Items</span>
            <strong>{loading ? "..." : stats.totalItems}</strong>
          </div>

          <div className="inventory-stat-card">
            <div className="inventory-stat-icon blue">
              <Archive size={22} />
            </div>

            <span>Total Units</span>
            <strong>{loading ? "..." : stats.totalUnits}</strong>
          </div>

          <div className="inventory-stat-card">
            <div className="inventory-stat-icon yellow">
              <AlertTriangle size={22} />
            </div>

            <span>Low Stock</span>
            <strong>{loading ? "..." : stats.lowStock}</strong>
          </div>

          <div className="inventory-stat-card">
            <div className="inventory-stat-icon red">
              <ShieldAlert size={22} />
            </div>

            <span>Expired</span>
            <strong>{loading ? "..." : stats.expired}</strong>
          </div>

        </div>

        <div className="inventory-secondary-stats">

          <div className="inventory-secondary-card">
            <div className="inventory-secondary-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <strong>
                {loading ? "..." : stats.expiringSoon}
              </strong>
              <span>Items expiring within 30 days</span>
            </div>
          </div>

          <div className="inventory-secondary-card">
            <div className="inventory-secondary-icon">
              <Truck size={20} />
            </div>

            <div>
              <strong>
                {loading ? "..." : stats.suppliers}
              </strong>
              <span>Active suppliers</span>
            </div>
          </div>

        </div>

        <section className="inventory-directory">

          <div className="inventory-directory-header">
            <div>
              <h2>Inventory Directory</h2>
              <p>
                {loading
                  ? "Loading inventory..."
                  : `${filteredItems.length} ${
                      filteredItems.length === 1
                        ? "item"
                        : "items"
                    } found`}
              </p>
            </div>

            <div className="inventory-search-box">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search medicine, supplier, batch..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {loading ? (
            <div className="inventory-loading">
              <div className="inventory-loader" />
              <p>Loading inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="inventory-empty">
              <div className="inventory-empty-icon">
                <Package size={34} />
              </div>

              <h3>
                {search
                  ? "No matching inventory items"
                  : "No inventory items found"}
              </h3>

              <p>
                {search
                  ? "Try a different search term."
                  : "Add your first inventory item to get started."}
              </p>

              {!search && (
                <button
                  className="inventory-primary-button"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={18} />
                  Add Inventory Item
                </button>
              )}
            </div>
          ) : (
            <div className="inventory-table-wrapper">

              <table className="inventory-table">

                <thead>
                  <tr>
                    <th>ITEM</th>
                    <th>CATEGORY</th>
                    <th>STOCK</th>
                    <th>EXPIRY</th>
                    <th>SUPPLIER</th>
                    <th>PRICE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => {
                    const stockStatus =
                      getStockStatus(item);

                    return (
                      <tr key={item._id}>

                        <td>
                          <div className="inventory-item-cell">

                            <div className="inventory-item-icon">
                              <Package size={18} />
                            </div>

                            <div>
                              <strong>{item.name}</strong>

                              <span>
                                {item.itemCode || "—"}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="inventory-category">
                            {item.category}
                          </span>
                        </td>

                        <td>
                          <div className="inventory-stock-cell">
                            <strong>
                              {item.quantity ?? 0}
                            </strong>

                            <span>
                              {item.unit || "piece"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="inventory-expiry">
                            <CalendarDays size={15} />
                            {formatDate(item.expiryDate)}
                          </div>
                        </td>

                        <td>
                          <div className="inventory-supplier">
                            <Truck size={15} />
                            <span>
                              {item.supplier || "—"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="inventory-price">
                            {formatCurrency(item.sellingPrice)}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inventory-status ${stockStatus.className}`}
                          >
                            <span className="inventory-status-dot" />
                            {stockStatus.label}
                          </span>
                        </td>

                        <td>
                          <div className="inventory-actions">

                            <button
                              className="inventory-action-button"
                              title="View details"
                              onClick={() =>
                                handleView(item)
                              }
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              className="inventory-action-button"
                              title="Add stock"
                              onClick={() =>
                                openStockModal(
                                  item,
                                  "add"
                                )
                              }
                            >
                              <Plus size={17} />
                            </button>

                            <button
                              className="inventory-action-button"
                              title="Remove stock"
                              onClick={() =>
                                openStockModal(
                                  item,
                                  "remove"
                                )
                              }
                            >
                              <Archive size={17} />
                            </button>

                            <button
                              className="inventory-action-button danger"
                              title="Deactivate"
                              onClick={() =>
                                handleDeactivate(item)
                              }
                            >
                              <ShieldAlert size={17} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>

      {/* ADD INVENTORY MODAL */}

      {showAddModal && (
        <div className="inventory-modal-overlay">

          <div className="inventory-modal inventory-large-modal">

            <div className="inventory-modal-header">
              <div>
                <h2>Add Inventory Item</h2>
                <p>
                  Add medicine, supplies or other stock.
                </p>
              </div>

              <button
                className="inventory-modal-close"
                onClick={closeAddModal}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateItem}
              className="inventory-form"
            >

              {error && (
                <div className="inventory-form-error">
                  <AlertTriangle size={17} />
                  {error}
                </div>
              )}

              <div className="inventory-form-grid">

                <div className="inventory-field">
                  <label>
                    Item Name <span>*</span>
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Paracetamol 500mg"
                    required
                  />
                </div>

                <div className="inventory-field">
                  <label>
                    Category <span>*</span>
                  </label>

                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    placeholder="Medicine"
                    required
                  />
                </div>

              </div>

              <div className="inventory-field">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe the item..."
                  rows="3"
                />
              </div>

              <div className="inventory-form-grid">

                <div className="inventory-field">
                  <label>Manufacturer</label>

                  <input
                    name="manufacturer"
                    value={form.manufacturer}
                    onChange={handleFormChange}
                    placeholder="Manufacturer name"
                  />
                </div>

                <div className="inventory-field">
                  <label>Supplier</label>

                  <input
                    name="supplier"
                    value={form.supplier}
                    onChange={handleFormChange}
                    placeholder="Supplier name"
                  />
                </div>

              </div>

              <div className="inventory-form-grid">

                <div className="inventory-field">
                  <label>Batch Number</label>

                  <input
                    name="batchNumber"
                    value={form.batchNumber}
                    onChange={handleFormChange}
                    placeholder="e.g. PCM2026A01"
                  />
                </div>

                <div className="inventory-field">
                  <label>Expiry Date</label>

                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleFormChange}
                  />
                </div>

              </div>

              <div className="inventory-section-title">
                <Package size={18} />
                Stock & Pricing
              </div>

              <div className="inventory-form-grid">

                <div className="inventory-field">
                  <label>
                    Purchase Price <span>*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="purchasePrice"
                    value={form.purchasePrice}
                    onChange={handleFormChange}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="inventory-field">
                  <label>
                    Selling Price <span>*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="sellingPrice"
                    value={form.sellingPrice}
                    onChange={handleFormChange}
                    placeholder="0"
                    required
                  />
                </div>

              </div>

              <div className="inventory-form-grid">

                <div className="inventory-field">
                  <label>
                    Quantity <span>*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleFormChange}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="inventory-field">
                  <label>Unit</label>

                  <input
                    name="unit"
                    value={form.unit}
                    onChange={handleFormChange}
                    placeholder="piece"
                  />
                </div>

              </div>

              <div className="inventory-form-grid">

                <div className="inventory-field">
                  <label>Reorder Level</label>

                  <input
                    type="number"
                    min="0"
                    name="reorderLevel"
                    value={form.reorderLevel}
                    onChange={handleFormChange}
                    placeholder="10"
                  />
                </div>

                <div className="inventory-field">
                  <label>Location</label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="Pharmacy Shelf A1"
                  />
                </div>

              </div>

              <div className="inventory-field">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>

              <div className="inventory-modal-footer">

                <button
                  type="button"
                  className="inventory-secondary-button"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inventory-primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Item
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* VIEW MODAL */}

      {showViewModal && selectedItem && (
        <div className="inventory-modal-overlay">

          <div className="inventory-modal">

            <div className="inventory-modal-header">

              <div>
                <h2>{selectedItem.name}</h2>

                <p>
                  {selectedItem.itemCode || "Inventory Item"}
                </p>
              </div>

              <button
                className="inventory-modal-close"
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>

            </div>

            <div className="inventory-detail-grid">

              <div>
                <span>Category</span>
                <strong>
                  {selectedItem.category || "—"}
                </strong>
              </div>

              <div>
                <span>Quantity</span>
                <strong>
                  {selectedItem.quantity ?? 0}{" "}
                  {selectedItem.unit || "piece"}
                </strong>
              </div>

              <div>
                <span>Purchase Price</span>
                <strong>
                  {formatCurrency(
                    selectedItem.purchasePrice
                  )}
                </strong>
              </div>

              <div>
                <span>Selling Price</span>
                <strong>
                  {formatCurrency(
                    selectedItem.sellingPrice
                  )}
                </strong>
              </div>

              <div>
                <span>Supplier</span>
                <strong>
                  {selectedItem.supplier || "—"}
                </strong>
              </div>

              <div>
                <span>Manufacturer</span>
                <strong>
                  {selectedItem.manufacturer || "—"}
                </strong>
              </div>

              <div>
                <span>Batch Number</span>
                <strong>
                  {selectedItem.batchNumber || "—"}
                </strong>
              </div>

              <div>
                <span>Expiry Date</span>
                <strong>
                  {formatDate(selectedItem.expiryDate)}
                </strong>
              </div>

              <div>
                <span>Reorder Level</span>
                <strong>
                  {selectedItem.reorderLevel ?? 0}
                </strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  {selectedItem.location || "—"}
                </strong>
              </div>

            </div>

            {selectedItem.description && (
              <div className="inventory-detail-section">
                <span>Description</span>
                <p>{selectedItem.description}</p>
              </div>
            )}

            {selectedItem.notes && (
              <div className="inventory-detail-section">
                <span>Notes</span>
                <p>{selectedItem.notes}</p>
              </div>
            )}

            <div className="inventory-modal-footer">

              <button
                className="inventory-secondary-button"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>

              <button
                className="inventory-primary-button"
                onClick={() => {
                  setShowViewModal(false);
                  openStockModal(
                    selectedItem,
                    "add"
                  );
                }}
              >
                <Plus size={18} />
                Add Stock
              </button>

            </div>

          </div>
        </div>
      )}

      {/* STOCK MODAL */}

      {showStockModal && selectedItem && (
        <div className="inventory-modal-overlay">

          <div className="inventory-modal inventory-stock-modal">

            <div className="inventory-modal-header">

              <div>
                <h2>
                  {stockAction === "add"
                    ? "Add Stock"
                    : "Remove Stock"}
                </h2>

                <p>{selectedItem.name}</p>
              </div>

              <button
                className="inventory-modal-close"
                onClick={() =>
                  setShowStockModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            {error && (
              <div className="inventory-form-error">
                <AlertTriangle size={17} />
                {error}
              </div>
            )}

            <form onSubmit={handleStockUpdate}>

              <div className="inventory-current-stock">
                <span>Current Stock</span>

                <strong>
                  {selectedItem.quantity ?? 0}{" "}
                  {selectedItem.unit || "piece"}
                </strong>
              </div>

              <div className="inventory-field">
                <label>
                  Quantity <span>*</span>
                </label>

                <input
                  type="number"
                  min="1"
                  value={stockAmount}
                  onChange={(event) =>
                    setStockAmount(
                      event.target.value
                    )
                  }
                  placeholder="Enter quantity"
                  autoFocus
                  required
                />
              </div>

              <div className="inventory-modal-footer">

                <button
                  type="button"
                  className="inventory-secondary-button"
                  onClick={() =>
                    setShowStockModal(false)
                  }
                  disabled={stockSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inventory-primary-button"
                  disabled={stockSubmitting}
                >
                  {stockSubmitting
                    ? "Updating..."
                    : stockAction === "add"
                    ? "Add Stock"
                    : "Remove Stock"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default Inventory;