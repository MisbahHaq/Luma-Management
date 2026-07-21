import { useNavigate } from 'react-router-dom';
import ProjectPicker from '../components/ProjectPicker';

export default function ReportsPage() {
    const navigate = useNavigate();
    return (
        <ProjectPicker
            title="Reports"
            subtitle="Select a project to view its reports"
            onSelect={(p) => navigate(`/reports/${p.id}`)}
        />
    );
}
