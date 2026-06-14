const supabaseUrl = "https://scefyffuqtpavzpolrvj.supabase.co";
const supabaseKey = "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

/* ========== AUTH MODE ========== */
let isLogin = true;

function toggleMode(e){
  e.preventDefault();
  isLogin = !isLogin;

  document.getElementById("fullName").style.display = isLogin ? "none":"block";
  document.getElementById("authBtn").innerText = isLogin ? "Login":"Register";
  document.getElementById("toggleText").innerText = isLogin ? "Belum punya akun?" : "Sudah punya akun?";
}

/* ========== LOGIN / REGISTER ========== */
async function handleAuth(){
  const email = email.value;
  const password = password.value;

  if(isLogin){
    const { error } = await supabaseClient.auth.signInWithPassword({email,password});
    if(error) return msg.innerText = error.message;
  }else{
    const fullName = document.getElementById("fullName").value;

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options:{ data:{ fullName } }
    });

    if(error) return msg.innerText = error.message;
  }

  checkUser();
}

/* ========== LOGOUT ========== */
async function logout(){
  await supabaseClient.auth.signOut();
  location.reload();
}

/* ========== SESSION ========== */
async function checkUser(){
  const { data } = await supabaseClient.auth.getSession();

  if(data.session){
    authBox.style.display="none";
    app.style.display="flex";
    loadTasks();
    updateTime();
    loadUsers();
  }
}

/* ========== TASK SYSTEM ========== */
async function addTask(){
  await supabaseClient.from("tasks").insert({
    title:taskInput.value,
    done:false
  });

  taskInput.value="";
  loadTasks();
}

async function loadTasks(){
  const {data}=await supabaseClient.from("tasks").select("*");

  totalTask.innerText=data.length;
  doneTask.innerText=data.filter(t=>t.done).length;
  pendingTask.innerText=data.filter(t=>!t.done).length;

  taskList.innerHTML=data.map(t=>`
    <div class="task">${t.title}</div>
  `).join("");

  renderCharts(data);
}

/* ========== CHARTS ========== */
let chart1,chart2;

function renderCharts(data){
  if(chart1) chart1.destroy();
  if(chart2) chart2.destroy();

  chart1=new Chart(chart1Canvas,{
    type:"doughnut",
    data:{
      labels:["Done","Pending"],
      datasets:[{data:[
        data.filter(t=>t.done).length,
        data.filter(t=>!t.done).length
      ]}]
    }
  });

  chart2=new Chart(chart2Canvas,{
    type:"bar",
    data:{
      labels:["Mon","Tue","Wed","Thu","Fri"],
      datasets:[{data:[3,6,2,8,5]}]
    }
  });
}

/* ========== CLOCK + GREETING ========== */
function updateTime(){
  setInterval(()=>{
    const now=new Date();
    const h=now.getHours();

    let greet="Hello";
    if(h<12)greet="Good Morning ☀️";
    else if(h<17)greet="Good Afternoon 🌤";
    else greet="Good Evening 🌙";

    greeting.innerText=greet;
    datetime.innerText=now.toLocaleString("id-ID");
  },1000);
}

/* ========== USERS ========== */
function loadUsers(){
  userTable.innerHTML=`
    <tr><td>Admin</td><td>Online</td><td>Now</td></tr>
    <tr><td>User 1</td><td>Online</td><td>2m</td></tr>
    <tr><td>User 2</td><td>Away</td><td>10m</td></tr>
  `;
}

/* ========== INIT ========== */
window.onload=checkUser;