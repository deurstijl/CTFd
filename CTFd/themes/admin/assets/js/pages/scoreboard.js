import "./main";
import CTFd from "../compat/CTFd";
import "../compat/json";
import { ezAlert } from "../compat/ezq";

// API toggle functions
const api_func = {
  users: (id, data) => CTFd.api.patch_user_public({ userId: id }, data),
  teams: (id, data) => CTFd.api.patch_team_public({ teamId: id }, data),
};

// Toggle a single account (used with `.scoreboard-toggle`)
function toggleAccount(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.accountId;
  const state = btn.dataset.state;

  const hidden = state === "visible";

  const params = {
    hidden: hidden,
  };

  api_func[CTFd.config.userMode](id, params).then((response) => {
    if (response.success) {
      btn.dataset.state = hidden ? "hidden" : "visible";
      btn.classList.toggle("btn-danger", hidden);
      btn.classList.toggle("btn-success", !hidden);
      btn.textContent = hidden ? "Hidden" : "Visible";
    }
  });
}

// Toggle multiple selected accounts
function toggleSelectedAccounts(selectedAccounts, action) {
  const params = {
    hidden: action === "hidden",
  };

  const reqs = [];

  selectedAccounts.accounts.forEach((id) => {
    reqs.push(api_func[CTFd.config.userMode](id, params));
  });

  selectedAccounts.users.forEach((id) => {
    reqs.push(api_func.users(id, params));
  });

  Promise.all(reqs).then(() => {
    window.location.reload();
  });
}

// Get selected IDs from the active tab and prompt for visibility
import Modal from "bootstrap/js/dist/modal";

function bulkToggleAccounts(event) {
  event.preventDefault();

  const activeTab = document.querySelector(".tab-pane.active");
  if (!activeTab) {
    alert("No active tab found.");
    return;
  }

  const accountIDs = Array.from(
    activeTab.querySelectorAll('input[data-account-id]:checked')
  ).map((el) => el.dataset.accountId);

  const userIDs = Array.from(
    activeTab.querySelectorAll('input[data-user-id]:checked')
  ).map((el) => el.dataset.userId);

  const selectedUsers = {
    accounts: accountIDs,
    users: userIDs,
  };

  if (accountIDs.length === 0 && userIDs.length === 0) {
    alert("Please select at least one user or account.");
    return;
  }

  const modalEl = document.getElementById("visibilityToggleModal");
  const modal = new Modal(modalEl);
  modal.show();

  const form = document.getElementById("scoreboard-bulk-edit-form");
  form.onsubmit = (e) => {
    e.preventDefault();
    const state = form.querySelector("select[name='visibility']").value;
    if (state) {
      toggleSelectedAccounts(selectedUsers, state);
      modal.hide();
    } else {
      alert("Please choose a visibility option.");
    }
  };
}


// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".scoreboard-toggle").forEach((btn) => {
    btn.addEventListener("click", toggleAccount);
  });

  const editBtn = document.getElementById("scoreboard-edit-button");
  if (editBtn) {
    editBtn.addEventListener("click", bulkToggleAccounts);
  }
});
