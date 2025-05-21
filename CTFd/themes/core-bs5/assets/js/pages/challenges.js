// bootstrap5-challenges.js
import "./main";
import "bootstrap/js/dist/tab";
import { Tooltip, Modal, Tab } from "bootstrap";
import { htmlEntities } from "../utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import hljs from "highlight.js";
import CTFd from "../CTFd";
import config from "../config";
import runStyles from "../styles";

dayjs.extend(relativeTime);

CTFd._internal.challenge = {};
let challenges = [];
let solves = [];

const loadChal = (id) => {
  const chal = challenges.find((c) => c.id == id);

  if (chal?.type === "hidden") {
    alert("You haven't unlocked this challenge yet!");
    return;
  }

  displayChal(chal);
};

const loadChalByName = (name) => {
  const idx = name.lastIndexOf("-");
  const id = name.slice(idx + 1);
  const chal = challenges.find((c) => c.id == id);
  displayChal(chal);
};

const displayChal = async (chal) => {
  const challengeWindow = document.getElementById("challenge-window");

  const [chalData, templateHTML] = await Promise.all([
    CTFd.api.get_challenge({ challengeId: chal.id }),
    fetch(config.urlRoot + chal.template).then((res) => res.text()),
  ]);

  // Dynamic import of challenge script as ES module
  const chalModule = await import(/* @vite-ignore */ `${config.urlRoot + chal.script}`);
  const challenge = CTFd._internal.challenge;

  // Inject challenge data into the plugin
  challenge.data = chalData.data;

  // Call preRender if exported
  if (chalModule?.preRender) chalModule.preRender();

  // Insert challenge HTML
  challengeWindow.innerHTML = chalData.data.view;


  // Style input and button
  document.getElementById("challenge-input")?.classList.add("form-control");
  document.getElementById("challenge-submit")?.classList.add(
    "btn",
    "btn-md",
    "btn-outline-secondary",
    "float-end"
  );

  // Handle modal sizing
  const modalDialog = challengeWindow.querySelector(".modal-dialog");
  const size = window.init?.theme_settings?.challenge_window_size;
  if (modalDialog && ["sm", "lg", "xl"].includes(size)) {
    modalDialog.classList.add(`modal-${size}`);
  }

  // Challenge solves
  challengeWindow.querySelectorAll(".challenge-solves").forEach((el) => {
    el.addEventListener("click", () => getSolves(chal.id));
  });

  // Bootstrap 5 modal
  requestAnimationFrame(() => {
    new Modal(challengeWindow).show();
  });

  // Enable tooltips
  challengeWindow.querySelectorAll("[data-bs-toggle='tooltip']").forEach((el) => {
    new Tooltip(el);
  });

  // Enable tab behavior
  challengeWindow.querySelectorAll(".nav-tabs a").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      new Tab(tab).show();
    });
  });

  // Submission handling
  challengeWindow.querySelector("#challenge-submit")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const btn = e.target;
    btn.disabled = true;

    try {
      const result = await challenge.submit();
      renderSubmissionResponse(result);
      await loadChals();
      markSolves();
    } catch (err) {
      console.error("Submission error", err);
    } finally {
      btn.disabled = false;
    }
  });

  // Enter key triggers submission
  challengeWindow.querySelector("#challenge-input")?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      document.getElementById("challenge-submit")?.click();
    }
  });

  // Hint loading
  challengeWindow.querySelectorAll(".load-hint").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      loadHint(el.dataset.hintId);
    });
  });

  // Call postRender
  if (chalModule?.postRender) chalModule.postRender();

  // Syntax highlighting
  challengeWindow.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });

  // Update URL fragment
  history.replaceState(null, "", `#${chal.name}-${chal.id}`);

  // Make sure the notificatiowrapper is not shown.
  document.getElementById("notification-wrapper").classList.add("d-none");
};

function renderSubmissionResponse(response) {
  const result = response.data;
  const message = document.getElementById("result-message");
  const alertBox = document.getElementById("result-notification");
  const input = document.getElementById("challenge-input");

  alertBox.className = "alert alert-dismissible text-center w-100 show";
  message.textContent = result.message;

  const nextBtn = document.createElement("div");
  nextBtn.className = "col-md-12 pb-3";
  nextBtn.innerHTML = `<button class='btn btn-info w-100'>Next Challenge</button>`;
  nextBtn.querySelector("button").addEventListener("click", () => {
    Modal.getInstance(document.getElementById("challenge-window")).hide();
    setTimeout(() => loadChal(CTFd._internal.challenge.data.next_id), 500);
  });

  if (result.status === "authentication_required") {
    window.location = `${CTFd.config.urlRoot}/login?next=${CTFd.config.urlRoot}${window.location.pathname}${window.location.hash}`;
    return;
  }

  switch (result.status) {
    case "incorrect":
      document.getElementById("notification-wrapper").classList.remove("d-none");
      alertBox.classList.add("alert-danger");
      input.classList.remove("correct");
      input.classList.add("wrong");
      break;

    case "correct":
      document.getElementById("notification-wrapper").classList.remove("d-none");
      alertBox.classList.add("alert-success");
      if (document.querySelector(".challenge-solves")) {
        const count = parseInt(document.querySelector(".challenge-solves").textContent) || 0;
        document.querySelector(".challenge-solves").textContent = `${count + 1} Solves`;
      }
      input.value = "";
      input.classList.remove("wrong");
      input.classList.add("correct");

      if (CTFd._internal.challenge.data.next_id) {
        document.querySelector(".submit-row")?.replaceChildren(nextBtn);
      }
      break;

    case "already_solved":
      document.getElementById("notification-wrapper").classList.remove("d-none");
      alertBox.classList.add("alert-info");
      input.classList.add("correct");
      if (CTFd._internal.challenge.data.next_id) {
        document.querySelector(".submit-row")?.replaceChildren(nextBtn);
      }
      break;

    case "paused":
    case "ratelimited":
      document.getElementById("notification-wrapper").classList.remove("d-none");
      alertBox.classList.add("alert-warning");
      input.classList.add("too-fast");
      break;
  }

  // Reset after timeout
  setTimeout(() => {
    alertBox.classList.remove("show");
    input.classList.remove("wrong", "too-fast");
  }, 3000);
}


function loadHint(id) {
  CTFd.api.get_hint({ hintId: id }).then((response) => {
    if (!response.success) {
      const msg = Object.values(response.errors).join("\n");
      showHTMLModal("Hint Error", `<div class="text-danger">${msg}</div>`);
      return;
    }

    const hint = response.data;
    if (hint.html) {
      console.log("showing the hint contents: " + hint.html);
      showHTMLModal(hint.title || "Hint", hint.html);
      return;
    }

    // If locked, offer unlock
    if (confirm("Are you sure you want to unlock this hint?")) {
      const params = { target: id, type: "hints" };
      CTFd.api.post_unlock_list({}, params).then((unlockResponse) => {
        if (unlockResponse.success) {
          CTFd.api.get_hint({ hintId: id }).then((r) =>
            showHTMLModal(r.data.title || "Hint", r.data.html)
          );
        } else {
          showHTMLModal("Hint Error", `<div class="text-danger">${unlockResponse.errors?.score || "Unable to unlock hint."}</div>`);
        }
      });
    }
  });
}


function showHTMLModal(title, htmlContent) {
  // Create modal elements manually
  const modalEl = document.createElement("div");
  modalEl.className = "modal fade";
  modalEl.tabIndex = -1;

  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body"></div>
      </div>
    </div>
  `;

  // Insert sanitized HTML into the modal body
  modalEl.querySelector(".modal-body").innerHTML = htmlContent;

  document.body.appendChild(modalEl);
  const modal = new Modal(modalEl);
  modal.show();

  modalEl.addEventListener("hidden.bs.modal", () => {
    modalEl.remove();
  });
}


function markSolves() {
  challenges.forEach((challenge) => {
    if (challenge.solved_by_me) {
      const btn = document.querySelector(`button[value='${challenge.id}']`);
      if (btn) {
        btn.classList.add("solved-challenge");
        btn.insertAdjacentHTML(
          "afterbegin",
          "<i class='fas fa-check corner-button-check'></i>"
        );
      }
    }
  });
}

function getSolves(id) {
  return CTFd.api.get_challenge_solves({ challengeId: id }).then((response) => {
    const data = response.data;
    const box = document.getElementById("challenge-solves-names");
    document.querySelector(".challenge-solves").textContent = `${data.length} Solves`;
    box.innerHTML = "";
    data.forEach((solv) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td><a href="${solv.account_url}">${htmlEntities(
        solv.name
      )}</a></td><td>${dayjs(solv.date).fromNow()}</td>`;
      box.appendChild(row);
    });
  });
}

function loadChals() {
  return CTFd.api.get_challenge_list().then((response) => {
    challenges = response.data;
    const board = document.getElementById("challenges-board");
    board.innerHTML = "";

    const categories = [...new Set(challenges.map((c) => c.category))];
    categories.forEach((category) => {
      const catId = category.replace(/ /g, "-");
      const row = document.createElement("div");
      row.id = `${catId}-row`;
      row.className = "pt-5";
      row.innerHTML = `
        <div class="category-header col-md-12 mb-3">
          <h3>${category}</h3>
        </div>
        <div class="category-challenges col-md-12">
          <div class="challenges-row col-md-12"></div>
        </div>`;
      board.appendChild(row);
    });

    challenges.forEach((chal) => {
      const chalId = chal.name.replace(/ /g, "-");
      const catId = chal.category.replace(/ /g, "-");

      const chalWrap = document.createElement("div");
      chalWrap.id = chalId;
      chalWrap.className = "col-md-3 d-inline-block me-3";

      const btn = document.createElement("button");
      btn.className = `btn btn-dark challenge-button w-100 text-truncate pt-3 pb-3 mb-2${
        solves.includes(chal.id) ? " solved-challenge" : ""
      }`;
      btn.value = chal.id;
      btn.innerHTML = `
        ${solves.includes(chal.id) ? "<i class='fas fa-check corner-button-check'></i>" : ""}
        <p>${chal.name}</p>
        <span>${chal.value}</span>`;

      chal.tags.forEach((tag) => {
        chalWrap.classList.add(`tag-${tag.value.replace(/ /g, "-")}`);
      });

      chalWrap.appendChild(btn);
      const targetRow = document.querySelector(`#${catId}-row .challenges-row`);
      if (targetRow) targetRow.appendChild(chalWrap);

      btn.addEventListener("click", () => loadChal(btn.value));
    });
  });
}

function update() {
  return loadChals().then(markSolves);
}

if (document.readyState !== "loading") {
  update().then(() => {
    if (window.location.hash.length > 0) {
      loadChalByName(decodeURIComponent(window.location.hash.substring(1)));
    }
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    update().then(() => {
      if (window.location.hash.length > 0) {
        loadChalByName(decodeURIComponent(window.location.hash.substring(1)));
      }
    });
  });
}

runStyles();

setInterval(update, 300000); // Refresh every 5 minutes

window.updateChallengeBoard = update;
