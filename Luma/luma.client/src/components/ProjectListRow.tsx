import Avatar from './Avatar';
import ProgressTrack from './ProgressTrack';
import StatusPill from './StatusPill';
import type { Project } from '../types/types';

interface ProjectListRowProps {
    project: Project;
    taskCount: number;
    completion: number;
    lastUpdated: string | null;
    onOpen: () => void;
}

export default function ProjectListRow({
    project,
    taskCount,
    completion,
    lastUpdated,
    onOpen,
}: ProjectListRowProps) {
    const status = completion === 100 ? 'Done' : 'InProgress';
    return (
        <tr className="project-row clickable" onClick={onOpen}>
            <td className="project-name">
                <span className="project-dot" />
                <div>
                    <div className="project-title">{project.name}</div>
                    {project.description && <div className="project-desc muted small">{project.description}</div>}
                </div>
            </td>
            <td className="instrument">{taskCount}</td>
            <td>
                <ProgressTrack value={completion} />
            </td>
            <td>
                <StatusPill status={status} />
            </td>
            <td className="instrument timestamp">
                {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '—'}
            </td>
            <td>
                <div className="row-owner">
                    <Avatar name={project.createdByUserFullName} size={26} />
                    <span className="small hide-narrow">{project.createdByUserFullName ?? 'Unknown'}</span>
                </div>
            </td>
        </tr>
    );
}
