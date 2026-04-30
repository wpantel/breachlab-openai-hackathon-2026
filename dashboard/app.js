const mission = {
  candidates: [
    {
      id: "cross-tenant-document-access",
      title: "Cross-Tenant Document Access",
      category: "Broken access control",
      target: "app/api/documents/[id]/route.ts",
      impact: "Private workspace document exposure",
      confidence: "High",
    },
    {
      id: "admin-export-abuse",
      title: "Admin Export Abuse",
      category: "Privilege escalation",
      target: "app/api/admin/export/route.ts",
      impact: "Bulk data export",
      confidence: "Medium",
    },
    {
      id: "support-bot-prompt-injection",
      title: "Support Bot Prompt Injection",
      category: "AI app security",
      target: "lib/support-bot/systemPrompt.ts",
      impact: "Hidden instruction leakage",
      confidence: "Medium",
    },
    {
      id: "unsafe-url-preview",
      title: "Unsafe URL Preview",
      category: "Input and upload abuse",
      target: "app/api/preview/route.ts",
      impact: "Server-side request forgery risk",
      confidence: "Medium",
    },
  ],
  agents: ["Recon", "Attacker", "Judge", "Forensics", "Patch", "Test", "Report"],
  events: [
    { type: "recon_started", label: "Recon mapped the target route", risk: 18, patch: 5 },
    { type: "breach_confirmed", label: "Attacker confirmed cross-tenant access", risk: 88, patch: 5 },
    { type: "judge_accepted", label: "Judge accepted the evidence", risk: 92, patch: 10 },
    { type: "forensics_started", label: "Forensics built the incident replay", risk: 78, patch: 18 },
    { type: "patch_applied", label: "Defender patched the root cause", risk: 42, patch: 72 },
    { type: "tests_passed", label: "Regression tests passed", risk: 24, patch: 90 },
    { type: "replay_blocked", label: "Original replay is blocked", risk: 12, patch: 96 },
    { type: "report_written", label: "Report and scorecard written", risk: 10, patch: 98 },
  ],
  timeline: [
    ["00:00", "Recon", "Attacker discovers document route from normal navigation."],
    ["00:31", "Initial Access", "Attacker logs in as a regular workspace member."],
    ["01:04", "Probe", "Attacker opens an allowed document."],
    ["01:21", "Enumeration", "Attacker changes the document id and sees another workspace's content."],
    ["03:10", "Remediation", "Patch scopes lookup by workspace membership."],
    ["04:00", "Verification", "Original replay returns 404."],
  ],
  scorecard: {
    Exploitability: "8.9 / 10",
    "Blast radius": "7.4 / 10",
    "Detection difficulty": "6.5 / 10",
    "Patch confidence": "9.0 / 10",
    "Regression coverage": "8.6 / 10",
    "Before risk": "High",
    "After risk": "Low",
  },
  benchmarks: [
    ["BreachLab multi-agent workflow", "4 / 5 fixed", "92"],
    ["Single-agent baseline", "2 / 5 fixed", "58"],
    ["Scanner-only baseline", "0 / 5 fixed", "31"],
  ],
};

let selectedCandidate = null;
let eventIndex = 0;
let missionStarted = false;
let arenaOpener = null;
let shellFallbackState = null;

const $ = (id) => document.getElementById(id);
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function renderCandidates() {
  $("candidateList").replaceChildren(
    ...mission.candidates.map((candidate) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `candidate${selectedCandidate?.id === candidate.id ? " selected" : ""}`;
      button.innerHTML = `<strong>${candidate.title}</strong><span>${candidate.category}</span><span>${candidate.target}</span><span>Impact: ${candidate.impact}</span><span>Confidence: ${candidate.confidence}</span>`;
      button.addEventListener("click", () => {
        selectedCandidate = candidate;
        $("startMissionButton").disabled = false;
        renderCandidates();
        renderPhases();
      });
      return button;
    }),
  );
}

function renderAgents() {
  $("agentBoard").replaceChildren(
    ...mission.agents.map((name, index) => {
      const row = document.createElement("div");
      const state = missionStarted ? (index < Math.min(eventIndex, mission.agents.length) ? "complete" : index === eventIndex ? "running" : "queued") : "queued";
      row.className = `agent-row ${state}`;
      row.innerHTML = `<strong>${name}</strong><span>${state}</span>`;
      return row;
    }),
  );
}

function renderTimeline() {
  $("timeline").replaceChildren(
    ...mission.timeline.map(([time, phase, event]) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${time} ${phase}</strong><br>${event}`;
      return item;
    }),
  );
}

function renderScorecard() {
  $("scorecard").replaceChildren(
    ...Object.entries(mission.scorecard).map(([label, value]) => {
      const row = document.createElement("div");
      row.className = "score-row";
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      return row;
    }),
  );
}

function renderBenchmarks() {
  $("benchmarkRows").replaceChildren(
    ...mission.benchmarks.map(([name, result, score]) => {
      const row = document.createElement("div");
      row.className = "benchmark-row";
      row.innerHTML = `<strong>${name}</strong><span>${result}</span><span>${score}</span>`;
      return row;
    }),
  );
}

function renderPhases() {
  $("phaseDiscovery").classList.toggle("active", !selectedCandidate);
  $("phaseSelection").classList.toggle("active", Boolean(selectedCandidate) && !missionStarted);
  $("phaseMission").classList.toggle("active", missionStarted);
}

function analyzeRepo() {
  $("discoveryTitle").textContent = "Discovery found 4 candidate breach simulations";
  $("discoverySummary").textContent = "Choose one candidate to start the BreachLab mission. These are plausible simulations until Judge validates local evidence.";
  renderCandidates();
  renderPhases();
}

function startMission() {
  missionStarted = true;
  eventIndex = 0;
  $("arenaButton").disabled = false;
  renderAgents();
  renderPhases();
  openArena();
}

function openArena() {
  arenaOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  setShellDisabled(true);
  $("arenaModal").classList.add("open");
  $("arenaModal").setAttribute("aria-hidden", "false");
  applyEvent(mission.events[eventIndex]);
  $("closeArenaButton").focus();
}

function closeArena() {
  $("arenaModal").classList.remove("open");
  $("arenaModal").setAttribute("aria-hidden", "true");
  setShellDisabled(false);
  if (arenaOpener && document.contains(arenaOpener)) {
    arenaOpener.focus();
  }
  arenaOpener = null;
}

function setShellDisabled(disabled) {
  const shell = document.querySelector(".shell");
  if (!shell) return;

  if ("inert" in shell) {
    shell.inert = disabled;
    return;
  }

  if (disabled) {
    shellFallbackState = {
      hadAriaHidden: shell.hasAttribute("aria-hidden"),
      pointerEvents: shell.style.pointerEvents,
      focusables: Array.from(shell.querySelectorAll(focusableSelector)).map((element) => ({
        element,
        tabindex: element.getAttribute("tabindex"),
      })),
    };
    shell.setAttribute("aria-hidden", "true");
    shell.style.pointerEvents = "none";
    shellFallbackState.focusables.forEach(({ element }) => element.setAttribute("tabindex", "-1"));
  } else if (shellFallbackState) {
    if (!shellFallbackState.hadAriaHidden) {
      shell.removeAttribute("aria-hidden");
    }
    shell.style.pointerEvents = shellFallbackState.pointerEvents;
    shellFallbackState.focusables.forEach(({ element, tabindex }) => {
      if (tabindex === null) {
        element.removeAttribute("tabindex");
      } else {
        element.setAttribute("tabindex", tabindex);
      }
    });
    shellFallbackState = null;
  }
}

function applyEvent(event) {
  const modal = $("arenaModal");
  modal.classList.remove("attack", "shield", "blocked", "verified");
  if (event.type === "breach_confirmed") modal.classList.add("attack");
  if (event.type === "judge_accepted") modal.classList.add("verified");
  if (event.type === "patch_applied" || event.type === "tests_passed") modal.classList.add("shield");
  if (event.type === "replay_blocked") modal.classList.add("shield", "blocked");
  $("riskMeter").style.width = `${event.risk}%`;
  $("patchMeter").style.width = `${event.patch}%`;
  $("arenaCaption").textContent = event.label;
  renderAgents();
}

function nextEvent() {
  eventIndex = Math.min(eventIndex + 1, mission.events.length - 1);
  applyEvent(mission.events[eventIndex]);
}

function handleKeydown(event) {
  if (!$("arenaModal").classList.contains("open")) return;

  if (event.key === "Escape") {
    closeArena();
    return;
  }

  if (event.key === "Tab") {
    trapArenaFocus(event);
  }
}

function trapArenaFocus(event) {
  const content = $("arenaModal").querySelector(".modal-content");
  const focusable = Array.from(content.querySelectorAll(focusableSelector)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none" && element.getClientRects().length > 0;
  });
  const first = focusable[0] || content;
  const last = focusable[focusable.length - 1] || content;

  if (!content.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

$("analyzeButton").addEventListener("click", analyzeRepo);
$("startMissionButton").addEventListener("click", startMission);
$("arenaButton").addEventListener("click", openArena);
$("closeArenaButton").addEventListener("click", closeArena);
$("nextEventButton").addEventListener("click", nextEvent);
document.addEventListener("keydown", handleKeydown);

renderCandidates();
renderAgents();
renderTimeline();
renderScorecard();
renderBenchmarks();
renderPhases();
