const client = supabase.createClient(
"https://scefyffuqtpavzpolrvj.supabase.co",
"sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc"
);

/* NAVIGATION FIX */
function openPage(id,el){

  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".menu").forEach(m=>m.classList.remove("active"));
  if(el) el.classList.add("active");
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
  startClock();
  loadTasks();
}

/* CLOCK (NO DETIK) */
function startClock(){
  setInterval(()=>{
    const h=new Date().getHours();

    let g="Hello";
    if(h<12)g="Good Morning ☀️";
    else if(h<17)g="Good Afternoon 🌤";
    else g="Good Evening 🌙";

    greeting.innerText=g;
    time.innerText=new Date().toLocaleString("id-ID",{hour:"2-digit",minute:"2-digit"});
  },1000);
}

/* TASK */
async function loadTasks(){
  const {data}=await client.from("tasks").select("*");

  totalTask.innerText=data.length;
  doneTask.innerText=data.filter(t=>t.done).length;
  pendingTask.innerText=data.filter(t=>!t.done).length;

  renderChart(data);
}

/* CHART FIX */
function renderChart(data){

  new Chart(chart1,{
    type:"doughnut",
    data:{
      labels:["Done","Pending"],
      datasets:[{data:[
        data.filter(t=>t.done).length,
        data.filter(t=>!t.done).length
      ]}]
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
      datasets:[{data:[3,2,5,4,6]}]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });
}