import { Modal, Tooltip, Tab } from "bootstrap";
import EasyMDE from "easymde";
import * as Vue from "vue";
import MediaLibrary from "./components/files/MediaLibrary.vue";
import hljs from "highlight.js";

// Show MediaLibrary Vue component
export function showMediaLibrary(editor) {
  const vueContainer = document.createElement("div");
  document.querySelector("main").appendChild(vueContainer);

  const app = Vue.createApp({
    render: () => Vue.h(MediaLibrary, { editor })
  });

  app.mount(vueContainer);

  const modalEl = document.getElementById("media-modal");

  if (modalEl) {
    modalEl.addEventListener("hidden.bs.modal", () => {
      app.unmount();
      modalEl.remove();
    });

    new Modal(modalEl).show();
  }
}

// Bind a single Markdown editor
export function bindMarkdownEditor(elem) {
  if (!elem.mde) {
    const mde = new EasyMDE({
      autoDownloadFontAwesome: false,
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "link",
        "image",
        {
          name: "media",
          action: (editor) => showMediaLibrary(editor),
          className: "fas fa-file-upload",
          title: "Media Library",
        },
        "|",
        "preview",
        "guide",
      ],
      element: elem,
      initialValue: elem.value,
      forceSync: true,
      minHeight: "200px",
      renderingConfig: {
        codeSyntaxHighlighting: true,
        hljs: hljs,
      },
    });

    elem.mde = mde;
    elem.codemirror = mde.codemirror;

    elem.addEventListener("change", () => {
      mde.codemirror.getDoc().setValue(elem.value);
      mde.codemirror.refresh();
    });

    elem.addEventListener("keyup", () => {
      mde.codemirror.getDoc().setValue(elem.value);
      mde.codemirror.refresh();
    });

    elem.addEventListener("paste", () => {
      mde.codemirror.getDoc().setValue(elem.value);
      mde.codemirror.refresh();
    });
  }
}

// Bind all Markdown editors
export function bindMarkdownEditors() {
  document.querySelectorAll("textarea.markdown").forEach((elem) => {
    bindMarkdownEditor(elem);
  });
}

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

// Main app entry point
export default () => {
  // Save initial form input values
  document.querySelectorAll("input, select, textarea").forEach((el) => {
    el.dataset.initial = el.value;
  });

  // Clickable table rows (better)
  document.querySelectorAll('tr[data-href], td[data-href]').forEach((el) => {
    el.addEventListener("click", (e) => {
      if (
        !window.getSelection().toString() &&
        !e.target.closest('a, button, input')
      ) {
        const href = el.getAttribute("data-href");
        if (href) window.location = href;
      }
    });
  });


  // Checkbox toggles
  document.querySelectorAll("[data-checkbox]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const checkbox = el.querySelector('input[type="checkbox"]');
      if (!e.target.matches('input[type="checkbox"]')) {
        checkbox.click();
        e.stopPropagation();
      }
    });
  });

  // Select/Deselect all checkboxes
  document.querySelectorAll("[data-checkbox-all]").forEach((el) => {
    el.addEventListener("change", (e) => {
      const checked = el.checked;
      const table = el.closest("table");
      const idx = Array.from(el.parentNode.children).indexOf(el) + 1;
      table.querySelectorAll(`tr td:nth-child(${idx}) input[type="checkbox"]`)
        .forEach((cb) => { cb.checked = checked; });
    });
  });

  // Prevent row click propagation for inner links/buttons
  document.querySelectorAll("tr[data-href] a, tr[data-href] button").forEach((el) => {
    if (!el.hasAttribute("data-bs-dismiss")) {
      el.addEventListener("click", (e) => e.stopPropagation());
    }
  });

  // Prevent row clicks for checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation(); // ✅ stop checkbox click from bubbling to row
    });
  });

  // Page selector
  document.querySelectorAll(".page-select").forEach((select) => {
    select.addEventListener("change", () => {
      const url = new URL(window.location);
      url.searchParams.set("page", select.value);
      window.location.href = url.toString();
    });
  });

  // Restore last active tab
  const activeTab = sessionStorage.getItem("activeTab");
  if (activeTab) {
    const target = document.querySelector(
      `.nav-tabs a[href="${activeTab}"], .nav-pills a[href="${activeTab}"]`
    );
    if (target) {
      new Tab(target).show();
    } else {
      sessionStorage.removeItem("activeTab");
    }
  }

  // Save tab on change
  document.querySelectorAll('a[data-bs-toggle="tab"]').forEach((el) => {
    el.addEventListener("shown.bs.tab", (e) => {
      sessionStorage.setItem("activeTab", e.target.getAttribute("href"));
    });
  });

  // Enable tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new Tooltip(el);
  });

  // Syntax highlighting
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightBlock(block);
  });

  // Init
  bindMarkdownEditors();
  makeSortableTables();
};
