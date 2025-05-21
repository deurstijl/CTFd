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
                <h3>Edit Hint</h3>
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

        <form method="POST" @submit.prevent="updateHint">
          <div class="modal-body">
            <div class="container">
              <div class="row">
                <div class="col-md-12">

                  <div class="mb-4">
                    <label>Title<br /><small>Shown before unlocking</small></label>
                    <input
                      type="text"
                      class="form-control"
                      name="title"
                      :value="title"
                      ref="title"
                    />
                  </div>

                  <div class="mb-4">
                    <label>Hint<br /><small>Markdown & HTML supported</small></label>
                    <textarea
                      class="form-control"
                      name="content"
                      rows="7"
                      :value="content"
                      ref="content"
                    ></textarea>
                  </div>

                  <div class="mb-4">
                    <label>Cost<br /><small>Points required to view</small></label>
                    <input
                      type="number"
                      class="form-control"
                      v-model.lazy="cost"
                    />
                  </div>

                  <div class="mb-4">
                    <label>Requirements<br />
                      <small>Hints that must be unlocked first</small>
                    </label>
                    <div
                      class="form-check"
                      v-for="hint in otherHints"
                      :key="hint.id"
                    >
                      <label class="form-check-label">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :value="hint.id"
                          v-model="selectedHints"
                        />
                        {{ hint.content }} - {{ hint.cost }}
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
  name: "HintEditForm",
  props: {
    challenge_id: Number,
    hint_id: Number,
    hints: Array,
    visible: Boolean,
  },
  data() {
    return {
      cost: 0,
      title: null,
      content: null,
      selectedHints: [],
    };
  },
  computed: {
    otherHints() {
      return this.hints.filter((hint) => hint.id !== this.hint_id);
    },
  },
  watch: {
    hint_id: {
      immediate: true,
      handler(val) {
        if (val !== null) this.loadHint();
      },
    },
    visible(newVal) {
      if (newVal && this.hint_id != null) {
        this.loadHint();
      }
    },
  },
  methods: {
    loadHint() {
      CTFd.fetch(`/api/v1/hints/${this.hint_id}?preview=true`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            const hint = res.data;
            this.cost = hint.cost;
            this.title = hint.title;
            this.content = hint.content;
            this.selectedHints = hint.requirements?.prerequisites || [];

            this.$nextTick(() => {
              const editor = this.$refs.content;
              bindMarkdownEditor(editor);
              setTimeout(() => {
                editor.mde.codemirror.getDoc().setValue(this.content || "");
                editor.mde.codemirror.refresh();
              }, 200);
            });
          }
        });
    },
    updateHint() {
      const params = {
        challenge_id: this.challenge_id,
        content: this.getContent(),
        cost: this.cost || 0,
        title: this.getTitle(),
        requirements: { prerequisites: this.selectedHints },
      };

      CTFd.fetch(`/api/v1/hints/${this.hint_id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            this.$emit("refreshHints", this.$options.name);
            this.$emit("close");
          } else {
            alert("Failed to update hint.");
          }
        })
        .catch((err) => {
          console.error("Update failed:", err);
          alert("Unexpected error: " + err.message);
        });
    },
    getContent() {
      const editor = this.$refs.content;
      return editor.mde.codemirror.getDoc().getValue();
    },
    getTitle() {
      return this.$refs.title.value;
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
