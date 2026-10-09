export const SEEN_KEY = "loaded";

/** Inline in <head>, runs before first paint: hides the loading screen once this session has loaded. */
export const SEEN_SCRIPT = `try{sessionStorage.getItem("${SEEN_KEY}")&&document.documentElement.setAttribute("data-seen","")}catch(e){}`;
