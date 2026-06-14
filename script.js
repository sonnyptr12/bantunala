// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

// IMPORTANT: pakai nama unik supaya TIDAK bentrok
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ================= ELEMENT =================
const msg = document.getElementById("msg");

// ================= LOGIN =================
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.innerText = "❌ " + error.message;
    return;
  }

  msg.innerText = "Login sukses ✔";
  checkUser();
};

// ================= LOGOUT =================
window.logout = async function () {
  await supabaseClient.auth.signOut();
  checkUser();
};

// ================= CHECK SESSION =================
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
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.log(error);
    return;
  }

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  data.forEach(task => {
    list.innerHTML += `
      <div class="task">
        ${task.title}
      </div>
    `;
  });
}

// ================= ADD TASK =================
window.addTask = async function () {
  const input = document.getElementById("taskInput");

  if (!input.value.trim()) return;

  const { error } = await supabaseClient
    .from("tasks")
    .insert([{ title: input.value }]);

  if (error) {
    console.log(error);
    return;
  }

  input.value = "";
  loadTasks();
};

// ================= AUTO START =================
window.addEventListener("load", checkUser);