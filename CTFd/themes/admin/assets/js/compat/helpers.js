import $ from "jquery";
import jQuery from "jquery";
import { default as ezq } from "./ezq";
import { htmlEntities } from "@ctfdio/ctfd-js/utils/html";
import { colorHash } from "./styles";
import { copyToClipboard } from "./ui";
import { Modal } from "bootstrap";

const utils = {
  htmlEntities: htmlEntities,
  colorHash: colorHash,
  copyToClipboard: copyToClipboard,
};

export function createUploadProgressModal(title = "Upload Progress") {
  let modalEl = document.getElementById("upload-progress-modal");

  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "upload-progress-modal";
    modalEl.className = "modal fade";
    modalEl.innerHTML = `
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
          </div>
          <div class="modal-body">
            <div class="progress">
              <div class="progress-bar progress-bar-striped progress-bar-animated"
                   role="progressbar"
                   aria-valuenow="0"
                   aria-valuemin="0"
                   aria-valuemax="100">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  const progressBar = modalEl.querySelector(".progress-bar");
  if (progressBar) {
    // Set initial width via JS, CSP-compliant
    progressBar.style.width = "0%";
  }

  const bsModal = Modal.getOrCreateInstance(modalEl);
  return {
    show: () => bsModal.show(),
    hide: () => bsModal.hide(),
    querySelector: (sel) => modalEl.querySelector(sel),
  };
}

const files = {
  upload: (form, extraData = {}, callback) => {
    const CTFd = window.CTFd;
    const csrfNonce = CTFd?.config?.csrfNonce || "";

    // Ensure it's a raw form element
    if (form instanceof HTMLFormElement === false) {
      form = form?.form || form?.target || form;
    }

    const formData = new FormData(form);
    formData.append("nonce", csrfNonce);

    for (const [key, value] of Object.entries(extraData)) {
      formData.append(key, value);
    }

    // Create progress modal
    const modal = createUploadProgressModal();
    const progressBar = modal.querySelector(".progress-bar");
    modal.show();

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${CTFd.config.urlRoot}/api/v1/files`, true);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressBar.style.width = `${percent.toFixed(1)}%`;
        progressBar.setAttribute("aria-valuenow", percent.toFixed(1));
      }
    });

    xhr.onload = () => {
      form.reset();
      progressBar.style.width = `100%`;
      progressBar.setAttribute("aria-valuenow", "100");

      setTimeout(() => {
        modal.hide();
      }, 500);

      try {
        const response = JSON.parse(xhr.responseText);
        if (callback) callback(response);
      } catch (err) {
        console.error("Upload response parsing failed", err);
        alert("Upload failed: invalid server response.");
      }
    };

    xhr.onerror = () => {
      modal.hide();
      alert("An error occurred during the file upload.");
    };

    xhr.send(formData);
  },
};


const comments = {
  get_comments: (extra_args) => {
    const CTFd = window.CTFd;
    return CTFd.fetch("/api/v1/comments?" + $.param(extra_args), {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }).then(function (response) {
      return response.json();
    });
  },
  add_comment: (comment, type, extra_args, cb) => {
    const CTFd = window.CTFd;
    let body = {
      content: comment,
      type: type,
      ...extra_args,
    };
    CTFd.fetch("/api/v1/comments", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        if (cb) {
          cb(response);
        }
      });
  },
  delete_comment: (comment_id) => {
    const CTFd = window.CTFd;
    return CTFd.fetch(`/api/v1/comments/${comment_id}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }).then(function (response) {
      return response.json();
    });
  },
};

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

const helpers = {
  files,
  comments,
  utils,
  ezq,
  createUploadProgressModal,
};

export default helpers;
