import { state } from "./state.js";
import { supabaseClient, loadAllLogs, loadToday } from "./db.js";
import { showLogin, showApp, render, renderProfile, renderSideHistory } from "./ui.js";

function showAuthHome(){
  document.getElementById("authHome").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("loginMessage").textContent = "";
}

export function showLoginForm(){
  document.getElementById("authHome").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("loginMessage").textContent = "";
}

export function showSignupForm(){
  document.getElementById("authHome").classList.add("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("signupForm").classList.remove("hidden");
  document.getElementById("loginMessage").textContent = "";
}

export async function initAuth(){
  const { data } = await supabaseClient.auth.getSession();

  if(data.session){
    state.currentUser = data.session.user;
    state.isGuest = false;
    await enterApp();
  } else {
    showLogin();
    showAuthHome();
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    setTimeout(async () => {
      if(session){
        state.currentUser = session.user;
        state.isGuest = false;
        await enterApp();
      } else if(!state.isGuest){
        state.currentUser = null;
        state.profile = null;
        state.allLogs = {};
        state.sets = 0;
        showLogin();
        showAuthHome();
      }
    }, 0);
  });
}

export async function enterApp(){
  showApp();

  if(state.isGuest){
    state.profile = {
      nickname: "Guest",
      avatar_url: "yrds_gpt.png"
    };
    loadToday();
    render();
    renderProfile();
    renderSideHistory();
    return;
  }

  await ensureProfile();
  await loadProfile();
  await loadAllLogs();

  loadToday();
  render();
  renderProfile();
  renderSideHistory();
}

export async function startGuestMode(){
  state.isGuest = true;
  state.currentUser = null;
  state.profile = {
    nickname: "Guest",
    avatar_url: "yrds_gpt.png"
  };

  await enterApp();
}

export async function signUp(){
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if(!email || !password){
    document.getElementById("loginMessage").textContent =
      "이메일과 비밀번호를 입력해줘.";
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  document.getElementById("loginMessage").textContent =
    error ? error.message : "회원가입 완료. 이메일 확인이 필요할 수 있어.";
}

export async function signIn(){
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if(!email || !password){
    document.getElementById("loginMessage").textContent =
      "이메일과 비밀번호를 입력해줘.";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    document.getElementById("loginMessage").textContent = error.message;
  }
}

export async function signOut(){
  state.isGuest = false;
  await supabaseClient.auth.signOut();
  showLogin();
  showAuthHome();
}

export async function ensureProfile(){
  if(!state.currentUser) return;

  await supabaseClient
    .from("profiles")
    .upsert({
      id: state.currentUser.id,
      nickname: state.currentUser.email.split("@")[0]
    }, {
      onConflict: "id",
      ignoreDuplicates: true
    });
}

export async function loadProfile(){
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", state.currentUser.id)
    .single();

  if(error){
    console.error(error);
    return;
  }

  state.profile = data;
}

export async function saveProfile(){
  if(state.isGuest){
    state.profile.nickname = document.getElementById("nicknameInput").value || "Guest";
    renderProfile();
    return;
  }

  const nickname = document.getElementById("nicknameInput").value;
  const file = document.getElementById("avatarInput").files[0];

  let avatarUrl = state.profile?.avatar_url || "yrds_gpt.png";

  if(file){
    const ext = file.name.split(".").pop();
    const path = `${state.currentUser.id}/avatar.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if(uploadError){
      alert(uploadError.message);
      return;
    }

    const { data } = supabaseClient
      .storage
      .from("avatars")
      .getPublicUrl(path);

    avatarUrl = data.publicUrl;
  }

  const { error } = await supabaseClient
    .from("profiles")
    .upsert({
      id: state.currentUser.id,
      nickname,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });

  if(error){
    alert(error.message);
    return;
  }

  await loadProfile();
}