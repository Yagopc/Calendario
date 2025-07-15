// Utilidades
function esHoy(fecha) {
  const hoy = new Date();
  return fecha.getDate() === hoy.getDate() &&
         fecha.getMonth() === hoy.getMonth() &&
         fecha.getFullYear() === hoy.getFullYear();
}
function getDiaSemana(fecha) { // 1=lunes ... 7=domingo
  return fecha ? ((fecha.getDay() === 0) ? 7 : fecha.getDay()) : null;
}

// Estado calendario
let monthActual = new Date().getMonth();
let yearActual = new Date().getFullYear();
let modoEdicion = "color"; // color, note, alert
let bloqueado = false;
let datos = {}; // { 'YYYY-MM-DD': { color, note, alert } }

// Colores disponibles
const colorList = ["white", "yellow", "red", "blue", "orange"];
// Elementos DOM
const calendarGrid = document.getElementById("calendarGrid");
const monthYear = document.getElementById("monthYear");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const editColor = document.getElementById("editColor");
const editNote = document.getElementById("editNote");
const editAlert = document.getElementById("editAlert");
const lockBtn = document.getElementById("lockBtn");
const statusBar = document.getElementById("statusBar");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const syncBtn = document.getElementById("syncBtn");
const efemeridesBtn = document.getElementById("efemeridesBtn");
const alertModal = document.getElementById("alertModal");
const noteModal = document.getElementById("noteModal");
const lockOverlay = document.getElementById("lockOverlay");

function pad2(n) { return n < 10 ? '0'+n : ''+n; }
function fechaKey(fecha) {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth()+1)}-${pad2(fecha.getDate())}`;
}

function getContrastColor(backgroundColor) {
  // Lista de colores "claros" (usarán texto negro)
  const lightColors = ['white', '#FFF59D', '#FFCCBC', '#B3E5FC', '#FFA500', '#FFF59D', '#FFCCBC'];
  
  // Si el fondo está en la lista de claros, texto negro; sino, blanco
  return lightColors.includes(backgroundColor) ? '#000' : '#FFF';
}


// Añade esto al inicio del archivo, con las otras funciones utilitarias
function getDiaEspecial(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  
  if (mes === 3 && dia === 20) return "spring"; // 20 marzo - primavera
  if (mes === 3 && dia === 30) return "clock"; // 30 marzo - reloj
  if (mes === 6 && dia === 21) return "sun"; // 21 junio - sol
  if (mes === 9 && dia === 22) return "leaf"; // 22 septiembre - hoja
  if (mes === 10 && dia === 26) return "clock"; // 26 octubre - reloj
  if (mes === 12 && dia === 21) return "snowflake"; // 21 diciembre - copo nieve
  return null;
}
function renderCalendar() {
  // Mes actual
  const primerDia = new Date(yearActual, monthActual, 1);
  const ultimoDia = new Date(yearActual, monthActual+1, 0);
  monthYear.textContent = primerDia.toLocaleString('es-ES', {month:'long'}) + " " + yearActual;
  calendarGrid.innerHTML = "";
  // Offset: primer día de la semana (lunes=1, domingo=7)
  let offset = getDiaSemana(primerDia) - 1;
  for (let i=0; i<offset; i++) {
    const cell = document.createElement('div');
    cell.className = "day-cell";
    calendarGrid.appendChild(cell);
  }
  for (let d=1; d<=ultimoDia.getDate(); d++) {
    const fecha = new Date(yearActual, monthActual, d);
    const key = fechaKey(fecha);
    const cell = document.createElement('div');
    cell.classList.add("day-cell");
    cell.dataset.date = key;
    // Coloreado por tipo
    if (esHoy(fecha)) cell.classList.add("today");
    const diaSemana = getDiaSemana(fecha);
    if (diaSemana === 6 || diaSemana === 7) cell.classList.add("weekend");
    if (diaSemana === 2) cell.classList.add("tuesday");
    // Colores personalizados
    const dia = datos[key] || {};
    if (dia.color && dia.color !== "white")
      cell.classList.add(dia.color);
    // Número
    cell.innerHTML = `<span>${d}</span>`;
    // Nota
    // Nota (con color dinámico)
if (dia.note) {
  const bgColor = dia.color ? getComputedStyle(cell).backgroundColor : '#FFF'; // Fondo predeterminado blanco
  const textColor = getContrastColor(dia.color || 'white'); // Usa la función de contraste
  cell.innerHTML += `<div class="day-note" style="color: ${textColor}">${dia.note}</div>`;
}
    // Aviso
    if (dia.alert) {
      cell.innerHTML += `<div class="day-alert"><i class="fas fa-bell"></i></div>`;
    }
    // Click
    cell.onclick = function() {
      if (bloqueado) return;
      if (modoEdicion === "color") {
        let idx = colorList.indexOf(dia.color || "white");
        idx = (idx+1)%colorList.length;
        dia.color = colorList[idx];
        datos[key] = dia;
        guardarDatos();
        renderCalendar();
      } else if (modoEdicion === "note") {
        abrirModalNota(key, dia.note);
      } else if (modoEdicion === "alert") {
        abrirModalAviso(key, dia.alert);
      }
    };

// Icono día especial
const diaEspecial = getDiaEspecial(fecha);
if (diaEspecial) {
  let icono = "";
  switch(diaEspecial) {
    case "spring": icono = "fa-seedling"; break;
    case "clock": icono = "fa-clock"; break;
    case "sun": icono = "fa-sun"; break;
    case "leaf": icono = "fa-leaf"; break;
    case "snowflake": icono = "fa-snowflake"; break;
  }
  cell.innerHTML += `<div class="day-special"><i class="fas ${icono}"></i></div>`;
}
    calendarGrid.appendChild(cell);
  }
  // Actualiza overlay bloqueo
  lockOverlay.style.display = bloqueado ? "block" : "none";
  // Icono bloqueo
  lockBtn.innerHTML = bloqueado ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-unlock"></i>';
}

function guardarDatos() {
  localStorage.setItem("calendarioDatos", JSON.stringify(datos));
}
function cargarDatos() {
  try {
    datos = JSON.parse(localStorage.getItem("calendarioDatos") || "{}");
  } catch {
    datos = {};
  }
}
function showStatus(msg, tiempo=1800) {
  statusBar.textContent = msg;
  statusBar.style.opacity = "1";
  setTimeout(() => { statusBar.style.opacity = "0"; }, tiempo);
}

// Navegación meses
btnPrev.onclick = () => { monthActual--; if (monthActual<0) { monthActual=11; yearActual--; } renderCalendar(); };
btnNext.onclick = () => { monthActual++; if (monthActual>11) { monthActual=0; yearActual++; } renderCalendar(); };

// Modos edición
editColor.onclick = () => { modoEdicion="color"; showStatus("Modo: Color"); };
editNote.onclick = () => { modoEdicion="note"; showStatus("Modo: Nota"); };
editAlert.onclick = () => { modoEdicion="alert"; showStatus("Modo: Aviso"); };

// Bloquear/desbloquear
lockBtn.onclick = () => {
  bloqueado = !bloqueado;
  showStatus(bloqueado? "Calendario bloqueado":"Calendario desbloqueado");
  renderCalendar();
};

// Exportar JSON
exportBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(datos, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "datoscalendario.json";
  a.click();
  showStatus("Exportado a JSON");
};
// Importar JSON
importBtn.onclick = () => {
  const input = document.createElement('input');
  input.type = "file";
  input.accept = "application/json";
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        datos = JSON.parse(evt.target.result);
        guardarDatos();
        renderCalendar();
        showStatus("Importación exitosa");
      } catch {
        showStatus("Error al importar");
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

// Sincronizar desde URL
syncBtn.onclick = () => {
  showStatus("Cargando datos...");
  fetch("https://yagopc.github.io/Calendario/datoscalendario.json")
    .then(r=>r.json()).then(j=>{
      datos = j; guardarDatos(); renderCalendar();
      showStatus("Sincronización exitosa");
    }).catch(()=>showStatus("Error al sincronizar"));
};

// Efemérides
efemeridesBtn.onclick = () => {
  window.open("https://www.hechoshistoricos.es", "_blank");
};

// Modal nota
function abrirModalNota(fecha, valor) {
  noteModal.style.display = "flex";
  document.getElementById("noteInput").value = valor || "";
  noteModal.dataset.fecha = fecha;
}
document.getElementById("saveNoteBtn").onclick = () => {
  const fecha = noteModal.dataset.fecha;
  const val = document.getElementById("noteInput").value.slice(0,3);
  datos[fecha] = datos[fecha]||{};
  datos[fecha].note = val;
  guardarDatos();
  noteModal.style.display = "none";
  renderCalendar();
};
document.getElementById("deleteNoteBtn").onclick = () => {
  const fecha = noteModal.dataset.fecha;
  if (datos[fecha]) delete datos[fecha].note;
  guardarDatos();
  noteModal.style.display = "none";
  renderCalendar();
};
document.getElementById("closeNoteBtn").onclick = () => {
  noteModal.style.display = "none";
};

// Modal aviso
function abrirModalAviso(fecha, valor) {
  alertModal.style.display = "flex";
  document.getElementById("alertText").value = valor || "";
  alertModal.dataset.fecha = fecha;
}
document.getElementById("saveAlertBtn").onclick = () => {
  const fecha = alertModal.dataset.fecha;
  const val = document.getElementById("alertText").value.slice(0,48);
  datos[fecha] = datos[fecha]||{};
  datos[fecha].alert = val;
  guardarDatos();
  alertModal.style.display = "none";
  renderCalendar();
};
document.getElementById("deleteAlertBtn").onclick = () => {
  const fecha = alertModal.dataset.fecha;
  if (datos[fecha]) delete datos[fecha].alert;
  guardarDatos();
  alertModal.style.display = "none";
  renderCalendar();
};
document.getElementById("closeAlertBtn").onclick = () => {
  alertModal.style.display = "none";
};

// Inicialización
cargarDatos();
renderCalendar();
showStatus("Modo: Color");