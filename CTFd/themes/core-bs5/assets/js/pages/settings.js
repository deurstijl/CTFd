// user-profile.js
import "./main";
import { copyToClipboard } from "../utils";
import CTFd from "../CTFd";

const error_template = (message) => `
  <div id="results" class="mb-4">
    <div class="alert alert-danger alert-dismissible fade show position-relative" role="alert">
      <span class="visually-hidden">Error:</span>
      <button type="button" class="btn-close position-absolute top-0 end-0 m-0" data-bs-dismiss="alert" aria-label="Close"></button>
      ${message}
    </div>
  </div>`;

const success_template = `
  <div id="results" class="mb-4">
    <div class="alert alert-success alert-dismissible fade show position-relative" role="alert">
      <button type="button" class="btn-close position-absolute top-0 end-0 m-0" data-bs-dismiss="alert" aria-label="Close"></button>
      <strong>Success!</strong> Your profile has been updated
    </div>
  </div>`;

function serializeForm(form) {
  const formData = new FormData(form);
  const obj = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}

function profileUpdate(event) {
  event.preventDefault();
  const results = document.getElementById("results");
  if (results) results.innerHTML = "";

  const form = event.target;
  const params = serializeForm(form);
  params.fields = [];

  for (const property in params) {
    const match = property.match(/fields\[(\d+)\]/);
    if (match) {
      params.fields.push({ field_id: parseInt(match[1]), value: params[property] });
      delete params[property];
    }
  }

  CTFd.api.patch_user_private({}, params).then((response) => {
    if (response.success) {
      results.innerHTML = success_template;
    } else if ("errors" in response) {
      Object.entries(response.errors).forEach(([errorField, errorMsg]) => {
        const input = form.querySelector(`[name='${errorField}']`);
        if (input) {
          input.classList.add("input-filled-invalid");
          input.classList.remove("input-filled-valid");
        }
        results.innerHTML += error_template(errorMsg);
      });
    }
  });
}

function tokenGenerate(event) {
  event.preventDefault();
  const form = event.target;
  const params = serializeForm(form);

  CTFd.fetch("/api/v1/tokens", {
    method: "POST",
    body: JSON.stringify(params),
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.success) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
          <p>Please copy your API Key, it won't be shown again!</p>
          <div class="input-group mb-3">
            <input type="text" id="user-token-result" class="form-control" value="${response.data.value}" readonly>
            <button class="btn btn-outline-secondary" type="button">
              <i class="fas fa-clipboard"></i>
            </button>
          </div>`;

        wrapper.querySelector("button").addEventListener("click", (e) => {
          copyToClipboard(e, "#user-token-result");
        });

        alert(wrapper.innerHTML); // replace with modal/overlay in real UI
      }
    });
}

function deleteToken(event) {
  event.preventDefault();
  const elem = event.target.closest(".delete-token");
  const id = elem.dataset.tokenId;

  if (confirm("Are you sure you want to delete this token?")) {
    CTFd.fetch(`/api/v1/tokens/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          const row = elem.closest(".token-row");
          if (row) row.remove();
        }
      });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("user-profile-form")?.addEventListener("submit", profileUpdate);
  document.getElementById("user-token-form")?.addEventListener("submit", tokenGenerate);

  document.querySelectorAll(".delete-token").forEach((el) => {
    el.addEventListener("click", deleteToken);
  });

  document.querySelectorAll(".nav-pills a").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const href = tab.getAttribute("href");
      if (href) window.location.hash = href;
    });
  });

  const hash = window.location.hash;
  if (hash) {
    const safeHash = hash.replace(/[<>\[\]"']/g, "");
    const activeTab = document.querySelector(`.nav-pills a[href='${safeHash}']`);
    if (activeTab) new bootstrap.Tab(activeTab).show();
  }
});