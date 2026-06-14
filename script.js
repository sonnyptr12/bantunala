const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ================= LOGIN =================
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.innerText = "❌ " + error.message;
    return;
  }

  msg.innerText = "✔ Login sukses";
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

  if (session) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadTasks();
  } else {
    document.getElementById("authBox").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
}

// ================= LOAD TASK =================
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

// ================= INIT =================
window.addEventListener("load", checkUser);