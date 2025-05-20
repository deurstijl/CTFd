import "bootstrap"; // Imports all Bootstrap 5 JS components
import hljs from "highlight.js";

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
};
