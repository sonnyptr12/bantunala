const supabaseClient = supabase.createClient(
"https://scefyffuqtpavzpolrvj.supabase.co",
"sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc"
);

/* PAGE NAV */
function openPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
}

/* LOGIN */
async function login(){
  const {error} = await supabaseClient.auth.signInWithPassword({
    email:email.value,
    password:password.value
  });

  if(!error){
    authBox.style.display="none";
    app.style.display="flex";
    init();
  }
}

/* LOGOUT */
async function logout(){
  await supabaseClient.auth.signOut();
  location.reload();
}

/* INIT */
function init(){
  updateTime();
  loadTasks();
  loadUsers();
}

/* TIME + GREETING */
function updateTime(){
  setInterval(()=>{
    const h=new Date().getHours();
    let greet="Hello";

    if(h<12)greet="Good Morning ☀️";
    else if(h<17)greet="Good Afternoon 🌤";
    else greet="Good Evening 🌙";

    greeting.innerText=greet;
    datetime.innerText=new Date().toLocaleString("id-ID");
  },1000);
}

/* TASKS */
async function loadTasks(){
  const {data}=await supabaseClient.from("tasks").select("*");

  totalTask.innerText=data.length;
  doneTask.innerText=data.filter(t=>t.done).length;
  pendingTask.innerText=data.filter(t=>!t.done).length;

  renderChart(data);
}

/* CHART */
let c1,c2;

function renderChart(data){
  if(c1)c1.destroy();
  if(c2)c2.destroy();

  c1=new Chart(chart1,{
    type:"doughnut",
    data:{
      labels:["Done","Pending"],
      datasets:[{data:[
        data.filter(t=>t.done).length,
        data.filter(t=>!t.done).length
      ]}]
    }
  });

  c2=new Chart(chart2,{
    type:"bar",
    data:{
      labels:["Mon","Tue","Wed","Thu","Fri"],
      datasets:[{data:[3,6,2,7,5]}]
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