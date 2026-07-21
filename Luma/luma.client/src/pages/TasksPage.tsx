import { useNavigate } from 'react-router-dom';
import ProjectPicker from '../components/ProjectPicker';

export default function TasksPage() {
    const navigate = useNavigate();
    return (
        <ProjectPicker
            title="Tasks"
            subtitle="Select a project to view its tasks"
            onSelect={(p) => navigate(`/projects/${p.id}`)}
        />
    );
}
