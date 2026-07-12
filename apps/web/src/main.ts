import "./styles.css";
import { createClockApp } from "./app/create-clock-app.js";

const app = createClockApp({
  document,
  window
});

app.start();

const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot;
hot?.dispose(() => app.destroy());
