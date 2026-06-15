// =========================================================
// MYWORK CORE v4 — CLEAN ENTERPRISE BUILD
// PART 1/10 — FOUNDATION LAYER
// =========================================================


// =========================================================
// 1. SUPABASE INIT (SECURE BASE CONFIG)
// =========================================================

const SUPABASE_URL = "https://scefyffuqtpavzpolrvj.supabase.co";

const SUPABASE_KEY = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

// safe guard (prevent crash if supabase not loaded)
if (typeof supabase === "undefined") {
  console.error("❌ Supabase library not loaded");
}

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// =========================================================
// 2. APP METADATA (VERSION CONTROL SYSTEM)
// =========================================================

const APP = Object.freeze({
  name: "MyWork SaaS Core",
  version: "4.0.0",
  build: new Date().toISOString(),
  mode: "enterprise-clean",
  author: "Bantunala"
});


// =========================================================
// 3. GLOBAL STATE STORE (SINGLE SOURCE OF TRUTH)
// =========================================================

const state = {
  user: null,

  tasks: [],
  files: [],
  broadcasts: [],
  notifications: [],
  activityLogs: [],
  excelData: [],

  ui: {
    page: "dashboard",
    ready: false,
    loading: false
  },

  realtime: {
    taskChannel: null,
    presenceChannel: null,
    initialized: false
  },

  charts: {
    donut: null,
    bar: null
  },

  cert: {
    elements: [],
    selected: null
  }
};


// =========================================================
// 4. SAFE DOM HELPER ENGINE
// =========================================================

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.innerText = value;
}

function setHTML(id, value) {
  const el = $(id);
  if (el) el.innerHTML = value;
}

function show(el) {
  if (el) el.classList.remove("hidden");
}

function hide(el) {
  if (el) el.classList.add("hidden");
}


// =========================================================
// 5. UI LOADER SYSTEM
// =========================================================

function setLoading(value) {
  state.ui.loading = value;

  const overlay = $("loadingOverlay");
  if (!overlay) return;

  if (value) show(overlay);
  else hide(overlay);
}


// =========================================================
// 6. TOAST ENGINE (GLOBAL NOTIFICATION SYSTEM)
// =========================================================

let toastTimer = null;

function toast(message, type = "info") {
  let el = $("toast");

  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }

  el.innerText = message;

  el.style.position = "fixed";
  el.style.bottom = "20px";
  el.style.right = "20px";
  el.style.padding = "10px 14px";
  el.style.borderRadius = "10px";
  el.style.zIndex = "99999";
  el.style.fontSize = "13px";
  el.style.backdropFilter = "blur(10px)";
  el.style.transition = "0.3s";

  // theme colors
  const colors = {
    info: "#38bdf8",
    success: "#10b981",
    error: "#ef4444"
  };

  el.style.border = `1px solid ${colors[type] || "#38bdf8"}`;
  el.style.color = "#fff";
  el.style.background = "rgba(15,23,42,0.9)";

  el.style.opacity = "1";

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = "0";
  }, 2500);
}


// =========================================================
// 7. ACTIVITY LOGGER CORE
// =========================================================

function logActivity(text) {
  state.activityLogs.unshift({
    text,
    time: new Date().toLocaleString("id-ID")
  });
}


// =========================================================
// 8. AUTH STATE LISTENER (SUPABASE CORE)
// =========================================================

client.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session) {
    state.user = session.user;
    bootstrapApp();
  }

  if (event === "SIGNED_OUT") {
    state.user = null;
    shutdownApp();
  }
});


// =========================================================
// 9. SESSION RESTORE (AUTO LOGIN)
// =========================================================

async function restoreSession() {
  try {
    const { data } = await client.auth.getSession();

    if (data.session) {
      state.user = data.session.user;
      bootstrapApp();
    } else {
      shutdownApp();
    }
  } catch (err) {
    console.error("SESSION ERROR:", err);
    shutdownApp();
  }
}


// =========================================================
// 10. APP BOOTSTRAP CORE
// =========================================================

function bootstrapApp() {
  const authBox = $("authBox");
  const appBox = $("app");

  if (authBox) hide(authBox);
  if (appBox) show(appBox);

  state.ui.ready = true;
  state.ui.page = "dashboard";

  logActivity("SYSTEM: LOGIN SUCCESS");
  toast("Welcome " + (state.user?.email || "User"), "success");

  // next modules will handle full loading
}


// =========================================================
// 11. APP SHUTDOWN CORE
// =========================================================

function shutdownApp() {
  const authBox = $("authBox");
  const appBox = $("app");

  if (authBox) show(authBox);
  if (appBox) hide(appBox);

  state.ui.ready = false;
}
// =========================================================
// MYWORK CORE v4 — PART 2/10
// TASK SYSTEM CORE (OPTIMIZED)
// =========================================================


// =========================================================
// 1. LOAD TASKS (SERVER SYNC ONLY)
// =========================================================

async function loadTasks() {
  if (!state.ui.ready) return;

  try {
    setLoading(true);

    const { data, error } = await client
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    state.tasks = data || [];

    renderTasks();        // UI render only
    updateTaskStats();    // KPI update only
    renderKanban();       // board update only
    renderCharts();       // analytics update

  } catch (err) {
    console.error("LOAD TASK ERROR:", err);
    toast("Gagal load task", "error");
  } finally {
    setLoading(false);
  }
}


// =========================================================
// 2. ADD TASK (OPTIMISTIC INSERT)
// =========================================================

async function addTask() {
  const input = $("taskInput");
  const title = input?.value?.trim();

  if (!title) {
    toast("Task tidak boleh kosong", "error");
    return;
  }

  const tempTask = {
    id: Date.now(),
    title,
    done: false,
    status: "todo",
    created_by: state.user?.email || "system"
  };

  // OPTIMISTIC UI UPDATE
  state.tasks.unshift(tempTask);
  renderTasks();
  updateTaskStats();
  renderKanban();

  input.value = "";

  try {
    const { data, error } = await client
      .from("tasks")
      .insert([{
        title,
        done: false,
        status: "todo",
        created_by: state.user?.email || "system",
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // replace temp id with real id
    if (data?.[0]) {
      const index = state.tasks.findIndex(t => t.id === tempTask.id);
      if (index !== -1) state.tasks[index] = data[0];
    }

    toast("Task berhasil ditambahkan", "success");
    logActivity("ADD TASK: " + title);

    renderKanban();

  } catch (err) {
    console.error(err);
    toast("Gagal menambah task", "error");

    // rollback
    state.tasks = state.tasks.filter(t => t.id !== tempTask.id);
    renderKanban();
  }
}


// =========================================================
// 3. DELETE TASK (SOFT UI + SERVER SYNC)
// =========================================================

async function deleteTask(id) {
  if (!confirm("Hapus task ini?")) return;

  const backup = [...state.tasks];

  // optimistic remove
  state.tasks = state.tasks.filter(t => t.id !== id);
  renderTasks();
  updateTaskStats();
  renderKanban();

  try {
    const { error } = await client
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;

    toast("Task dihapus", "success");
    logActivity("DELETE TASK #" + id);

  } catch (err) {
    console.error(err);
    toast("Gagal hapus task", "error");

    // rollback
    state.tasks = backup;
    renderKanban();
  }
}


// =========================================================
// 4. TOGGLE DONE STATUS (FAST LOCAL UPDATE)
// =========================================================

async function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const old = task.done;
  task.done = !old;

  renderTasks();
  updateTaskStats();

  try {
    const { error } = await client
      .from("tasks")
      .update({ done: task.done })
      .eq("id", id);

    if (error) throw error;

    logActivity("TOGGLE TASK #" + id);

  } catch (err) {
    console.error(err);

    // rollback
    task.done = old;
    renderTasks();
  }
}


// =========================================================
// 5. UPDATE TASK STATUS (KANBAN MOVE)
// =========================================================

async function updateTaskStatus(id, status) {
  const task = state.tasks.find(t => t.id == id);
  if (!task) return;

  const oldStatus = task.status;
  task.status = status;

  renderKanban();

  try {
    const { error } = await client
      .from("tasks")
      .update({
        status,
        done: status === "done"
      })
      .eq("id", id);

    if (error) throw error;

    toast("Task dipindahkan", "success");
    logActivity(`MOVE TASK #${id} → ${status}`);

  } catch (err) {
    console.error(err);

    // rollback
    task.status = oldStatus;
    renderKanban();
  }
}


// =========================================================
// 6. TASK FILTER ENGINE (FAST SEARCH)
// =========================================================

function filterTasks(keyword) {
  const q = (keyword || "").toLowerCase();

  const cards = document.querySelectorAll(".kanban-card");

  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(q) ? "block" : "none";
  });
}


// =========================================================
// 7. SEARCH LISTENER (SCOPED)
// =========================================================

function initTaskSearch() {
  const input = $("taskSearch");
  if (!input) return;

  input.addEventListener("input", (e) => {
    filterTasks(e.target.value);
  });
}


// =========================================================
// 8. TASK STATS ENGINE (LIGHTWEIGHT KPI)
// =========================================================

function updateTaskStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const active = total - done;

  setText("taskCount", total);
  setText("doneCount", done);
  setText("activeCount", active);
}


// =========================================================
// 9. SAFE TASK GETTER (FUTURE USE)
// =========================================================

function getTasksByStatus(status) {
  return state.tasks.filter(t => t.status === status);
}


// =========================================================
// 10. INIT TASK SYSTEM HOOK
// =========================================================

function initTaskSystem() {
  initTaskSearch();
  loadTasks();
}
// =========================================================
// TASK CORE ENGINE (OPTIMIZED STATE FLOW)
// =========================================================

// CACHE SAFE HELPERS
function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

// =========================================================
// LOAD TASKS (OPTIMIZED + STATE FIRST)
// =========================================================

async function loadTasks() {
  try {
    showLoader();

    const { data, error } = await client
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("TASK LOAD ERROR:", error);
      showToast("Gagal load tasks");
      return;
    }

    // NORMALIZE DATA
    state.tasks = safeArray(data).map(t => ({
      id: t.id,
      title: t.title || "",
      done: !!t.done,
      status: t.status || "todo",
      priority: t.priority || "normal",
      created_by: t.created_by || "system",
      created_at: t.created_at
    }));

    // ONE TIME RENDER FLOW
    renderAllTaskUI();

  } catch (err) {
    console.error("LOAD TASK EXCEPTION:", err);
  } finally {
    hideLoader();
  }
}

// =========================================================
// SINGLE RENDER PIPELINE (PERFORMANCE BOOST)
// =========================================================

function renderAllTaskUI() {
  updateDashboard();
  renderTaskCounters();
  renderKanban();
  renderChart();
}

// =========================================================
// ADD TASK (OPTIMIZED + LOCAL FIRST UPDATE)
// =========================================================

async function addTask() {
  const input = document.getElementById("taskInput");
  const title = input?.value?.trim();

  if (!title) {
    showToast("Task tidak boleh kosong");
    return;
  }

  // optimistic UI (langsung update state)
  const tempTask = {
    id: Date.now(),
    title,
    done: false,
    status: "todo",
    priority: "normal",
    created_by: state.user?.email || "system",
    created_at: new Date().toISOString(),
    _temp: true
  };

  state.tasks.unshift(tempTask);
  renderAllTaskUI();

  input.value = "";

  try {
    const { error } = await client
      .from("tasks")
      .insert([{
        title,
        done: false,
        status: "todo",
        priority: "normal",
        created_by: state.user?.email || "system",
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error(error);
      showToast("Gagal tambah task");

      // rollback
      state.tasks = state.tasks.filter(t => t.id !== tempTask.id);
      renderAllTaskUI();
      return;
    }

    showToast("Task berhasil ditambahkan");
    addActivity("ADD TASK: " + title);

    // sync ulang ringan (tanpa full reload kalau nanti kita upgrade realtime full)
    loadTasks();

  } catch (err) {
    console.error("ADD TASK ERROR:", err);
  }
}

// =========================================================
// DELETE TASK (OPTIMIZED REMOVE FIRST)
// =========================================================

async function deleteTask(id) {
  if (!confirm("Hapus task ini?")) return;

  const backup = [...state.tasks];
  state.tasks = state.tasks.filter(t => t.id !== id);
  renderAllTaskUI();

  try {
    const { error } = await client
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      showToast("Gagal hapus task");

      // rollback
      state.tasks = backup;
      renderAllTaskUI();
      return;
    }

    addActivity("DELETE TASK #" + id);
    showToast("Task dihapus");

  } catch (err) {
    console.error(err);
  }
}

// =========================================================
// TOGGLE DONE (SMART UPDATE)
// =========================================================

async function toggleTask(id, current) {
  const task = state.tasks.find(t => t.id == id);
  if (!task) return;

  task.done = !current;
  renderAllTaskUI();

  try {
    const { error } = await client
      .from("tasks")
      .update({ done: !current })
      .eq("id", id);

    if (error) {
      console.error(error);
      showToast("Update gagal");

      // revert
      task.done = current;
      renderAllTaskUI();
      return;
    }

    addActivity("TOGGLE TASK #" + id);

  } catch (err) {
    console.error(err);
  }
}

// =========================================================
// STATUS UPDATE (KANBAN MOVE ENGINE)
// =========================================================

async function updateTaskStatus(taskId, status) {
  const task = state.tasks.find(t => t.id == taskId);
  if (!task) return;

  const oldStatus = task.status;

  task.status = status;
  task.done = status === "done";
  renderAllTaskUI();

  try {
    const { error } = await client
      .from("tasks")
      .update({
        status,
        done: status === "done"
      })
      .eq("id", taskId);

    if (error) {
      console.error(error);
      showToast("Gagal update status");

      // rollback
      task.status = oldStatus;
      task.done = oldStatus === "done";
      renderAllTaskUI();
      return;
    }

    addActivity(`MOVE TASK #${taskId} → ${status}`);

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
  }
}

// =========================================================
// FILTER ENGINE (UPGRADED FAST SEARCH)
// =========================================================

function filterTasks() {
  const q = (document.getElementById("taskSearch")?.value || "")
    .toLowerCase();

  const cards = document.querySelectorAll(".kanban-card");

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? "block" : "none";
  });
}

// =========================================================
// LIVE SEARCH LISTENER
// =========================================================

document.addEventListener("input", (e) => {
  if (e.target.id === "taskSearch") {
    filterTasks();
  }
});

// =========================================================
// KPI CALCULATOR (FAST PURE FUNCTION)
// =========================================================

function calculateTaskStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const active = total - done;

  return { total, done, active };
}

// =========================================================
// DASHBOARD UPDATE (CLEAN)
// =========================================================

function updateDashboard() {
  const { total, done, active } = calculateTaskStats();

  setText("taskCount", total);
  setText("doneCount", done);
  setText("activeCount", active);
}

// =========================================================
// KANBAN COUNTERS
// =========================================================

function renderTaskCounters() {
  setText("todoCount", state.tasks.filter(t => t.status === "todo").length);
  setText("doingCount", state.tasks.filter(t => t.status === "doing").length);
  setText("doneTaskCount", state.tasks.filter(t => t.status === "done").length);
}

// =========================================================
// KANBAN SAFE CACHE
// =========================================================

let kanbanInitialized = false;
let sortableInstances = {};

// =========================================================
// RENDER KANBAN (OPTIMIZED - NO FULL REINIT LOOP)
// =========================================================

function renderKanban() {
  const todo = document.getElementById("todoList");
  const doing = document.getElementById("doingList");
  const done = document.getElementById("doneList");

  if (!todo || !doing || !done) return;

  // CLEAR ONLY ONCE (STABLE DOM FLOW)
  todo.innerHTML = "";
  doing.innerHTML = "";
  done.innerHTML = "";

  const fragmentTodo = document.createDocumentFragment();
  const fragmentDoing = document.createDocumentFragment();
  const fragmentDone = document.createDocumentFragment();

  for (const task of state.tasks) {

    const card = createTaskCard(task);

    if (task.status === "todo") {
      fragmentTodo.appendChild(card);
    } else if (task.status === "doing") {
      fragmentDoing.appendChild(card);
    } else {
      fragmentDone.appendChild(card);
    }
  }

  todo.appendChild(fragmentTodo);
  doing.appendChild(fragmentDoing);
  done.appendChild(fragmentDone);

  initDragSystem();
}

// =========================================================
// CREATE TASK CARD (REUSABLE COMPONENT)
// =========================================================

function createTaskCard(task) {
  const card = document.createElement("div");

  card.className = "kanban-card";
  card.dataset.id = task.id;

  card.innerHTML = `
    <div class="kanban-title">
      ${escapeHtml(task.title)}
    </div>

    <div class="kanban-footer">
      <small>${task.created_by || ""}</small>

      <div class="kanban-actions">
        <button onclick="toggleTask(${task.id}, ${task.done})">✔</button>
        <button onclick="deleteTask(${task.id})">✖</button>
      </div>
    </div>
  `;

  return card;
}

// =========================================================
// HTML ESCAPE (SECURITY UPGRADE)
// =========================================================

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================================================
// DRAG SYSTEM INIT (NO DUPLICATE INSTANCE)
// =========================================================

function initDragSystem() {
  const lists = ["todoList", "doingList", "doneList"];

  for (const id of lists) {
    const el = document.getElementById(id);
    if (!el) continue;

    // DESTROY OLD INSTANCE FIRST (IMPORTANT FIX)
    if (sortableInstances[id]) {
      sortableInstances[id].destroy();
    }

    sortableInstances[id] = new Sortable(el, {
      group: "kanban",
      animation: 180,
      ghostClass: "dragging",

      onStart: (evt) => {
        evt.item.classList.add("drag-active");
      },

      onEnd: async (evt) => {
        evt.item.classList.remove("drag-active");

        const taskId = evt.item.dataset.id;

        const newStatus = resolveStatus(evt.to.id);

        // avoid unnecessary update
        const task = state.tasks.find(t => t.id == taskId);
        if (!task || task.status === newStatus) return;

        await updateTaskStatus(taskId, newStatus);
      }
    });
  }

  kanbanInitialized = true;
}

// =========================================================
// STATUS RESOLVER (SAFE MAPPING)
// =========================================================

function resolveStatus(listId) {
  switch (listId) {
    case "todoList": return "todo";
    case "doingList": return "doing";
    case "doneList": return "done";
    default: return "todo";
  }
}

// =========================================================
// SMART RE-RENDER CONTROL (ANTI LOOP)
// =========================================================

let kanbanRenderLock = false;

function safeRenderKanban() {
  if (kanbanRenderLock) return;

  kanbanRenderLock = true;

  requestAnimationFrame(() => {
    renderKanban();
    kanbanRenderLock = false;
  });
}

// =========================================================
// OPTIMIZED REFRESH HOOK
// =========================================================

// override dari part sebelumnya (IMPORTANT INTEGRATION)
function renderAllTaskUI() {
  updateDashboard();
  renderTaskCounters();
  safeRenderKanban();
  renderChart();
}

// =========================================================
// TASK UPDATE SYNC PATCH (INTEGRATION SAFE)
// =========================================================

function syncTaskToState(updatedTask) {
  const index = state.tasks.findIndex(t => t.id == updatedTask.id);

  if (index !== -1) {
    state.tasks[index] = {
      ...state.tasks[index],
      ...updatedTask
    };
  } else {
    state.tasks.unshift(updatedTask);
  }
}

// =========================================================
// BATCH DOM OPTIMIZATION FLAG
// =========================================================

let domBatchMode = false;

function enableBatchMode() {
  domBatchMode = true;
}

function disableBatchMode() {
  domBatchMode = false;
  renderAllTaskUI();
}

// =========================================================
// REALTIME STATE GUARDS
// =========================================================

let realtimeReady = false;
let lastTaskSync = 0;
const SYNC_COOLDOWN = 800; // ms anti spam reload

// =========================================================
// INIT REALTIME MASTER ENGINE
// =========================================================

function initRealtime() {
  if (realtimeReady) return;

  const channel = client.channel("tasks-realtime-v2");

  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks"
      },
      (payload) => {
        handleRealtimeTaskEvent(payload);
      }
    )
    .subscribe((status) => {
      updateConnectionStatus(status);
    });

  state.realtime.taskChannel = channel;
  realtimeReady = true;
}

// =========================================================
// REALTIME EVENT HANDLER (SMART ROUTER)
// =========================================================

function handleRealtimeTaskEvent(payload) {
  const now = Date.now();

  // anti spam reload
  if (now - lastTaskSync < SYNC_COOLDOWN) return;
  lastTaskSync = now;

  const { eventType, new: newData, old: oldData } = payload;

  switch (eventType) {

    case "INSERT":
      handleTaskInsert(newData);
      break;

    case "UPDATE":
      handleTaskUpdate(newData);
      break;

    case "DELETE":
      handleTaskDelete(oldData);
      break;

    default:
      loadTasks(); // fallback aman
  }

  addNotification("Task update realtime");
}

// =========================================================
// INSERT HANDLER (NO FULL RELOAD)
// =========================================================

function handleTaskInsert(task) {
  syncTaskToState(task);
  renderAllTaskUI();
}

// =========================================================
// UPDATE HANDLER (SMART MERGE)
// =========================================================

function handleTaskUpdate(task) {
  syncTaskToState(task);
  renderAllTaskUI();
}

// =========================================================
// DELETE HANDLER (FAST REMOVE)
// =========================================================

function handleTaskDelete(task) {
  state.tasks = state.tasks.filter(t => t.id !== task.id);
  renderAllTaskUI();
}

// =========================================================
// CONNECTION STATUS UI
// =========================================================

function updateConnectionStatus(status) {
  const el = document.getElementById("connectionStatus");
  if (!el) return;

  const map = {
    SUBSCRIBED: "🟢 Online",
    CHANNEL_ERROR: "🔴 Error",
    CLOSED: "⚫ Offline"
  };

  el.innerText = map[status] || "⚪ Connecting...";
}

// =========================================================
// PRESENCE ENGINE (FIXED + CLEAN STATE)
// =========================================================

let presenceChannel = null;
let presenceReady = false;

// =========================================================
// INIT PRESENCE SYSTEM
// =========================================================

function initPresence() {
  if (presenceReady) return;

  presenceChannel = client.channel("online-users-v2");

  presenceChannel
    .on("presence", { event: "sync" }, () => {
      const stateData = presenceChannel.presenceState();

      const users = Object.values(stateData)
        .flat()
        .map(u => ({
          email: u.email || "guest",
          time: u.login_time
        }));

      renderOnlineUsers(users);
      setText("onlineCount", users.length);
    })

    .on("presence", { event: "join" }, ({ newPresences }) => {
      addNotification("User joined");
    })

    .on("presence", { event: "leave" }, ({ leftPresences }) => {
      addNotification("User left");
    })

    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presenceChannel.track({
          email: state.user?.email || "guest",
          login_time: new Date().toISOString()
        });
      }
    });

  state.realtime.presenceChannel = presenceChannel;
  presenceReady = true;
}

// =========================================================
// BROADCAST ENGINE (ANTI DUPLICATE RENDER)
// =========================================================

function listenBroadcast() {
  const channel = client.channel("broadcast-live-v2");

  channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "broadcast"
      },
      (payload) => {
        handleBroadcast(payload.new);
      }
    )
    .subscribe();

  state.realtime.broadcastChannel = channel;
}

// =========================================================
// BROADCAST HANDLER (SMART PUSH)
// =========================================================

function handleBroadcast(data) {
  const box = document.getElementById("broadcastList");
  if (!box) return;

  const item = document.createElement("div");
  item.className = "broadcast-item";

  item.innerHTML = `
    📢 ${escapeHtml(data.message || "")}<br>
    <small>${data.sender || ""}</small>
  `;

  box.prepend(item);

  addNotification("New broadcast");
  showToast(data.message);
}

// =========================================================
// SAFE NOTIFICATION QUEUE (ANTI SPAM)
// =========================================================

let notificationQueue = [];
let notificationLock = false;

function addNotification(message) {
  notificationQueue.push({
    message,
    time: new Date().toLocaleString("id-ID")
  });

  flushNotifications();
}

// =========================================================
// NOTIFICATION FLUSHER (BATCH RENDER)
// =========================================================

function flushNotifications() {
  if (notificationLock) return;

  notificationLock = true;

  setTimeout(() => {
    state.notifications = [
      ...notificationQueue,
      ...state.notifications
    ];

    notificationQueue = [];
    renderNotifications();

    notificationLock = false;
  }, 300);
}

// =========================================================
// SAFE RECONNECT (OPTIONAL FUTURE PROOF)
// =========================================================

async function reconnectRealtime() {
  try {
    if (state.realtime.taskChannel) {
      await state.realtime.taskChannel.unsubscribe();
    }

    realtimeReady = false;
    initRealtime();

  } catch (err) {
    console.error("RECONNECT ERROR:", err);
  }
}

// =========================================================
// CHART STATE GUARD
// =========================================================

let chartLocked = false;

// =========================================================
// SAFE CHART DESTRUCTOR
// =========================================================

function destroyChart(chart) {
  try {
    if (chart && typeof chart.destroy === "function") {
      chart.destroy();
    }
  } catch (err) {
    console.error("CHART DESTROY ERROR:", err);
  }
}

// =========================================================
// CALCULATE CHART DATA (PURE FUNCTION)
// =========================================================

function getChartData() {
  const done = state.tasks.filter(t => t.done).length;
  const pending = state.tasks.length - done;

  const todo = state.tasks.filter(t => t.status === "todo").length;
  const doing = state.tasks.filter(t => t.status === "doing").length;

  return {
    donut: { done, pending },
    bar: {
      total: state.tasks.length,
      todo,
      doing,
      done
    }
  };
}

// =========================================================
// MAIN CHART RENDER PIPELINE
// =========================================================

function renderChart() {
  if (chartLocked) return;

  chartLocked = true;

  requestAnimationFrame(() => {
    try {
      const donutEl = document.getElementById("chartDonut");
      const barEl = document.getElementById("chartBar");

      if (!donutEl || !barEl) {
        chartLocked = false;
        return;
      }

      const data = getChartData();

      renderDonutChart(donutEl, data.donut);
      renderBarChart(barEl, data.bar);

    } catch (err) {
      console.error("CHART RENDER ERROR:", err);
    } finally {
      chartLocked = false;
    }
  });
}

// =========================================================
// DONUT CHART (SAFE RE-INIT)
// =========================================================

function renderDonutChart(ctx, data) {
  destroyChart(state.charts.donut);

  state.charts.donut = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Done", "Pending"],
      datasets: [{
        data: [data.done, data.pending],
        backgroundColor: [
          "rgba(16,185,129,0.8)",
          "rgba(56,189,248,0.8)"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      animation: {
        duration: 600
      },
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

// =========================================================
// BAR CHART (TASK DISTRIBUTION)
// =========================================================

function renderBarChart(ctx, data) {
  destroyChart(state.charts.bar);

  state.charts.bar = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Todo", "Doing", "Done"],
      datasets: [{
        label: "Tasks",
        data: [data.todo, data.doing, data.done],
        backgroundColor: [
          "rgba(239,68,68,0.7)",
          "rgba(56,189,248,0.7)",
          "rgba(16,185,129,0.7)"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 500
      },
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// =========================================================
// SMART CHART UPDATE (NO FULL RELOAD BURST)
// =========================================================

function updateChartsSmart() {
  // hanya update kalau UI sudah ready
  if (!state.ui.systemReady) return;

  renderChart();
}

// =========================================================
// THROTTLED CHART UPDATE (ANTI SPAM REALTIME)
// =========================================================

let chartUpdateTimer = null;

function scheduleChartUpdate() {
  if (chartUpdateTimer) clearTimeout(chartUpdateTimer);

  chartUpdateTimer = setTimeout(() => {
    updateChartsSmart();
  }, 250);
}

// =========================================================
// OVERRIDE SAFE INTEGRATION HOOK
// =========================================================

// dipakai oleh PART 3 / PART 5 realtime system
function renderAllTaskUI() {
  updateDashboard();
  renderTaskCounters();
  safeRenderKanban();
  scheduleChartUpdate();
}

// =========================================================
// CHART REFRESH MANUAL (FOR DEBUG / BUTTON)
// =========================================================

function refreshCharts() {
  renderChart();
  showToast("Charts refreshed");
}

// =========================================================
// MEMORY SAFE RESET (OPTIONAL DEBUG MODE)
// =========================================================

function resetCharts() {
  destroyChart(state.charts.donut);
  destroyChart(state.charts.bar);

  state.charts.donut = null;
  state.charts.bar = null;
}

// =========================================================
// AUTH STATE GUARD
// =========================================================

let authReady = false;

// =========================================================
// SESSION BOOTSTRAP (SAFE SINGLE SOURCE OF TRUTH)
// =========================================================

async function bootstrapAuth() {
  try {
    const { data: { session }, error } = await client.auth.getSession();

    if (error) {
      console.error("SESSION ERROR:", error);
      exitApp();
      return;
    }

    if (session?.user) {
      state.user = normalizeUser(session.user);
      enterApp();
    } else {
      state.user = null;
      exitApp();
    }

  } catch (err) {
    console.error("AUTH BOOT ERROR:", err);
    exitApp();
  } finally {
    authReady = true;
  }
}

// =========================================================
// USER NORMALIZER (ROLE READY STRUCTURE)
// =========================================================

function normalizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
    whatsapp: user.user_metadata?.whatsapp || "",
    institution: user.user_metadata?.institution || "",
    avatar: user.user_metadata?.avatar || null,

    // DEFAULT ROLE SYSTEM (READY FOR SUPABASE EXTENSION)
    role: user.user_metadata?.role || "user",

    created_at: user.created_at
  };
}

// =========================================================
// AUTH STATE LISTENER (CLEAN + NO DUPLICATE CALL)
// =========================================================

client.auth.onAuthStateChange((event, session) => {

  if (!authReady) return;

  if (event === "SIGNED_IN" && session?.user) {
    state.user = normalizeUser(session.user);
    enterApp();
    showToast("Login berhasil");
  }

  if (event === "SIGNED_OUT") {
    state.user = null;
    exitApp();
    showToast("Logout berhasil");
  }

});

// =========================================================
// ENTER APP (SECURE GATE)
// =========================================================

function enterApp() {
  if (!state.user) return;

  const authBox = document.getElementById("authBox");
  const appBox = document.getElementById("app");

  if (authBox) authBox.style.display = "none";
  if (appBox) appBox.style.display = "flex";

  state.ui.systemReady = true;

  // ROUTE DEFAULT
  openPage("dashboard");

  // SAFE LOADERS
  loadTasks();
  loadFiles();
  loadBroadcastHistory();
  loadProfile();

  initRealtime();
  initPresence();
  listenBroadcast();

  addActivity("LOGIN: " + state.user.email);
}

// =========================================================
// EXIT APP (FULL CLEAN STATE RESET)
// =========================================================

function exitApp() {
  const authBox = document.getElementById("authBox");
  const appBox = document.getElementById("app");

  if (authBox) authBox.style.display = "flex";
  if (appBox) appBox.style.display = "none";

  state.user = null;
  state.ui.systemReady = false;

  // CLEAN UI STATE
  state.tasks = [];
  state.notifications = [];
  state.activityLogs = [];
}

// =========================================================
// LOGIN (CLEAN SINGLE VERSION - FIX DUPLICATE ISSUE)
// =========================================================

async function login() {
  const email = document.getElementById("loginEmail")?.value?.trim();
  const password = document.getElementById("loginPassword")?.value?.trim();

  if (!email || !password) {
    showToast("Email dan password wajib diisi");
    return;
  }

  try {
    const { error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showToast(error.message);
      return;
    }

  } catch (err) {
    console.error("LOGIN ERROR:", err);
  }
}

// =========================================================
// REGISTER (CLEAN + METADATA STRUCTURE)
// =========================================================

async function registerUser() {
  const name = document.getElementById("regName")?.value?.trim();
  const email = document.getElementById("regEmail")?.value?.trim();
  const whatsapp = document.getElementById("regWhatsapp")?.value?.trim();
  const password = document.getElementById("regPassword")?.value?.trim();

  if (!name || !email || !whatsapp || !password) {
    showToast("Semua field wajib diisi");
    return;
  }

  try {
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          whatsapp,
          role: "user"
        }
      }
    });

    if (error) {
      showToast(error.message);
      return;
    }

    showToast("Registrasi berhasil, cek email");

  } catch (err) {
    console.error("REGISTER ERROR:", err);
  }
}

// =========================================================
// LOGOUT (SAFE CLEAN STATE)
// =========================================================

async function logout() {
  try {
    const { error } = await client.auth.signOut();

    if (error) {
      showToast(error.message);
      return;
    }

    state.user = null;
    exitApp();

  } catch (err) {
    console.error("LOGOUT ERROR:", err);
  }
}

// =========================================================
// ROLE CHECK SYSTEM (FOR FUTURE ADMIN PANEL)
// =========================================================

function hasRole(role) {
  return state.user?.role === role;
}

function isAdmin() {
  return hasRole("admin");
}

// =========================================================
// PAGE GUARD SYSTEM (SECURITY LAYER)
// =========================================================

function requireAuth() {
  if (!state.user) {
    showToast("Silakan login terlebih dahulu");
    exitApp();
    return false;
  }
  return true;
}

// =========================================================
// ADMIN GUARD (FUTURE FEATURE)
// =========================================================

function requireAdmin() {
  if (!requireAuth()) return false;

  if (!isAdmin()) {
    showToast("Akses ditolak (admin only)");
    return false;
  }

  return true;
}

// =========================================================
// STORAGE STATE CACHE
// =========================================================

state.files = [];
let fileRenderLock = false;

// =========================================================
// FILE VALIDATION (SECURITY LAYER)
// =========================================================

function validateFile(file) {
  if (!file) return { ok: false, msg: "File kosong" };

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (file.size > maxSize) {
    return { ok: false, msg: "File terlalu besar (max 10MB)" };
  }

  const bannedTypes = [
    "application/x-msdownload",
    "application/x-sh",
    "application/x-bat"
  ];

  if (bannedTypes.includes(file.type)) {
    return { ok: false, msg: "Tipe file tidak diizinkan" };
  }

  return { ok: true };
}

// =========================================================
// UPLOAD FILE (OPTIMIZED + SAFE PATHING)
// =========================================================

async function uploadFile() {
  const file = document.getElementById("fileUpload")?.files?.[0];
  if (!file) {
    showToast("Pilih file terlebih dahulu");
    return;
  }

  const check = validateFile(file);
  if (!check.ok) {
    showToast(check.msg);
    return;
  }

  const safeName = file.name.replace(/\s/g, "_");
  const path = `${state.user?.id || "guest"}/${Date.now()}_${safeName}`;

  try {
    const { error } = await client.storage
      .from("files")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      showToast(error.message);
      return;
    }

    showToast("Upload berhasil");

    addActivity("UPLOAD FILE: " + file.name);

    loadFiles();

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
  }
}

// =========================================================
// LOAD FILES (OPTIMIZED LIST + CACHE SAFE)
// =========================================================

async function loadFiles() {
  if (fileRenderLock) return;
  fileRenderLock = true;

  const box = document.getElementById("fileList");
  if (!box) return;

  try {
    const { data, error } = await client.storage
      .from("files")
      .list(state.user?.id || "", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      });

    if (error) {
      console.error(error);
      return;
    }

    state.files = (data || []).map(f => ({
      name: f.name,
      id: f.id,
      created_at: f.created_at
    }));

    renderFiles();

  } catch (err) {
    console.error("LOAD FILE ERROR:", err);
  } finally {
    fileRenderLock = false;
  }
}

// =========================================================
// RENDER FILE LIST (FAST DOM UPDATE)
// =========================================================

function renderFiles() {
  const box = document.getElementById("fileList");
  if (!box) return;

  box.innerHTML = "";

  if (!state.files.length) {
    box.innerHTML = "<p>No files</p>";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const file of state.files) {
    const el = document.createElement("div");
    el.className = "file-card";

    el.innerHTML = `
      📄 ${escapeHtml(file.name)}
      <div>
        <button onclick="downloadFile('${file.name}')">⬇</button>
        <button onclick="deleteFile('${file.name}')">🗑</button>
      </div>
    `;

    fragment.appendChild(el);
  }

  box.appendChild(fragment);
}

// =========================================================
// DOWNLOAD FILE (SIGNED URL SAFE)
// =========================================================

async function downloadFile(name) {
  try {
    const { data, error } = await client.storage
      .from("files")
      .createSignedUrl(name, 60);

    if (error) {
      showToast("Download gagal");
      return;
    }

    window.open(data.signedUrl, "_blank");

  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
  }
}

// =========================================================
// DELETE FILE (STATE SYNC + OPTIMIZED REMOVE)
// =========================================================

async function deleteFile(name) {
  if (!confirm("Hapus file ini?")) return;

  const backup = [...state.files];
  state.files = state.files.filter(f => f.name !== name);
  renderFiles();

  try {
    const { error } = await client.storage
      .from("files")
      .remove([name]);

    if (error) {
      showToast(error.message);

      state.files = backup;
      renderFiles();
      return;
    }

    showToast("File deleted");

  } catch (err) {
    console.error("DELETE FILE ERROR:", err);
  }
}

// =========================================================
// AVATAR UPLOAD (USER PROFILE SAFE UPDATE)
// =========================================================

async function uploadAvatar(fileInputId = "avatarInput") {
  const file = document.getElementById(fileInputId)?.files?.[0];
  if (!file) return;

  const check = validateFile(file);
  if (!check.ok) {
    showToast(check.msg);
    return;
  }

  const path = `avatars/${state.user.id}_${Date.now()}_${file.name}`;

  try {
    const { error } = await client.storage
      .from("files")
      .upload(path, file, { upsert: true });

    if (error) {
      showToast(error.message);
      return;
    }

    const { data } = client.storage
      .from("files")
      .getPublicUrl(path);

    await client.auth.updateUser({
      data: {
        avatar: data.publicUrl
      }
    });

    showToast("Avatar updated");

    const { data: userData } = await client.auth.getUser();
    state.user = normalizeUser(userData.user);

    loadProfile();

  } catch (err) {
    console.error("AVATAR ERROR:", err);
  }
}

// =========================================================
// FILE SEARCH FILTER (OPTIONAL FUTURE UI)
// =========================================================

function filterFiles(keyword) {
  const q = (keyword || "").toLowerCase();

  document.querySelectorAll(".file-card").forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? "flex" : "none";
  });
}
/* =========================================================
   MYWORK ULTRA ENTERPRISE SCRIPT v2
   PART 9/10 — REALTIME + NOTIFICATION ENGINE + SYNC CORE
========================================================= */


/* ================= GLOBAL EVENT BUS ================= */
const EventBus = {
  events: {},

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  },

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
};


/* ================= TOAST SYSTEM ADVANCED ================= */
function showToast(message, type = "info", timeout = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = message;

  toast.className = "";
  toast.classList.add("show", type);

  setTimeout(() => {
    toast.classList.remove("show");
  }, timeout);
}


/* ================= NOTIFICATION ENGINE ================= */
const NotificationSystem = {
  list: [],

  push(title, message, level = "info") {
    const notif = {
      id: Date.now(),
      title,
      message,
      level,
      time: new Date().toISOString()
    };

    this.list.unshift(notif);
    this.render();

    EventBus.emit("notification:new", notif);
    showToast(title + " - " + message, level);
  },

  render() {
    const panel = document.querySelector(".notification-panel");
    if (!panel) return;

    panel.innerHTML = this.list.slice(0, 20).map(n => `
      <div class="notification-item ${n.level}">
        <strong>${n.title}</strong>
        <p>${n.message}</p>
        <small>${new Date(n.time).toLocaleTimeString()}</small>
      </div>
    `).join("");
  },

  clear() {
    this.list = [];
    this.render();
  }
};


/* ================= REALTIME SUPABASE LISTENER ================= */
function initRealtime(db) {
  if (!db) return;

  // TASKS REALTIME
  db.channel("tasks-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, payload => {
      console.log("TASK UPDATE:", payload);

      EventBus.emit("tasks:update", payload);

      NotificationSystem.push(
        "Task Update",
        "Data task berubah secara realtime",
        "info"
      );
    })
    .subscribe();


  // BROADCAST REALTIME
  db.channel("broadcast-channel")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcast" }, payload => {

      const msg = payload.new;
      EventBus.emit("broadcast:new", msg);

      NotificationSystem.push(
        "Broadcast Baru",
        msg.message || "Pesan baru masuk",
        "success"
      );
    })
    .subscribe();
}


/* ================= OFFLINE QUEUE SYSTEM ================= */
const OfflineQueue = {
  queue: [],

  add(action) {
    this.queue.push(action);
    localStorage.setItem("offlineQueue", JSON.stringify(this.queue));
  },

  load() {
    const data = localStorage.getItem("offlineQueue");
    this.queue = data ? JSON.parse(data) : [];
  },

  async sync(db) {
    if (!navigator.onLine) return;

    for (let action of this.queue) {
      try {
        if (action.type === "CREATE_TASK") {
          await db.from("tasks").insert(action.payload);
        }

        if (action.type === "UPDATE_TASK") {
          await db.from("tasks")
            .update(action.payload.data)
            .eq("id", action.payload.id);
        }

      } catch (err) {
        console.error("SYNC ERROR:", err);
      }
    }

    this.queue = [];
    localStorage.removeItem("offlineQueue");
  }
};


/* ================= AUTO SYNC MANAGER ================= */
const SyncManager = {
  db: null,

  init(db) {
    this.db = db;

    OfflineQueue.load();
    OfflineQueue.sync(db);

    window.addEventListener("online", () => {
      NotificationSystem.push("Online", "Sinkronisasi dimulai", "success");
      OfflineQueue.sync(db);
    });

    window.addEventListener("offline", () => {
      NotificationSystem.push("Offline", "Mode offline aktif", "warning");
    });
  }
};


/* ================= PERFORMANCE LOGGER ================= */
const Perf = {
  marks: {},

  start(label) {
    this.marks[label] = performance.now();
  },

  end(label) {
    if (!this.marks[label]) return;

    const duration = performance.now() - this.marks[label];
    console.log(`⏱ ${label}: ${duration.toFixed(2)}ms`);

    delete this.marks[label];
    return duration;
  }
};


/* ================= GLOBAL ERROR HANDLER ================= */
window.addEventListener("error", (e) => {
  console.error("GLOBAL ERROR:", e.message);

  NotificationSystem.push(
    "System Error",
    e.message,
    "error"
  );
});


/* ================= APP STATE OBSERVER ================= */
const AppState = {
  state: {},

  set(key, value) {
    this.state[key] = value;
    EventBus.emit("state:change", { key, value });
  },

  get(key) {
    return this.state[key];
  }
};


/* ================= AUTO INIT HOOK ================= */
function initCoreSystem(db) {
  console.log("🚀 Initializing MyWork Core System...");

  SyncManager.init(db);

  NotificationSystem.push(
    "System Ready",
    "Core engine aktif",
    "success"
  );
}
/* =========================================================
   MYWORK ULTRA ENTERPRISE SCRIPT v2
   PART 10/10 — FINAL CORE ENGINE (PRODUCTION READY)
========================================================= */


/* ================= SUPABASE WRAPPER CORE ================= */
const DB = {
  client: null,

  init(client) {
    this.client = client;
  },

  from(table) {
    return this.client.from(table);
  },

  async select(table, query = "*") {
    const { data, error } = await this.client.from(table).select(query);
    if (error) throw error;
    return data;
  },

  async insert(table, payload) {
    const { data, error } = await this.client.from(table).insert(payload);
    if (error) throw error;
    return data;
  },

  async update(table, payload, match) {
    const { data, error } = await this.client.from(table).update(payload).match(match);
    if (error) throw error;
    return data;
  },

  async delete(table, match) {
    const { data, error } = await this.client.from(table).delete().match(match);
    if (error) throw error;
    return data;
  }
};


/* ================= AUTH SYSTEM (FULL) ================= */
const Auth = {
  user: null,

  async login(email, password) {
    const { data, error } = await DB.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      NotificationSystem.push("Login Failed", error.message, "error");
      return null;
    }

    this.user = data.user;
    AppState.set("user", this.user);

    NotificationSystem.push("Login Success", "Selamat datang " + email, "success");
    return data.user;
  },

  async register(email, password) {
    const { data, error } = await DB.client.auth.signUp({
      email,
      password
    });

    if (error) {
      NotificationSystem.push("Register Failed", error.message, "error");
      return null;
    }

    NotificationSystem.push("Register Success", "Akun berhasil dibuat", "success");
    return data.user;
  },

  async logout() {
    await DB.client.auth.signOut();
    this.user = null;
    AppState.set("user", null);

    NotificationSystem.push("Logout", "Anda telah keluar", "info");
  },

  async getSession() {
    const { data } = await DB.client.auth.getSession();
    this.user = data.session?.user || null;
    return this.user;
  }
};


/* ================= TASK ENGINE ================= */
const TaskEngine = {
  tasks: [],

  async load() {
    const data = await DB.select("tasks");
    this.tasks = data || [];

    EventBus.emit("tasks:loaded", this.tasks);
    return this.tasks;
  },

  async create(task) {
    const data = await DB.insert("tasks", {
      title: task.title,
      status: task.status || "todo",
      created_at: new Date().toISOString(),
      user_id: Auth.user?.id
    });

    NotificationSystem.push("Task Created", task.title, "success");
    await this.load();
    return data;
  },

  async update(id, payload) {
    await DB.update("tasks", payload, { id });

    NotificationSystem.push("Task Updated", "Task berhasil diperbarui", "info");
    await this.load();
  },

  async remove(id) {
    await DB.delete("tasks", { id });

    NotificationSystem.push("Task Deleted", "Task dihapus", "warning");
    await this.load();
  },

  getByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  }
};


/* ================= KANBAN CONTROLLER ================= */
const Kanban = {
  render() {
    const columns = {
      todo: document.querySelector("#todoList"),
      doing: document.querySelector("#doingList"),
      done: document.querySelector("#doneList")
    };

    if (!TaskEngine.tasks) return;

    Object.values(columns).forEach(c => c.innerHTML = "");

    TaskEngine.tasks.forEach(task => {
      const el = document.createElement("div");
      el.className = "kanban-card";
      el.draggable = true;
      el.dataset.id = task.id;

      el.innerHTML = `
        <strong>${task.title}</strong>
        <small>${task.status}</small>
      `;

      el.addEventListener("dragstart", () => {
        el.classList.add("dragging");
      });

      el.addEventListener("dragend", () => {
        el.classList.remove("dragging");
      });

      if (columns[task.status]) {
        columns[task.status].appendChild(el);
      }
    });
  },

  initDragDrop() {
    document.querySelectorAll(".kanban-list").forEach(list => {
      list.addEventListener("dragover", e => {
        e.preventDefault();
      });

      list.addEventListener("drop", async e => {
        const id = e.dataTransfer.getData("text/plain");
        const newStatus = list.dataset.status;

        if (!id || !newStatus) return;

        await TaskEngine.update(id, { status: newStatus });
        await TaskEngine.load();
        this.render();
      });
    });
  }
};


/* ================= UI ROUTER ================= */
const Router = {
  current: "dashboard",

  go(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const target = document.querySelector(`#${page}`);
    if (target) target.classList.add("active");

    this.current = page;

    EventBus.emit("route:change", page);
  }
};


/* ================= TOPBAR CONTROLLER ================= */
const UI = {
  updateTime() {
    const el = document.getElementById("time");
    if (!el) return;

    setInterval(() => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString();
    }, 1000);
  },

  setGreeting() {
    const el = document.getElementById("greeting");
    if (!el) return;

    const hour = new Date().getHours();

    let greet = "Selamat datang";
    if (hour < 12) greet = "Selamat pagi";
    else if (hour < 18) greet = "Selamat siang";
    else greet = "Selamat malam";

    el.textContent = greet;
  }
};


/* ================= GLOBAL APP INITIALIZER ================= */
async function initApp(supabaseClient) {

  console.log("🚀 MyWork Final System Booting...");

  DB.init(supabaseClient);
  Auth.user = await Auth.getSession();

  await TaskEngine.load();

  Kanban.render();
  Kanban.initDragDrop();

  UI.updateTime();
  UI.setGreeting();

  SyncManager.init(supabaseClient);

  Router.go("dashboard");

  EventBus.emit("app:ready", true);

  NotificationSystem.push(
    "MyWork Ready",
    "Semua sistem berjalan normal",
    "success"
  );
}


/* ================= GLOBAL EXPORTS ================= */
window.MyWork = {
  Auth,
  DB,
  TaskEngine,
  Kanban,
  Router,
  UI,
  initApp
};