import { SET_SECONDS } from "./config.js";

export const state = {
  currentUser: null,
  profile: null,
  allLogs: {},
  sets: 0,
  remaining: SET_SECONDS,
  timerId: null,
  audioCtx: null,
  metroId: null,
  nextTime: 0,
  step: 0
};