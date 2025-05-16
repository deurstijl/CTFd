import "./main";
import $ from "jquery";
import "../compat/json";
import "bootstrap/js/dist/tab";
import CTFd from "../compat/CTFd";
import { htmlEntities } from "@ctfdio/ctfd-js/utils/html";
import { ezQuery, ezAlert, ezToast } from "../compat/ezq";
import { default as helpers } from "../compat/helpers";
import { bindMarkdownEditors } from "../styles";
import * as Vue from "vue";
import CommentBox from "../components/comments/CommentBox.vue";
import FlagList from "../components/flags/FlagList.vue";
import Requirements from "../components/requirements/Requirements.vue";
import TopicsList from "../components/topics/TopicsList.vue";
import TagsList from "../components/tags/TagsList.vue";
import ChallengeFilesList from "../components/files/ChallengeFilesList.vue";
import HintsList from "../components/hints/HintsList.vue";
import NextChallenge from "../components/next/NextChallenge.vue";
import Modal from "bootstrap/js/dist/modal";
import { loadScript } from "../compat/helpers";

function loadChalTemplate(challenge) {
  CTFd._internal.challenge = {};

  loadScript(CTFd.config.urlRoot + challenge.scripts.view)
    .then(() => {
      const templateData = challenge.create;
      const entryDiv = document.querySelector("#create-chal-entry-div");
      if (!entryDiv) throw new Error("create-chal-entry-div not found");
      console.log("FRANKDEBUG create-chal-entry-div  found");
      entryDiv.innerHTML = templateData;

      if (typeof bindMarkdownEditors === "function") {
        bindMarkdownEditors();
      }

      return loadScript(CTFd.config.urlRoot + challenge.scripts.create);
    })
    .then(() => {
      const form = document.querySelector("#create-chal-entry-div form");
      if (!form) throw new Error("Challenge form not found");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const params = Object.fromEntries(formData.entries());

        try {
          const response = await CTFd.fetch("/api/v1/challenges", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
          });

          const result = await response.json();

          if (result.success) {
            const idInput = document.querySelector("#challenge-create-options #challenge_id");
            if (idInput) idInput.value = result.data.id;

            const modal = document.querySelector("#challenge-create-options");
            if (modal && typeof bootstrap !== "undefined") {
              const bsModal = new bootstrap.Modal(modal);
              bsModal.show();
            }
          } else {
            let body = "";
            for (const key in result.errors) {
              body += result.errors[key].join("\n") + "\n";
            }

            alert(body)
          }
        } catch (err) {
          console.error("Challenge creation failed:", err);
          alert(err.message)
        }
      });
    })
    .catch((err) => {
      console.error("Error in loadChalTemplate:", err);
    });
}


function handleChallengeOptions(event) {
  event.preventDefault();
  var params = $(event.target).serializeJSON(true);
  let flag_params = {
    challenge_id: params.challenge_id,
    content: params.flag || "",
    type: params.flag_type,
    data: params.flag_data ? params.flag_data : "",
  };
  // Define a save_challenge function
  let save_challenge = function () {
    CTFd.fetch("/api/v1/challenges/" + params.challenge_id, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: params.state,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setTimeout(function () {
            window.location =
              CTFd.config.urlRoot + "/admin/challenges/" + params.challenge_id;
          }, 700);
        }
      });
  };

  Promise.all([
    // Save flag
    new Promise(function (resolve, _reject) {
      if (flag_params.content.length == 0) {
        resolve();
        return;
      }
      CTFd.fetch("/api/v1/flags", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flag_params),
      }).then(function (response) {
        resolve(response.json());
      });
    }),
    // Upload files
    new Promise(function (resolve, _reject) {
      let form = event.target;
      let data = {
        challenge: params.challenge_id,
        type: "challenge",
      };
      let filepath = $(form.elements["file"]).val();
      if (filepath) {
        helpers.files.upload(form, data);
      }
      resolve();
    }),
  ]).then((_responses) => {
    save_challenge();
  });
}

$(() => {
  $(".preview-challenge").click(function (_e) {
    let url = `${CTFd.config.urlRoot}/admin/challenges/preview/${window.CHALLENGE_ID}`;
    $("#challenge-window").html(
      `<iframe src="${url}" height="100%" width="100%" frameBorder=0></iframe>`,
    );
    $("#challenge-modal").modal();
  });

  // $(".comments-challenge").click(function (_event) {
  //   $("#challenge-comments-window").modal();
  // });

  document.querySelector(".comments-challenge")?.addEventListener("click", () => {
    const modalElement = document.getElementById("challenge-comments-window");
  
    if (modalElement) {
      // Mount Vue component if not already mounted
      const mountTarget = document.querySelector("#comment-box");
      const modal = new Modal(modalElement);
      modal.show();
    }
  });

  document.querySelector(".delete-challenge")?.addEventListener("click", function () {
    const name = window.CHALLENGE_NAME || "this challenge";
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
  
    if (confirmed) {
      CTFd.fetch(`/api/v1/challenges/${window.CHALLENGE_ID}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((response) => {
          if (response.success) {
            window.location = `${CTFd.config.urlRoot}/admin/challenges`;
          } else {
            alert("Failed to delete the challenge.");
          }
        })
        .catch((err) => {
          console.error("Delete failed:", err);
          alert("Unexpected error: " + err.message);
        });
    }
  });

  $("#challenge-update-container > form").submit(function (e) {
    e.preventDefault();
    var params = $(e.target).serializeJSON(true);
    CTFd.fetch("/api/v1/challenges/" + window.CHALLENGE_ID + "/flags", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        let update_challenge = function () {
          CTFd.fetch("/api/v1/challenges/" + window.CHALLENGE_ID, {
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
                $(".challenge-state").text(response.data.state);
                switch (response.data.state) {
                  case "visible":
                    $(".challenge-state")
                      .removeClass("badge-danger")
                      .addClass("badge-success");
                    break;
                  case "hidden":
                    $(".challenge-state")
                      .removeClass("badge-success")
                      .addClass("badge-danger");
                    break;
                  default:
                    break;
                }
                alert("Your challenge has been updated!");
              } else {
                let body = "";
                for (const k in response.errors) {
                  body += response.errors[k].join("\n");
                  body += "\n";
                }
                alert(body);
              }
            });
        };
        // Check if the challenge doesn't have any flags before marking visible
        if (response.data.length === 0 && params.state === "visible") {
          if (confirm("This challenge does not have any flags meaning it may be unsolveable. Are you sure you'd like to update this challenge?")){
            update_challenge();
          };
        } else {
          update_challenge();
        }
      });
  });

  $("#challenge-create-options form").submit(handleChallengeOptions);

  // Load FlagList component
  if (document.querySelector("#challenge-flags")) {
    //const flagList = Vue.extend(FlagList);
    let vueContainer = document.createElement("div");
    document.querySelector("#challenge-flags").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(FlagList, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  // Load TopicsList component
  if (document.querySelector("#challenge-topics")) {
    //const topicsList = Vue.extend(TopicsList);
    let vueContainer = document.createElement("div");
    document.querySelector("#challenge-topics").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(TopicsList, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  // Load TagsList component
  if (document.querySelector("#challenge-tags")) {
    //const tagList = Vue.extend(TagsList);
    let vueContainer = document.createElement("div");
    document.querySelector("#challenge-tags").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(TagsList, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  // Load Requirements component
  if (document.querySelector("#prerequisite-add-form")) {
    //const reqsComponent = Vue.extend(Requirements);
    let vueContainer = document.createElement("div");
    document.querySelector("#prerequisite-add-form").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(Requirements, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  // Load ChallengeFilesList component
  if (document.querySelector("#challenge-files")) {
    //const challengeFilesList = Vue.extend(ChallengeFilesList);
    let vueContainer = document.createElement("div");
    document.querySelector("#challenge-files").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(ChallengeFilesList, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  // Load HintsList component
  if (document.querySelector("#challenge-hints")) {
    //const hintsList = Vue.extend(HintsList);
    let vueContainer = document.createElement("div");
    document.querySelector("#challenge-hints").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(HintsList, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  // Load Next component
  if (document.querySelector("#next-add-form")) {
    //const nextChallenge = Vue.extend(NextChallenge);
    let vueContainer = document.createElement("div");
    document.querySelector("#next-add-form").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(NextChallenge, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  // Because this JS is shared by a few pages,
  // we should only insert the CommentBox if it's actually in use
  if (document.querySelector("#comment-box")) {
    // Insert CommentBox element
    //const commentBox = Vue.extend(CommentBox);
    let vueContainer = document.createElement("div");
    document.querySelector("#comment-box").appendChild(vueContainer);
    Vue.createApp({
      render: () => Vue.h(CommentBox, {
        challenge_id: window.CHALLENGE_ID
      })
    }).mount(vueContainer);
  }

  $.get(CTFd.config.urlRoot + "/api/v1/challenges/types", function (response) {
    const data = response.data;
    loadChalTemplate(data["standard"]);

    $("#create-chals-select input[name=type]").change(function () {
      let challenge = data[this.value];
      loadChalTemplate(challenge);
    });
  });
});
