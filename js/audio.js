import { state } from "./state.js";

export function getAudioContext(){
  if(!state.audioCtx){
    state.audioCtx = new AudioContext();
  }

  if(state.audioCtx.state === "suspended"){
    state.audioCtx.resume();
  }

  return state.audioCtx;
}

export function buildBeats(){
  const beatsEl = document.getElementById("beats");
  const sub = parseInt(document.getElementById("subdivision").value);
  const total = 4 * sub;

  beatsEl.innerHTML = "";
  beatsEl.style.gridTemplateColumns = `repeat(${total}, 1fr)`;

  for(let i = 0; i < total; i++){
    const b = document.createElement("div");
    b.className = "beat";
    beatsEl.appendChild(b);
  }
}

function playClick(time, isAccent, isMain){
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.frequency.value = isAccent ? 1400 : isMain ? 900 : 600;
  g.gain.value = isAccent ? 0.35 : isMain ? 0.25 : 0.12;

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.05);
}

function flash(stepIndex){
  const beats = document.querySelectorAll(".beat");
  const sub = parseInt(document.getElementById("subdivision").value);

  const accentColor = "#fc7903";
  const subColor = "#3f7fb5";

  beats.forEach((b, i) => {
    const isQuarterBeat = i % sub === 0;

    b.style.background = isQuarterBeat ? accentColor : subColor;
    b.style.opacity = 0.4;
    b.classList.remove("active");
  });

  if(beats[stepIndex]){
    beats[stepIndex].classList.add("active");
    beats[stepIndex].style.opacity = 1;
  }
}

function scheduler(){
  const ctx = getAudioContext();
  const bpm = parseInt(document.getElementById("bpm").value);
  const sub = parseInt(document.getElementById("subdivision").value);
  const interval = 60 / bpm / sub;
  const total = 4 * sub;

  while(state.nextTime < ctx.currentTime + 0.1){
    const pos = state.step % total;
    const isAccent = pos === 0;
    const isMain = pos % sub === 0;

    playClick(state.nextTime, isAccent, isMain);

    setTimeout(() => flash(pos), (state.nextTime - ctx.currentTime) * 1000);

    state.nextTime += interval;
    state.step++;
  }
}

export function toggleMetronome(){
  const ctx = getAudioContext();
  const metroButton = document.getElementById("metroButton");

  if(state.metroId){
    clearInterval(state.metroId);
    state.metroId = null;
    metroButton.textContent = "Metronome";
    return;
  }

  state.nextTime = ctx.currentTime;
  state.step = 0;
  state.metroId = setInterval(scheduler, 25);
  metroButton.textContent = "Stop";
}

export function playNote(freq){
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const output = ctx.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.7, now + 0.01);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
  output.connect(ctx.destination);

  const harmonics = [
    { ratio: 1, gain: 0.55 },
    { ratio: 2, gain: 0.25 },
    { ratio: 3, gain: 0.12 },
    { ratio: 4, gain: 0.07 },
    { ratio: 5, gain: 0.04 }
  ];

  harmonics.forEach(h => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = freq * h.ratio;

    gain.gain.setValueAtTime(h.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc.connect(gain);
    gain.connect(output);

    osc.start(now);
    osc.stop(now + 3.0);
  });
}