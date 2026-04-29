import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { state } from "./state.js";

export const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export function dateKey(date = new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getSetsForDate(key){
  return state.allLogs[key] || 0;
}

export async function loadAllLogs(){
  if(state.isGuest){
    state.allLogs = {};

    Object.keys(localStorage).forEach(key => {
      if(key.startsWith("guest-practice-")){
        const date = key.replace("guest-practice-", "");
        state.allLogs[date] = parseInt(localStorage.getItem(key)) || 0;
      }
    });

    return;
  }

  if(!state.currentUser) return;

  const { data, error } = await supabaseClient
    .from("practice_logs")
    .select("date, sets")
    .eq("user_id", state.currentUser.id);

  if(error){
    console.error(error);
    return;
  }

  state.allLogs = {};
  data.forEach(row => {
    state.allLogs[row.date] = row.sets;
  });
}

export function loadToday(){
  state.sets = getSetsForDate(dateKey());
}

export async function saveToday(){
  if(state.isGuest){
    state.allLogs[dateKey()] = state.sets;
    localStorage.setItem(`guest-practice-${dateKey()}`, state.sets);
    return;
  }

  if(!state.currentUser){
    alert("로그인해야 기록이 저장돼.");
    return;
  }

  state.allLogs[dateKey()] = state.sets;

  const { error } = await supabaseClient
    .from("practice_logs")
    .upsert({
      user_id: state.currentUser.id,
      date: dateKey(),
      sets: state.sets
    }, {
      onConflict: "user_id,date"
    });

  if(error){
    console.error(error);
    alert("저장 실패");
  }
}

export async function deleteToday(){
  if(state.isGuest){
    localStorage.removeItem(`guest-practice-${dateKey()}`);
    delete state.allLogs[dateKey()];
    state.sets = 0;
    return;
  }

  if(!state.currentUser) return;

  const { error } = await supabaseClient
    .from("practice_logs")
    .delete()
    .eq("user_id", state.currentUser.id)
    .eq("date", dateKey());

  if(error){
    alert(error.message);
    return;
  }

  delete state.allLogs[dateKey()];
  state.sets = 0;
}