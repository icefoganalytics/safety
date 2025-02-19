import { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "administration",
    component: () => import("../views/Dashboard.vue"),
    meta: {
      requireSystemAdmin: true,
    },
  },
  {
    path: "administration/users",
    component: () => import("../modules/users/views/UserList.vue"),
    meta: {
      requireSystemAdmin: true,
    },
  },
  {
    path: "administration/locations",
    component: () => import("@/modules/administration/modules/locations/views/LocationList.vue"),
    meta: {
      requireSystemAdmin: true,
    },
  },
];

export default routes;
