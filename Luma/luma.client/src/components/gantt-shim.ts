import 'frappe-gantt/dist/frappe-gantt.js';

// frappe-gantt's prebuilt bundle is a UMD IIFE that assigns `Gantt` to the global scope.
// Importing it for its side effect installs `window.Gantt`, which we re-export here so
// consumers can use a stable ESM import. The class type comes from the ambient declaration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Gantt: any = typeof window !== 'undefined' ? (window as any).Gantt : undefined;

export { Gantt };
