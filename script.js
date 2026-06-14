const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let isLogin = true;
let pdfFiles = [];

/* ================= AUTH ================= */
window.toggleMode = function(e){
  e.preventDefault();
  isLogin = !isLogin;
  document.getElementById("authBtn").innerText = isLogin ? "Login" : "Register";
  document.getElementById("fullName").style.display = isLogin ? "none" : "block";
};

window.handleAuth = async function(){
  const email = email.value;
  const password = password.value;

  if(isLogin){
    await supabaseClient.auth.signInWithPassword({email,password});
  }else{
    await supabaseClient.auth.signUp({email,password});
  }

  checkUser();
};

window.logout = async function(){
  await supabaseClient.auth.signOut();
  checkUser();
};

/* ================= SESSION ================= */
async function checkUser(){
  const {data} = await supabaseClient.auth.getSession();

  authBox.style.display = data.session ? "none" : "flex";
  app.style.display = data.session ? "flex" : "none";

  if(data.session){
    loadTasks();
  }
}

/* ================= NAV ================= */
window.showPage = function(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  document.getElementById("page-"+page).classList.remove("hidden");
};

/* ================= TASK ================= */
window.addTask = async function(){
  await supabaseClient.from("tasks").insert([
    {title:taskInput.value,done:false}
  ]);

  taskInput.value="";
  loadTasks();
};

async function loadTasks(){
  const {data} = await supabaseClient.from("tasks").select("*");

  taskList.innerHTML = data.map(t=>`
    <div class="task">${t.title}</div>
  `).join("");

  totalTask.innerText = data.length;
  doneTask.innerText = data.filter(t=>t.done).length;
  pendingTask.innerText = data.filter(t=>!t.done).length;
}

/* ================= NOTES ================= */
window.addNote = async function(){
  await supabaseClient.from("notes").insert([
    {content:noteInput.value}
  ]);
};

/* ================= ANNOUNCE ================= */
window.addAnnouncement = async function(){
  await supabaseClient.from("announcements").insert([
    {content:announceInput.value}
  ]);
};

/* ================= PDF REAL MERGE ================= */
pdfInput.onchange = (e)=>{
  pdfFiles = Array.from(e.target.files);
};

window.mergePDF = async function(){

  const {PDFDocument} = PDFLib;
  const merged = await PDFDocument.create();

  for(const file of pdfFiles){
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);

    const copied = await merged.copyPages(doc, doc.getPageIndices());
    copied.forEach(p=>merged.addPage(p));
  }

  const pdfBytes = await merged.save();

  const blob = new Blob([pdfBytes],{type:"application/pdf"});
  const url = URL.createObjectURL(blob);

  window.open(url);
};

window.splitPDF = function(){
  alert("Split ready upgrade next level (backend mode)");
};

window.addEventListener("load",checkUser);