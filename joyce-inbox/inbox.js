// Send to Joyce: receives AdaptedMind's recent-lessons page from the bookmark button (which runs
// on adaptedmind.com, in the grown-up's own signed-in browser) and posts it to /api/joyce-inbox.
// The inbox key lives only in this site's storage on this device; it is never in the bookmark.

const KEY_NAME = "joyce-inbox-key";
const ADAPTEDMIND = /^https:\/\/(?:www\.)?adaptedmind\.com$/;
const SITE = location.origin;

const $ = (id) => document.getElementById(id);
const statusLine = $("status");
let pending = null;
let busy = false;

function readKey() {
  try { return localStorage.getItem(KEY_NAME) || ""; } catch { return ""; }
}

function writeKey(value) {
  try { localStorage.setItem(KEY_NAME, value); return true; } catch { return false; }
}

function show(text, kind = "") {
  statusLine.textContent = text;
  statusLine.className = `status ${kind}`.trim();
}

async function send(report) {
  const key = readKey();
  if (!key) {
    pending = report;
    $("setup").hidden = false;
    show("Add the inbox key below, and this page will send it.", "no");
    $("key").focus();
    return;
  }
  if (busy) return;
  busy = true;
  show("Sending to Joyce...");
  try {
    const res = await fetch("/api/joyce-inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ source: "adaptedmind-panel", kid: "max", text: report.text })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      $("setup").hidden = false;
      pending = report;
      show("That inbox key didn't work. Paste it again below.", "no");
      return;
    }
    if (!res.ok) {
      show(data.error || "Joyce couldn't take it just now. Try again in a minute.", "no");
      return;
    }
    pending = null;
    show(data.say || "Joyce got it.", "ok");
  } catch {
    show("No connection. Try again when you're online.", "no");
  } finally {
    busy = false;
  }
}

// The bookmark keeps offering the page until this window says it got it.
let received = false;
window.addEventListener("message", (event) => {
  if (!ADAPTEDMIND.test(event.origin)) return;
  const data = event.data;
  if (!data || data.type !== "joyce-inbox" || typeof data.text !== "string") return;
  try { event.source?.postMessage("joyce-inbox:got", event.origin); } catch { /* The bookmark stops on its own. */ }
  if (received) return;
  received = true;
  send({ text: data.text });
});

$("keyForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = $("key").value.trim();
  if (!value) return;
  if (!writeKey(value)) {
    show("This browser won't save the key (private browsing?). Try a normal window.", "no");
    return;
  }
  $("key").value = "";
  $("setup").hidden = true;
  if (pending) send(pending);
  else show("Key saved. Now use the button on AdaptedMind's recent lessons page.", "ok");
});

$("send").addEventListener("click", () => {
  const text = $("paste").value.trim();
  if (!text) {
    show("Paste the recent lessons text first.", "no");
    return;
  }
  send({ text });
});

// The bookmark: one line of JavaScript that runs on the AdaptedMind page.
const bookmarklet = `javascript:(()=>{const S=${JSON.stringify(SITE)};const w=window.open(S+"/joyce-inbox/","joyce-inbox");if(!w){alert("Allow this page to open a window, then tap Send to Joyce again.");return;}const m={type:"joyce-inbox",text:document.body.innerText.slice(0,30000)};let n=0;const t=setInterval(()=>{try{w.postMessage(m,S)}catch(e){}if(++n>80)clearInterval(t)},250);addEventListener("message",e=>{if(e.origin===S&&e.data==="joyce-inbox:got")clearInterval(t)})})()`;
const link = $("bookmarklet");
link.href = bookmarklet;
link.addEventListener("click", (event) => {
  event.preventDefault();
  show("Drag this button to your bookmarks bar, then use it on AdaptedMind's page.");
});

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(bookmarklet);
    show("Copied. Paste it as the address of a bookmark named Send to Joyce.", "ok");
  } catch {
    show("Copying didn't work here. Press and hold the green button and copy its link instead.", "no");
  }
});

if (!readKey()) $("setup").hidden = false;
