
// ================= SUPABASE =================
const SUPABASE_URL = "https://scefyffuqtpavzpolrvj.supabase.co";
const SUPABASE_KEY = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================= STATE =================
let tasks = [];
let user = null;

// ================= AUTH =================
async function login(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    msg.innerText = "❌ " + error.message;
    return;
  }

  user = data.user;
  startApp();
}

// ================= LOGOUT =================
async function logout(){
  await client.auth.signOut();
  location.reload();
}

// ================= INIT APP =================
function startApp(){
  document.getElementById("authBox").style.display = "none";
  document.getElementById("app").style.display = "flex";

  openPage("dashboard");

  initClock();
  loadTasks();
  initRealtime();
  initPresence();
}

// ================= SPA NAV =================
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

// ================= CLOCK =================
function initClock(){
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

// ================= TASK LOAD =================
async function loadTasks(){

  const { data } = await client
    .from("tasks")
    .select("*")
    .order("id",{ascending:false});

  tasks = data || [];

  updateDashboard();
  renderKanban();
  renderChart();
}

// ================= DASHBOARD UPDATE =================
function updateDashboard(){

  const done = tasks.filter(t=>t.done).length;
  const active = tasks.length - done;

  document.getElementById("taskCount").innerText = tasks.length;
  document.getElementById("doneCount").innerText = done;
  document.getElementById("activeCount").innerText = active;
}

// ================= TASK CRUD =================
async function addTask(){

  const input = document.getElementById("taskInput");
  if(!input || !input.value) return;

  await client.from("tasks").insert([{
    title:input.value,
    done:false,
    status:"todo"
  }]);

  input.value="";
  loadTasks();
}

async function deleteTask(id){
  await client.from("tasks").delete().eq("id",id);
  loadTasks();
}

async function toggleTask(id,done){
  await client.from("tasks")
    .update({done:!done})
    .eq("id",id);

  loadTasks();
}

// ================= KANBAN RENDER =================
function renderKanban(){

  const todo = document.getElementById("todoList");
  const doing = document.getElementById("doingList");
  const done = document.getElementById("doneList");

  if(!todo) return;

  todo.innerHTML = "";
  doing.innerHTML = "";
  done.innerHTML = "";

  tasks.forEach(t=>{
    const el = document.createElement("div");
    el.className="kanban-card";
    el.innerText = t.title;

    if(t.status==="todo") todo.appendChild(el);
    if(t.status==="doing") doing.appendChild(el);
    if(t.status==="done") done.appendChild(el);
  });

  initDrag();
}

// ================= DRAG & DROP =================
function initDrag(){

  ["todoList","doingList","doneList"].forEach(id=>{
    new Sortable(document.getElementById(id),{
      group:"tasks",
      animation:200,
      onEnd:async function(evt){

        const taskName = evt.item.innerText;
        const newStatus =
          evt.to.id==="todoList" ? "todo" :
          evt.to.id==="doingList" ? "doing" : "done";

        const task = tasks.find(t=>t.title===taskName);
        if(!task) return;

        await client.from("tasks")
          .update({status:newStatus})
          .eq("id",task.id);

        loadTasks();
      }
    });
  });
}

// ================= CHART =================
let chartDonut,chartBar;

function renderChart(){

  const done = tasks.filter(t=>t.done).length;
  const pending = tasks.length - done;

  if(chartDonut) chartDonut.destroy();
  if(chartBar) chartBar.destroy();

  const ctx1 = document.getElementById("chartDonut");
  const ctx2 = document.getElementById("chartBar");

  if(!ctx1 || !ctx2) return;

  chartDonut = new Chart(ctx1,{
    type:"doughnut",
    data:{
      labels:["Done","Pending"],
      datasets:[{data:[done,pending]}]
    },
    options:{responsive:true,maintainAspectRatio:false}
  });

  chartBar = new Chart(ctx2,{
    type:"bar",
    data:{
      labels:["Tasks"],
      datasets:[{data:[tasks.length]}]
    },
    options:{responsive:true,maintainAspectRatio:false}
  });
}

// ================= REALTIME =================
function initRealtime(){

  client
    .channel("tasks-channel")
    .on("postgres_changes",{event:"*"},payload=>{
      loadTasks();
    })
    .subscribe();
}

// ================= PRESENCE (ONLINE USERS) =================
function initPresence(){

  const channel = client.channel("online-users");

  channel.subscribe(async (status)=>{

    if(status==="SUBSCRIBED"){
      channel.track({
        user:user?.email || "guest",
        online:true
      });
    }
  });
}

// ================= BROADCAST =================
async function sendBroadcast(){

  const input = document.getElementById("broadcastInput");
  if(!input || !input.value) return;

  await client.from("broadcast").insert([{
    message:input.value,
    created_at:new Date()
  }]);

  input.value="";
}

// ================= CERTIFICATE PDF =================
async function generateCertificate(){

  const { jsPDF } = window.jspdf;

  const name = document.getElementById("certName").value;
  const event = document.getElementById("certEvent").value;

  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text("CERTIFICATE", 70, 40);

  doc.setFontSize(16);
  doc.text("This is to certify", 20, 70);

  doc.text(name || "NAME", 20, 90);
  doc.text("for participating in", 20, 110);
  doc.text(event || "EVENT", 20, 130);

  doc.save("certificate.pdf");
}

// ================= EXCEL UPLOAD =================
function uploadExcel(event){

  const file = document.getElementById("excelFile").files[0];

  const reader = new FileReader();

  reader.onload = function(e){
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data,{type:"array"});

    console.log(workbook);
    alert("Excel loaded successfully");
  };

  reader.readAsArrayBuffer(file);
}

// ================= FILE UPLOAD =================
async function uploadFile(){

  const file = document.getElementById("fileUpload").files[0];
  if(!file) return;

  await client.storage
    .from("files")
    .upload(file.name,file);

  alert("Uploaded");
}

// ================= INIT =================
window.addEventListener("load",()=>{
  initClock();
});