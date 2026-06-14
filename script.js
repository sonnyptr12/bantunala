const supabaseClient = supabase.createClient(
"https://scefyffuqtpavzpolrvj.supabase.co",
"sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc"
);

/* NAVIGATION FIX */
function openPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* LOGIN */
async function login(){
  const {error}=await supabaseClient.auth.signInWithPassword({
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
  loadUsers();
}

/* CLOCK + GREETING */
function clock(){
  setInterval(()=>{
    const h=new Date().getHours();
    let g="Hello";

    if(h<12)g="Good Morning ☀️";
    else if(h<17)g="Good Afternoon 🌤";
    else g="Good Evening 🌙";

    greeting.innerText=g;
    datetime.innerText=new Date().toLocaleString("id-ID");
  },1000);
}

/* TASK */
async function loadTasks(){
  const {data}=await supabaseClient.from("tasks").select("*");

  totalTask.innerText=data.length;
  doneTask.innerText=data.filter(t=>t.done).length;
  pendingTask.innerText=data.filter(t=>!t.done).length;

  renderChart(data);
}

/* CHART FIX (NO OVERFLOW) */
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
      datasets:[{data:[3,6,2,7,5]}]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });
}

/* USERS */
function loadUsers(){
  userTable.innerHTML=`
    <tr><td>Admin</td><td>Online</td><td>Now</td></tr>
    <tr><td>User</td><td>Online</td><td>2m</td></tr>
  `;
}