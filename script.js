const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const msg = document.getElementById("msg");

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.innerText = "❌ " + error.message;
    console.log(error);
    return;
  }

  msg.innerText = "Login sukses";
  checkUser();
}

// ================= LOGOUT =================
async function logout() {
  await supabase.auth.signOut();
  checkUser();
}

// ================= CHECK SESSION =================
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();

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
  const { data, error } = await supabase.from("tasks").select("*");

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  if (error) {
    console.log(error);
    return;
  }

  data.forEach(task => {
    list.innerHTML += `
      <div class="task">
        ${task.title}
      </div>
    `;
  });
}

// ================= ADD TASK =================
async function addTask() {
  const input = document.getElementById("taskInput");

  if (!input.value) return;

  const { error } = await supabase.from("tasks").insert([
    { title: input.value }
  ]);

  if (error) {
    console.log(error);
    return;
  }

  input.value = "";
  loadTasks();
}

// ================= AUTO CHECK =================
checkUser();