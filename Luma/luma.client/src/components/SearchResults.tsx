import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../api/endpoints';
import type { SearchProjectResult, SearchTaskResult, SearchResponse } from '../types/types';

interface SearchResultsProps {
    query: string;
    onClose: () => void;
}

export default function SearchResults({ query, onClose }: SearchResultsProps) {
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!query.trim()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResults(null);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const { data } = await searchApi.query(query.trim());
                setResults(data);
            } catch {
                setResults(null);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleClickOutside = useCallback(
        (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        },
        [onClose],
    );

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    const goToProject = (id: string) => {
        onClose();
        navigate(`/projects/${id}`);
    };

    const goToTask = (projectId: string) => {
        onClose();
        navigate(`/projects/${projectId}`);
    };

    if (!query.trim()) return null;

    const hasResults = results && (results.projects.length > 0 || results.tasks.length > 0);

    return (
        <div className="modern-search-results" ref={ref}>
            {loading && <div className="modern-search-loading">Searching...</div>}

            {!loading && !hasResults && (
                <div className="modern-search-empty">No results for "{query}"</div>
            )}

            {!loading && hasResults && (
                <>
                    {results.projects.length > 0 && (
                        <div className="modern-search-group">
                            <div className="modern-search-group-title">Projects</div>
                            {results.projects.map((p: SearchProjectResult) => (
                                <button
                                    key={p.id}
                                    className="modern-search-item"
                                    onClick={() => goToProject(p.id)}
                                >
                                    <span className="modern-search-item-icon">📁</span>
                                    <div className="modern-search-item-content">
                                        <div className="modern-search-item-primary">{p.name}</div>
                                        {p.description && (
                                            <div className="modern-search-item-secondary">{p.description}</div>
                                        )}
                                    </div>
                                    <span className="modern-search-item-meta">{p.taskCount} tasks</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {results.tasks.length > 0 && (
                        <div className="modern-search-group">
                            <div className="modern-search-group-title">Tasks</div>
                            {results.tasks.map((t: SearchTaskResult) => (
                                <button
                                    key={t.id}
                                    className="modern-search-item"
                                    onClick={() => goToTask(t.projectId)}
                                >
                                    <span className="modern-search-item-icon">☑</span>
                                    <div className="modern-search-item-content">
                                        <div className="modern-search-item-primary">{t.title}</div>
                                        <div className="modern-search-item-secondary">
                                            {t.projectName} · <span className={`modern-search-status status-${t.status.toLowerCase()}`}>{t.status}</span> · <span className="muted" style={{ fontFamily: 'var(--instrument)', fontSize: 12 }}>{t.issueKey}</span>
                                        </div>
                                    </div>
                                    {t.assigneeFullName && (
                                        <span className="modern-search-item-meta">{t.assigneeFullName}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
