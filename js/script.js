/* ===== Helpers & state ===== */
const $ = (s, r=document)=>r.querySelector(s);
const STORAGE_KEY = "revou_todos_v1";

const state = { todos: [], filter: "all", search: "" };

/** @typedef {{id:string,title:string,due:string,done:boolean,created:number}} Todo */

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos)); }
function load(){
  try{ state.todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch{ state.todos = []; }
}

/* ===== DOM refs ===== */
const form = $("#todoForm");
const taskInput = $("#taskInput");
const dateInput = $("#dateInput");
const errorBox = $("#errorBox");
const listEl = $("#todoList");
const emptyEl = $("#emptyState");
const statusFilter = $("#statusFilter");
const searchInput = $("#searchInput");
const clearAllBtn = $("#clearAllBtn");

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  // min date = hari ini
  const today = new Date().toISOString().slice(0,10);
  dateInput.min = today;

  load();
  render();

  form.addEventListener("submit", onSubmit);
  statusFilter.addEventListener("change", () => { state.filter = statusFilter.value; render(); });
  searchInput.addEventListener("input", () => { state.search = searchInput.value.trim().toLowerCase(); render(); });
  clearAllBtn.addEventListener("click", onClearAll);
});

/* ===== Handlers ===== */
function onSubmit(e){
  e.preventDefault(); hideError();

  const title = taskInput.value.trim();
  const due = dateInput.value;

  if(!title) return showError("Nama tugas tidak boleh kosong.");
  if(!due) return showError("Tanggal harus diisi.");
  const dueDate = new Date(due+"T00:00:00");
  const today = new Date(new Date().toISOString().slice(0,10)+"T00:00:00");
  if(isNaN(dueDate.getTime())) return showError("Tanggal tidak valid.");
  if(dueDate < today) return showError("Tanggal tidak boleh di masa lalu.");

  const todo = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title, due, done:false, created: Date.now()
  };
  state.todos.unshift(todo);
  save();
  form.reset();
  dateInput.min = new Date().toISOString().slice(0,10);
  render();
}

function onToggle(id){
  const t = state.todos.find(x=>x.id===id);
  if(!t) return;
  t.done = !t.done;
  save(); render();
}

function onDelete(id){
  state.todos = state.todos.filter(x=>x.id!==id);
  save(); render();
}

function onClearAll(){
  if(state.todos.length===0) return;
  if(!confirm("Hapus semua tugas?")) return;
  state.todos = []; save(); render();
}

/* ===== Render ===== */
function render(){
  const rows = getVisibleTodos();

  listEl.innerHTML = "";
  if(rows.length===0){ emptyEl.style.display="block"; }
  else{
    emptyEl.style.display="none";
    rows.forEach(t => listEl.appendChild(renderItem(t)));
  }
}

function getVisibleTodos(){
  const today = new Date().toISOString().slice(0,10);
  return state.todos
    .filter(t => t.title.toLowerCase().includes(state.search))
    .filter(t => {
      if(state.filter==="pending") return !t.done;
      if(state.filter==="done") return t.done;
      if(state.filter==="overdue") return !t.done && t.due < today;
      return true;
    })
    .sort((a,b)=> a.done - b.done || a.due.localeCompare(b.due) || b.created - a.created);
}

function renderItem(t){
  const li = document.createElement("li");
  li.className = "item" + (t.done ? " done" : "");

  // tombol bulat (checked/unchecked) -> toggle
  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.type = "button";
  toggle.title = t.done ? "Mark Pending" : "Mark Done";
  toggle.addEventListener("click", ()=>onToggle(t.id));

  // judul + due + badge
  const textWrap = document.createElement("div");
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = t.title;

  const meta = document.createElement("div");
  meta.className = "meta";
  const d = new Date(t.due+"T00:00:00");
  const dueStr = d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"});

  const today = new Date().toISOString().slice(0,10);
  const overdue = !t.done && t.due < today;

  const badge = document.createElement("span");
  badge.className = "badge" + (t.done ? " done" : overdue ? " overdue" : "");
  badge.textContent = t.done ? "Done" : overdue ? "Overdue" : "Pending";

  meta.textContent = dueStr + " • ";
  meta.appendChild(badge);

  textWrap.append(title, meta);

  // aksi: delete (x)
  const actions = document.createElement("div");
  actions.className = "actions";
  const del = document.createElement("button");
  del.className = "btn-del";
  del.type = "button";
  del.setAttribute("aria-label","Delete");
  del.textContent = "×";
  del.addEventListener("click", ()=>onDelete(t.id));
  actions.appendChild(del);

  li.append(toggle, textWrap, actions);
  return li;
}

/* ===== Error UI ===== */
function showError(msg){ errorBox.textContent = msg; errorBox.hidden = false; }
function hideError(){ errorBox.hidden = true; errorBox.textContent = ""; }
