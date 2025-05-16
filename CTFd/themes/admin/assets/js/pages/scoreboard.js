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
function bulkToggleAccounts(_event) {
  const activeTab = document.querySelector(".tab-pane.active");

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

  ezAlert({
    title: "Toggle Visibility",
    body: `
      <form id="scoreboard-bulk-edit">
  <div class="form-group mb-3">
    <label for="visibility-select" class="form-label">Visibility</label>
    <select id="visibility-select" name="visibility" class="form-select" required>
      <option value="">--</option>
      <option value="visible">Visible</option>
      <option value="hidden">Hidden</option>
    </select>
  </div>
</form>
    `,
    button: "Submit",
    success: () => {
      const form = document.getElementById("scoreboard-bulk-edit");
      const formData = new FormData(form);
      const state = formData.get("visibility");
      if (state) {
        toggleSelectedAccounts(selectedUsers, state);
      }
    },
  });
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
