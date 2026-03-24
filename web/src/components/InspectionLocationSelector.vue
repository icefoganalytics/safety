<template>
  <v-select :items="filteredLocations" item-title="title" item-value="id"></v-select>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { isNil } from "lodash";

import { useInspectionLocationStore } from "@/store/InspectionLocationStore";

const store = useInspectionLocationStore();
const { loadInspectionLocations } = store;

loadInspectionLocations();

const { inspectionlocations } = storeToRefs(store);

const props = defineProps({
  department: {
    type: String,
    default: null,
  },
  branch: {
    type: String,
    default: null,
  },
});

const filteredLocations = computed(() => {
  if (inspectionlocations.value.length === 0) {
    return [];
  }

  let results = inspectionlocations.value;

  if (!isNil(props.department)) {
    results = results.filter((location) => location.department_code === props.department);
  }

  if (!isNil(props.branch) && props.branch !== "") {
    results = results.filter((location) => location.branch === props.branch);
  }

  return results;
});
</script>
