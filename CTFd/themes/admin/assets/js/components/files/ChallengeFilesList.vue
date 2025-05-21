<template>
  <div>
    <table id="filesboard" class="table table-striped">
      <thead>
        <tr>
          <td class="text-center"><b>File</b></td>
          <td class="text-center"><b>Settings</b></td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.id">
          <td class="text-start">
            <a :href="`${urlRoot}/files/${file.location}`">{{
              file.location.split("/").pop()
            }}</a>
            <div class="d-flex flex-row align-items-center">
              <strong class="mr-2 small"> SHA1: </strong>
              <span class="d-inline-block mr-2 small text-muted">
                {{ file.sha1sum || "null" }}
              </span>
            </div>
          </td>

          <td class="text-center">
            <i
              role="button"
              class="btn-fa fas fa-times delete-file"
              @click="deleteFile(file.id)"
            ></i>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="col-md-12 mt-3">
      <form method="POST" ref="FileUploadForm" @submit.prevent="addFiles">
        <div class="mb-4">
          <input
            class="form-control"
            id="file"
            multiple=""
            name="file"
            required=""
            type="file"
          />
          <sub class="text-muted">
            Attach multiple files using Control+Click or Cmd+Click.
          </sub>
        </div>
        <div class="mb-4">
          <input
            class="btn btn-success float-end"
            id="_submit"
            name="_submit"
            type="submit"
            value="Upload"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ezQuery } from "../../compat/ezq";
import { default as helpers } from "../../compat/helpers";
import CTFd from "../../compat/CTFd";

export default {
  props: {
    challenge_id: Number,
  },
  data: function () {
    return {
      files: [],
      urlRoot: CTFd.config.urlRoot,
    };
  },
  methods: {
    loadFiles: function () {
      CTFd.fetch(`/api/v1/challenges/${this.$props.challenge_id}/files`, {
        method: "GET",
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          if (response.success) {
            this.files = response.data;
          }
        });
    },
    addFiles: async function () {
      const form = this.$refs.FileUploadForm;
      const input = form.querySelector("#file");

      if (!input.files.length) {
        alert("Please select at least one file.");
        return;
      }

      const formData = new FormData();
      for (let i = 0; i < input.files.length; i++) {
        formData.append("file", input.files[i]);
      }

      formData.append("type", "challenge");
      formData.append("challenge", this.challenge_id);
      formData.append("nonce", CTFd.config.csrfNonce);

      try {
        const response = await fetch(`${CTFd.config.urlRoot}/api/v1/files`, {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          this.loadFiles();
        } else {
          let msg = "";
          for (const key in result.errors) {
            msg += result.errors[key].join("\n") + "\n";
          }
          alert("Upload failed:\n" + msg);
        }
      } catch (err) {
        console.error("File upload error:", err);
        alert("Unexpected error: " + err.message);
      }
    },
    deleteFile(fileId) {
      const confirmed = confirm("Are you sure you want to delete this file?");
      if (!confirmed) return;

      CTFd.fetch(`/api/v1/files/${fileId}`, {
        method: "DELETE",
        credentials: "same-origin",
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            this.loadFiles();
          } else {
            alert("Failed to delete the file.");
          }
        })
        .catch((err) => {
          console.error("Error deleting file:", err);
          alert("Unexpected error: " + err.message);
        });
    },
  },
  created() {
    this.loadFiles();
  },
};
</script>

<style scoped></style>
