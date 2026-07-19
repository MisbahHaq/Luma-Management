declare module '*.css';

declare global {
    interface Window {
        Gantt: typeof import('./components/gantt-shim').Gantt;
    }
}

declare module 'frappe-gantt/dist/frappe-gantt.js';
