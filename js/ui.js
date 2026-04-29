import { CHART_DAYS, GRID_CELLS, SET_SECONDS } from "./config.js";
import { state } from "./state.js";
import { dateKey, getSetsForDate } from "./db.js";

export function formatTime(s){
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function getRecentData(days = CHART_DAYS){
  const data = [];

  for(let i = days - 1; i >= 0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);

    const key = dateKey(d);
    data.push({
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      sets: getSetsForDate(key),
      isToday: i === 0
    });
  }

  return data;
}

export function calcStreak(){
  let s = 0;
  const d = new Date();

  while(true){
    const key = dateKey(d);
    if(getSetsForDate(key) > 0){
      s++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return s;
}

export function buildGrid(){
  const gridEl = document.getElementById("grid");
  gridEl.innerHTML = "";

  for(let i = 0; i < GRID_CELLS; i++){
    const c = document.createElement("div");
    c.className = "cell";
    gridEl.appendChild(c);
  }
}

export function renderGrid(){
  document.querySelectorAll(".cell").forEach((c, i) => {
    c.classList.toggle("filled", i < state.sets);
  });
}

export function renderChart(){
  const chartEl = document.getElementById("chart");
  const data = getRecentData();
  const maxSets = Math.max(...data.map(d => d.sets), 1);

  chartEl.innerHTML = "";
  chartEl.style.gridTemplateColumns = `repeat(${CHART_DAYS}, 1fr)`;

  data.forEach(item => {
    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";

    const count = document.createElement("div");
    count.className = "bar-count";
    count.textContent = item.sets > 0 ? item.sets : "";

    const bar = document.createElement("div");
    bar.className = item.isToday ? "bar today" : "bar";
    bar.style.height = `${Math.max((item.sets / maxSets) * 100, item.sets > 0 ? 8 : 3)}%`;

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = item.label;

    wrap.appendChild(count);
    wrap.appendChild(bar);
    wrap.appendChild(label);
    chartEl.appendChild(wrap);
  });
}

export function renderSideHistory(){
  const data = getRecentData(30).slice().reverse();

  document.getElementById("sideHistory").innerHTML = data
    .map(item => `${item.key}: ${item.sets}세트`)
    .join("<br>");
}

export function renderProfile(){
  const nickname = state.profile?.nickname || "me";
  const avatarUrl = state.profile?.avatar_url || "yrds_gpt.png";

  document.getElementById("topNickname").textContent = nickname;
  document.getElementById("topAvatar").src = avatarUrl;

  document.getElementById("sideNickname").textContent = nickname;
  document.getElementById("profilePreview").src = avatarUrl;

  document.getElementById("nicknameInput").value = nickname;
}

export function render(){
  document.getElementById("timer").textContent = formatTime(state.remaining);

  const todayEl = document.getElementById("today");
  if (todayEl) {
    todayEl.textContent = state.sets;
    document.getElementById("streak").textContent = calcStreak();
  }

  renderGrid();
  renderChart();
}

export function resetTimerView(){
  state.remaining = SET_SECONDS;
  render();
}

export function showLogin(){
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("appScreen").classList.add("hidden");
}

export function showApp(){
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
}

export function showPracticeView(){
  document.getElementById("practiceView").classList.remove("hidden");
  document.getElementById("recordView").classList.add("hidden");
}

export function showRecordView(){
  document.getElementById("practiceView").classList.add("hidden");
  document.getElementById("recordView").classList.remove("hidden");
  render();
}


export function openSideMenu(){
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById("sideMenu").classList.add("open");
}

export function closeSideMenu(){
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("sideMenu").classList.remove("open");
}