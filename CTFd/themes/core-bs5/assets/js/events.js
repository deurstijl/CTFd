import { Howl } from "howler";
import { NativeEventSource, EventSourcePolyfill } from "event-source-polyfill";
import {
  WindowController,
  init_notification_counter,
  inc_notification_counter,
  dec_notification_counter
} from "./utils";

const EventSource = NativeEventSource || EventSourcePolyfill;

export default (root) => {
  const source = new EventSource(root + "/events");
  const wc = new WindowController();

  const howl = new Howl({
    src: [
      root + "/themes/core-bs5/static/sounds/notification.webm",
      root + "/themes/core-bs5/static/sounds/notification.mp3"
    ]
  });

  init_notification_counter();

  function connect() {
    source.addEventListener(
      "notification",
      (event) => {
        const data = JSON.parse(event.data);
        wc.broadcast("notification", data);
        render(data);

        if (data.sound) {
          howl.play();
        }
      },
      false
    );
  }

  function disconnect() {
    if (source) source.close();
  }

  function render(data) {
    inc_notification_counter();
  
    switch (data.type) {
      case "toast":
        showCenteredToast(data);
        break;
  
      case "alert":
        showCenteredToast(data);
        dec_notification_counter();
        break;
  
      case "background":
      default:
        // Update count, no UI
        break;
    }
  }

  function showCenteredToast(data) {
    const toastId = `center-toast-${Date.now()}`;
    const wrapper = document.getElementById("center-toast-wrapper") || createCenteredToastContainer();
  
    const toastEl = document.createElement("div");
    toastEl.className = "toast show text-bg-dark border-0";
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
  
    toastEl.innerHTML = `
      <div class="toast-body text-center">
        <h5 class="mb-2">${data.title}</h5>
        <p>${data.content || ""}</p>
        <button class="btn btn-light mt-2">OK</button>
      </div>
    `;
  
    const okBtn = toastEl.querySelector("button");
    okBtn.addEventListener("click", () => {
      toastEl.remove();
      dec_notification_counter();
    });
  
    wrapper.appendChild(toastEl);
  }

  function createCenteredToastContainer() {
    const wrapper = document.createElement("div");
    wrapper.id = "center-toast-wrapper";
    wrapper.className = "position-fixed top-50 start-50 translate-middle p-3 z-1050";
    wrapper.style.zIndex = "1055"; // Above modal
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function showToast(data) {
    const toastId = `toast-${Date.now()}`;
    const trimmed = data.content.length > 50 ? data.content.slice(0, 47) + "..." : data.content;

    const toastWrapper = document.getElementById("toast-wrapper") || createToastContainer();
    const toastEl = document.createElement("div");
    toastEl.className = "toast align-items-center text-bg-dark border-0 show";
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.id = toastId;

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong>${data.title}</strong><br>
          ${trimmed}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    toastEl.querySelector(".toast-body").addEventListener("click", () => {
      showModal(data, () => dec_notification_counter());
      toastEl.remove();
    });

    toastEl.querySelector(".btn-close").addEventListener("click", () => {
      dec_notification_counter();
    });

    toastWrapper.appendChild(toastEl);
    new bootstrap.Toast(toastEl).show();
  }

  function createToastContainer() {
    const wrapper = document.createElement("div");
    wrapper.id = "toast-wrapper";
    wrapper.className = "toast-container position-fixed top-0 end-0 p-3";
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function showModal(data, onConfirm = () => {}) {
    const modalId = `modal-${Date.now()}`;
    const modalEl = document.createElement("div");
    modalEl.className = "modal fade";
    modalEl.id = modalId;
    modalEl.setAttribute("tabindex", "-1");
    modalEl.setAttribute("aria-hidden", "true");

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${data.title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${data.html}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Got it!</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
    const modal = new bootstrap.Modal(modalEl);

    modalEl.addEventListener("hidden.bs.modal", () => {
      modalEl.remove();
      onConfirm();
    });

    modal.show();
  }

  wc.alert = render;
  wc.toast = render;
  wc.background = render;

  wc.masterDidChange = function () {
    if (this.isMaster) connect();
    else disconnect();
  };
};
