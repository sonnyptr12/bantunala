// =========================================================
// MYWORK ENTERPRISE CORE v3 (REBUILD FROM ZERO)
// PART 1 - FOUNDATION LAYER
// =========================================================

// =========================================================
// SUPABASE INIT (SAFE + SCALABLE)
// =========================================================

const SUPABASE_URL =
  "https://scefyffuqtpavzpolrvj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const client =
  supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================================================
// APP METADATA
// =========================================================

const APP = {
  name: "MyWork SaaS Core",
  version: "3.0.0",
  mode: "enterprise",
  developer: "Bantunala",
  build: new Date().toISOString()
};

client.auth.onAuthStateChange((event, session) => {

  if (event === "SIGNED_IN" && session) {
    state.user = session.user;
    enterApp();
  }

  if (event === "SIGNED_OUT") {
    state.user = null;
    exitApp();
  }

});

// =========================================================
// GLOBAL STATE (CENTRALIZED STORE)
// =========================================================

let state = {

  user: null,

  tasks: [],

  excelData: [],

  cert: {
    elements: [],
    selected: null
  },

  ui: {
    currentPage: "dashboard",
    systemReady: false,
    loader: false
  },

  charts: {
    donut: null,
    bar: null
  },

  realtime: {
    taskChannel: null,
    presenceChannel: null,
    started: false
  },

  broadcast: [],
  notifications: [],
  activityLogs: []

};

// =========================================================
// APP BOOTSTRAP
// =========================================================

window.addEventListener("load", async () => {

  try {

    showLoader();

    initClock();
    initKeyboardShortcuts();

    await restoreSession();

    loadLocalModules();

    console.log("🚀 MyWork Boot Complete");

  } catch (err) {
    console.error("BOOT ERROR:", err);
  } finally {
    hideLoader();
  }

});

// =========================================================
// SESSION RESTORE
// =========================================================

async function restoreSession() {

  try {

    const { data: { session } } =
      await client.auth.getSession();

    if (session) {
      state.user = session.user;
      enterApp();
    } else {
      exitApp();
    }

  } catch (err) {
    console.error("SESSION ERROR:", err);
    exitApp();
  }

}

// =========================================================
// APP STARTER
// =========================================================

function enterApp() {

  const authBox = document.getElementById("authBox");
  const appBox = document.getElementById("app");

  if (authBox) authBox.style.display = "none";
  if (appBox) appBox.style.display = "flex";

  state.ui.systemReady = true;

  openPage("dashboard");

  loadTasks();
  loadFiles();
  loadBroadcastHistory();
  loadProfile();

  initRealtime();
  initPresence();
  listenBroadcast();

  addActivity("LOGIN: " + (state.user?.email || "unknown"));

  showToast("Welcome " + (state.user?.email || "User"));
}

function exitApp() {

  const authBox = document.getElementById("authBox");
  const appBox = document.getElementById("app");

  if (authBox) authBox.style.display = "flex";
  if (appBox) appBox.style.display = "none";

  state.ui.systemReady = false;
}

// =========================================================
// PAGE SYSTEM
// =========================================================

function openPage(pageId, menuBtn) {

  state.ui.currentPage = pageId;

  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
    p.classList.add("hidden");
  });

  const target = document.getElementById(pageId);

  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }

  document.querySelectorAll(".menu").forEach(m => {
    m.classList.remove("active");
  });

  if (menuBtn) menuBtn.classList.add("active");

  if (pageId === "settings") {
  loadSettings();
}
}

// =========================================================
// CLOCK SYSTEM
// =========================================================

function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {

  const now = new Date();
  const hour = now.getHours();

  let greet = "Welcome";

  if (hour < 12) greet = "Good Morning ☀️";
  else if (hour < 17) greet = "Good Afternoon 🌤";
  else greet = "Good Evening 🌙";

  // 👇 AMBIL NAMA USER DARI SUPABASE METADATA
  const name =
    state.user?.user_metadata?.name ||
    state.user?.email?.split("@")[0] ||
    "User";

  setText("greeting", `${greet}, ${name}`);

  setText(
    "time",
    now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }) +
    " • " +
    now.toLocaleTimeString("id-ID")
  );
}

// =========================================================
// DOM HELPERS (SAFE ACCESS)
// =========================================================

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

// =========================================================
// LOADER SYSTEM
// =========================================================

function showLoader() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.classList.remove("hidden");
}

function hideLoader() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.classList.add("hidden");
}

// =========================================================
// TOAST SYSTEM (GLOBAL SAFE)
// =========================================================

function showToast(message) {

  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#111827";
    toast.style.color = "#fff";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "13px";
    toast.style.zIndex = "9999";
    toast.style.transition = "0.3s";

    document.body.appendChild(toast);
  }

  toast.innerText = message;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2500);

}

// =========================================================
// ACTIVITY LOG CORE
// =========================================================

function addActivity(text) {

  state.activityLogs.unshift({
    text,
    time: new Date().toLocaleString("id-ID")
  });

}
// =========================================================
// MYWORK CORE v3
// PART 2 - TASK SYSTEM (ENTERPRISE LEVEL)
// =========================================================

// =========================================================
// LOAD TASKS
// =========================================================

async function loadTasks() {

  try {

    showLoader();

    const { data, error } = await client
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("LOAD TASK ERROR:", error);
      hideLoader();
      return;
    }

    state.tasks = data || [];

    updateDashboard();
    renderTaskCounters();
    renderKanban();
    renderChart();

  } catch (err) {
    console.error("LOAD TASK EXCEPTION:", err);
  }

  hideLoader();
}

// =========================================================
// ADD TASK (SAFE + VALIDATED)
// =========================================================

async function addTask() {

  const input = document.getElementById("taskInput");

  if (!input || !input.value.trim()) {
    showToast("Task tidak boleh kosong");
    return;
  }

  const title = input.value.trim();

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
      showToast(error.message);
      return;
    }

    addActivity("ADD TASK: " + title);
    showToast("Task berhasil ditambahkan");

    input.value = "";

    loadTasks();

  } catch (err) {
    console.error("ADD TASK ERROR:", err);
  }

}

// =========================================================
// DELETE TASK
// =========================================================

async function deleteTask(id) {

  if (!confirm("Hapus task ini?")) return;

  try {

    await client
      .from("tasks")
      .delete()
      .eq("id", id);

    addActivity("DELETE TASK #" + id);
    showToast("Task dihapus");

    loadTasks();

  } catch (err) {
    console.error(err);
  }

}

// =========================================================
// TOGGLE DONE STATUS
// =========================================================

async function toggleTask(id, current) {

  try {

    await client
      .from("tasks")
      .update({
        done: !current
      })
      .eq("id", id);

    addActivity("TOGGLE TASK #" + id);

    loadTasks();

  } catch (err) {
    console.error(err);
  }

}

// =========================================================
// UPDATE STATUS (KANBAN DRAG SYSTEM)
// =========================================================

async function updateTaskStatus(taskId, status) {

  try {

    await client
      .from("tasks")
      .update({
        status,
        done: status === "done"
      })
      .eq("id", taskId);

  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
  }

}

// =========================================================
// DASHBOARD KPI
// =========================================================

function updateDashboard() {

  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const active = total - done;

  setText("taskCount", total);
  setText("doneCount", done);
  setText("activeCount", active);

}

// =========================================================
// TASK COUNTERS (KANBAN HEADER)
// =========================================================

function renderTaskCounters() {

  setText(
    "todoCount",
    state.tasks.filter(t => t.status === "todo").length
  );

  setText(
    "doingCount",
    state.tasks.filter(t => t.status === "doing").length
  );

  setText(
    "doneTaskCount",
    state.tasks.filter(t => t.status === "done").length
  );

}

// =========================================================
// SEARCH / FILTER TASKS
// =========================================================

function filterTasks() {

  const q =
    document.getElementById("taskSearch")?.value.toLowerCase() || "";

  document.querySelectorAll(".kanban-card").forEach(card => {

    const text = card.innerText.toLowerCase();

    card.style.display =
      text.includes(q) ? "block" : "none";

  });

}

// =========================================================
// SEARCH LISTENER (AUTO)
// =========================================================

document.addEventListener("input", (e) => {

  if (e.target.id === "taskSearch") {
    filterTasks();
  }

});
// =========================================================
// MYWORK CORE v3
// PART 3 - KANBAN + DRAG + CHART ENGINE
// =========================================================

// =========================================================
// RENDER KANBAN BOARD
// =========================================================

function renderKanban() {

  const todo = document.getElementById("todoList");
  const doing = document.getElementById("doingList");
  const done = document.getElementById("doneList");

  if (!todo || !doing || !done) return;

  todo.innerHTML = "";
  doing.innerHTML = "";
  done.innerHTML = "";

  state.tasks.forEach(task => {

    const card = document.createElement("div");
    card.className = "kanban-card";
    card.dataset.id = task.id;

    card.innerHTML = `
      <div class="kanban-title">
        ${task.title}
      </div>

      <div class="kanban-footer">
        <small>${task.created_by || ""}</small>

        <div class="kanban-actions">
          <button onclick="toggleTask(${task.id}, ${task.done})">✔</button>
          <button onclick="deleteTask(${task.id})">✖</button>
        </div>
      </div>
    `;

    if (task.status === "todo") {
      todo.appendChild(card);
    } else if (task.status === "doing") {
      doing.appendChild(card);
    } else {
      done.appendChild(card);
    }

  });

  initDrag();

}

// =========================================================
// DRAG & DROP SYSTEM (SORTABLE.JS)
// =========================================================

function initDrag() {

  const lists = ["todoList", "doingList", "doneList"];

  lists.forEach(id => {

    const el = document.getElementById(id);
    if (!el) return;

    new Sortable(el, {

      group: "kanban",
      animation: 200,
      ghostClass: "dragging",

      onEnd: async function (evt) {

        const taskId = evt.item.dataset.id;

        const newStatus =
          evt.to.id === "todoList"
            ? "todo"
            : evt.to.id === "doingList"
              ? "doing"
              : "done";

        await updateTaskStatus(taskId, newStatus);

        addActivity(`MOVE TASK #${taskId} → ${newStatus}`);
        showToast("Task dipindahkan");

        loadTasks(); // refresh sync

      }

    });

  });

}

// =========================================================
// CHART ENGINE (DONUT + BAR)
// =========================================================

function renderChart() {

  const donutEl = document.getElementById("chartDonut");
  const barEl = document.getElementById("chartBar");

  if (!donutEl || !barEl) return;

  const done = state.tasks.filter(t => t.done).length;
  const pending = state.tasks.length - done;

  // destroy old chart (prevent memory leak)
  if (state.charts.donut) state.charts.donut.destroy();
  if (state.charts.bar) state.charts.bar.destroy();

  // =====================================================
  // DONUT CHART
  // =====================================================

  state.charts.donut = new Chart(donutEl, {
    type: "doughnut",
    data: {
      labels: ["Done", "Pending"],
      datasets: [{
        data: [done, pending]
      }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });

  // =====================================================
  // BAR CHART
  // =====================================================

  state.charts.bar = new Chart(barEl, {
    type: "bar",
    data: {
      labels: ["Tasks"],
      datasets: [{
        label: "Total Tasks",
        data: [state.tasks.length]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

}
// =========================================================
// MYWORK CORE v3
// PART 4 - REALTIME + PRESENCE + BROADCAST SYSTEM
// =========================================================

// =========================================================
// REALTIME TASK LISTENER
// =========================================================

function initRealtime() {

  if (state.realtime.started) return;

  const channel = client.channel("tasks-realtime");

  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks"
      },
      (payload) => {

        console.log("TASK UPDATE:", payload);

        loadTasks();

        addNotification("Task updated");
        addActivity("Realtime task change");

      }
    )
    .subscribe((status) => {

      updateConnectionStatus(status);

    });

  state.realtime.taskChannel = channel;
  state.realtime.started = true;

}

// =========================================================
// CONNECTION STATUS UI
// =========================================================

function updateConnectionStatus(status) {

  const el = document.getElementById("connectionStatus");
  if (!el) return;

  if (status === "SUBSCRIBED") {
    el.innerText = "🟢 Online";
  } else {
    el.innerText = "🔴 Offline";
  }

}

// =========================================================
// PRESENCE SYSTEM (ONLINE USERS)
// =========================================================

let presenceChannel = null;

function initPresence() {

  if (presenceChannel) return;

  presenceChannel = client.channel("online-users");

  presenceChannel
    .on("presence", { event: "sync" }, () => {

      const state = presenceChannel.presenceState();

      const users = [];

      Object.keys(state).forEach(key => {
        state[key].forEach(u => users.push(u));
      });

      renderOnlineUsers(users);

      setText("onlineCount", users.length);

    });

  presenceChannel.subscribe(async (status) => {

    if (status === "SUBSCRIBED") {

      await presenceChannel.track({
        email: state.user?.email || "guest",
        online: true,
        login_time: new Date().toISOString()
      });

    }

  });

}

// =========================================================
// RENDER ONLINE USERS
// =========================================================

function renderOnlineUsers(users) {

  const box = document.getElementById("userList");
  if (!box) return;

  box.innerHTML = "";

  if (!users.length) {
    box.innerHTML = "<p>No online users</p>";
    return;
  }

  users.forEach(u => {

    const row = document.createElement("div");
    row.className = "user-row";

    row.innerHTML = `
      <span>🟢</span>
      <span>${u.email}</span>
    `;

    box.appendChild(row);

  });

}

// =========================================================
// NOTIFICATION ENGINE
// =========================================================

function addNotification(message) {

  state.notifications.unshift({
    message,
    time: new Date().toLocaleString("id-ID")
  });

  renderNotifications();

}

function renderNotifications() {

  const box = document.getElementById("notificationList");
  if (!box) return;

  if (!state.notifications.length) {
    box.innerHTML = "<p>No notifications</p>";
    return;
  }

  box.innerHTML = "";

  state.notifications.forEach(n => {

    const el = document.createElement("div");
    el.className = "notification-item";

    el.innerHTML = `
      <strong>${n.message}</strong><br>
      <small>${n.time}</small>
    `;

    box.appendChild(el);

  });

}

// =========================================================
// ACTIVITY LOG RENDER
// =========================================================

function renderActivityLogs() {

  const box = document.getElementById("activityList");
  if (!box) return;

  if (!state.activityLogs.length) {
    box.innerHTML = "<p>No activity yet</p>";
    return;
  }

  box.innerHTML = "";

  state.activityLogs.forEach(a => {

    const el = document.createElement("div");
    el.className = "activity-item";

    el.innerHTML = `
      <strong>${a.text}</strong><br>
      <small>${a.time}</small>
    `;

    box.appendChild(el);

  });

}

// =========================================================
// BROADCAST LISTENER (LIVE FEED)
// =========================================================

function listenBroadcast() {

  const channel = client.channel("broadcast-live");

  channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "broadcast"
      },
      (payload) => {

        const box = document.getElementById("broadcastList");

        if (box) {

          const item = document.createElement("div");
          item.className = "broadcast-item";

          item.innerHTML = `
            📢 ${payload.new.message}<br>
            <small>${payload.new.sender || ""}</small>
          `;

          box.prepend(item);

        }

        addNotification("New broadcast");
        showToast(payload.new.message);

      }
    )
    .subscribe();

}

// =========================================================
// BROADCAST HISTORY LOAD
// =========================================================

async function loadBroadcastHistory() {

  const box = document.getElementById("broadcastList");
  if (!box) return;

  const { data } = await client
    .from("broadcast")
    .select("*")
    .order("id", { ascending: false });

  box.innerHTML = "";

  (data || []).forEach(item => {

    const el = document.createElement("div");

    el.className = "broadcast-item";

    el.innerHTML = `
      📢 ${item.message}<br>
      <small>${item.sender || ""}</small>
    `;

    box.appendChild(el);

  });

}
// =========================================================
// MYWORK CORE v3
// PART 5 - FINAL MODULES (ENTERPRISE TOOLKIT)
// =========================================================

// =========================================================
// PROFILE SYSTEM
// =========================================================

function loadProfile() {

  const box = document.getElementById("profileInfo");
  if (!box || !state.user) return;

  box.innerHTML = `
    <p>Nama: ${state.user.user_metadata?.name || "-"}</p>
    <p>Email: ${state.user.email || "-"}</p>
    <p>Instansi: ${state.user.user_metadata?.institution || "-"}</p>
  `;

}

// =========================================================
// LOCAL STORAGE MODULES
// =========================================================

function loadLocalModules() {

  state.notes = JSON.parse(localStorage.getItem("mywork_notes") || "[]");
  state.contacts = JSON.parse(localStorage.getItem("mywork_contacts") || "[]");
  state.teamMembers = JSON.parse(localStorage.getItem("mywork_team") || "[]");

}

// =========================================================
// KEYBOARD SHORTCUTS
// =========================================================

function initKeyboardShortcuts() {

  document.addEventListener("keydown", (e) => {

    if (e.ctrlKey && e.key.toLowerCase() === "k") {
      e.preventDefault();

      const el = document.getElementById("commandPalette");
      if (el) el.classList.toggle("hidden");

    }

    if (e.ctrlKey && e.key.toLowerCase() === "b") {
      e.preventDefault();
      openPage("broadcast");
      showToast("Broadcast mode");
    }

  });

}

// =========================================================
// FILE UPLOAD (SUPABASE STORAGE)
// =========================================================

async function uploadFile() {

  const file = document.getElementById("fileUpload")?.files?.[0];
  if (!file) return;

  const path = Date.now() + "_" + file.name;

  const { error } = await client.storage
    .from("files")
    .upload(path, file);

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("File uploaded");
  loadFiles();

}

// =========================================================
// LOAD FILES
// =========================================================

async function loadFiles() {

  const box = document.getElementById("fileList");
  if (!box) return;

  const { data, error } = await client.storage
    .from("files")
    .list();

  if (error) {
    console.error(error);
    return;
  }

  box.innerHTML = "";

  (data || []).forEach(file => {

    const el = document.createElement("div");

    el.className = "file-card";

    el.innerHTML = `
      📄 ${file.name}
      <button onclick="deleteFile('${file.name}')">🗑</button>
    `;

    box.appendChild(el);

  });

}

// =========================================================
// DELETE FILE
// =========================================================

async function deleteFile(name) {

  if (!confirm("Hapus file ini?")) return;

  const { error } = await client.storage
    .from("files")
    .remove([name]);

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("File deleted");
  loadFiles();

}

// =========================================================
// PDF TOOLS (BASIC PLACEHOLDER UPGRADE)
// =========================================================

function mergePDF() {
  showToast("Merge PDF module ready (placeholder)");
}

function splitPDF() {
  showToast("Split PDF module ready (placeholder)");
}

function exportPDF() {
  window.print();
  showToast("Export PDF done");
}

// =========================================================
// EXCEL IMPORT SYSTEM
// =========================================================

function uploadExcel() {

  const file = document.getElementById("excelFile")?.files?.[0];
  if (!file) {
    showToast("Pilih file Excel");
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {

    const data = new Uint8Array(e.target.result);

    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    state.excelData = XLSX.utils.sheet_to_json(sheet);

    renderExcelPreview();

    showToast(state.excelData.length + " data loaded");

  };

  reader.readAsArrayBuffer(file);

}

// =========================================================
// EXCEL PREVIEW
// =========================================================

function renderExcelPreview() {

  const box = document.getElementById("excelPreview");
  if (!box) return;

  box.innerHTML = "";

  state.excelData.slice(0, 5).forEach(row => {

    const el = document.createElement("div");
    el.className = "excel-row";
    el.innerText = JSON.stringify(row);

    box.appendChild(el);

  });

}

// =========================================================
// CERTIFICATE GENERATOR (SINGLE)
// =========================================================

async function generateCertificate() {

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF("landscape");

  const nama =
    document.getElementById("certName")?.value || "PESERTA";

  const event =
    document.getElementById("certEvent")?.value || "";

  doc.setFontSize(28);
  doc.text(nama, 148, 90, { align: "center" });

  doc.setFontSize(16);
  doc.text(event, 148, 110, { align: "center" });

  doc.save("certificate.pdf");

}

// =========================================================
// BATCH CERTIFICATE GENERATOR
// =========================================================

async function generateBatchCertificates() {

  if (!state.excelData.length) {
    showToast("Upload Excel dulu");
    return;
  }

  const { jsPDF } = window.jspdf;

  for (const row of state.excelData) {

    const doc = new jsPDF("landscape");

    const nama = row.nama || row.NAMA || "PESERTA";

    doc.setFontSize(28);
    doc.text(nama, 148, 90, { align: "center" });

    doc.save(nama + ".pdf");

  }

  showToast("Batch selesai");

}

// =========================================================
// CERTIFICATE STUDIO INIT
// =========================================================

function initCertificateStudio() {

  const canvas = document.getElementById("certCanvas");
  if (!canvas || canvas.dataset.loaded) return;

  canvas.dataset.loaded = true;

  loadSavedTemplate();
  loadTemplateLayout();

  if (state.cert.elements.length === 0) {

    addTextToCert("{{nama}}", 100, 100);
    addTextToCert("{{kelas}}", 100, 160);
    addTextToCert("{{event}}", 100, 220);

  }

}

// =========================================================
// ADD TEXT TO CERT
// =========================================================

function addTextToCert(text, x = 100, y = 100) {

  const canvas = document.getElementById("certCanvas");
  if (!canvas) return;

  const el = document.createElement("div");

  el.className = "text-item";
  el.innerText = text;

  el.style.position = "absolute";
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.cursor = "move";

  el.onclick = () => selectElement(el);

  enableDrag(el);

  canvas.appendChild(el);

  state.cert.elements.push(el);

}

// =========================================================
// SELECT ELEMENT
// =========================================================

function selectElement(el) {

  document.querySelectorAll(".text-item")
    .forEach(e => e.classList.remove("active"));

  state.cert.selected = el;
  el.classList.add("active");

}

// =========================================================
// DRAG ENGINE
// =========================================================

function enableDrag(el) {

  let dragging = false;
  let ox = 0;
  let oy = 0;

  el.addEventListener("mousedown", (e) => {
    dragging = true;
    ox = e.offsetX;
    oy = e.offsetY;
  });

  document.addEventListener("mousemove", (e) => {

    if (!dragging) return;

    const canvas = document.getElementById("certCanvas");
    const rect = canvas.getBoundingClientRect();

    el.style.left = (e.clientX - rect.left - ox) + "px";
    el.style.top = (e.clientY - rect.top - oy) + "px";

  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

}

// =========================================================
// SAVE TEMPLATE LAYOUT
// =========================================================

function saveTemplateLayout() {

  const layout = state.cert.elements.map(el => ({
    text: el.innerText,
    left: el.style.left,
    top: el.style.top
  }));

  localStorage.setItem("cert_layout", JSON.stringify(layout));

  showToast("Template saved");

}

// =========================================================
// LOAD TEMPLATE LAYOUT
// =========================================================

function loadTemplateLayout() {

  const data = JSON.parse(localStorage.getItem("cert_layout") || "[]");

  const canvas = document.getElementById("certCanvas");
  if (!canvas) return;

  canvas.querySelectorAll(".text-item").forEach(e => e.remove());

  state.cert.elements = [];

  data.forEach(item => {
    addTextToCert(item.text, parseInt(item.left), parseInt(item.top));
  });

}

// =========================================================
// BACKGROUND TEMPLATE
// =========================================================

function loadSavedTemplate() {

  const bg = localStorage.getItem("cert_bg");
  const canvas = document.getElementById("certCanvas");

  if (bg && canvas) {
    canvas.style.backgroundImage = `url(${bg})`;
  }

}

// =========================================================
// FINAL BOOT LOG
// =========================================================

window.addEventListener("load", () => {

  console.log("✅ MyWork v3 Fully Loaded");

});
async function login() {

  const email = document.getElementById("loginEmail")?.value?.trim();
  const password = document.getElementById("loginPassword")?.value?.trim();

  if (!email || !password) {
    showToast("Email dan password wajib diisi");
    return;
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);
    showToast(error.message);
    return;
  }

  state.user = data.user;
  enterApp();

  showToast("Login berhasil");
}
async function registerUser() {

  const name = document.getElementById("regName")?.value;
  const email = document.getElementById("regEmail")?.value;
  const phone = document.getElementById("regPhone")?.value;
  const institution = document.getElementById("regInstitution")?.value;
  const password = document.getElementById("regPassword")?.value;

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        institution
      }
    }
  });

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Akun berhasil dibuat, cek email / login langsung");
}
async function logout() {

  const { error } = await client.auth.signOut();

  if (error) {
    showToast(error.message);
    return;
  }

  state.user = null;
  exitApp();

  showToast("Logout berhasil");
}

function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");

  document.getElementById("loginTab").classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
}

function showRegister() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");

  document.getElementById("registerTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
}
async function login() {

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showToast("Email & password wajib diisi");
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Login berhasil");
}
async function registerUser() {

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const whatsapp = document.getElementById("regWhatsapp").value;
  const password = document.getElementById("regPassword").value;

  if (!name || !email || !whatsapp || !password) {
    showToast("Semua field wajib diisi");
    return;
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        whatsapp
      }
    }
  });

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Registrasi berhasil, cek email untuk konfirmasi");
  showLogin();
}
window.addEventListener("load", () => {
  console.log("✅ MyWork v3 Fully Loaded");
});
function loadSettings() {

  if (!state.user) return;

  const name = state.user.user_metadata?.name || "";
  const whatsapp = state.user.user_metadata?.whatsapp || "";
  const email = state.user.email || "";

  setText("settingsEmail", "Email: " + email);
  setText("settingsName", "Nama: " + name);

  document.getElementById("updateName").value = name;
  document.getElementById("updateWhatsapp").value = whatsapp;
}
async function updateProfile() {

  const name = document.getElementById("updateName").value;
  const whatsapp = document.getElementById("updateWhatsapp").value;

  let avatarUrl = state.user.user_metadata?.avatar || null;

  const file = document.getElementById("avatarInput")?.files?.[0];

  if (file) {

    const path = "avatars/" + state.user.id + "_" + file.name;

    const { error } = await client.storage
      .from("files")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data } = client.storage.from("files").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }
  }

  const { error } = await client.auth.updateUser({
    data: { name, whatsapp, avatar: avatarUrl }
  });

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Profile updated");

  const { data } = await client.auth.getUser();
  state.user = data.user;

  loadSettings();
  loadProfile();
  updateClock();
}
async function changePassword() {

  const password = document.getElementById("newPassword").value;

  if (!password) {
    showToast("Password tidak boleh kosong");
    return;
  }

  const { error } = await client.auth.updateUser({
    password
  });

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Password updated");
}
async function logout() {

  await client.auth.signOut();

  state.user = null;

  exitApp();

  showToast("Logged out");
}