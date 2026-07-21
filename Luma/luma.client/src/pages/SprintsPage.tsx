import { useNavigate } from 'react-router-dom';
import ProjectPicker from '../components/ProjectPicker';

export default function SprintsPage() {
    const navigate = useNavigate();
    return (
        <ProjectPicker
            title="Sprints"
            subtitle="Select a project to manage its sprints"
            onSelect={(p) => navigate(`/projects/${p.id}`)}
        />
    );
}
