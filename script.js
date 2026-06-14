
// ================= SUPABASE =================
const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const client = supabase.createClient(supabaseUrl, supabaseKey);

// ================= GLOBAL STATE =================
let tasksData = [];

// ================= LOGIN =================
async function login(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    msg.innerText = "❌ " + error.message;
    return;
  }

  startApp();
}

// ================= LOGOUT =================
async function logout(){
  await client.auth.signOut();
  location.reload();
}

// ================= INIT APP =================
async function startApp(){

  document.getElementById("authBox").style.display = "none";
  document.getElementById("app").style.display = "flex";

  openPage("dashboard");

  startClock();
  loadTasks();
}

// ================= SPA ROUTER =================
function openPage(id,el){

  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".menu").forEach(m=>{
    m.classList.remove("active");
  });

  if(el) el.classList.add("active");
}

// ================= CLOCK + GREETING =================
function startClock(){
  setInterval(()=>{
    const now = new Date();
    const hour = now.getHours();

    let greet = "Hello";

    if(hour < 12) greet = "Good Morning ☀️";
    else if(hour < 17) greet = "Good Afternoon 🌤";
    else greet = "Good Evening 🌙";

    document.getElementById("greeting").innerText = greet;

    document.getElementById("time").innerText =
      now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});

  },1000);
}

// ================= LOAD TASKS =================
async function loadTasks(){

  const { data } = await client
    .from("tasks")
    .select("*")
    .order("id",{ascending:false});

  tasksData = data || [];

  updateDashboard();
  renderTable();
  renderTaskBoard();
  renderCharts();
}

// ================= UPDATE DASHBOARD =================
function updateDashboard(){

  const total = tasksData.length;
  const done = tasksData.filter(t=>t.done).length;
  const pending = total - done;

  document.getElementById("totalTask").innerText = total;
  document.getElementById("doneTask").innerText = done;
  document.getElementById("pendingTask").innerText = pending;
}

// ================= TASK CRUD =================

// ADD
async function addTask(title){

  const input = document.getElementById("taskInput");
  const value = input?.value;

  if(!value) return;

  await client.from("tasks").insert([{
    title:value,
    done:false
  }]);

  input.value="";
  loadTasks();
}

// DELETE
async function deleteTask(id){

  await client.from("tasks")
    .delete()
    .eq("id",id);

  loadTasks();
}

// TOGGLE DONE
async function toggleTask(id,done){

  await client.from("tasks")
    .update({done:!done})
    .eq("id",id);

  loadTasks();
}

// EDIT
async function editTask(id,title){

  const newTitle = prompt("Edit task:",title);

  if(!newTitle) return;

  await client.from("tasks")
    .update({title:newTitle})
    .eq("id",id);

  loadTasks();
}

// ================= TABLE RENDER =================
function renderTable(){

  const table = document.getElementById("taskTable");
  table.innerHTML="";

  tasksData.forEach(t=>{
    table.innerHTML += `
      <tr>
        <td>${t.title}</td>
        <td>${t.done ? "✅ Done" : "⏳ Pending"}</td>
      </tr>
    `;
  });
}

// ================= TASK BOARD (CARD UI) =================
function renderTaskBoard(){

  const board = document.getElementById("taskBoard");
  if(!board) return;

  board.innerHTML="";

  tasksData.forEach(t=>{
    board.innerHTML += `
      <div class="task-card">
        <h4>${t.title}</h4>
        <p>${t.done ? "Completed" : "In Progress"}</p>

        <button onclick="toggleTask(${t.id},${t.done})">Toggle</button>
        <button onclick="editTask(${t.id},'${t.title}')">Edit</button>
        <button onclick="deleteTask(${t.id})">Delete</button>
      </div>
    `;
  });
}

// ================= CHARTS =================
let chart1,chart2;

function renderCharts(){

  const done = tasksData.filter(t=>t.done).length;
  const pending = tasksData.length - done;

  // destroy old chart
  if(chart1) chart1.destroy();
  if(chart2) chart2.destroy();

  const ctx1 = document.getElementById("chart1");
  const ctx2 = document.getElementById("chart2");

  if(!ctx1 || !ctx2) return;

  chart1 = new Chart(ctx1,{
    type:"doughnut",
    data:{
      labels:["Done","Pending"],
      datasets:[{
        data:[done,pending]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });

  chart2 = new Chart(ctx2,{
    type:"bar",
    data:{
      labels:["Tasks"],
      datasets:[{
        data:[tasksData.length]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });
}

// ================= BROADCAST =================
async function sendBroadcast(){

  const msg = document.getElementById("broadcastInput")?.value;

  if(!msg) return;

  await client.from("broadcast").insert([{
    message:msg,
    created_at:new Date()
  }]);

  alert("Broadcast sent");
}

// ================= INIT =================
window.addEventListener("load",()=>{
  startClock();
});