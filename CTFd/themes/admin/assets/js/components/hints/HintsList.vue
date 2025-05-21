<template>
  <div>
    <!-- Hint creation modal -->
    <HintCreationForm
      :challenge_id="challenge_id"
      :visible="showCreateModal"
      :hints="hints"
      @refreshHints="refreshHints"
      @close="showCreateModal = false"
    />

    <!-- Hint edit modal -->
    <HintEditForm
      :challenge_id="challenge_id"
      :hint_id="editing_hint_id"
      :visible="showEditModal"
      :hints="hints"
      @refreshHints="refreshHints"
      @close="closeEditModal"
    />

    <table class="table table-striped">
      <thead>
        <tr>
          <td class="text-center"><b>ID</b></td>
          <td class="text-center"><b>Title</b></td>
          <td class="text-center"><b>Hint</b></td>
          <td class="text-center"><b>Cost</b></td>
          <td class="text-center"><b>Settings</b></td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hint in hints" :key="hint.id">
          <td class="text-center">{{ hint.type }}</td>
          <td class="text-center">{{ hint.title }}</td>
          <td class="text-break">
            <pre>{{ hint.content }}</pre>
          </td>
          <td class="text-center">{{ hint.cost }}</td>
          <td class="text-center">
            <i
              role="button"
              class="btn-fa fas fa-edit"
              @click="editHint(hint.id)"
            ></i>
            <i
              role="button"
              class="btn-fa fas fa-times"
              @click="deleteHint(hint.id)"
            ></i>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="col-md-12">
      <button class="btn btn-success float-end" @click="addHint">
        Create Hint
      </button>
    </div>
  </div>
</template>

<script>
import CTFd from "../../compat/CTFd";
import { ezQuery } from "../../compat/ezq";
import HintCreationForm from "./HintCreationForm.vue";
import HintEditForm from "./HintEditForm.vue";

export default {
  components: {
    HintCreationForm,
    HintEditForm,
  },
  props: {
    challenge_id: Number,
  },
  data() {
    return {
      hints: [],
      editing_hint_id: null,
      showCreateModal: false,
      showEditModal: false,
    };
  },
  methods: {
    async loadHints() {
      const result = await CTFd.fetch(
        `/api/v1/challenges/${this.challenge_id}/hints`,
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const response = await result.json();
      if (response.success) {
        this.hints = response.data;
        return true;
      } else {
        return false;
      }
    },

    addHint() {
      this.showCreateModal = true;
    },

    editHint(hintId) {
      this.editing_hint_id = hintId;
      this.showEditModal = true;
    },

    closeEditModal() {
      this.editing_hint_id = null;
      this.showEditModal = false;
    },

    async refreshHints(caller) {
      const success = await this.loadHints();
      if (!success) {
        alert("An error occurred while updating this hint. Please try again.");
      }

      // Auto-close the relevant modal
      if (caller === "HintCreationForm") {
        this.showCreateModal = false;
      } else if (caller === "HintEditForm") {
        this.closeEditModal();
      }
    },

    deleteHint(hintId) {
    if (!confirm("Are you sure you want to delete this hint?")) return;

    CTFd.fetch(`/api/v1/hints/${hintId}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          this.loadHints();
        } else {
          alert("Failed to delete the hint.");
        }
      })
      .catch((err) => {
        console.error("Hint deletion failed:", err);
        alert("Unexpected error: " + err.message);
      });
    },
  },
  created() {
    this.loadHints();
  },
};
</script>

<style scoped></style>
