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
        <DepartmentSelector v-model="selectedLocation.department_code" label="Department" />
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

import DepartmentSelector from "@/components/DepartmentSelector.vue";

export default {
  name: "LocationEditor",
  data: () => ({}),
  computed: {
    ...mapState(useInspectionLocationAdminStore, ["selectedLocation"]),

    visible() {
      return this.selectedLocation ? true : false;
    },
  },
  methods: {
    ...mapActions(useInspectionLocationAdminStore, ["unselectLocation", "saveLocation"]),
    close() {
      this.unselectLocation();
    },
  },
};
</script>
