import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

const CATEGORIES = ["Food", "Travel", "Education", "Shopping", "Other"];

const CATEGORY_COLORS = {
  Food: "bg-orange-100 text-orange-600",
  Travel: "bg-purple-100 text-purple-600",
  Education: "bg-blue-100 text-blue-600",
  Shopping: "bg-pink-100 text-pink-600",
  Other: "bg-gray-100 text-gray-600",
};

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

const defaultForm = { amount: "", category: "Food", description: "", date: "" };

export const DashBoard = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeTab, setActiveTab] = useState("expenses");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expensesData, statsData] = await Promise.all([
        apiFetch("/expenses/getAll"),
        apiFetch("/expenses/stats"),
      ]);
      setExpenses(expensesData);
      setStats(statsData);
    } catch (err) {
      setError("Failed to load data. Check your connection or login status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense._id);
    setForm({
      amount: expense.amount,
      category: expense.category,
      description: expense.description || "",
      date: expense.date ? expense.date.split("T")[0] : "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(defaultForm);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setFormError("Please enter a valid amount.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        date: form.date || new Date().toISOString(),
      };

      if (editingId) {
        await apiFetch(`/expenses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/expenses/create", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      fetchAll();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await apiFetch(`/expenses/${id}`, { method: "DELETE" });
      fetchAll();
    } catch {
      alert("Failed to delete expense.");
    }
  };

  const filtered = expenses
    .filter((e) => {
      const matchSearch =
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === "All" || e.category === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return sortOrder === "desc" ? db - da : da - db;
    });

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">ExpenseTracker</h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">Welcome back</p>
          <button
            onClick={handleLogout}
            className="border px-3 py-1 rounded hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card
          title="Total Expenses"
          value={stats ? `$${stats.totalExpenses.toFixed(2)}` : "—"}
          loading={loading}
        />
        <Card
          title="This Month"
          value={stats ? `$${stats.monthlyExpenses.toFixed(2)}` : "—"}
          loading={loading}
        />
        <Card
          title="Total Transactions"
          value={stats ? stats.totalTransactions : "—"}
          loading={loading}
        />
        <Card
          title="Categories"
          value={stats ? stats.categoriesCount : "—"}
          loading={loading}
        />
      </div>

      {/* Tabs + Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-1 rounded shadow ${activeTab === "expenses" ? "bg-white font-semibold" : "bg-gray-200"}`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-1 rounded ${activeTab === "analytics" ? "bg-white font-semibold shadow" : "bg-gray-200"}`}
          >
            Analytics
          </button>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="mb-4 font-semibold">Expense History</h2>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-10">Loading...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2">Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 text-sm text-gray-500">
                      {formatDate(item.date)}
                    </td>
                    <td>
                      {item.description || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${CATEGORY_COLORS[item.category] || "bg-gray-100 text-gray-600"}`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="font-medium">${item.amount.toFixed(2)}</td>
                    <td className="text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className="mr-2 p-1 hover:bg-gray-200 rounded"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1 hover:bg-red-100 text-red-500 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-center text-gray-400 mt-6">No expenses found</p>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <AnalyticsPanel expenses={expenses} loading={loading} />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                {editingId ? "Edit Expense" : "Add Expense"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="What was this for?"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border p-2 rounded"
                />
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 border px-4 py-2 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                >
                  <Check size={16} />
                  {submitting ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsPanel = ({ expenses, loading }) => {
  if (loading)
    return <div className="text-center text-gray-400 py-10">Loading...</div>;
  if (expenses.length === 0)
    return (
      <div className="bg-white p-6 rounded shadow text-center text-gray-400">
        No expense data to analyze yet.
      </div>
    );

  const byCategory = CATEGORIES.map((cat) => ({
    name: cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((acc, e) => acc + e.amount, 0),
  })).filter((c) => c.total > 0);

  const grandTotal = byCategory.reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-4">Spending by Category</h2>
      <div className="flex flex-col gap-3">
        {byCategory
          .sort((a, b) => b.total - a.total)
          .map((cat) => {
            const pct = ((cat.total / grandTotal) * 100).toFixed(1);
            return (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span
                    className={`px-2 py-0.5 rounded font-medium ${CATEGORY_COLORS[cat.name]}`}
                  >
                    {cat.name}
                  </span>
                  <span className="text-gray-600">
                    ${cat.total.toFixed(2)} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const Card = ({ title, value, loading }) => (
  <div className="bg-white p-4 rounded shadow">
    <p className="text-gray-500 text-sm">{title}</p>
    <h2 className="text-2xl font-bold mt-2">
      {loading ? <span className="text-gray-300">—</span> : value}
    </h2>
  </div>
);
