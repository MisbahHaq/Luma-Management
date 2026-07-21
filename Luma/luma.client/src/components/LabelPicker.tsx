import { useState, useEffect, useRef } from 'react';
import { labelsApi } from '../api/endpoints';
import type { Label } from '../types/types';

interface LabelPickerProps {
    projectId: string;
    taskId: string;
    selectedLabels: Label[];
    canEdit: boolean;
    onLabelsChanged: (labels: Label[]) => void;
}

const PRESET_COLORS = [
    '#8B5CF6',
    '#DC2626',
    '#D97706',
    '#16A34A',
    '#2563EB',
    '#7C3AED',
    '#DB2777',
    '#0891B2',
];

export default function LabelPicker({ projectId, taskId, selectedLabels, canEdit, onLabelsChanged }: LabelPickerProps) {
    const [allLabels, setAllLabels] = useState<Label[]>([]);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        labelsApi.forProject(projectId).then(({ data }) => setAllLabels(data)).catch(() => setAllLabels([]));
    }, [projectId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleLabel = async (label: Label) => {
        const isSelected = selectedLabels.some((l) => l.id === label.id);
        try {
            if (isSelected) {
                await labelsApi.detach(taskId, label.id);
                onLabelsChanged(selectedLabels.filter((l) => l.id !== label.id));
            } else {
                await labelsApi.attach(taskId, label.id);
                onLabelsChanged([...selectedLabels, label]);
            }
        } catch {
            // ignore
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const { data } = await labelsApi.create(projectId, newName.trim(), newColor);
            setAllLabels((prev) => [...prev, data]);
            await labelsApi.attach(taskId, data.id);
            onLabelsChanged([...selectedLabels, data]);
            setNewName('');
            setCreating(false);
        } catch {
            // ignore
        }
    };

    return (
        <div className="label-picker" ref={pickerRef}>
            <div className="label-chips">
                {selectedLabels.map((label) => (
                    <span
                        key={label.id}
                        className="label-chip"
                        style={{
                            backgroundColor: `${label.color}20`,
                            color: label.color,
                            borderColor: `${label.color}40`,
                        }}
                    >
                        {label.name}
                        {canEdit && (
                            <button
                                type="button"
                                className="label-chip-remove"
                                onClick={() => void toggleLabel(label)}
                            >
                                ×
                            </button>
                        )}
                    </span>
                ))}
                {canEdit && (
                    <button type="button" className="label-add-btn" onClick={() => setOpen((o) => !o)}>
                        + Label
                    </button>
                )}
            </div>

            {open && canEdit && (
                <div className="label-dropdown">
                    <div className="label-dropdown-list">
                        {allLabels.length === 0 && !creating && (
                            <p className="muted small" style={{ padding: '8px 12px' }}>No labels yet.</p>
                        )}
                        {allLabels.map((label) => {
                            const isSelected = selectedLabels.some((l) => l.id === label.id);
                            return (
                                <button
                                    key={label.id}
                                    type="button"
                                    className={`label-dropdown-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => void toggleLabel(label)}
                                >
                                    <span
                                        className="label-dot"
                                        style={{ backgroundColor: label.color }}
                                    />
                                    {label.name}
                                </button>
                            );
                        })}
                    </div>

                    {!creating ? (
                        <button
                            type="button"
                            className="label-create-btn"
                            onClick={() => setCreating(true)}
                        >
                            + Create new label
                        </button>
                    ) : (
                        <div className="label-create-form">
                            <input
                                type="text"
                                placeholder="Label name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                            />
                            <div className="label-color-options">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`label-color-option ${newColor === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewColor(color)}
                                    />
                                ))}
                            </div>
                            <div className="label-create-actions">
                                <button type="button" className="btn btn-ghost small" onClick={() => setCreating(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary small"
                                    onClick={() => void handleCreate()}
                                    disabled={!newName.trim()}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
