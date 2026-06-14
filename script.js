const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ================= INIT =================
window.addEventListener("load", () => {
  checkUser();
});

// ================= LOGIN =================
window.login = async function () {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const msg = document.getElementById("msg");

  msg.innerText = "Loading...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  if (error) {
    msg.innerText = "❌ " + error.message;
    return;
  }

  msg.innerText = "✔ Login sukses";

  await checkUser();
};

// ================= LOGOUT =================
window.logout = async function () {
  await supabaseClient.auth.signOut();

  await checkUser();
};

// ================= SESSION CONTROL (FIX CENTER BUG) =================
async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();
  const session = data?.session;

  const authBox = document.getElementById("authBox");
  const app = document.getElementById("app");

  if (session) {
    // 🔥 IMPORTANT: jangan pakai block untuk auth
    authBox.style.display = "none";

    // dashboard bebas block/flex
    app.style.display = "flex";

    loadTasks();
  } else {
    // 🔥 INI YANG FIX BUG CENTER FLICK
    authBox.style.display = "flex";
    app.style.display = "none";
  }
}

// ================= LOAD TASK =================
async function loadTasks() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("id", { ascending: false });

  const list = document.getElementById("taskList");

  if (error) {
    console.log(error);
    return;
  }

  list.innerHTML = "";

  data.forEach(task => {
    list.innerHTML += `
      <div class="task ${task.done ? "done" : ""}">
        
        <div class="task-left">
          <span>${task.title}</span>
          <span class="badge">${task.done ? "DONE" : "PENDING"}</span>
        </div>

        <div class="actions">
          <button onclick="toggleDone(${task.id}, ${task.done})">✔</button>
          <button onclick="editTask(${task.id}, '${task.title}')">✏</button>
          <button onclick="deleteTask(${task.id})">❌</button>
        </div>

      </div>
    `;
  });
}

// ================= ADD TASK =================
window.addTask = async function () {
  const input = document.getElementById("taskInput");

  if (!input.value.trim()) return;

  await supabaseClient
    .from("tasks")
    .insert([{ title: input.value, done: false }]);

  input.value = "";
  loadTasks();
};

// ================= DELETE TASK =================
window.deleteTask = async function (id) {
  await supabaseClient
    .from("tasks")
    .delete()
    .eq("id", id);

  loadTasks();
};

// ================= TOGGLE DONE =================
window.toggleDone = async function (id, done) {
  await supabaseClient
    .from("tasks")
    .update({ done: !done })
    .eq("id", id);

  loadTasks();
};

// ================= EDIT TASK =================
window.editTask = async function (id, oldTitle) {
  const newTitle = prompt("Edit task:", oldTitle);

  if (!newTitle) return;

  await supabaseClient
    .from("tasks")
    .update({ title: newTitle })
    .eq("id", id);

  loadTasks();
};