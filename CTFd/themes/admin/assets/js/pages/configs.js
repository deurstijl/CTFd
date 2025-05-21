import "./main";
import "bootstrap/js/dist/tab";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import timezones from "../timezones";
import CTFd from "../compat/CTFd";
import { default as helpers } from "../compat/helpers";
import $ from "jquery";
import "../compat/json";
import { ezQuery, ezProgressBar, ezAlert } from "../compat/ezq";
import CodeMirror from "codemirror";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import * as Vue from "vue";
import FieldList from "../components/configs/fields/FieldList.vue";
import BracketList from "../components/configs/brackets/BracketList.vue";
import { Modal } from "bootstrap";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

function loadTimestamp(place, timestamp) {
  if (typeof timestamp == "string") {
    timestamp = parseInt(timestamp, 10) * 1000;
  }
  const d = dayjs(timestamp);
  $("#" + place + "-month").val(d.month() + 1); // Months are zero indexed (https://day.js.org/docs/en/get-set/month)
  $("#" + place + "-day").val(d.date());
  $("#" + place + "-year").val(d.year());
  $("#" + place + "-hour").val(d.hour());
  $("#" + place + "-minute").val(d.minute());
  loadDateValues(place);
}

function loadDateValues(place) {
  const month = $("#" + place + "-month").val();
  const day = $("#" + place + "-day").val();
  const year = $("#" + place + "-year").val();
  const hour = $("#" + place + "-hour").val();
  const minute = $("#" + place + "-minute").val();
  const timezone_string = $("#" + place + "-timezone").val();

  const utc = convertDateToMoment(month, day, year, hour, minute);
  if (utc.unix() && month && day && year && hour && minute) {
    $("#" + place).val(utc.unix());
    $("#" + place + "-local").val(
      utc.format("dddd, MMMM Do YYYY, h:mm:ss a z (zzz)"),
    );
    $("#" + place + "-zonetime").val(
      utc.tz(timezone_string).format("dddd, MMMM Do YYYY, h:mm:ss a z (zzz)"),
    );
  } else {
    $("#" + place).val("");
    $("#" + place + "-local").val("");
    $("#" + place + "-zonetime").val("");
  }
}

function convertDateToMoment(month, day, year, hour, minute) {
  let month_num = month.toString();
  if (month_num.length == 1) {
    month_num = "0" + month_num;
  }

  let day_str = day.toString();
  if (day_str.length == 1) {
    day_str = "0" + day_str;
  }

  let hour_str = hour.toString();
  if (hour_str.length == 1) {
    hour_str = "0" + hour_str;
  }

  let min_str = minute.toString();
  if (min_str.length == 1) {
    min_str = "0" + min_str;
  }

  // 2013-02-08 24:00
  const date_string =
    year.toString() +
    "-" +
    month_num +
    "-" +
    day_str +
    " " +
    hour_str +
    ":" +
    min_str +
    ":00";
  return dayjs(date_string);
}

function updateConfigs(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const obj = Object.fromEntries(formData.entries());
  const params = {};

  // Convert string "true"/"false" to boolean where appropriate
  for (const key in obj) {
    const val = obj[key];
    if (val === "true") {
      params[key] = true;
    } else if (val === "false") {
      params[key] = false;
    } else {
      params[key] = val;
    }
  }

  // Handle auth-related cleanup
  if (params.mail_useauth === false || params.mail_useauth === "false") {
    params.mail_username = null;
    params.mail_password = null;
  } else {
    if (params.mail_username === "") delete params.mail_username;
    if (params.mail_password === "") delete params.mail_password;
  }

  // Send PATCH request
  CTFd.api.patch_config_list({}, params).then((response) => {
    if (response.success) {
      window.location.reload();
    } else if (response.errors && response.errors.value) {
      const errors = response.errors.value.join("\n");
      alert(`Error:\n${errors}`);
    } else {
      alert("An unknown error occurred while updating configs.");
    }
  });
}


function uploadLogo(event) {
  event.preventDefault();

  const form = event.target;

  helpers.files.upload(form, {}, function (response) {
    if (!response.success || !response.data || response.data.length === 0) {
      alert("Logo upload failed. No file was returned.");
      return;
    }

    const file = response.data[0];
    const params = {
      value: file.location,
    };

    CTFd.fetch("/api/v1/configs/ctf_logo", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.reload();
        } else {
          alert("Logo uploading failed.");
        }
      })
      .catch((err) => {
        console.error("Upload error:", err);
        alert("An unexpected error occurred while uploading the logo.");
      });
  });
}

function switchUserMode(event) {
  event.preventDefault();
  let formData = new FormData(event.target);
  let msg =
    "Are you sure you'd like to switch user modes?\n\nAll submissions, awards, unlocks, and tracking will be deleted!";
  if (formData.get("user_mode") == "users") {
    msg =
      "Are you sure you'd like to switch user modes?\n\nAll teams, submissions, awards, unlocks, and tracking will be deleted!";
  }
  if (confirm(msg)) {
    // Use original form to include original input
    formData.append("submissions", true);
    formData.append("nonce", CTFd.config.csrfNonce);
    fetch(CTFd.config.urlRoot + "/admin/reset", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
    // Bind `this` so that we can reuse the updateConfigs function
    let binded = updateConfigs.bind(this);
    binded(event);
  }
}

function removeLogo() {
  const confirmed = confirm("Are you sure you'd like to remove the CTF logo?");
  if (!confirmed) return;

  const params = { value: null };

  CTFd.api.patch_config({ configKey: "ctf_logo" }, params).then((_response) => {
    window.location.reload();
  });
}

function smallIconUpload(event) {
  event.preventDefault();

  const form = event.target;

  helpers.files.upload(form, {}, function (response) {
    if (!response.success || !response.data || response.data.length === 0) {
      alert("Icon upload failed. No file was returned.");
      return;
    }

    const file = response.data[0];
    const params = {
      value: file.location,
    };

    CTFd.fetch("/api/v1/configs/ctf_small_icon", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.reload();
        } else {
          alert("Icon upload failed.");
        }
      })
      .catch((err) => {
        console.error("Upload error:", err);
        alert("An unexpected error occurred during upload.");
      });
  });
}

function removeSmallIcon() {
  const confirmed = confirm("Are you sure you'd like to remove the small site iconNOW?");
  if (!confirmed) return;

  const params = { value: null };

  CTFd.api.patch_config({ configKey: "ctf_small_icon" }, params).then((_response) => {
    window.location.reload();
  });
}


function importCSV(event) {
  event.preventDefault();

  const fileInput = document.getElementById("import-csv-file");
  const csvTypeInput = document.getElementById("import-csv-type");

  const csvFile = fileInput?.files?.[0];
  const csvType = csvTypeInput?.value;

  if (!csvFile || !csvType) {
    alert("CSV file and type are required.");
    return;
  }

  const formData = new FormData();
  formData.append("csv_file", csvFile);
  formData.append("csv_type", csvType);
  formData.append("nonce", CTFd.config.csrfNonce);

  const modal = helpers.createUploadProgressModal("Upload Progress");
  const progressBar = modal.querySelector(".progress-bar");
  modal.show();

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${CTFd.config.urlRoot}/admin/import/csv`, true);

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressBar.style.width = `${percent.toFixed(1)}%`;
      progressBar.setAttribute("aria-valuenow", percent.toFixed(1));
    }
  });

  xhr.onload = () => {
    modal.hide();

    if (xhr.status === 200) {
      setTimeout(() => window.location.reload(), 700);
    } else if (xhr.status === 500) {
      try {
        const errors = JSON.parse(xhr.responseText);
        const errorText = errors
          .map((e) => `Line ${e[0]}: ${JSON.stringify(e[1])}`)
          .join("\n");
        alert(errorText);
      } catch (err) {
        console.error("Invalid error response from server:", err);
        alert("Import failed with unknown error.");
      }
    } else {
      alert(`Unexpected response: ${xhr.statusText}`);
    }
  };

  xhr.onerror = () => {
    modal.hide();
    alert("An error occurred during import.");
  };

  xhr.send(formData);
}

function importConfig(event) {
  event.preventDefault();

  const fileInput = document.getElementById("import-file");
  const importFile = fileInput?.files?.[0];

  if (!importFile) {
    alert("Please select a file to import.");
    return;
  }

  const formData = new FormData();
  formData.append("backup", importFile);
  formData.append("nonce", CTFd.config.csrfNonce);

  const modal = helpers.createUploadProgressModal("Upload Progress");
  const progressBar = modal.querySelector(".progress-bar");

  modal.show();

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${CTFd.config.urlRoot}/admin/import`, true);

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressBar.style.width = `${percent.toFixed(1)}%`;
      progressBar.setAttribute("aria-valuenow", percent.toFixed(1));
    }
  });

  xhr.onload = () => {
    modal.hide();

    if (xhr.status === 200) {
      window.location.href = `${CTFd.config.urlRoot}/admin/import`;
    } else if (xhr.status === 500) {
      alert(xhr.responseText);
    } else {
      alert(`Unexpected error: ${xhr.statusText}`);
    }
  };

  xhr.onerror = () => {
    modal.hide();
    alert("An error occurred during file upload.");
  };

  xhr.send(formData);
}


function exportConfig(event) {
  event.preventDefault();
  window.location.href = event.currentTarget.getAttribute("href");
}

// Insert timezones into a <select>
function insertTimezones(target) {
  if (!target) return;

  const guessed = dayjs.tz.guess();
  const currentOpt = document.createElement("option");
  currentOpt.textContent = guessed;
  target.appendChild(currentOpt);

  for (const tz of timezones) {
    const opt = document.createElement("option");
    opt.textContent = tz;
    target.appendChild(opt);
  }
}


$(() => {
  const theme_header_editor = CodeMirror.fromTextArea(
    document.getElementById("theme-header"),
    {
      lineNumbers: true,
      lineWrapping: true,
      mode: "htmlmixed",
      htmlMode: true,
    },
  );

  const theme_footer_editor = CodeMirror.fromTextArea(
    document.getElementById("theme-footer"),
    {
      lineNumbers: true,
      lineWrapping: true,
      mode: "htmlmixed",
      htmlMode: true,
    },
  );

  const theme_settings_editor = CodeMirror.fromTextArea(
    document.getElementById("theme-settings"),
    {
      lineNumbers: true,
      lineWrapping: true,
      readOnly: true,
      mode: { name: "javascript", json: true },
    },
  );

  // Handle refreshing codemirror when switching tabs.
  // Better than the autorefresh approach b/c there's no flicker
  $("a[href='#theme']").on("shown.bs.tab", function (_e) {
    theme_header_editor.refresh();
    theme_footer_editor.refresh();
    theme_settings_editor.refresh();
  });

  $(
    "a[href='#legal'], a[href='#tos-config'], a[href='#privacy-policy-config']",
  ).on("shown.bs.tab", function (_e) {
    $("#tos-config .CodeMirror").each(function (i, el) {
      el.CodeMirror.refresh();
    });
    $("#privacy-policy-config .CodeMirror").each(function (i, el) {
      el.CodeMirror.refresh();
    });
  });

  // Handle form submit inside the modal
  document.querySelector("#theme-settings-modal form")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const json = {};

    for (const [key, value] of formData.entries()) {
      if (json.hasOwnProperty(key)) {
        if (Array.isArray(json[key])) {
          json[key].push(value);
        } else {
          json[key] = [json[key], value];
        }
      } else {
        json[key] = value;
      }
    }

    theme_settings_editor.getDoc().setValue(JSON.stringify(json, null, 2));

    const modalEl = document.getElementById("theme-settings-modal");
    Modal.getInstance(modalEl)?.hide();
  });

  // Handle clicking the settings button to show modal with data
  document.querySelector("#theme-settings-button")?.addEventListener("click", () => {
    const form = document.querySelector("#theme-settings-modal form");
    let data = {};

    try {
      data = JSON.parse(theme_settings_editor.getValue());
    } catch (e) {
      data = {};
    }

    for (const [key, value] of Object.entries(data)) {
      const input = form.querySelectorAll(`[name="${key}"]`);

      input.forEach((el) => {
        const type = el.type;
        if (type === "checkbox" || type === "radio") {
          el.checked = value === el.value || value === true;
        } else {
          el.value = value;
        }
      });
    }

    const modalEl = document.getElementById("theme-settings-modal");
    Modal.getOrCreateInstance(modalEl).show();
  });

  insertTimezones(document.getElementById("start-timezone"));
  insertTimezones(document.getElementById("end-timezone"));
  insertTimezones(document.getElementById("freeze-timezone"));

  $(".config-section > form:not(.form-upload, .custom-config-form)").submit(
    updateConfigs,
  );
  $("#logo-upload").submit(uploadLogo);
  $("#user-mode-form").submit(switchUserMode);
  $("#remove-logo").click(removeLogo);
  $("#ctf-small-icon-upload").submit(smallIconUpload);
  $("#remove-small-icon").click(removeSmallIcon);
  $("#export-button").click(exportConfig);
  $("#import-button").click(importConfig);
  $("#import-csv-form").submit(importCSV);
  $("#config-color-update").click(function () {
    const hex_code = $("#config-color-picker").val();
    const user_css = theme_header_editor.getValue();
    let new_css;
    if (user_css.length) {
      let css_vars = `theme-color: ${hex_code};`;
      new_css = user_css.replace(/theme-color: (.*);/, css_vars);
    } else {
      new_css =
        `<style id="theme-color">\n` +
        `:root {--theme-color: ${hex_code};}\n` +
        `.navbar{background-color: var(--theme-color) !important;}\n` +
        `.container-fluid bg-light p-5 text-center mb-4{background-color: var(--theme-color) !important;}\n` +
        `</style>\n` + 
        `NOTE that inline styles need to have a nonce value.\n` +
        `Better use <link rel="stylesheet" href="/files/your.css">` ;
    }
    theme_header_editor.getDoc().setValue(new_css);
  });

  $(".start-date").change(function () {
    loadDateValues("start");
  });
  $(".end-date").change(function () {
    loadDateValues("end");
  });
  $(".freeze-date").change(function () {
    loadDateValues("freeze");
  });

  const start = $("#start").val();
  const end = $("#end").val();
  const freeze = $("#freeze").val();

  if (start) {
    loadTimestamp("start", start);
  }
  if (end) {
    loadTimestamp("end", end);
  }
  if (freeze) {
    loadTimestamp("freeze", freeze);
  }

  // Toggle username and password based on stored value
  $("#mail_useauth")
    .change(function () {
      $("#mail_username_password").toggle(this.checked);
    })
    .change();

  $("#config-sidebar .nav-link").click(function () {
    window.scrollTo(0, 0);
  });

  // Insert FieldList element for users
  // const fieldList = Vue.extend(FieldList);
  let userVueContainer = document.createElement("div");
  document.querySelector("#user-field-list").appendChild(userVueContainer);
  Vue.createApp({
    render: () => Vue.h(FieldList, {
      type: "user"
    })
  }).mount(userVueContainer);

  // Insert FieldList element for teams
  let teamVueContainer = document.createElement("div");
  document.querySelector("#team-field-list").appendChild(teamVueContainer);
  Vue.createApp({
    render: () => Vue.h(FieldList, {
      type: "team"
    })
  }).mount(teamVueContainer);

  let bracketListContainer = document.createElement("div");
  document.querySelector("#brackets-list").appendChild(bracketListContainer);

  Vue.createApp({
    render: () => Vue.h(BracketList)
  }).mount(bracketListContainer);
});
