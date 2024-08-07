/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

import BaseComponents from "./baseComponents";
import { App } from "vue";

export function registerPlugins(app: App<Element>) {
  BaseComponents.register(app);
  //app.use(vuetify);
}
