import "./main";
import CTFd from "../compat/CTFd";
import $ from "jquery";
import { htmlEntities } from "@ctfdio/ctfd-js/utils/html";
import { ezQuery } from "../compat/ezq";
import "../compat/format";

function deleteCorrectSubmission(event) {
  event.preventDefault();

  const button = event.currentTarget;
  const keyId = button.dataset.submissionId;

  const row = button.closest("tr");
  if (!row) return;

  const chalName = row.querySelector(".chal")?.textContent.trim() || "Unknown Challenge";
  const teamName = row.querySelector(".team")?.textContent.trim() || "Unknown Team";

  const confirmed = confirm(
    `Are you sure you want to delete correct submission from "${teamName}" for challenge "${chalName}"?`
  );

  if (!confirmed) return;

  CTFd.api
    .delete_submission({ submissionId: keyId })
    .then((response) => {
      if (response.success && row) {
        row.remove();
      } else {
        alert("Failed to delete submission.");
      }
    })
    .catch((err) => {
      console.error("Error deleting submission:", err);
      alert("An unexpected error occurred.");
    });
}


function deleteSelectedSubmissions(event) {
  event.preventDefault();

  const checkboxes = document.querySelectorAll("input[data-submission-id]:checked");
  const submissionIDs = Array.from(checkboxes).map(el => el.dataset.submissionId);
  const label = submissionIDs.length === 1 ? "submission" : "submissions";

  if (submissionIDs.length === 0) {
    alert("Please select at least one submission to delete.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${submissionIDs.length} ${label}?`);
  if (!confirmed) return;

  const requests = submissionIDs.map(subId =>
    CTFd.api.delete_submission({ submissionId: subId })
  );

  Promise.all(requests)
    .then(() => {
      window.location.reload();
    })
    .catch(err => {
      console.error("Failed to delete submissions:", err);
      alert("An error occurred while deleting submissions.");
    });
}


function correctSubmissions(event) {
  event.preventDefault();

  const checkboxes = document.querySelectorAll("input[data-submission-id]:checked");
  const submissionIDs = Array.from(checkboxes).map(el => el.dataset.submissionId);
  const label = submissionIDs.length === 1 ? "submission" : "submissions";

  if (submissionIDs.length === 0) {
    alert("Please select at least one submission to correct.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to mark ${submissionIDs.length} ${label} correct?`);
  if (!confirmed) return;

  const requests = submissionIDs.map(subId =>
    CTFd.fetch(`/api/v1/submissions/${subId}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "correct" }),
    })
  );

  Promise.all(requests)
    .then(() => {
      window.location.reload();
    })
    .catch(err => {
      console.error("Failed to mark submissions correct:", err);
      alert("An error occurred while updating submissions.");
    });
}


function showFlagsToggle(event) {
  event.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("full")) {
    urlParams.delete("full");
  } else {
    urlParams.set("full", "true");
  }
  window.location.href = `${window.location.pathname}?${urlParams.toString()}`;
}


function showFlag(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const flagRow = button.closest("td");
  const flag = flagRow?.querySelector("pre");
  const eye = button.querySelector("i");

  if (!flag || !eye) return;

  const fullText = flag.getAttribute("title");

  if (!flag.classList.contains("full-flag")) {
    flag.textContent = fullText;
    flag.classList.add("full-flag");
    eye.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    flag.textContent = `${fullText.substring(0, 42)}...`;
    flag.classList.remove("full-flag");
    eye.classList.replace("fa-eye-slash", "fa-eye");
  }
}


function copyFlag(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const flag = button.closest("td")?.querySelector("pre");
  if (!flag) return;

  const text = flag.getAttribute("title");
  navigator.clipboard.writeText(text).then(() => {
    // Optional: Bootstrap 5 tooltip setup if you're using Bootstrap's JS
    if (window.bootstrap) {
      let tooltip = bootstrap.Tooltip.getInstance(button);
      if (!tooltip) {
        tooltip = new bootstrap.Tooltip(button, {
          title: "Copied!",
          trigger: "manual",
        });
      }
      tooltip.show();
      setTimeout(() => tooltip.hide(), 1500);
    } else {
      // Fallback alert
      alert("Copied to clipboard");
    }
  });
}


document.addEventListener("DOMContentLoaded", () => {
  const fullFlagsBtn = document.getElementById("show-full-flags-button");
  const shortFlagsBtn = document.getElementById("show-short-flags-button");
  const correctBtn = document.getElementById("correct-flags-button");
  const deleteBtn = document.getElementById("submission-delete-button");

  if (fullFlagsBtn) fullFlagsBtn.addEventListener("click", showFlagsToggle);
  if (shortFlagsBtn) shortFlagsBtn.addEventListener("click", showFlagsToggle);
  if (correctBtn) correctBtn.addEventListener("click", correctSubmissions);
  if (deleteBtn) deleteBtn.addEventListener("click", deleteSelectedSubmissions);

  document.querySelectorAll(".show-flag").forEach(el =>
    el.addEventListener("click", showFlag)
  );

  document.querySelectorAll(".copy-flag").forEach(el =>
    el.addEventListener("click", copyFlag)
  );

  document.querySelectorAll(".delete-correct-submission").forEach(el =>
    el.addEventListener("click", deleteCorrectSubmission)
  );
});

