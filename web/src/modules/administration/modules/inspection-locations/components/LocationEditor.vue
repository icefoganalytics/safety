<template>
  <v-dialog v-model="visible" persistent max-width="700">
    <v-card v-if="selectedLocation">
      <v-toolbar color="primary" variant="dark" title="Edit Location">
        <v-spacer></v-spacer>
        <v-btn icon @click="close" color="white"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-text>
        <v-text-field v-model="selectedLocation.name" dense outlined label="Name" />
        <v-text-field v-model="selectedLocation.description" dense outlined label="Description" />
        <LocationSelect v-model="selectedLocation.location_code" label="Location" />
        <DepartmentSelector v-model="selectedLocation.department_code" label="Department"
          @update:model-value="loadBranches" />
        <v-combobox v-model="selectedLocation.branch" :items="branchOptions" label="Area"
          hint="Select an existing branch or type a new one" persistent-hint />
      </v-card-text>
      <v-card-actions class="mx-4 mb-2">
        <v-btn color="primary" variant="flat" @click="saveLocation">Save</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="yg_sun" variant="outlined" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useInspectionLocationAdminStore } from "../store";
import { useApiStore } from "@/store/ApiStore";
import { INSPECTION_LOCATION_URL } from "@/urls";

import DepartmentSelector from "@/components/DepartmentSelector.vue";
import LocationSelect from "@/components/common/LocationSelect.vue";

export default {
  name: "LocationEditor",
  components: { DepartmentSelector, LocationSelect },
  data: () => ({
    branchOptions: [] as string[],
  }),
  computed: {
    ...mapState(useInspectionLocationAdminStore, ["selectedLocation"]),

    visible() {
      return this.selectedLocation ? true : false;
    },
  },
  watch: {
    selectedLocation: {
      handler(val) {
        if (val && val.department_code) {
          this.loadBranches();
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions(useInspectionLocationAdminStore, ["unselectLocation", "saveLocation"]),
    close() {
      this.unselectLocation();
    },
    async loadBranches() {
      this.branchOptions = [];
      const dept = this.selectedLocation?.department_code;
      if (!dept) return;
      const api = useApiStore();
      const resp = await api.secureCall("get", `${INSPECTION_LOCATION_URL}/branches/${dept}`);
      if (resp && resp.data) {
        this.branchOptions = resp.data;
      }
    },
  },
};
</script>
