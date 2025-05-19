import "./main";
import $ from "jquery";
import "../compat/json";
import "../compat/format";
import CTFd from "../compat/CTFd";
import { htmlEntities } from "@ctfdio/ctfd-js/utils/html";
import { ezQuery, ezBadge } from "../compat/ezq";
import { createGraph, updateGraph } from "../compat/graphs";
import * as Vue from "vue";
import CommentBox from "../components/comments/CommentBox.vue";
import { createApp, h } from "vue"; // Vue 3
import Modal from "bootstrap/js/dist/modal";

function createUser(event) {
  event.preventDefault();
  const params = $("#user-info-create-form").serializeJSON(true);
  console.log(params);

  params.fields = [];

  for (const property in params) {
    if (property.match(/fields\[\d+\]/)) {
      let field = {};
      let id = parseInt(property.slice(7, -1));
      field["field_id"] = id;
      field["value"] = params[property];
      params.fields.push(field);
      delete params[property];
    }
  }

  // Move the notify value into a GET param
  let url = "/api/v1/users";
  let notify = params.notify;
  if (notify === true) {
    url = `${url}?notify=true`;
  }
  delete params.notify;

  CTFd.fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      if (response.success) {
        const user_id = response.data.id;
        window.location = CTFd.config.urlRoot + "/admin/users/" + user_id;
      } else {
        $("#user-info-create-form > #results").empty();
        Object.keys(response.errors).forEach(function (key, _index) {
          $("#user-info-create-form > #results").append(
            ezBadge({
              type: "error",
              body: response.errors[key],
            }),
          );
          const i = $("#user-info-form").find("input[name={0}]".format(key));
          const input = $(i);
          input.addClass("input-filled-invalid");
          input.removeClass("input-filled-valid");
        });
      }
    });
}

function updateUser(event) {
  event.preventDefault();
  const params = $("#user-info-edit-form").serializeJSON(true);

  params.fields = [];

  for (const property in params) {
    if (property.match(/fields\[\d+\]/)) {
      let field = {};
      let id = parseInt(property.slice(7, -1));
      field["field_id"] = id;
      field["value"] = params[property];
      params.fields.push(field);
      delete params[property];
    }
  }

  CTFd.fetch("/api/v1/users/" + window.USER_ID, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      if (response.success) {
        window.location.reload();
      } else {
        $("#user-info-edit-form > #results").empty();
        Object.keys(response.errors).forEach(function (key, _index) {
          $("#user-info-edit-form > #results").append(
            ezBadge({
              type: "error",
              body: response.errors[key],
            }),
          );
          const i = $("#user-info-edit-form").find(
            "input[name={0}]".format(key),
          );
          const input = $(i);
          input.addClass("input-filled-invalid");
          input.removeClass("input-filled-valid");
        });
      }
    });
}

function deleteUser(event) {
  event.preventDefault();

  const userName = window.USER_NAME || "this user";
  const confirmed = confirm(`Are you sure you want to delete "${userName}"?`);

  if (!confirmed) return;

  CTFd.fetch(`/api/v1/users/${window.USER_ID}`, {
    method: "DELETE",
    credentials: "same-origin",
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.success) {
        window.location = `${CTFd.config.urlRoot}/admin/users`;
      } else {
        alert("Failed to delete user.");
      }
    })
    .catch((err) => {
      console.error("Delete failed:", err);
      alert("Unexpected error while deleting the user.");
    });
}


function awardUser(event) {
  event.preventDefault();
  const params = $("#user-award-form").serializeJSON(true);
  params["user_id"] = window.USER_ID;

  CTFd.fetch("/api/v1/awards", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      if (response.success) {
        window.location.reload();
      } else {
        $("#user-award-form > #results").empty();
        Object.keys(response.errors).forEach(function (key, _index) {
          $("#user-award-form > #results").append(
            ezBadge({
              type: "error",
              body: response.errors[key],
            }),
          );
          const i = $("#user-award-form").find("input[name={0}]".format(key));
          const input = $(i);
          input.addClass("input-filled-invalid");
          input.removeClass("input-filled-valid");
        });
      }
    });
}

function emailUser(event) {
  event.preventDefault();
  var params = $("#user-mail-form").serializeJSON(true);
  CTFd.fetch("/api/v1/users/" + window.USER_ID + "/email", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      if (response.success) {
        $("#user-mail-form > #results").append(
          ezBadge({
            type: "success",
            body: "E-Mail sent successfully!",
          }),
        );
        $("#user-mail-form").find("input[type=text], textarea").val("");
      } else {
        $("#user-mail-form > #results").empty();
        Object.keys(response.errors).forEach(function (key, _index) {
          $("#user-mail-form > #results").append(
            ezBadge({
              type: "error",
              body: response.errors[key],
            }),
          );
          var i = $("#user-mail-form").find(
            "input[name={0}], textarea[name={0}]".format(key),
          );
          var input = $(i);
          input.addClass("input-filled-invalid");
          input.removeClass("input-filled-valid");
        });
      }
    });
}

function correctSubmissions(event) {
  event.preventDefault();

  const checkboxes = document.querySelectorAll("input[data-submission-type='incorrect']:checked");
  const submissionIDs = Array.from(checkboxes).map(el => el.dataset.submissionId);
  const label = submissionIDs.length === 1 ? "submission" : "submissions";

  if (submissionIDs.length === 0) {
    alert("Please select at least one submission to mark as correct.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to mark ${submissionIDs.length} ${label} correct?`);
  if (!confirmed) return;

  const requests = submissionIDs.map(subId =>
    CTFd.fetch(`/api/v1/submissions/${subId}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "correct" }),
    })
  );

  Promise.all(requests)
    .then(() => {
      window.location.reload();
    })
    .catch(err => {
      console.error("Failed to correct submissions:", err);
      alert("An error occurred while updating submissions.");
    });
}


function deleteSelectedSubmissions(event, target) {
  event.preventDefault();

  let selector, type, title;
  switch (target) {
    case "solves":
      selector = 'input[data-submission-type="correct"]:checked';
      type = "solve";
      title = "Solves";
      break;
    case "fails":
      selector = 'input[data-submission-type="incorrect"]:checked';
      type = "fail";
      title = "Fails";
      break;
    default:
      return;
  }

  const checkboxes = document.querySelectorAll(selector);
  const submissionIDs = Array.from(checkboxes).map((el) => el.dataset.submissionId);

  if (submissionIDs.length === 0) {
    alert(`Please select at least one ${type} to delete.`);
    return;
  }

  const label = submissionIDs.length === 1 ? type : `${type}s`;
  const confirmed = confirm(`Are you sure you want to delete ${submissionIDs.length} ${label}?`);

  if (!confirmed) return;

  const deleteRequests = submissionIDs.map((subId) =>
    CTFd.api.delete_submission({ submissionId: subId })
  );

  Promise.all(deleteRequests)
    .then(() => {
      window.location.reload();
    })
    .catch((err) => {
      console.error(`Failed to delete ${label}:`, err);
      alert(`An error occurred while deleting ${label}.`);
    });
}


function deleteSelectedAwards(event) {
  event.preventDefault();

  const checkboxes = document.querySelectorAll("input[data-award-id]:checked");
  const awardIDs = Array.from(checkboxes).map((el) => el.dataset.awardId);
  const targetLabel = awardIDs.length === 1 ? "award" : "awards";

  if (awardIDs.length === 0) {
    alert("Please select at least one award to delete.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${awardIDs.length} ${targetLabel}?`);
  if (!confirmed) return;

  const deleteRequests = awardIDs.map((awardID) =>
    CTFd.fetch(`/api/v1/awards/${awardID}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
  );

  Promise.all(deleteRequests)
    .then(() => {
      window.location.reload();
    })
    .catch((err) => {
      console.error("Award deletion failed:", err);
      alert("An error occurred while deleting awards.");
    });
}

function solveSelectedMissingChallenges(event) {
  event.preventDefault();

  const checkboxes = document.querySelectorAll("input[data-missing-challenge-id]:checked");
  const challengeIDs = Array.from(checkboxes).map(el => el.dataset.missingChallengeId);
  const target = challengeIDs.length === 1 ? "challenge" : "challenges";

  if (challengeIDs.length === 0) {
    alert("Please select at least one challenge to mark as solved.");
    return;
  }

  const userName = window.USER_NAME || "this user";
  const confirmed = confirm(
    `Are you sure you want to mark ${challengeIDs.length} ${target} correct for ${userName}?`
  );
  if (!confirmed) return;

  const requests = challengeIDs.map(challengeID => {
    const params = {
      provided: "MARKED AS SOLVED BY ADMIN",
      user_id: window.USER_ID,
      team_id: window.TEAM_ID,
      challenge_id: challengeID,
      type: "correct",
    };

    return CTFd.fetch("/api/v1/submissions", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
  });

  Promise.all(requests)
    .then(() => {
      window.location.reload();
    })
    .catch(err => {
      console.error("Failed to mark challenges as solved:", err);
      alert("An error occurred while marking challenges as solved.");
    });
}


const api_funcs = {
  team: [
    (x) => CTFd.api.get_team_solves({ teamId: x }),
    (x) => CTFd.api.get_team_fails({ teamId: x }),
    (x) => CTFd.api.get_team_awards({ teamId: x }),
  ],
  user: [
    (x) => CTFd.api.get_user_solves({ userId: x }),
    (x) => CTFd.api.get_user_fails({ userId: x }),
    (x) => CTFd.api.get_user_awards({ userId: x }),
  ],
};

const createGraphs = (type, id, name, account_id) => {
  let [solves_func, fails_func, awards_func] = api_funcs[type];

  Promise.all([
    solves_func(account_id),
    fails_func(account_id),
    awards_func(account_id),
  ]).then((responses) => {
    createGraph(
      "score_graph",
      "#score-graph",
      responses,
      type,
      id,
      name,
      account_id,
    );
    createGraph(
      "category_breakdown",
      "#categories-pie-graph",
      responses,
      type,
      id,
      name,
      account_id,
    );
    createGraph(
      "solve_percentages",
      "#keys-pie-graph",
      responses,
      type,
      id,
      name,
      account_id,
    );
  });
};

const updateGraphs = (type, id, name, account_id) => {
  let [solves_func, fails_func, awards_func] = api_funcs[type];

  Promise.all([
    solves_func(account_id),
    fails_func(account_id),
    awards_func(account_id),
  ]).then((responses) => {
    updateGraph(
      "score_graph",
      "#score-graph",
      responses,
      type,
      id,
      name,
      account_id,
    );
    updateGraph(
      "category_breakdown",
      "#categories-pie-graph",
      responses,
      type,
      id,
      name,
      account_id,
    );
    updateGraph(
      "solve_percentages",
      "#keys-pie-graph",
      responses,
      type,
      id,
      name,
      account_id,
    );
  });
};

document.addEventListener("DOMContentLoaded", () => {
  // Helper: toggle a modal by ID
  function toggleModal(id) {
    const modalElement = document.getElementById(id);
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.toggle();
    }
  }

  // Button actions
  document.querySelectorAll(".delete-user").forEach(el =>
    el.addEventListener("click", deleteUser)
  );

  document.querySelectorAll(".edit-user").forEach(el =>
    el.addEventListener("click", () => toggleModal("user-info-modal"))
  );

  document.querySelectorAll(".award-user").forEach(el =>
    el.addEventListener("click", () => toggleModal("user-award-modal"))
  );

  document.querySelectorAll(".email-user").forEach(el =>
    el.addEventListener("click", () => toggleModal("user-email-modal"))
  );

  document.querySelectorAll(".addresses-user").forEach(el =>
    el.addEventListener("click", () => toggleModal("user-addresses-modal"))
  );

  document.getElementById("user-mail-form")?.addEventListener("submit", emailUser);
  document.getElementById("solves-delete-button")?.addEventListener("click", (e) => {
    deleteSelectedSubmissions(e, "solves");
  });

  document.getElementById("correct-fail-button")?.addEventListener("click", correctSubmissions);

  document.getElementById("fails-delete-button")?.addEventListener("click", (e) => {
    deleteSelectedSubmissions(e, "fails");
  });

  document.getElementById("awards-delete-button")?.addEventListener("click", (e) => {
    deleteSelectedAwards(e);
  });

  document.getElementById("missing-solve-button")?.addEventListener("click", (e) => {
    solveSelectedMissingChallenges(e);
  });

  document.getElementById("user-info-create-form")?.addEventListener("submit", createUser);
  document.getElementById("user-info-edit-form")?.addEventListener("submit", updateUser);
  document.getElementById("user-award-form")?.addEventListener("submit", awardUser);

  // Mount Vue CommentBox
  const commentBoxTarget = document.getElementById("comment-box");
  if (commentBoxTarget) {
    const vueContainer = document.createElement("div");
    commentBoxTarget.appendChild(vueContainer);

    createApp({
      render: () => h(CommentBox, {
        type: "user",
        id: window.USER_ID
      })
    }).mount(vueContainer);
  }

  // Stats modal logic
  let { type, id, name, account_id } = window.stats_data || {};
  let intervalId;

  const statsModal = document.getElementById("user-statistics-modal");

  if (statsModal) {
    statsModal.addEventListener("shown.bs.modal", () => {
      createGraphs(type, id, name, account_id);
      intervalId = setInterval(() => {
        updateGraphs(type, id, name, account_id);
      }, 300000); // 5 minutes
    });

    statsModal.addEventListener("hidden.bs.modal", () => {
      clearInterval(intervalId);
    });

    document.querySelectorAll(".statistics-user").forEach(el =>
      el.addEventListener("click", () => toggleModal("user-statistics-modal"))
    );
  }
});