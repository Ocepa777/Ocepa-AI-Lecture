import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Sparkles, FileText, List, Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { lectureService, Lecture } from '../lib/lectureService';

export const PostLectureReview = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lecture, setLecture] = useState<Lecture | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) fetchLecture();
    }, [id]);

    const fetchLecture = async () => {
        try {
            const data = await lectureService.getLecture(id!);
            setLecture(data);
            setMessages([{ role: 'ai', text: "Hello! I'm Ocepa. I've summarized your lecture above. How can I help you study these materials today?" }]);
        } catch (error) {
            console.error('Error fetching lecture:', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        // Mock AI Response based on lecture context
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', text: `Based on the lecture "${lecture?.title}", that concept refers to the ${userMsg.includes('formula') ? 'mathematical relationship between variables defined in section 2' : 'primary thesis discussed during the second half of the session'}. Would you like me to elaborate?` }]);
            setIsTyping(false);
        }, 1000);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-ocean-600 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-ocean-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Thinking Canvas
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>Export PDF</Button>
                    <Button onClick={() => navigate('/dashboard')}>Save Changes</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Summary & Notes */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">{lecture?.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-50">
                            <span className="flex items-center gap-1"><List className="h-4 w-4" /> Comprehensive Session</span>
                            <span className="flex items-center gap-1 font-medium text-ocean-600 bg-ocean-50 px-3 py-1 rounded-full border border-ocean-100">
                                <Sparkles className="h-3 w-3" /> AI Optimized Summary
                            </span>
                        </div>

                        <div className="prose prose-slate max-w-none mb-10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Executive Summary</h3>
                            <p className="text-slate-600 leading-relaxed text-lg italic">
                                {lecture?.summary || "Summary is being finalized by Ocepa..."}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Full Lecture Notes (Transcript)</h3>
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 max-h-[400px] overflow-y-auto space-y-3">
                                {(lecture?.transcript as string[])?.length > 0 ? (
                                    (lecture?.transcript as string[]).map((text, idx) => (
                                        <p key={idx} className="text-slate-700 text-sm leading-relaxed">{text}</p>
                                    ))
                                ) : (
                                    <p className="text-slate-400 italic text-sm">No transcript data found for this session.</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-ocean-500" /> Structured Key Insights
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(lecture?.notes as any[])?.length > 0 ? (
                                (lecture?.notes as any[]).map((note, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-ocean-200 transition-colors"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-ocean-500 mb-2 block">
                                            {note.category || 'Note'}
                                        </span>
                                        <p className="text-slate-700 text-sm font-medium leading-relaxed">{note.text}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="md:col-span-2 bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-sm">No structured insights generated yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Chat Interface */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl border border-slate-800">
                        <div className="p-5 border-b border-white/10 flex items-center gap-3">
                            <div className="h-10 w-10 bg-ocean-500/20 rounded-xl flex items-center justify-center text-ocean-400">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Chat with Lecture</h3>
                                <p className="text-slate-400 text-xs">AI Study Companion</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-ocean-600 text-white ml-auto rounded-tr-none'
                                        : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'
                                        }`}
                                >
                                    {msg.text}
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="bg-white/5 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-white/5 w-16 flex justify-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 bg-white/5 border-t border-white/10">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a follow-up question..."
                                    className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all placeholder:text-slate-500"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-2 p-1.5 bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
