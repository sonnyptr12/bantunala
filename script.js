const client = supabase.createClient(
"https://scefyffuqtpavzpolrvj.supabase.co",
"sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc"
);

/* NAV */
function openPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* LOGIN */
async function login(){
  const {error}=await client.auth.signInWithPassword({
    email:email.value,
    password:password.value
  });

  if(!error){
    authBox.style.display="none";
    app.style.display="flex";
    init();
  }
}

/* INIT */
function init(){
  clock();
  loadTasks();
}

/* CLOCK (NO DETIK) */
function clock(){
  setInterval(()=>{
    const h=new Date().getHours();

    let g="Hello";
    if(h<12)g="Good Morning ☀️";
    else if(h<17)g="Good Afternoon 🌤";
    else g="Good Evening 🌙";

    greeting.innerText=g;
    time.innerText=new Date().toLocaleString("id-ID",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"});
  },1000);
}

/* TASK LOAD */
async function loadTasks(){
  const {data}=await client.from("tasks").select("*");

  totalTask.innerText=data.length;
  doneTask.innerText=data.filter(t=>t.done).length;
  pendingTask.innerText=data.filter(t=>!t.done).length;

  taskTable.innerHTML=data.map(t=>`
    <tr>
      <td>${t.title}</td>
      <td>${t.desc || "-"}</td>
      <td>${t.done ? "Done":"Pending"}</td>
    </tr>
  `).join("");

  renderChart(data);
}

/* BROADCAST (SIMULASI GLOBAL MESSAGE) */
function sendBroadcast(){
  alert("📢 Broadcast sent: " + broadcastInput.value);
  broadcastInput.value="";
}

/* CHART FIX */
function renderChart(data){
  new Chart(chart1,{
    type:"doughnut",
    data:{
      labels:["Done","Pending"],
      datasets:[{
        data:[
          data.filter(t=>t.done).length,
          data.filter(t=>!t.done).length
        ]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });

  new Chart(chart2,{
    type:"bar",
    data:{
      labels:["Mon","Tue","Wed","Thu","Fri"],
      datasets:[{data:[2,4,6,3,5]}]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });
}