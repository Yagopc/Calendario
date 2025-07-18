// Utilidades

function getEstacion(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  
  // Primavera: 20 marzo - 20 junio
  if ((mes === 3 && dia >= 20) || (mes > 3 && mes < 6) || (mes === 6 && dia <= 20)) 
    return "primavera";
  // Verano: 21 junio - 22 septiembre
  if ((mes === 6 && dia >= 21) || (mes > 6 && mes < 9) || (mes === 9 && dia <= 22)) 
    return "verano";
  // Otoño: 23 septiembre - 20 diciembre
  if ((mes === 9 && dia >= 23) || (mes > 9 && mes < 12) || (mes === 12 && dia <= 20)) 
    return "otoño";
  // Invierno: 21 diciembre - 19 marzo
  return "invierno";
}

// URLs de los fondos para cada estación
const fondosEstacion = {
  primavera: "https://img.pikbest.com/backgrounds/20250224/elegant-spring-background--e2-80-93-soft-natural-hues-with-minimalist-floral-design-elements_11551508.jpg!w700wp",
  verano: "https://img.pikbest.com/backgrounds/20190318/simple-summer-water-pattern-background_1877317.jpg!sw800",
  otoño: "https://images.unsplash.com/photo-1637162330294-28cc8540d41d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXV0dW1uJTIwYmFja2dyb3VuZHxlbnwwfHwwfHx8MA%3D%3D",
  invierno: "https://images.pexels.com/photos/1978126/pexels-photo-1978126.jpeg?cs=srgb&dl=pexels-weekendplayer-1978126.jpg&fm=jpg"
};

// Función para actualizar el fondo según la estación
function actualizarFondo() {
  const estacion = getEstacion(new Date(yearActual, monthActual, 1));
  document.body.style.backgroundImage = `url(${fondosEstacion[estacion]})`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundAttachment = "fixed";
  document.body.style.backgroundPosition = "center";
}
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

// Modifica la función getContrastColor para que sea más precisa

function getContrastColor(backgroundColor) {
  // Mapeo de colores nombrados a HEX
  const colorMap = {
    white: '#FFFFFF',
    yellow: '#FFF59D',
    red: '#FFCCBC',
    blue: '#B3E5FC',
    orange: '#FFA500',
    black: '#000000',
    // Agrega más colores si es necesario
  };
  
  // Obtener el color HEX (si es un nombre) o usar el valor directamente
  let hexColor = colorMap[backgroundColor.toLowerCase()] || backgroundColor;
  
  // Si el color no empieza con #, asumimos que es inválido y usamos blanco
  if (!hexColor.startsWith('#')) {
    console.warn(`Color no válido: ${backgroundColor}, usando blanco como fallback`);
    hexColor = '#FFFFFF';
  }
  
  // Asegurarnos que el color HEX tenga 6 dígitos (puede venir en formato #FFF)
  if (hexColor.length === 4) {
    hexColor = `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`;
  }
  
  try {
    // Convertir color HEX a RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calcular luminosidad (fórmula WCAG)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  } catch (e) {
    console.error(`Error al procesar color: ${hexColor}`, e);
    return '#000000'; // Fallback a negro si hay error
  }
}
 

function getDiaEspecial(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  
  if (mes === 3 && dia === 20) return "spring";
  if (mes === 3 && dia === 30) return "clock";
  if (mes === 6 && dia === 21) return "sun";
  if (mes === 9 && dia === 22) return "leaf";
  if (mes === 10 && dia === 26) return "clock";
  if (mes === 12 && dia === 21) return "snowflake";
  return null;
}

function renderCalendar() {

  actualizarFondo();
  
 

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

  // Resaltar día actual en cabecera
  const hoy = new Date();
  if (hoy.getFullYear() === yearActual && hoy.getMonth() === monthActual) {
    const diaSemanaHoy = getDiaSemana(hoy);
    const weekdays = document.querySelectorAll('.weekdays span');
    weekdays.forEach((span, index) => {
      if (index + 1 === diaSemanaHoy) {
        span.style.backgroundColor = '#4e54c8';
        span.style.color = 'white';
      }
    });
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
    
    // Nota (con color dinámico)
    if (dia.note) {
      const bgColor = dia.color ? getComputedStyle(cell).backgroundColor : '#FFF';
      const textColor = getContrastColor(dia.color || 'white');
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
  
  // Marcar botón activo
  document.querySelectorAll('.edit-btn').forEach(b => b.classList.remove('active'));
  if (modoEdicion === "color") editColor.classList.add('active');
  if (modoEdicion === "note") editNote.classList.add('active');
  if (modoEdicion === "alert") editAlert.classList.add('active');
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
btnPrev.onclick = () => { 
  monthActual--; 
  if (monthActual<0) { 
    monthActual=11; 
    yearActual--; 
  } 
  renderCalendar(); 
};

btnNext.onclick = () => { 
  monthActual++; 
  if (monthActual>11) { 
    monthActual=0; 
    yearActual++; 
  } 
  renderCalendar(); 
};

// Modos edición
editColor.onclick = () => { 
  modoEdicion = "color"; 
  document.querySelectorAll('.edit-btn').forEach(b => b.classList.remove('active'));
  editColor.classList.add('active');
  showStatus("Modo: Color"); 
};

editNote.onclick = () => { 
  modoEdicion = "note"; 
  document.querySelectorAll('.edit-btn').forEach(b => b.classList.remove('active'));
  editNote.classList.add('active');
  showStatus("Modo: Nota"); 
};

editAlert.onclick = () => { 
  modoEdicion = "alert"; 
  document.querySelectorAll('.edit-btn').forEach(b => b.classList.remove('active'));
  editAlert.classList.add('active');
  showStatus("Modo: Aviso"); 
};

// Bloquear/desbloquear
lockBtn.onclick = () => {
  bloqueado = !bloqueado;
  showStatus(bloqueado ? "Calendario bloqueado" : "Calendario desbloqueado");
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
    .then(r=>r.json())
    .then(j=>{
      datos = j; 
      guardarDatos(); 
      renderCalendar();
      showStatus("Sincronización exitosa");
    })
    .catch(()=>showStatus("Error al sincronizar"));
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


cargarDatos();
renderCalendar();
showStatus("Modo: Color");