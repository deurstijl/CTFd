<template>
  <div
    id="flag-create-modal"
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
                <h3>Create Flag</h3>
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
          <label for="create-keys-select" class="control-label">
            Choose Flag Type
          </label>
          <select class="form-control form-select" v-model="selectedType">
            <option disabled value="">--</option>
            <option value="static">static</option>
            <option value="regex">regex</option>
            <!-- Add more as needed -->
          </select>

          <br />

          <component
            v-if="selectedTypeComponent"
            :is="selectedTypeComponent"
            :challenge_id="challenge_id"
            @submit="submitFlag"
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
  name: "FlagCreationForm",
  props: {
    challenge_id: {
      type: Number,
      required: true,
    },
    visible: {
      type: Boolean,
      required: true,
    },
  },
  components: {
    StaticFlagForm,
    RegexFlagForm,
  },
  data() {
    return {
      selectedType: "",
    };
  },
  computed: {
    selectedTypeComponent() {
      switch (this.selectedType) {
        case "static":
          return "StaticFlagForm";
        case "regex":
          return "RegexFlagForm";
        default:
          return null;
      }
    },
  },
  methods: {
    submitFlag(params) {
      CTFd.fetch("/api/v1/flags", {
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
            this.$emit("refreshFlags", this.$options.name);
            this.$emit("close");
            this.selectedType = "";
          } else {
            let msg = "";
            for (const key in response.errors) {
              msg += response.errors[key].join("\n") + "\n";
            }
            alert("Error:\n" + msg);
          }
        })
        .catch((err) => {
          console.error("Flag creation error:", err);
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
