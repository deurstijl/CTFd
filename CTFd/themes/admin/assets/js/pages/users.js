import "./main";
import CTFd from "../compat/CTFd";
import $ from "jquery";
import "../compat/json";
import { ezAlert, ezQuery } from "../compat/ezq";
import Modal from "bootstrap/js/dist/modal";

function deleteSelectedUsers(_event) {
  const checkboxes = document.querySelectorAll("input[data-user-id]:checked");
  const userIDs = Array.from(checkboxes).map((el) => el.dataset.userId);
  const target = userIDs.length === 1 ? "user" : "users";

  if (userIDs.length === 0) {
    alert("Please select at least one user to delete.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${userIDs.length} ${target}?`);
  if (!confirmed) return;

  const deleteRequests = userIDs.map((userID) =>
    CTFd.fetch(`/api/v1/users/${userID}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
  );

  Promise.all(deleteRequests)
    .then(() => {
      window.location.reload();
    })
    .catch((err) => {
      console.error("Failed to delete users:", err);
      alert("An error occurred while deleting users.");
    });
}

function bulkEditUsers(_event) {
  const modalElement = document.getElementById("bulkEditModal");
  if (!modalElement) {
    console.error("Modal element not found");
    return;
  }

  const form = modalElement.querySelector("#users-bulk-edit-form");
  if (!form) {
    console.error("Modal form not found");
    return;
  }

  const checkboxes = document.querySelectorAll("input[data-user-id]:checked");
  const userIDs = Array.from(checkboxes).map((el) => el.dataset.userId);

  if (userIDs.length === 0) {
    alert("Please select at least one user.");
    return;
  }

  const modal = new Modal(modalElement);
  modal.show();

  form.onsubmit = async function (event) {
    event.preventDefault();

    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (value !== "") data[key] = value === "true";
    }

    try {
      await Promise.all(
        userIDs.map((userID) =>
          CTFd.fetch(`/api/v1/users/${userID}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(data),
          })
        )
      );
      modal.hide();
      window.location.reload();
    } catch (err) {
      console.error("Bulk update failed:", err);
      alert("Failed to update users.");
    }
  };
}


document.addEventListener("DOMContentLoaded", () => {
  const deleteButton = document.getElementById("users-delete-button");
  const editButton = document.getElementById("users-edit-button");

  if (deleteButton) {
    deleteButton.addEventListener("click", deleteSelectedUsers);
  } else {
    console.warn("Delete button not found: #users-delete-button");
  }

  if (editButton) {
    editButton.addEventListener("click", bulkEditUsers);
  } else {
    console.warn("Edit button not found: #users-edit-button");
  }
});