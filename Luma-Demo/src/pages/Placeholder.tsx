import AppShell from '../components/AppShell';

export default function Placeholder({ title, hint }: { title: string; hint: string }) {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <h1 className="text-lg font-semibold text-text-primary mb-2">{title}</h1>
                <p className="text-xs text-text-muted max-w-sm">{hint}</p>
            </div>
        </AppShell>
    );
}
