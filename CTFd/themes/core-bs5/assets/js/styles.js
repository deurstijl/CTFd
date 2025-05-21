import "bootstrap"; // Imports all Bootstrap 5 JS components
import hljs from "highlight.js";


// Add sorting to table headers
export function makeSortableTables() {
  const headers = document.querySelectorAll("th.sort-col");
  headers.forEach((th) => {
    const icon = document.createElement("i");
    icon.classList.add("fas", "fa-sort");
    th.append(" ", icon);

    th.addEventListener("click", () => {
      const table = th.closest("table");
      const tbody = table.querySelector("tbody");
      const index = Array.from(th.parentNode.children).indexOf(th);
      const rows = Array.from(tbody.querySelectorAll("tr"));
      const asc = !th.classList.contains("asc");
    
      rows.sort((a, b) => {
        const valA = a.children[index].innerText.trim();
        const valB = b.children[index].innerText.trim();
        return !isNaN(valA) && !isNaN(valB)
          ? asc ? valA - valB : valB - valA
          : asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    
      table.querySelectorAll("th").forEach((h) => h.classList.remove("asc", "desc"));
      th.classList.add(asc ? "asc" : "desc");
    
      // ✅ Append back to tbody, not table
      rows.forEach((row) => tbody.appendChild(row));
    });
  });
}


export default () => {
  // Save initial values of inputs
  document.querySelectorAll(":is(input, select, textarea)").forEach((el) => {
    el.dataset.initial = el.value;
  });

  // Add/remove "input-filled-valid/invalid" on focus/blur
  document.querySelectorAll(".form-control").forEach((el) => {
    el.addEventListener("focus", () => {
      el.classList.remove("input-filled-invalid");
      el.classList.add("input-filled-valid");
    });

    el.addEventListener("blur", () => {
      if (!el.value) {
        el.classList.remove("input-filled-invalid");
        el.classList.remove("input-filled-valid");
      }
    });

    // Pre-fill state on load
    if (el.value) {
      el.classList.add("input-filled-valid");
    }
  });

  // Handle page-select dropdown navigation
  document.querySelectorAll(".page-select").forEach((el) => {
    el.addEventListener("change", (e) => {
      const url = new URL(window.location);
      url.searchParams.set("page", e.target.value);
      window.location.href = url.toString();
    });
  });

  // Initialize Bootstrap tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
  });

  // Highlight code blocks
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });

  // INIT:
  makeSortableTables();
};

