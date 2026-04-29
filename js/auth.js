import { state } from "./state.js";
import { supabaseClient, loadAllLogs, loadToday } from "./db.js";
import { showLogin, showApp, render, renderProfile, renderSideHistory } from "./ui.js";

export async function initAuth(){
  const { data } = await supabaseClient.auth.getSession();

  if(data.session){
    state.currentUser = data.session.user;
    await enterApp();
  } else {
    showLogin();
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    setTimeout(async () => {
      if(session){
        state.currentUser = session.user;
        await enterApp();
      } else {
        state.currentUser = null;
        state.profile = null;
        state.allLogs = {};
        state.sets = 0;
        showLogin();
      }
    }, 0);
  });
}

export async function enterApp(){
  showApp();

  await ensureProfile();
  await loadProfile();
  await loadAllLogs();

  loadToday();
  render();
  renderProfile();
  renderSideHistory();
}

export async function signUp(){
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { error } = await supabaseClient.auth.signUp({ email, password });

  document.getElementById("loginMessage").textContent =
    error ? error.message : "회원가입 완료. 이메일 확인이 필요할 수 있어.";
}

export async function signIn(){
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    document.getElementById("loginMessage").textContent = error.message;
  }
}

export async function signOut(){
  await supabaseClient.auth.signOut();
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