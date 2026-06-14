const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let isLogin = true;

// ================= AUTH =================
window.toggleMode = function(e) {
  e.preventDefault();
  isLogin = !isLogin;

  document.getElementById("authTitle").innerText =
    isLogin ? "Login ke sistem" : "Buat akun baru";

  document.getElementById("authBtn").innerText =
    isLogin ? "Login" : "Register";

  document.getElementById("fullName").style.display =
    isLogin ? "none" : "block";
};

window.handleAuth = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
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
window.logout = async function() {
  await supabaseClient.auth.signOut();
  checkUser();
};

// ================= SESSION =================
async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();

  document.getElementById("authBox").style.display =
    data.session ? "none" : "flex";

  document.getElementById("app").style.display =
    data.session ? "flex" : "none";

  if (data.session) {
    loadTasks();
    loadNotes();
    loadAnnouncements();
  }
}

// ================= NAV =================
window.showPage = function(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById("page-" + page).classList.remove("hidden");
};

// ================= TASK =================
window.addTask = async function() {
  const input = document.getElementById("taskInput");

  await supabaseClient.from("tasks").insert([
    { title: input.value, done: false }
  ]);

  input.value = "";
  loadTasks();
};

async function loadTasks() {
  const { data } = await supabaseClient.from("tasks").select("*");

  document.getElementById("taskList").innerHTML = data.map(t => `
    <div class="task ${t.done ? "done" : ""}">
      ${t.title}
    </div>
  `).join("");

  document.getElementById("totalTask").innerText = data.length;
  document.getElementById("doneTask").innerText = data.filter(t => t.done).length;
  document.getElementById("pendingTask").innerText = data.filter(t => !t.done).length;
}

// ================= NOTES =================
window.addNote = async function() {
  const input = document.getElementById("noteInput");

  await supabaseClient.from("notes").insert([
    { content: input.value }
  ]);

  input.value = "";
  loadNotes();
};

async function loadNotes() {
  const { data } = await supabaseClient.from("notes").select("*");

  document.getElementById("noteList").innerHTML = data.map(n => `
    <div class="task">📝 ${n.content}</div>
  `).join("");
}

// ================= ANNOUNCEMENTS =================
window.addAnnouncement = async function() {
  const input = document.getElementById("announceInput");

  await supabaseClient.from("announcements").insert([
    { content: input.value }
  ]);

  input.value = "";
  loadAnnouncements();
};

async function loadAnnouncements() {
  const { data } = await supabaseClient.from("announcements").select("*");

  document.getElementById("announceList").innerHTML = data.map(a => `
    <div class="task">📢 ${a.content}</div>
  `).join("");
}

// ================= INIT =================
window.addEventListener("load", checkUser);