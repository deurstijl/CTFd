<template>
  <div
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    :class="{ show: visible }"
    :style="{ display: visible ? 'block' : 'none' }"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header text-center">
          <div class="container">
            <div class="row">
              <div class="col-md-12">
                <h3>Create Hint</h3>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="close"
            @click="$emit('close')"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <form method="POST" @submit.prevent="submitHint">
          <div class="modal-body">
            <div class="container">
              <div class="row">
                <div class="col-md-12">

                  <div class="mb-4">
                    <label>
                      Title<br />
                      <small>Content shown before unlocking</small>
                    </label>
                    <input
                      type="text"
                      class="form-control"
                      name="title"
                      ref="title"
                    />
                  </div>

                  <div class="mb-4">
                    <label>
                      Hint<br />
                      <small>Markdown & HTML supported</small>
                    </label>
                    <textarea
                      type="text"
                      class="form-control"
                      name="content"
                      rows="7"
                      ref="content"
                    ></textarea>
                  </div>

                  <div class="mb-4">
                    <label>
                      Cost<br />
                      <small>Points required to view</small>
                    </label>
                    <input
                      type="number"
                      class="form-control"
                      v-model.lazy="cost"
                    />
                  </div>

                  <div class="mb-4">
                    <label>
                      Requirements<br />
                      <small>Hints that must be unlocked before this one</small>
                    </label>
                    <div
                      class="form-check"
                      v-for="hint in hints"
                      :key="hint.id"
                    >
                      <label class="form-check-label cursor-pointer">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :value="hint.id"
                          v-model="selectedHints"
                        />
                        {{ hint.cost }} - {{ hint.id }}
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="container">
              <div class="row">
                <div class="col-md-12">
                  <button class="btn btn-primary float-end">Submit</button>
                </div>
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script>
import CTFd from "../../compat/CTFd";
import { bindMarkdownEditor } from "../../styles";

export default {
  name: "HintCreationForm",
  props: {
    challenge_id: Number,
    hints: Array,
    visible: Boolean,
  },
  data() {
    return {
      cost: 0,
      selectedHints: [],
    };
  },
  methods: {
    getCost() {
      return this.cost || 0;
    },
    getContent() {
      return this.$refs.content.value;
    },
    getTitle() {
      return this.$refs.title.value;
    },
    submitHint() {
      const params = {
        challenge_id: this.challenge_id,
        content: this.getContent(),
        cost: this.getCost(),
        title: this.getTitle(),
        requirements: { prerequisites: this.selectedHints },
      };

      CTFd.fetch("/api/v1/hints", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            this.$emit("refreshHints", this.$options.name);
            this.$emit("close");
            this.resetForm();
          } else {
            alert("Error creating hint.");
          }
        })
        .catch((err) => {
          console.error("Creation failed:", err);
          alert("Unexpected error: " + err.message);
        });
    },
    resetForm() {
      this.cost = 0;
      this.selectedHints = [];
      if (this.$refs.title) this.$refs.title.value = "";
      if (this.$refs.content) this.$refs.content.value = "";
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // Optional: bind markdown editor here
        this.$nextTick(() => bindMarkdownEditor(this.$refs.content));
        this.resetForm();
      }
    },
  },
};
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
.modal.show {
  opacity: 1;
  display: block !important;
}
</style>
