const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// AUTH
window.handleAuth = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await supabaseClient.auth.signInWithPassword({ email, password });
  checkUser();
};

window.logout = async function () {
  await supabaseClient.auth.signOut();
  checkUser();
};

async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();

  document.getElementById("authBox").style.display =
    data.session ? "none" : "flex";

  document.getElementById("app").style.display =
    data.session ? "flex" : "none";

  if (data.session) loadTasks();
}

// TASK
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

  document.getElementById("taskList").innerHTML = data
    .map(t => `<div class="task ${t.done ? "done" : ""}">${t.title}</div>`)
    .join("");

  document.getElementById("totalTask").innerText = data.length;
  document.getElementById("doneTask").innerText = data.filter(t => t.done).length;
  document.getElementById("pendingTask").innerText = data.filter(t => !t.done).length;
}

window.addEventListener("load", checkUser);