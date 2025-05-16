<template>
  <div id="media-modal" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="text-center w-100">Media Library</h3>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <div class="row">
            <div class="col-md-6" id="media-library-list">
              <div
                class="media-item-wrapper"
                v-for="file in files"
                :key="file.id"
              >
                <a href="#" @click.prevent="selectFile(file)">
                  <i :class="getIconClass(file.location)" aria-hidden="true"></i>
                  <small class="media-item-title ps-1">{{ file.location.split("/").pop() }}</small>
                </a>
              </div>
            </div>

            <div class="col-md-6" id="media-library-details">
              <h4 class="text-center">Media Details</h4>
              <div class="text-center" v-if="selectedFile">
                <div v-if="getIconClass(selectedFile.location) === 'far fa-file-image'">
                  <img :src="buildSelectedFileUrl()" class="img-fluid" style="max-height: 300px; object-fit: contain;" />
                </div>
                <div v-else>
                  <i :class="`${getIconClass(selectedFile.location)} fa-4x`" aria-hidden="true"></i>
                </div>

                <div class="mt-3">
                  <a :href="buildSelectedFileUrl()" target="_blank">{{ selectedFile.location.split("/").pop() }}</a>
                </div>

                <div class="mt-3">
                  <label for="media-link">Link:</label>
                  <input id="media-link" class="form-control" type="text" :value="buildSelectedFileUrl()" readonly />
                </div>

                <div class="row text-center mt-4">
                  <div class="col-md-6 mb-2">
                    <button @click="insertSelectedFile" class="btn btn-success w-100">Insert</button>
                  </div>
                  <div class="col-md-3 mb-2">
                    <button @click="downloadSelectedFile" class="btn btn-primary w-100">
                      <i class="fas fa-download"></i>
                    </button>
                  </div>
                  <div class="col-md-3 mb-2">
                    <button @click="deleteSelectedFile" class="btn btn-danger w-100">
                      <i class="far fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form id="media-library-upload" enctype="multipart/form-data" class="mt-4">
            <div class="row">
              <div class="col">
                <div class="mb-3">
                  <label for="media-files" class="form-label">Upload Files</label>
                  <input type="file" name="file" id="media-files" class="form-control" multiple />
                  <div class="form-text">Attach multiple files using Control+Click or Cmd+Click.</div>
                </div>
              </div>
              <div class="col">
                <div class="mb-3">
                  <label for="location" class="form-label">Upload File Location</label>
                  <input type="text" name="location" id="location" class="form-control" placeholder="Location" />
                  <div class="form-text">
                    Route where file will be accessible (optional). Provide as <code>directory/filename.ext</code>.
                  </div>
                </div>
              </div>
            </div>
            <input type="hidden" value="page" name="type" />
          </form>
          <div class="progress mb-4" v-if="isUploading">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              :style="{ width: uploadProgress + '%' }"
              :aria-valuenow="uploadProgress"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {{ uploadProgress }}%
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="uploadChosenFiles" type="submit" class="btn btn-primary ms-auto">Upload</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CTFd from "../../compat/CTFd";
import helpers from "../../compat/helpers";

function get_page_files() {
  return CTFd.fetch("/api/v1/files?type=page", {
    credentials: "same-origin",
  }).then((response) => response.json());
}

export default {
  props: {
    editor: Object,
  },
  data() {
    return {
      files: [],
      selectedFile: null,
      uploadProgress: 0, // New state
      isUploading: false, // To toggle visibility
    };
  },
  methods: {
    getPageFiles() {
      get_page_files().then((response) => {
        this.files = response.data;
      });
    },
    uploadChosenFiles() {
      const form = document.querySelector("#media-library-upload");
      const locationInput = form.querySelector('input[name="location"]');
      const locationValue = locationInput?.value?.trim();
      if (locationValue && !locationValue.includes("/")) {
        alert("Upload location must include a folder and filename, like 'folder/file.ext'.");
        return;
      }

      const formData = new FormData(form);

      this.isUploading = true;
      this.uploadProgress = 0;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/v1/files");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          this.uploadProgress = Math.round((e.loaded * 100) / e.total);
        }
      });

      xhr.onload = () => {
        this.isUploading = false;
        this.uploadProgress = 100;

        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            this.getPageFiles();
            this.selectedFile = null;

            // Optionally close modal
            const modalEl = document.getElementById("media-modal");
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
          }
        } catch (err) {
          console.error("Upload failed or bad JSON:", err);
        }
      };

      xhr.onerror = () => {
        this.isUploading = false;
        alert("Upload failed. Please try again.");
      };

      formData.append("nonce", CTFd.config.csrfNonce);
      xhr.send(formData);
    },
    selectFile(file) {
      this.selectedFile = file;
    },
    buildSelectedFileUrl() {
      return `${CTFd.config.urlRoot}/files/${this.selectedFile.location}`;
    },
    deleteSelectedFile() {
      if (!this.selectedFile) return;

      if (confirm("Are you sure you want to delete this file?")) {
        CTFd.fetch(`/api/v1/files/${this.selectedFile.id}`, {
          method: "DELETE",
        }).then((response) => {
          if (response.status === 200) {
            response.json().then((object) => {
              if (object.success) {
                this.getPageFiles();
                this.selectedFile = null;
              }
            });
          }
        });
      }
    },
    insertSelectedFile() {
      let editor = this.editor;
      if (editor.hasOwnProperty("codemirror")) {
        editor = editor.codemirror;
      }
      const doc = editor.getDoc();
      const cursor = doc.getCursor();
      const url = this.buildSelectedFileUrl();
      const filename = url.split("/").pop();
      const isImage = this.getIconClass(this.selectedFile.location) === "far fa-file-image";
      const link = `${isImage ? "!" : ""}[${filename}](${url})`;
      doc.replaceRange(link, cursor);
    },
    downloadSelectedFile() {
      window.open(this.buildSelectedFileUrl(), "_blank");
    },
    getIconClass(filename) {
      const mapping = {
        png: "far fa-file-image",
        jpg: "far fa-file-image",
        jpeg: "far fa-file-image",
        gif: "far fa-file-image",
        bmp: "far fa-file-image",
        svg: "far fa-file-image",
        txt: "far fa-file-alt",
        mov: "far fa-file-video",
        mp4: "far fa-file-video",
        wmv: "far fa-file-video",
        flv: "far fa-file-video",
        mkv: "far fa-file-video",
        avi: "far fa-file-video",
        pdf: "far fa-file-pdf",
        mp3: "far fa-file-sound",
        wav: "far fa-file-sound",
        aac: "far fa-file-sound",
        zip: "far fa-file-archive",
        gz: "far fa-file-archive",
        tar: "far fa-file-archive",
        "7z": "far fa-file-archive",
        rar: "far fa-file-archive",
        py: "far fa-file-code",
        c: "far fa-file-code",
        cpp: "far fa-file-code",
        html: "far fa-file-code",
        js: "far fa-file-code",
        rb: "far fa-file-code",
        go: "far fa-file-code",
      };
      const ext = filename.split(".").pop().toLowerCase();
      return mapping[ext] || "far fa-file";
    },
  },
  created() {
    this.getPageFiles();
  },
};
</script>

<style scoped>
.media-item-wrapper {
  margin-bottom: 0.5rem;
}
</style>
