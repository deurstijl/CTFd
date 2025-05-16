<template>
  <div>
    <!-- Flag creation modal -->
    <FlagCreationForm
      :challenge_id="challenge_id"
      :visible="showCreateModal"
      @refreshFlags="refreshFlags"
      @close="showCreateModal = false"
    />

    <!-- Flag edit modal -->
    <FlagEditForm
      :flag_id="editing_flag_id"
      :visible="showEditModal"
      @refreshFlags="refreshFlags"
      @close="closeEditModal"
    />

    <!-- Flag table -->
    <table id="flagsboard" class="table table-striped">
      <thead>
        <tr>
          <td class="text-center"><b>Type</b></td>
          <td class="text-center"><b>Flag</b></td>
          <td class="text-center"><b>Settings</b></td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="flag in flags" :key="flag.id">
          <td class="text-center">{{ flag.type }}</td>
          <td class="text-break">
            <pre class="flag-content">{{ flag.content }}</pre>
          </td>
          <td class="text-center">
            <i
              role="button"
              class="btn-fa fas fa-edit edit-flag"
              @click="editFlag(flag.id)"
            ></i>
            <i
              role="button"
              class="btn-fa fas fa-times delete-flag"
              @click="deleteFlag(flag.id)"
            ></i>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add Flag Button -->
    <div class="col-md-12">
      <button
        id="flag-add-button"
        class="btn btn-success d-inline-block float-end"
        @click="addFlag"
      >
        Create Flag
      </button>
    </div>
  </div>
</template>

<script>
import CTFd from "../../compat/CTFd";
import FlagCreationForm from "./FlagCreationForm.vue";
import FlagEditForm from "./FlagEditForm.vue";

export default {
  components: {
    FlagCreationForm,
    FlagEditForm,
  },
  props: {
    challenge_id: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      flags: [],
      editing_flag_id: null,
      showCreateModal: false,
      showEditModal: false,
    };
  },
  methods: {
    async loadFlags() {
      try {
        const response = await CTFd.fetch(
          `/api/v1/challenges/${this.challenge_id}/flags`,
          {
            method: "GET",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          this.flags = data.data;
        }
      } catch (err) {
        console.error("Failed to load flags:", err);
      }
    },
    refreshFlags() {
      this.loadFlags();
      this.showCreateModal = false;
      this.showEditModal = false;
    },
    addFlag() {
      this.showCreateModal = true;
    },
    editFlag(flag_id) {
      this.editing_flag_id = flag_id;
      this.showEditModal = true;
    },
    closeEditModal() {
      this.editing_flag_id = null;
      this.showEditModal = false;
    },
    async deleteFlag(flag_id) {
      if (!confirm("Are you sure you'd like to delete this flag?")) return;
      try {
        const response = await CTFd.fetch(`/api/v1/flags/${flag_id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          this.loadFlags();
        } else {
          alert("Failed to delete flag.");
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    },
  },
  created() {
    this.loadFlags();
  },
};
</script>

<style scoped></style>
