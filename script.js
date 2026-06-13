const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login gagal");
  } else {
    checkUser();
  }
}

// LOGOUT
async function logout() {
  await supabase.auth.signOut();
  checkUser();
}

// CEK SESSION
async function checkUser() {
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadTasks();
  } else {
    document.getElementById("authBox").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
}

// TASK SYSTEM
async function loadTasks() {
  const { data } = await supabase.from("tasks").select("*");

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  data.forEach(task => {
    list.innerHTML += `<div class="task">${task.title}</div>`;
  });
}

async function addTask() {
  const input = document.getElementById("taskInput");

  await supabase.from("tasks").insert([
    { title: input.value }
  ]);

  input.value = "";
  loadTasks();
}

// AUTO CHECK LOGIN
checkUser();