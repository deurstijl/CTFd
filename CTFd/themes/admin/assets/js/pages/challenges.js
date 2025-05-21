import "./main";
import CTFd from "../compat/CTFd";
import $ from "jquery";
import "../compat/json";
import Modal from "bootstrap/js/dist/modal";

function deleteSelectedChallenges(event) {
  event.preventDefault();

  const checkboxes = document.querySelectorAll("input[data-challenge-id]:checked");
  const challengeIDs = Array.from(checkboxes).map(el => el.dataset.challengeId);
  const target = challengeIDs.length === 1 ? "challenge" : "challenges";

  if (challengeIDs.length === 0) {
    alert("Please select at least one challenge to delete.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${challengeIDs.length} ${target}?`);
  if (!confirmed) return;

  const requests = challengeIDs.map(chalID =>
    CTFd.fetch(`/api/v1/challenges/${chalID}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
  );

  Promise.all(requests)
    .then(() => {
      window.location.reload();
    })
    .catch(err => {
      console.error("Failed to delete challenges:", err);
      alert("An error occurred while deleting challenges.");
    });
}




function bulkEditChallenges(event) {
  event.preventDefault();

  const checkboxes = document.querySelectorAll("input[data-challenge-id]:checked");
  const challengeIDs = Array.from(checkboxes).map(el => el.dataset.challengeId);

  if (challengeIDs.length === 0) {
    alert("Please select at least one challenge to edit.");
    return;
  }

  const modalEl = document.getElementById("challengesBulkEditModal");
  const modal = new Modal(modalEl);
  modal.show();

  const form = document.getElementById("challenges-bulk-edit-form");

  // Remove any previously bound handler
  form.onsubmit = async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      if (value !== "") {
        data[key] = key === "value" ? Number(value) : value;
      }
    }

    const requests = challengeIDs.map(chalID =>
      CTFd.fetch(`/api/v1/challenges/${chalID}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
    );

    try {
      await Promise.all(requests);
      modal.hide();
      window.location.reload();
    } catch (err) {
      console.error("Bulk edit failed:", err);
      alert("An error occurred while editing challenges.");
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const deleteButton = document.getElementById("challenges-delete-button");
  const editButton = document.getElementById("challenges-edit-button");

  if (deleteButton) {
    deleteButton.addEventListener("click", deleteSelectedChallenges);
  } else {
    console.warn("Missing #challenges-delete-button");
  }

  if (editButton) {
    editButton.addEventListener("click", bulkEditChallenges);
  } else {
    console.warn("Missing #challenges-edit-button");
  }
});
