import 'frappe-gantt/dist/frappe-gantt.css';

// frappe-gantt 0.6.1 ships a UMD bundle (`var Gantt = (function () { ... })();`)
// with no ESM exports, so Vite cannot import it directly.
// We pull the raw source via Vite's `?raw` and evaluate it in an isolated function
// that returns the `Gantt` constructor.
// @ts-ignore
import ganttSource from 'frappe-gantt/dist/frappe-gantt.js?raw';

const Gantt = (new Function(ganttSource + '; return Gantt;'))();

export { Gantt };
