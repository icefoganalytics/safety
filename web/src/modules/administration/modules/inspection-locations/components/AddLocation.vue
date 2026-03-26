<template>
  <div>
    <v-btn color="primary" variant="flat" size="small" class="mr-5" @click="doShow">Add Inspection Location</v-btn>

    <v-dialog v-model="showEdit" width="700px" persistent>
      <template v-slot:default="{ isActive }">
        <v-card>
          <v-toolbar color="primary" density="comfortable">
            <v-toolbar-title class="text-white" style="">Add Inspection Location</v-toolbar-title>
            <v-spacer> </v-spacer>
            <v-toolbar-items>
              <v-btn icon="mdi-close" @click="doClose"></v-btn>
            </v-toolbar-items>
          </v-toolbar>

          <v-card-text class="pt-5">
            <v-text-field v-model="chosenOne.name" dense outlined label="Name" />
            <v-text-field v-model="chosenOne.description" dense outlined label="Description" />
            <LocationSelect v-model="chosenOne.location_code" label="Location" />
            <DepartmentSelector v-model="chosenOne.department_code" label="Department"
              @update:model-value="loadBranches" />
            <v-combobox v-model="chosenOne.branch" :items="branchOptions" label="Area"
              hint="Select an existing branch or type a new one" persistent-hint />

            <v-btn color="primary" class="mb-0 mt-4" @click="doAdd"
              :disabled="isNil(chosenOne.name) || isNil(chosenOne.department_code)">Add
            </v-btn>
          </v-card-text>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { mapActions } from "pinia";
import { useInspectionLocationAdminStore } from "../store";
import { useApiStore } from "@/store/ApiStore";
import { INSPECTION_LOCATION_URL } from "@/urls";
import * as _ from "lodash";
import DepartmentSelector from "@/components/DepartmentSelector.vue";
import LocationSelect from "@/components/common/LocationSelect.vue";

export default {
  name: "AddLocation",
  components: { DepartmentSelector, LocationSelect },
  props: ["onComplete", "onError"],
  data: () => ({
    showEdit: false,
    chosenOne: {} as any,
    branchOptions: [] as string[],
  }),
  methods: {
    ...mapActions(useInspectionLocationAdminStore, ["addLocation"]),
    doShow() {
      this.showEdit = true;
      this.chosenOne = {};
      this.branchOptions = [];
    },
    doClose() {
      this.showEdit = false;
      this.chosenOne = {};
      this.branchOptions = [];
    },
    doSelect(person: any) {
      this.chosenOne = person;
    },
    async loadBranches() {
      this.branchOptions = [];
      if (!this.chosenOne.department_code) return;
      const api = useApiStore();
      const resp = await api.secureCall("get", `${INSPECTION_LOCATION_URL}/branches/${this.chosenOne.department_code}`);
      if (resp && resp.data) {
        this.branchOptions = resp.data;
      }
    },
    doAdd() {
      this.addLocation(this.chosenOne)
        .then((resp: any) => {
          if (resp && resp.error) {
            if (this.onError) this.onError(resp.error[0]);

            this.chosenOne = {};
            return;
          }

          if (this.onComplete) this.onComplete();

          this.doClose();
        })
        .catch((resp) => {
          console.log("Error in AddLocation", resp);
        });
    },
    isNil(val: any) {
      return _.isNil(val);
    },
  },
};
</script>
