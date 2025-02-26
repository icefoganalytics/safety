import { acceptHMRUpdate, defineStore } from "pinia";
import { useApiStore } from "./ApiStore";
import { ATTACHMENT_URL, LOCATION_URL, OFFLINEREPORTS_URL, REPORTS_URL } from "@/urls";

export const useReportStore = defineStore("reports", {
  state: () => ({
    myReports: [] as Incident[],
    mySupervisorReports: [] as Incident[],
    locations: [] as Location[],
    urgencies: [] as Urgency[],
    selectedReport: undefined as Incident | undefined,
    isLoading: false,
  }),
  getters: {
    currentStep(state) {
      if (state.selectedReport && state.selectedReport.steps) {
        for (const step of state.selectedReport.steps) {
          if (step.complete_date) continue;
          return step;
        }
      }
      return {};
    },
  },
  actions: {
    async initialize() {
      console.log("Initializing Report Store");
      this.myReports = this.myReports || new Array<Incident>();

      // this.myReports = [{ title: "testing", createDate: new Date() }];
      await this.loadLocations();
      await this.loadUrgency();
      await this.loadMyReports();
      await this.loadMySupervisorReports();
    },

    async loadLocations() {
      const api = useApiStore();
      return api.call("get", `${LOCATION_URL}`).then((resp) => {
        this.locations = resp.data;
        return resp.data;
      });
    },

    async loadUrgency() {
      this.urgencies = [
        { code: "Critical", name: "Critical" },
        { code: "High", name: "High" },
        { code: "Medium", name: "Medium" },
        { code: "Low", name: "Low" },
      ];
    },

    async loadMyReports() {
      const api = useApiStore();
      return api
        .secureCall("get", `${REPORTS_URL}/my-reports`)
        .then((resp) => {
          this.myReports = resp.data;
          return resp.data;
        })
        .catch(() => {
          console.log("Error in loadMyReports");
        });
    },

    async loadMySupervisorReports() {
      const api = useApiStore();
      return api
        .secureCall("get", `${REPORTS_URL}/my-supervisor-reports`)
        .then((resp) => {
          this.mySupervisorReports = resp.data;
          return resp.data;
        })
        .catch(() => {
          console.log("Error in loadMyReports");
        });
    },

    async addReport(report: Incident) {
      this.myReports.push(report);
      const api = useApiStore();

      const formData = new FormData();
      formData.append("eventType", report.eventType);
      formData.append("date", (report as any).date.toString());
      formData.append("urgency", report.urgency);
      formData.append("location_code", report.location_code);
      formData.append("location_detail", report.location_detail ?? "");
      formData.append("description", report.description);
      formData.append("supervisor_email", report.supervisor_email);
      if (report.supervisor_alt_email) formData.append("supervisor_alt_email", report.supervisor_alt_email);
      formData.append("on_behalf", report.on_behalf);
      formData.append("on_behalf_email", report.on_behalf_email);

      for (const file of report.files || []) {
        formData.append("files", file);
      }

      return api.secureUpload("post", `${REPORTS_URL}`, formData);
    },

    async deleteIncident() {
      if (!this.selectedReport) return;

      const api = useApiStore();
      return api.secureCall("delete", `${REPORTS_URL}/${this.selectedReport.id}`);
    },

    async addReportOffline(report: Incident) {
      this.isLoading = true;

      const api = useApiStore();

      const formData = new FormData();
      formData.append("eventType", report.eventType);
      formData.append("date", (report as any).date.toString());
      formData.append("urgency", report.urgency);
      formData.append("location_code", report.location_code);
      formData.append("location_detail", report.location_detail ?? "");
      formData.append("description", report.description);
      formData.append("supervisor_email", report.supervisor_email);
      if (report.supervisor_alt_email) formData.append("supervisor_alt_email", report.supervisor_alt_email);
      formData.append("on_behalf", report.on_behalf);
      formData.append("on_behalf_email", report.on_behalf_email);

      for (const file of report.files || []) {
        formData.append("files", file);
      }

      return api.upload("post", `${OFFLINEREPORTS_URL}`, formData).finally(() => {
        this.isLoading = false;
      });

      /* const storedJson = this.getStoredReports();
      storedJson.push(report);
      localStorage.setItem("reports", JSON.stringify(storedJson)); */
    },

    getStoredReports() {
      let storedReports = localStorage.getItem("reports") ?? "[]";
      return JSON.parse(storedReports);
    },

    async updateReport() {
      if (!this.selectedReport) return;

      const body = {
        investigation_notes: this.selectedReport.investigation_notes,
        description: this.selectedReport.description,
        additional_description: this.selectedReport.additional_description,
        urgency_code: this.selectedReport.urgency_code,
      };

      const api = useApiStore();
      return api.secureCall("put", `${REPORTS_URL}/${this.selectedReport.id}`, body);
    },

    async loadReport(reportId: number) {
      const api = useApiStore();
      return api
        .secureCall("get", `${REPORTS_URL}/${reportId}`)
        .then((resp) => {
          this.selectedReport = resp.data;
        })
        .catch(() => {
          console.log("Error in loadReport");
        });
    },

    async loadReportsForRole(roleName: string) {
      const api = useApiStore();
      return api
        .secureCall("get", `${REPORTS_URL}/role/${roleName}`)
        .then((resp) => {
          return resp.data;
        })
        .catch(() => {
          console.log(`Error in loadReportsForRole/${roleName}`);
        });
    },

    async completeStep(step: any) {
      if (!this.selectedReport) return;

      const api = useApiStore();
      return api
        .secureCall("put", `${REPORTS_URL}/${this.selectedReport.id}/step/${step.id}/complete`, {
          control: step.control,
        })
        .then((resp) => {
          if (this.selectedReport) this.loadReport(this.selectedReport.id);
        })
        .catch(() => {
          console.log(`Error in completeStep /step/${step.id}/complete`);
        });
    },

    async revertStep(step: any) {
      if (!this.selectedReport) return;

      const api = useApiStore();
      return api
        .secureCall("put", `${REPORTS_URL}/${this.selectedReport.id}/step/${step.id}/revert`)
        .then((resp) => {
          if (this.selectedReport) this.loadReport(this.selectedReport.id);
        })
        .catch(() => {
          console.log(`Error in revertStep /step/${step.id}/complete`);
        });
    },

    async saveAction(action: any) {
      const reportId = this.selectedReport?.id ?? action.incident_id ?? action.hazard_id ?? 0;
      const api = useApiStore();

      if (action.id) {
        return api
          .secureCall("put", `${REPORTS_URL}/${reportId}/action/${action.id}`, action)
          .then((resp) => {
            if (reportId != -1) this.loadReport(reportId);
          })
          .catch(() => {
            console.log(`Error in completeStep /${reportId}/action/${action.id}`);
          });
      } else {
        return api
          .secureCall("post", `${REPORTS_URL}/${reportId}/action`, action)
          .then((resp) => {
            if (reportId != -1) this.loadReport(reportId);
          })
          .catch(() => {
            console.log(`Error in saveAction /${reportId}/action/${action.id}`);
          });
      }
    },

    async deleteAction(action: any) {
      const reportId = this.selectedReport?.id ?? action.incident_id ?? action.hazard_id ?? 0;
      const api = useApiStore();

      if (action.id) {
        return api
          .secureCall("delete", `${REPORTS_URL}/${reportId}/action/${action.id}`)
          .then((resp) => {
            if (this.selectedReport) this.loadReport(reportId);
          })
          .catch(() => {
            console.log(`Error in deleteAction /${reportId}/action/${action.id}`);
          });
      }
    },

    async completeAction(action: any) {
      const reportId = this.selectedReport?.id ?? action.incident_id ?? action.hazard_id ?? 0;
      const api = useApiStore();

      if (action.id) {
        return api
          .secureCall("put", `${REPORTS_URL}/${reportId}/action/${action.id}/complete`, {
            control: action.control,
            notes: action.notes,
          })
          .then((resp) => {
            if (this.selectedReport) this.loadReport(reportId);
          })
          .catch(() => {
            console.log(`Error in deleteAction /${reportId}/action/${action.id}`);
          });
      }
    },

    async revertAction(action: any) {
      const reportId = this.selectedReport?.id ?? action.incident_id ?? action.hazard_id ?? 0;

      const api = useApiStore();

      if (action.id) {
        return api
          .secureCall("put", `${REPORTS_URL}/${reportId}/action/${action.id}/revert`)
          .then((resp) => {
            if (this.selectedReport) this.loadReport(reportId);
          })
          .catch(() => {
            console.log(`Error in deleteAction /${reportId}/action/${action.id}`);
          });
      }
    },

    openAttachment(attachment: any) {
      if (!this.selectedReport) return;

      window.open(`${ATTACHMENT_URL}/incident/${this.selectedReport.id}/attachment/${attachment.id}`);
    },

    async saveInvestigation(investigation: any) {
      if (!this.selectedReport) return;
      let reportId = this.selectedReport.id;

      const api = useApiStore();

      return api
        .secureCall("post", `${REPORTS_URL}/${reportId}/investigation`, investigation)
        .then((resp) => {
          if (this.selectedReport) this.loadReport(reportId);
          return this.selectedReport;
        })
        .catch(() => {
          console.log(`Error in deleteAction /${reportId}/investigation`);
        });
    },
    sendNotification(recipients: string) {
      if (!this.selectedReport) return;
      let reportId = this.selectedReport.id;

      const api = useApiStore();
      return api.secureCall("post", `${REPORTS_URL}/${reportId}/send-notification`, { recipients });
    },
    sendEmployeeNotification() {
      if (!this.selectedReport) return;
      let reportId = this.selectedReport.id;

      const api = useApiStore();
      return api.secureCall("post", `${REPORTS_URL}/${reportId}/send-employee-notification`, {});
    },
  },
});

export interface Report {
  createDate?: Date;
  date: Date;
  title?: string;
  eventType: string;
  status: string;
  urgency: string;
  location_code: string;
  specificLocation: string;
  description: string;
  supervisor_email?: string;
  supervisor_alt_email?: string;
  on_behalf: string;
  on_behalf_email: string;

  files?: any[];
}

export interface Incident {
  id: number;
  created_at: Date;
  title?: string;
  eventType: string;
  status: string;
  urgency: string;
  urgency_code: string;
  location_code: string;
  specificLocation: string;
  description: string;
  supervisor_email: string;
  supervisor_alt_email?: string;
  on_behalf: string;
  on_behalf_email: string;
  investigation_notes?: string;
  additional_description?: string;
  location_detail?: string;

  incident_type_description: string;
  status_name: string;

  files?: any[];
  steps?: any[];
  actions?: any[];
  hazards?: any[];
}

export interface Location {
  code: string;
  name: string;
  description?: string;
}

export interface Urgency {
  code: string;
  name: string;
  description?: string;
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportStore, import.meta.hot));
}
