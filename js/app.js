import { SET_SECONDS } from "./config.js";
import { state } from "./state.js";
import { saveToday, deleteToday as deleteTodayFromDb, loadToday } from "./db.js";
import {
  initAuth,
  signIn,
  signUp,
  signOut,
  saveProfile,
  loadProfile,
  showLoginForm,
  showSignupForm,
  startGuestMode
} from "./auth.js";
import {
  buildGrid,
  render,
  resetTimerView,
  openSideMenu,
  closeSideMenu,
  renderProfile,
  showPracticeView,
  showRecordView
} from "./ui.js";
import { buildBeats, toggleMetronome, playNote } from "./audio.js";

function startTimer(){
  if(state.timerId) return;

  state.timerId = setInterval(async () => {
    state.remaining--;

    if(state.remaining <= 0){
      state.sets++;
      await saveToday();

      state.remaining = 0;
      pauseTimer();
      render();
      renderSideHistory();
      return;
    }

    render();
  }, 1000);
}

function pauseTimer(){
  clearInterval(state.timerId);
  state.timerId = null;
}

function resetTimer(){
  pauseTimer();
  state.remaining = SET_SECONDS;
  render();
}

async function deleteToday(){
  const ok = confirm("오늘 기록을 삭제할까?");
  if(!ok) return;

  await deleteTodayFromDb();
  loadToday();
  resetTimerView();
  renderSideHistory();
}

function bindEvents(){

  document.getElementById("showLoginButton").addEventListener("click", showLoginForm);
  document.getElementById("showSignupButton").addEventListener("click", showSignupForm);
  document.getElementById("guestButton").addEventListener("click", startGuestMode);

  document.getElementById("showMyRecordButton").addEventListener("click", () => {
    closeSideMenu();
    showRecordView();
  });

  document.getElementById("backToPracticeButton").addEventListener("click", () => {
    showPracticeView();
  });

  document.querySelectorAll(".back-auth-button").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById("authHome").classList.remove("hidden");
      document.getElementById("loginForm").classList.add("hidden");
      document.getElementById("signupForm").classList.add("hidden");
      document.getElementById("loginMessage").textContent = "";
    });
  });

  document.getElementById("signInButton").addEventListener("click", signIn);
  document.getElementById("signUpButton").addEventListener("click", signUp);
  document.getElementById("signOutButton").addEventListener("click", signOut);

  document.getElementById("startButton").addEventListener("click", startTimer);
  document.getElementById("pauseButton").addEventListener("click", pauseTimer);
  document.getElementById("resetButton").addEventListener("click", resetTimer);
  document.getElementById("deleteTodayButton").addEventListener("click", deleteToday);

  document.getElementById("metroButton").addEventListener("click", toggleMetronome);

  document.getElementById("bpm").addEventListener("input", () => {
    document.getElementById("bpmValue").textContent =
      document.getElementById("bpm").value;
  });

  document.getElementById("subdivision").addEventListener("change", buildBeats);

  document.querySelectorAll(".tuner-button").forEach(button => {
    button.addEventListener("click", () => {
      playNote(parseFloat(button.dataset.note));
    });
  });

  document.getElementById("showMyRecordButton").addEventListener("click", () => {
    document.getElementById("sideMain").classList.add("hidden");
    document.getElementById("profilePanel").classList.add("hidden");
    document.getElementById("recordPanel").classList.remove("hidden");
    render();
  });

  document.querySelectorAll(".back-menu-button").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById("sideMain").classList.remove("hidden");
      document.getElementById("profilePanel").classList.add("hidden");
      document.getElementById("recordPanel").classList.add("hidden");
    });
  });

  document.getElementById("editProfileButton").addEventListener("click", () => {
    document.getElementById("profileEditForm").classList.remove("hidden");
  });

  document.getElementById("cancelProfileEditButton").addEventListener("click", () => {
    document.getElementById("profileEditForm").classList.add("hidden");
  });

  document.getElementById("userButton").addEventListener("click", openSideMenu);
  document.getElementById("overlay").addEventListener("click", closeSideMenu);
  document.getElementById("closeSideMenuButton").addEventListener("click", closeSideMenu);

  document.getElementById("saveProfileButton").addEventListener("click", async () => {
    await saveProfile();
    await loadProfile();
    renderProfile();
    document.getElementById("profileEditForm").classList.add("hidden");
  });

}

function init(){
  buildGrid();
  buildBeats();
  bindEvents();
  initAuth();
}

init();