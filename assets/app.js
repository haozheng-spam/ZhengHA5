const sessions = [
  { id: "recall", minutes: 20, title: "Recall sprint", description: "Put your notes away and write down what you remember from your last class." },
  { id: "reading", minutes: 30, title: "Reading block", description: "Read one section and jot down a question to bring back to class." },
  { id: "practice", minutes: 50, title: "Practice set", description: "Work through a few problems, then mark the steps you want to revisit." }
];

const prototype = new URLSearchParams(location.search).has("prototype");
const storageKey = "study-window-plan";
const saved = new Set(prototype ? ["reading"] : readPlan());

function readPlan() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(stored) ? stored.filter(id => sessions.some(session => session.id === id)) : [];
  } catch {
    return [];
  }
}

function savePlan() {
  if (prototype) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify([...saved]));
  } catch {
    // The current tab still retains the plan when storage is unavailable.
  }
}

const duration = document.querySelector("#duration");
const status = document.querySelector("#status");
const sessionsScreen = document.querySelector("#sessions");
const planScreen = document.querySelector("#plan");

function makeCard(session, inPlan) {
  const item = document.createElement("li");
  item.className = "card";

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = `${session.minutes} min`;

  const title = document.createElement("h3");
  title.textContent = session.title;

  const description = document.createElement("p");
  description.textContent = session.description;

  const button = document.createElement("button");
  button.type = "button";
  button.className = inPlan ? "button secondary" : "button";
  const added = saved.has(session.id);
  button.textContent = inPlan ? "Remove" : added ? "Added" : "Add to plan";
  button.setAttribute("aria-label", `${button.textContent} ${session.title}`);
  button.disabled = !inPlan && added;
  button.addEventListener("click", () => {
    if (inPlan) saved.delete(session.id);
    else saved.add(session.id);
    savePlan();
    render();
    const target = inPlan
      ? document.querySelector("#plan-list button") || document.querySelector("#plan .section-head a")
      : document.querySelector("#session-list button:not(:disabled)") || document.querySelector("#plan-link");
    target.focus();
    status.textContent = `${session.title} ${inPlan ? "removed from" : "added to"} your plan.`;
  });

  item.append(time, title, description, button);
  return item;
}

function render() {
  const filter = duration.value;
  const available = sessions.filter(session =>
    filter === "all" || (filter === "short" ? session.minutes <= 30 : session.minutes > 30)
  );
  const planned = sessions.filter(session => saved.has(session.id));
  document.querySelector("#session-list").replaceChildren(...available.map(session => makeCard(session, false)));
  document.querySelector("#plan-list").replaceChildren(...planned.map(session => makeCard(session, true)));
  document.querySelector("#count").textContent = saved.size;
  document.querySelector("#empty").hidden = planned.length > 0;
}

function route(moveFocus) {
  const showPlan = location.hash === "#plan";
  sessionsScreen.hidden = showPlan;
  planScreen.hidden = !showPlan;
  document.querySelectorAll("nav a").forEach(link => link.removeAttribute("aria-current"));
  document.querySelector(showPlan ? "#plan-link" : "#sessions-link").setAttribute("aria-current", "page");
  if (moveFocus) {
    document.querySelector(showPlan ? "#plan-title" : "#sessions-title").focus();
  }
}

duration.addEventListener("change", () => {
  render();
  const count = document.querySelector("#session-list").children.length;
  status.textContent = `${count} sessions shown.`;
});
document.querySelector(".skip").addEventListener("click", event => {
  event.preventDefault();
  document.querySelector("#main").focus();
});
window.addEventListener("hashchange", () => route(true));
render();
route(false);
