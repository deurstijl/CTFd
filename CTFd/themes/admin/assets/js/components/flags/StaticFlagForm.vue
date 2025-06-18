<template>
  <div>
    <div class="mb-4">
      <label for="static-flag">Flag</label>
      <input
        v-model="flag"
        type="text"
        class="form-control"
        id="static-flag"
        name="flag"
        required
      />
    </div>

    <div class="mb-4">
      <label for="static-case">Case</label>
      <select
        v-model="data"
        class="form-select"
        id="static-case"
        name="data"
      >
        <option :value="'case_insensitive'">Case Insensitive</option>
        <option :value="''">Case Sensitive</option>
      </select>
    </div>

    <button class="btn btn-success float-end" @click="submit">
      Create Flag
    </button>
  </div>
</template>

<script>
export default {
  name: "StaticFlagForm",
  props: {
    challenge_id: Number,
    mode: {
      type: String,
      default: "create",
    },
    initialData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      flag: this.initialData.content || "",
      data: this.initialData.data || "", // will be 'case_insensitive' or ''
    };
  },
  methods: {
    submit() {
      const params = {
        type: "static",
        content: this.flag,
        data: this.data,
      };

      if (this.challenge_id) {
        params.challenge = this.challenge_id;
      }

      if (this.mode === "edit") {
        params.id = this.initialData.id;
      }

      this.$emit("submit", params);
    },
  },
};
</script>
