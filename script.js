const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let isLogin = true;

// ================= TOGGLE =================
window.toggleMode = function (e) {
  e.preventDefault();

  isLogin = !isLogin;

  const title = document.getElementById("authTitle");
  const btn = document.getElementById("authBtn");
  const fullName = document.getElementById("fullName");
  const msg = document.getElementById("msg");
  const toggleText = document.getElementById("toggleText");
  const toggleAction = document.getElementById("toggleAction");

  msg.innerText = "";

  if (isLogin) {
    title.innerText = "Login ke akun kamu";
    btn.innerText = "Login";
    fullName.style.display = "none";

    toggleText.innerText = "Belum punya akun?";
    toggleAction.innerText = "Daftar";
  } else {
    title.innerText = "Buat akun baru";
    btn.innerText = "Register";
    fullName.style.display = "block";

    toggleText.innerText = "Sudah punya akun?";
    toggleAction.innerText = "Login";
  }
};

// ================= AUTH =================
window.handleAuth = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const msg = document.getElementById("msg");

  if (!email || !password) {
    msg.innerText = "❌ Email & Password wajib diisi";
    return;
  }

  msg.innerText = "Loading...";

  if (isLogin) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) return msg.innerText = "❌ " + error.message;

    msg.innerText = "✔ Login sukses";
  } else {
    if (!fullName) return msg.innerText = "❌ Nama wajib diisi";

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) return msg.innerText = "❌ " + error.message;

    const user = data.user;

    if (user) {
      await supabaseClient.from("profiles").insert([
        { id: user.id, full_name: fullName, email }
      ]);
    }

    msg.innerText = "✔ Register sukses";
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
  const session = data?.session;

  document.getElementById("authBox").style.display = session ? "none" : "flex";
  document.getElementById("app").style.display = session ? "block" : "none";

  if (session) loadTasks();
}

// ================= TASK =================
window.addTask = async function () {
  const input = document.getElementById("taskInput");
  if (!input.value.trim()) return;

  await supabaseClient
    .from("tasks")
    .insert([{ title: input.value, done: false }]);

  input.value = "";
  loadTasks();
};

async function loadTasks() {
  const { data } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("id", { ascending: false });

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  data.forEach(task => {
    list.innerHTML += `
      <div class="task ${task.done ? "done" : ""}">
        <span>${task.title}</span>

        <div class="actions">
          <button onclick="toggleDone(${task.id}, ${task.done})">✔</button>
          <button onclick="deleteTask(${task.id})">❌</button>
        </div>
      </div>
    `;
  });
}

window.deleteTask = async function (id) {
  await supabaseClient.from("tasks").delete().eq("id", id);
  loadTasks();
};

window.toggleDone = async function (id, done) {
  await supabaseClient
    .from("tasks")
    .update({ done: !done })
    .eq("id", id);

  loadTasks();
};

// ================= INIT =================
window.addEventListener("load", checkUser);