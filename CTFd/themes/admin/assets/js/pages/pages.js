import "./main";
import CTFd from "../compat/CTFd";

function deleteSelectedUsers(_event) {
  const checkboxes = document.querySelectorAll("input[data-page-id]:checked");
  const pageIDs = Array.from(checkboxes).map((el) => el.dataset.pageId);
  const target = pageIDs.length === 1 ? "page" : "pages";

  if (pageIDs.length === 0) {
    alert("No pages selected.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${pageIDs.length} ${target}?`);
  if (!confirmed) return;

  const deleteRequests = pageIDs.map((pageID) =>
    CTFd.fetch(`/api/v1/pages/${pageID}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
  );

  Promise.all(deleteRequests).then(() => {
    window.location.reload();
  }).catch((err) => {
    console.error("Failed to delete pages:", err);
    alert("An error occurred while deleting the pages.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("pages-delete-button")
    ?.addEventListener("click", deleteSelectedUsers);
});
