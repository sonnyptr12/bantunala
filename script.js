// =========================================================
// SUPABASE CONFIG
// =========================================================

const SUPABASE_URL =
  "https://scefyffuqtpavzpolrvj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_UEEIA0b0Cw3ucS8OoP0ZPQ_9N6iAmGc";

const client =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

// =========================================================
// GLOBAL STATE
// =========================================================

let user = null;
let tasks = [];
let chartDonut = null;
let chartBar = null;

let realtimeStarted = false;
let presenceStarted = false;

let excelData = [];

let certElements = [];
let selectedElement = null;

// =========================================================
// APP START
// =========================================================

window.addEventListener(
  "load",
  async () => {

    initClock();

    await restoreSession();

    listenBroadcast();

  }
);

// =========================================================
// SESSION RESTORE
// =========================================================

async function restoreSession(){

  try{

    const {
      data:{session}
    } = await client.auth.getSession();

    if(session){

      user = session.user;

      startApp();

    }

  }catch(err){

    console.error(err);

  }

}

// =========================================================
// AUTH LOGIN
// =========================================================

async function login(){

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const msg =
    document.getElementById("msg");

  if(!email || !password){

    msg.innerText =
      "❌ Email dan Password wajib diisi";

    return;
  }

  msg.innerText = "Loading...";

  const {
    data,
    error
  } =
  await client.auth.signInWithPassword({

    email,
    password

  });

  if(error){

    msg.innerText =
      "❌ " + error.message;

    return;
  }

  user = data.user;

  msg.innerText =
    "✅ Login berhasil";

  startApp();

}

// =========================================================
// LOGOUT
// =========================================================

async function logout(){

  if(
    !confirm(
      "Yakin ingin logout?"
    )
  ) return;

  await client.auth.signOut();

  location.reload();

}

// =========================================================
// START APP
// =========================================================

function startApp(){

  const auth =
    document.getElementById("authBox");

  const app =
    document.getElementById("app");

  if(auth)
    auth.style.display = "none";

  if(app)
    app.style.display = "flex";

  openPage("dashboard");

  loadTasks();

  if(!realtimeStarted){

    initRealtime();
    realtimeStarted = true;

  }

  if(!presenceStarted){

    initPresence();
    presenceStarted = true;

  }

}

// =========================================================
// NAVIGATION SYSTEM
// =========================================================

function openPage(
  pageId,
  menuBtn
){

  document
    .querySelectorAll(".page")
    .forEach(page=>{

      page.classList.remove(
        "active"
      );

    });

  const target =
    document.getElementById(
      pageId
    );

  if(target){

    target.classList.add(
      "active"
    );

  }

  document
    .querySelectorAll(".menu")
    .forEach(menu=>{

      menu.classList.remove(
        "active"
      );

    });

  if(menuBtn){

    menuBtn.classList.add(
      "active"
    );

  }

}

// =========================================================
// CLOCK SYSTEM
// =========================================================

function initClock(){

  updateClock();

  setInterval(
    updateClock,
    60000
  );

}

function updateClock(){

  const now =
    new Date();

  const hour =
    now.getHours();

  let greeting =
    "Welcome";

  if(hour < 12){

    greeting =
      "Good Morning ☀️";

  }
  else if(hour < 17){

    greeting =
      "Good Afternoon 🌤";

  }
  else{

    greeting =
      "Good Evening 🌙";

  }

  const greetingEl =
    document.getElementById(
      "greeting"
    );

  const timeEl =
    document.getElementById(
      "time"
    );

  if(greetingEl){

    greetingEl.innerText =
      greeting;

  }

  if(timeEl){

    timeEl.innerText =
      now.toLocaleDateString(
        "id-ID",
        {
          weekday:"long",
          day:"numeric",
          month:"long",
          year:"numeric"
        }
      )
      +
      " • "
      +
      now.toLocaleTimeString(
        "id-ID",
        {
          hour:"2-digit",
          minute:"2-digit"
        }
      );

  }

}

// =========================================================
// TASK SYSTEM
// =========================================================

async function loadTasks(){

  try{

    const {
      data,
      error
    } =
    await client
      .from("tasks")
      .select("*")
      .order(
        "id",
        {
          ascending:false
        }
      );

    if(error){

      console.error(error);
      return;

    }

    tasks =
      data || [];

    updateDashboard();

    if(
      typeof renderKanban
      === "function"
    ){

      renderKanban();

    }

    if(
      typeof renderChart
      === "function"
    ){

      renderChart();

    }

  }
  catch(err){

    console.error(err);

  }

}

// =========================================================
// DASHBOARD KPI
// =========================================================

function updateDashboard(){

  const total =
    tasks.length;

  const done =
    tasks.filter(
      t => t.done
    ).length;

  const active =
    total - done;

  updateText(
    "taskCount",
    total
  );

  updateText(
    "doneCount",
    done
  );

  updateText(
    "activeCount",
    active
  );

}

// =========================================================
// DOM HELPERS
// =========================================================

function updateText(
  id,
  value
){

  const el =
    document.getElementById(
      id
    );

  if(el){

    el.innerText =
      value;

  }

}

function showMessage(
  id,
  text
){

  const el =
    document.getElementById(
      id
    );

  if(el){

    el.innerText =
      text;

  }

}

// =========================================================
// REALTIME TASKS
// =========================================================

function initRealtime(){

  client
    .channel(
      "tasks-realtime"
    )
    .on(
      "postgres_changes",
      {
        event:"*",
        schema:"public",
        table:"tasks"
      },
      ()=>{
        loadTasks();
      }
    )
    .subscribe();

}

// =========================================================
// ONLINE PRESENCE
// =========================================================

function initPresence(){

  const channel =
    client.channel(
      "online-users"
    );

  channel.subscribe(
    async status => {

      if(
        status ===
        "SUBSCRIBED"
      ){

        await channel.track({

          email:
            user?.email ||
            "guest",

          online:true,

          last_seen:
            new Date()
              .toISOString()

        });

      }

    }
  );

}

// =========================================================
// BROADCAST LISTENER
// =========================================================

function listenBroadcast(){

  client
    .channel(
      "broadcast-live"
    )
    .on(
      "postgres_changes",
      {
        event:"INSERT",
        schema:"public",
        table:"broadcast"
      },
      payload=>{

        const list =
          document.getElementById(
            "broadcastList"
          );

        if(!list)
          return;

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "broadcast-item";

        item.innerHTML =
          "📢 "
          +
          payload.new.message;

        list.prepend(
          item
        );

      }
    )
    .subscribe();

}

// =========================================================
// ONLINE USER TABLE
// =========================================================

function renderOnlineUsers(
  users
){

  const container =
    document.getElementById(
      "userList"
    );

  if(!container)
    return;

  container.innerHTML = "";

  users.forEach(user=>{

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "user-row";

    row.innerHTML =

      `
      <span>🟢</span>
      <span>${user.email}</span>
      `;

    container.appendChild(
      row
    );

  });

}
// =========================================================
// TASK CRUD
// =========================================================

async function addTask(){

  const input =
    document.getElementById(
      "taskInput"
    );

  if(
    !input ||
    !input.value.trim()
  ){
    return;
  }

  try{

    const {
      error
    } =
    await client
      .from("tasks")
      .insert([{

        title:
          input.value,

        done:false,

        status:"todo",

        created_by:
          user?.email ||

          "system",

        created_at:
          new Date()
            .toISOString()

      }]);

    if(error){

      console.error(error);
      return;

    }

    input.value = "";

    loadTasks();

  }
  catch(err){

    console.error(err);

  }

}

async function deleteTask(id){

  if(
    !confirm(
      "Hapus task ini?"
    )
  ){
    return;
  }

  try{

    await client
      .from("tasks")
      .delete()
      .eq(
        "id",
        id
      );

    loadTasks();

  }
  catch(err){

    console.error(err);

  }

}

async function toggleTask(
  id,
  currentStatus
){

  try{

    await client
      .from("tasks")
      .update({

        done:
          !currentStatus

      })
      .eq(
        "id",
        id
      );

    loadTasks();

  }
  catch(err){

    console.error(err);

  }

}

// =========================================================
// KANBAN RENDER
// =========================================================

function renderKanban(){

  const todo =
    document.getElementById(
      "todoList"
    );

  const doing =
    document.getElementById(
      "doingList"
    );

  const done =
    document.getElementById(
      "doneList"
    );

  if(
    !todo ||
    !doing ||
    !done
  ){
    return;
  }

  todo.innerHTML = "";
  doing.innerHTML = "";
  done.innerHTML = "";

  tasks.forEach(task=>{

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "kanban-card";

    card.dataset.id =
      task.id;

    card.innerHTML =

      `
      <div class="kanban-title">
        ${task.title}
      </div>

      <div class="kanban-footer">
        ${task.created_by || ""}
      </div>
      `;

    if(
      task.status ===
      "todo"
    ){

      todo.appendChild(
        card
      );

    }

    else if(
      task.status ===
      "doing"
    ){

      doing.appendChild(
        card
      );

    }

    else{

      done.appendChild(
        card
      );

    }

  });

  initDrag();

}

// =========================================================
// SORTABLE KANBAN
// =========================================================

function initDrag(){

  const lists = [

    "todoList",
    "doingList",
    "doneList"

  ];

  lists.forEach(id=>{

    const container =
      document.getElementById(
        id
      );

    if(!container){
      return;
    }

    new Sortable(
      container,
      {

        group:"kanban",

        animation:250,

        ghostClass:
          "dragging",

        onEnd:
          async function(evt){

            const taskId =
              evt.item.dataset.id;

            const newStatus =

              evt.to.id ===
              "todoList"

              ? "todo"

              :

              evt.to.id ===
              "doingList"

              ? "doing"

              :

              "done";

            try{

              await client
                .from("tasks")
                .update({

                  status:
                    newStatus,

                  done:
                    newStatus ===
                    "done"

                })
                .eq(
                  "id",
                  taskId
                );

            }
            catch(err){

              console.error(
                err
              );

            }

          }

      }
    );

  });

}

// =========================================================
// CHART SYSTEM
// =========================================================

function renderChart(){

  const donutCanvas =
    document.getElementById(
      "chartDonut"
    );

  const barCanvas =
    document.getElementById(
      "chartBar"
    );

  if(
    !donutCanvas ||
    !barCanvas
  ){
    return;
  }

  const doneCount =
    tasks.filter(
      t => t.done
    ).length;

  const pendingCount =
    tasks.length -
    doneCount;

  if(chartDonut){

    chartDonut.destroy();

  }

  if(chartBar){

    chartBar.destroy();

  }

  chartDonut =
    new Chart(
      donutCanvas,
      {

        type:"doughnut",

        data:{

          labels:[

            "Done",
            "Pending"

          ],

          datasets:[{

            data:[

              doneCount,
              pendingCount

            ],

            backgroundColor:[

              "#00E5FF",
              "#7C3AED"

            ],

            borderWidth:0

          }]

        },

        options:{

          responsive:true,

          maintainAspectRatio:
            false,

          cutout:"70%",

          plugins:{

            legend:{

              position:
                "bottom"

            }

          }

        }

      }
    );

  chartBar =
    new Chart(
      barCanvas,
      {

        type:"bar",

        data:{

          labels:[

            "Tasks"

          ],

          datasets:[{

            label:
              "Total",

            data:[

              tasks.length

            ],

            backgroundColor:
              "#00E5FF",

            borderRadius:
              10

          }]

        },

        options:{

          responsive:true,

          maintainAspectRatio:
            false,

          plugins:{

            legend:{

              display:false

            }

          },

          scales:{

            y:{

              beginAtZero:
                true

            }

          }

        }

      }
    );

}

// =========================================================
// BROADCAST SYSTEM
// =========================================================

async function sendBroadcast(){

  const input =
    document.getElementById(
      "broadcastInput"
    );

  if(
    !input ||
    !input.value.trim()
  ){
    return;
  }

  try{

    await client
      .from("broadcast")
      .insert([{

        message:
          input.value,

        sender:
          user?.email,

        created_at:
          new Date()
            .toISOString()

      }]);

    input.value = "";

  }
  catch(err){

    console.error(err);

  }

}

async function loadBroadcastHistory(){

  const list =
    document.getElementById(
      "broadcastList"
    );

  if(!list){
    return;
  }

  const {
    data
  } =
  await client
    .from("broadcast")
    .select("*")
    .order(
      "id",
      {
        ascending:false
      }
    );

  list.innerHTML = "";

  (data || [])
  .forEach(item=>{

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "broadcast-item";

    row.innerHTML =

      `
      📢 ${item.message}
      `;

    list.appendChild(
      row
    );

  });

}
// =========================================================
// CERTIFICATE STUDIO
// =========================================================

function initCertificateStudio(){

  const canvas =
    document.getElementById(
      "certCanvas"
    );

  if(!canvas) return;

  if(
    canvas.dataset.loaded
  ) return;

  canvas.dataset.loaded = true;

  addTextToCert(
    "{{NAMA}}",
    300,
    240
  );

  addTextToCert(
    "{{KELAS}}",
    300,
    300
  );

  addTextToCert(
    "{{PRESTASI}}",
    300,
    360
  );

}

// =========================================================
// TEMPLATE BACKGROUND UPLOAD
// =========================================================

function uploadCertificateTemplate(){

  const file =
    document.getElementById(
      "templateUpload"
    )?.files?.[0];

  if(!file) return;

  const reader =
    new FileReader();

  reader.onload =
    function(e){

      const canvas =
        document.getElementById(
          "certCanvas"
        );

      if(!canvas) return;

      canvas.style.backgroundImage =
        `url(${e.target.result})`;

      canvas.style.backgroundSize =
        "cover";

      canvas.style.backgroundPosition =
        "center";

      localStorage.setItem(
        "certificate_template",
        e.target.result
      );

    };

  reader.readAsDataURL(
    file
  );

}

// =========================================================
// LOAD SAVED TEMPLATE
// =========================================================

function loadSavedTemplate(){

  const template =
    localStorage.getItem(
      "certificate_template"
    );

  const canvas =
    document.getElementById(
      "certCanvas"
    );

  if(
    template &&
    canvas
  ){

    canvas.style.backgroundImage =
      `url(${template})`;

    canvas.style.backgroundSize =
      "cover";

  }

}

// =========================================================
// DRAGGABLE TEXT SYSTEM
// =========================================================

function addTextToCert(
  text,
  x = 100,
  y = 100
){

  const canvas =
    document.getElementById(
      "certCanvas"
    );

  if(!canvas) return;

  const item =
    document.createElement(
      "div"
    );

  item.className =
    "text-item";

  item.innerText =
    text;

  item.style.left =
    x + "px";

  item.style.top =
    y + "px";

  item.onclick =
    ()=>{

      selectElement(
        item
      );

    };

  enableDrag(
    item
  );

  canvas.appendChild(
    item
  );

  certElements.push(
    item
  );

}

function selectElement(
  el
){

  document
    .querySelectorAll(
      ".text-item"
    )
    .forEach(e=>{

      e.classList.remove(
        "active"
      );

    });

  el.classList.add(
    "active"
  );

  selectedElement =
    el;

}

// =========================================================
// DRAG ENGINE
// =========================================================

function enableDrag(el){

  let dragging =
    false;

  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener(
    "mousedown",
    e=>{

      dragging = true;

      offsetX =
        e.offsetX;

      offsetY =
        e.offsetY;

    }
  );

  document.addEventListener(
    "mousemove",
    e=>{

      if(
        !dragging
      ) return;

      const canvas =
        document.getElementById(
          "certCanvas"
        );

      const rect =
        canvas.getBoundingClientRect();

      el.style.left =
        (
          e.clientX -
          rect.left -
          offsetX
        ) + "px";

      el.style.top =
        (
          e.clientY -
          rect.top -
          offsetY
        ) + "px";

    }
  );

  document.addEventListener(
    "mouseup",
    ()=>{

      dragging =
        false;

    }
  );

}

// =========================================================
// SAVE TEMPLATE LAYOUT
// =========================================================

function saveTemplateLayout(){

  const layout =
    certElements.map(
      el => ({

        text:
          el.innerText,

        left:
          el.style.left,

        top:
          el.style.top

      })
    );

  localStorage.setItem(
    "cert_layout",
    JSON.stringify(
      layout
    )
  );

  alert(
    "Template saved"
  );

}

// =========================================================
// LOAD TEMPLATE LAYOUT
// =========================================================

function loadTemplateLayout(){

  const layout =
    JSON.parse(
      localStorage.getItem(
        "cert_layout"
      ) || "[]"
    );

  const canvas =
    document.getElementById(
      "certCanvas"
    );

  if(!canvas) return;

  canvas
    .querySelectorAll(
      ".text-item"
    )
    .forEach(
      e=>e.remove()
    );

  certElements = [];

  layout.forEach(
    item=>{

      addTextToCert(
        item.text,
        parseInt(
          item.left
        ),
        parseInt(
          item.top
        )
      );

    }
  );

}

// =========================================================
// EXCEL IMPORT
// =========================================================

function uploadExcel(){

  const file =
    document.getElementById(
      "excelFile"
    )?.files?.[0];

  if(!file) return;

  const reader =
    new FileReader();

  reader.onload =
    function(e){

      const data =
        new Uint8Array(
          e.target.result
        );

      const workbook =
        XLSX.read(
          data,
          {
            type:"array"
          }
        );

      const sheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      excelData =
        XLSX.utils.sheet_to_json(
          sheet
        );

      alert(
        excelData.length +
        " data berhasil dimuat"
      );

    };

  reader.readAsArrayBuffer(
    file
  );

}

// =========================================================
// SINGLE CERTIFICATE PDF
// =========================================================

async function generateCertificate(){

  const {
    jsPDF
  } = window.jspdf;

  const doc =
    new jsPDF(
      "landscape"
    );

  const nama =
    document.getElementById(
      "certName"
    )?.value ||
    "Nama Peserta";

  doc.setFontSize(
    28
  );

  doc.text(
    nama,
    140,
    90,
    {
      align:"center"
    }
  );

  doc.save(
    "certificate.pdf"
  );

}

// =========================================================
// BATCH CERTIFICATE EXPORT
// =========================================================

async function exportAllCertificates(){

  if(
    excelData.length === 0
  ){

    alert(
      "Upload excel terlebih dahulu"
    );

    return;

  }

  const {
    jsPDF
  } = window.jspdf;

  for(

    let i = 0;
    i < excelData.length;
    i++

  ){

    const row =
      excelData[i];

    const doc =
      new jsPDF(
        "landscape"
      );

    doc.setFontSize(
      24
    );

    doc.text(
      row.NAMA ||
      row.nama ||
      "PESERTA",
      140,
      90,
      {
        align:"center"
      }
    );

    doc.save(
      `CERTIFICATE_${
        row.NAMA ||
        row.nama ||
        i
      }.pdf`
    );

  }

  alert(
    "Batch export selesai"
  );

}

// =========================================================
// CLOUD STORAGE
// =========================================================

async function uploadFile(){

  const file =
    document.getElementById(
      "fileUpload"
    )?.files?.[0];

  if(!file) return;

  const path =
    Date.now() +
    "_" +
    file.name;

  const {
    error
  } =
  await client.storage
    .from("files")
    .upload(
      path,
      file
    );

  if(error){

    alert(
      error.message
    );

    return;

  }

  loadFiles();

}

// =========================================================
// LOAD FILES
// =========================================================

async function loadFiles(){

  const box =
    document.getElementById(
      "fileList"
    );

  if(!box) return;

  const {
    data
  } =
  await client.storage
    .from("files")
    .list();

  box.innerHTML = "";

  (data || [])
  .forEach(file=>{

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "file-card";

    item.innerHTML =

      `
      📄 ${file.name}
      `;

    box.appendChild(
      item
    );

  });

}

// =========================================================
// PDF TOOLS PLACEHOLDER
// =========================================================

function mergePDF(){

  alert(
    "Merge PDF Module"
  );

}

function splitPDF(){

  alert(
    "Split PDF Module"
  );

}

function exportPDF(){

  window.print();

}

// =========================================================
// INITIALIZE EXTRA MODULES
// =========================================================

window.addEventListener(
  "load",
  ()=>{

    loadSavedTemplate();

    loadTemplateLayout();

    initCertificateStudio();

    loadBroadcastHistory();

    loadFiles();

  }
);