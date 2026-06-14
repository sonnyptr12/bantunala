const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let isLogin = true;
let filter = "all";

// ================= PAGE NAV =================
window.showPage = function(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById("page-" + page).classList.remove("hidden");

  document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
};

// ================= FILTER =================
window.setFilter = function(f) {
  filter = f;
  loadTasks();
};

// ================= AUTH =================
window.toggleMode = function (e) {
  e.preventDefault();
  isLogin = !isLogin;

  document.getElementById("authTitle").innerText =
    isLogin ? "Login ke akun kamu" : "Buat akun baru";

  document.getElementById("authBtn").innerText =
    isLogin ? "Login" : "Register";

  document.getElementById("fullName").style.display =
    isLogin ? "none" : "block";

  document.getElementById("toggleText").innerText =
    isLogin ? "Belum punya akun?" : "Sudah punya akun?";

  document.getElementById("toggleAction").innerText =
    isLogin ? "Daftar" : "Login";
};

// ================= LOGIN/REGISTER =================
window.handleAuth = async function () {
  const email = email.value;
  const password = password.value;
  const fullName = document.getElementById("fullName").value;

  if (isLogin) {
    await supabaseClient.auth.signInWithPassword({ email, password });
  } else {
    const { data } = await supabaseClient.auth.signUp({ email, password });

    if (data.user) {
      await supabaseClient.from("profiles").insert([
        { id: data.user.id, full_name: fullName }
      ]);
    }
  }

  checkUser();
};

// ================= LOGOUT =================
window.logout = async function () {
  await supabaseClient.auth.signOut();
  checkUser();
};

// ================= SESSION =================
async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();
  const session = data.session;

  document.getElementById("authBox").style.display =
    session ? "none" : "flex";

  document.getElementById("app").style.display =
    session ? "flex" : "none";

  if (session) loadTasks();
}

// ================= TASK =================
window.addTask = async function () {
  const input = document.getElementById("taskInput");

  await supabaseClient.from("tasks").insert([
    { title: input.value, done: false }
  ]);

  input.value = "";
  loadTasks();
};

async function loadTasks() {
  const { data } = await supabaseClient.from("tasks").select("*");

  let tasks = data;

  if (filter === "done") tasks = tasks.filter(t => t.done);
  if (filter === "pending") tasks = tasks.filter(t => !t.done);

  document.getElementById("taskList").innerHTML = tasks.map(t => `
    <div class="task ${t.done ? "done" : ""}">
      ${t.title}
    </div>
  `).join("");

  updateStats(data);
}

// ================= STATS =================
function updateStats(data) {
  document.getElementById("totalTask").innerText = data.length;
  document.getElementById("doneTask").innerText = data.filter(t => t.done).length;
  document.getElementById("pendingTask").innerText = data.filter(t => !t.done).length;
}

// ================= INIT =================
window.addEventListener("load", checkUser);