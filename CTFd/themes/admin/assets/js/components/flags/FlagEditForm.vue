<template>
  <div
    id="flag-edit-modal"
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    :class="{ show: visible }"
    :style="{ display: visible ? 'block' : 'none' }"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header text-center">
          <div class="container">
            <div class="row">
              <div class="col-md-12">
                <h3>Edit Flag</h3>
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

        <div class="modal-body">
          <component
            v-if="flag && selectedTypeComponent"
            :is="selectedTypeComponent"
            :mode="'edit'"
            :initialData="flag"
            @submit="updateFlag"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import StaticFlagForm from "./StaticFlagForm.vue";
import RegexFlagForm from "./RegexFlagForm.vue";
import CTFd from "../../compat/CTFd";

export default {
  name: "FlagEditForm",
  props: {
    flag_id: Number,
    visible: Boolean,
  },
  components: {
    StaticFlagForm,
    RegexFlagForm,
  },
  data() {
    return {
      flag: null,
    };
  },
  computed: {
    selectedTypeComponent() {
      if (!this.flag) return null;
      switch (this.flag.type) {
        case "static":
          return "StaticFlagForm";
        case "regex":
          return "RegexFlagForm";
        default:
          return null;
      }
    },
  },
  watch: {
    visible(newVal) {
      if (newVal && this.flag_id != null) {
        this.loadFlag();
      }
    },
  },
  methods: {
    loadFlag() {
      CTFd.fetch(`/api/v1/flags/${this.flag_id}`, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((res) => {
          this.flag = res.data;
        })
        .catch((err) => {
          console.error("Failed to load flag:", err);
        });
    },
    updateFlag(params) {
      CTFd.fetch(`/api/v1/flags/${this.flag_id}`, {
        method: "PATCH",
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
            this.$emit("refreshFlags", this.$options.name);
            this.$emit("close");
            this.flag = null;
          } else {
            let msg = "";
            for (const key in response.errors) {
              msg += response.errors[key].join("\n") + "\n";
            }
            alert("Error updating flag:\n" + msg);
          }
        })
        .catch((err) => {
          console.error("Error updating flag:", err);
          alert("Unexpected error: " + err.message);
        });
    },
  },
};
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.15s linear;
}
.modal.show {
  opacity: 1;
  display: block !important;
}
</style>
