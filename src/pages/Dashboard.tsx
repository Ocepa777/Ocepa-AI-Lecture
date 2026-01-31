import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Mic, FileText, Calendar, Plus, Loader2, Trash2 } from 'lucide-react';
import { lectureService, Lecture } from '../lib/lectureService';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        try {
            const data = await lectureService.getLectures();
            setLectures(data);
        } catch (error) {
            console.error('Error fetching lectures:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartNew = async () => {
        try {
            const newLecture = await lectureService.createLecture('Untitled Lecture');
            navigate(`/lecture/${newLecture.id}`);
        } catch (error) {
            console.error('Error creating lecture:', error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this lecture?')) {
            try {
                await lectureService.deleteLecture(id);
                setLectures(prev => prev.filter(l => l.id !== id));
            } catch (error) {
                console.error('Error deleting lecture:', error);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Thinking Canvas</h1>
                    <p className="text-slate-500 mt-1">Manage your lectures and study materials</p>
                </div>
                <Button onClick={handleStartNew} className="gap-2 shadow-lg shadow-ocean-500/20">
                    <Plus className="h-5 w-5" /> New Lecture
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-ocean-600 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div
                        onClick={handleStartNew}
                        className="group border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-ocean-400 hover:bg-ocean-50/50 cursor-pointer transition-all duration-300"
                    >
                        <div className="h-14 w-14 bg-ocean-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Mic className="h-7 w-7 text-ocean-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Record New Lecture</h3>
                        <p className="text-sm text-slate-500 mt-1">Start recording live audio</p>
                    </div>

                    {lectures.map((lecture) => (
                        <div
                            key={lecture.id}
                            onClick={() => navigate(`/lecture/${lecture.id}/review`)}
                            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full h-8 w-8"
                                onClick={(e) => handleDelete(e, lecture.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{lecture.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-3 mb-4">{lecture.summary || 'Click to generate insights from your lecture audio.'}</p>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {new Date(lecture.created_at).toLocaleDateString()}
                                </span>
                                <span className="font-medium text-ocean-600">View Notes →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
