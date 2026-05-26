import { useState, useCallback, useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./App.css";

// ─── CopilotKit config ────────────────────────────────────────────────────────
// Priority: Cloud key > Node runtime URL > error
const CLOUD_KEY = import.meta.env.VITE_COPILOT_CLOUD_API_KEY;
const RUNTIME_URL = "http://localhost:4000/copilotkit";
const BACKEND_API = "http://localhost:8000";

const copilotProps = CLOUD_KEY
  ? { publicApiKey: CLOUD_KEY }
  : { runtimeUrl: RUNTIME_URL };

// ─── Todo App Inner Component ─────────────────────────────────────────────────
function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // ── Fetch todos on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_API}/todos`);
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error("❌ Error fetching todos:", err);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Give AI visibility into current todos ──────────────────────────────────
  useCopilotReadable({
    description: "The current list of todo items with their ID, text, done status, and priority",
    value: todos,
  });

  // ── AI Actions ────────────────────────────────────────────────────────────
  useCopilotAction({
    name: "addTodo",
    description: "Add a new todo item to the list",
    parameters: [
      { name: "text", type: "string", description: "The todo text", required: true },
      { name: "priority", type: "string", description: "Priority: low, medium, or high", required: false },
    ],
    handler: async ({ text, priority = "medium" }) => {
      try {
        const id = Date.now();
        const res = await fetch(`${BACKEND_API}/todos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, text, done: false, priority }),
        });
        if (!res.ok) throw new Error("Failed to add todo");
        await fetchTodos();
        return `Added: "${text}" (${priority} priority, id=${id})`;
      } catch (err) {
        console.error("❌ Error adding todo:", err);
        return `Failed to add todo: ${err.message}`;
      }
    },
  });

  useCopilotAction({
    name: "completeTodo",
    description: "Mark a todo as done or undone by its numeric ID",
    parameters: [
      { name: "id", type: "number", description: "The todo item ID", required: true },
      { name: "done", type: "boolean", description: "true = done", required: true },
    ],
    handler: async ({ id, done }) => {
      try {
        const res = await fetch(`${BACKEND_API}/todos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done }),
        });
        if (!res.ok) throw new Error("Failed to update todo");
        await fetchTodos();
        return `Todo #${id} marked as ${done ? "done ✓" : "undone ○"}`;
      } catch (err) {
        console.error("❌ Error updating todo:", err);
        return `Failed to update todo: ${err.message}`;
      }
    },
  });

  useCopilotAction({
    name: "deleteTodo",
    description: "Delete a todo item by its numeric ID",
    parameters: [
      { name: "id", type: "number", description: "The todo item ID", required: true },
    ],
    handler: async ({ id }) => {
      try {
        const res = await fetch(`${BACKEND_API}/todos/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete todo");
        await fetchTodos();
        return `Deleted todo #${id}`;
      } catch (err) {
        console.error("❌ Error deleting todo:", err);
        return `Failed to delete todo: ${err.message}`;
      }
    },
  });

  useCopilotAction({
    name: "clearCompleted",
    description: "Remove all completed todo items",
    parameters: [],
    handler: async () => {
      try {
        const count = todos.filter(t => t.done).length;
        for (const todo of todos) {
          if (todo.done) {
            await fetch(`${BACKEND_API}/todos/${todo.id}`, { method: "DELETE" });
          }
        }
        await fetchTodos();
        return `Cleared ${count} completed todo(s)`;
      } catch (err) {
        console.error("❌ Error clearing completed:", err);
        return `Failed to clear completed: ${err.message}`;
      }
    },
  });

  useCopilotAction({
    name: "setPriority",
    description: "Change the priority of a todo item",
    parameters: [
      { name: "id", type: "number", description: "The todo item ID", required: true },
      { name: "priority", type: "string", description: "low, medium, or high", required: true },
    ],
    handler: async ({ id, priority }) => {
      try {
        const res = await fetch(`${BACKEND_API}/todos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority }),
        });
        if (!res.ok) throw new Error("Failed to update priority");
        await fetchTodos();
        return `Set todo #${id} priority to ${priority}`;
      } catch (err) {
        console.error("❌ Error updating priority:", err);
        return `Failed to update priority: ${err.message}`;
      }
    },
  });

  // ── Local handlers ─────────────────────────────────────────────────────────
  const addTodo = useCallback(async () => {
    if (!newTodo.trim()) return;
    try {
      const id = Date.now();
      const res = await fetch(`${BACKEND_API}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text: newTodo.trim(), done: false, priority: "medium" }),
      });
      if (!res.ok) throw new Error("Failed to add todo");
      setNewTodo("");
      await fetchTodos();
    } catch (err) {
      console.error("❌ Error adding todo:", err);
    }
  }, [newTodo]);

  const toggleTodo = useCallback(async (id) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      const res = await fetch(`${BACKEND_API}/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !todo.done }),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      await fetchTodos();
    } catch (err) {
      console.error("❌ Error updating todo:", err);
    }
  }, [todos]);

  const deleteTodo = useCallback(async (id) => {
    try {
      const res = await fetch(`${BACKEND_API}/todos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete todo");
      await fetchTodos();
    } catch (err) {
      console.error("❌ Error deleting todo:", err);
    }
  }, []);

  const filtered = todos.filter(t =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );

  const priorities = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
  const remaining = todos.filter(t => !t.done).length;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <span className="logo-icon">✦</span>
            <h1 className="app-title">TaskFlow</h1>
          </div>
          <div className="header-stats">
            <span className="stat-badge">{remaining} remaining</span>
            <span className="stat-badge done">{todos.length - remaining} done</span>
          </div>
        </div>
        <p className="header-hint">
          {CLOUD_KEY ? "☁️ CopilotKit Cloud" : `🖥️ Runtime: ${RUNTIME_URL}`}
        </p>
      </header>

      <main className="main-content">
        <div className="input-section">
          <input
            className="todo-input"
            placeholder="What needs to be done?"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTodo()}
            disabled={loading}
          />
          <button className="add-btn" onClick={addTodo} disabled={loading}><span>+</span></button>
        </div>

        {loading && <div style={{ padding: "1rem", textAlign: "center", color: "#999" }}>⏳ Loading todos...</div>}

        <div className="filter-bar">
          {["all", "active", "done"].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <ul className="todo-list">
          {filtered.length === 0 && (
            <li className="empty-state">
              <span>✨</span>
              <p>Nothing here — ask the AI assistant!</p>
            </li>
          )}
          {filtered.map(todo => (
            <li key={todo.id} className={`todo-item ${todo.done ? "done" : ""}`}>
              <button className="check-btn" onClick={() => toggleTodo(todo.id)}>
                {todo.done ? "✓" : ""}
              </button>
              <span className="todo-text">{todo.text}</span>
              <span className="priority-dot" style={{ background: priorities[todo.priority] }} title={`${todo.priority} priority`} />
              <span className="todo-id">#{todo.id}</span>
              <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>×</button>
            </li>
          ))}
        </ul>

        {todos.some(t => t.done) && (
          <div className="footer-actions">
            <button className="clear-btn" onClick={() => setTodos(p => p.filter(t => !t.done))}>
              Clear completed
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <CopilotKit {...copilotProps}>
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: "TaskFlow AI",
          initial: "Hi! I can help manage your tasks.\n\nTry:\n• *\"Add buy milk with high priority\"*\n• *\"Complete task #1\"*\n• *\"Delete task #2\"*\n• *\"What are my todos?\"*\n• *\"Clear all completed tasks\"*",
        }}
        clickOutsideToClose={false}
      >
        <TodoApp />
      </CopilotSidebar>
    </CopilotKit>
  );
}
