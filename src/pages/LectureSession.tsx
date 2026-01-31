import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Mic, Square, List, Sparkles, Loader2, Edit2, Check, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { lectureService, Lecture } from '../lib/lectureService';
import { GeminiLiveService } from '../lib/geminiService';
import { floatTo16BitPCM, arrayBufferToBase64 } from '../lib/audioUtils';

export const LectureSession = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lecture, setLecture] = useState<Lecture | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<string[]>([]);
    const [notes, setNotes] = useState<{ category: string, text: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState('');

    const geminiRef = useRef<GeminiLiveService | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            fetchLecture();
        }
    }, [id]);

    const fetchLecture = async () => {
        try {
            const data = await lectureService.getLecture(id!);
            setLecture(data);
            setTempTitle(data.title);
            setTranscript(data.transcript as string[] || []);
            setNotes(data.notes as any[] || []);
        } catch (error) {
            console.error('Error fetching lecture:', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTitle = async () => {
        if (!lecture) return;
        try {
            const updated = await lectureService.updateLecture(lecture.id, { title: tempTitle });
            setLecture(updated);
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Error updating title:', error);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);

            // Using ScriptProcessor for simplicity in this demo, though AudioWorklet is preferred for production
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            geminiRef.current = new GeminiLiveService((text) => {
                setTranscript(prev => [...prev, text]);

                // Structured logic simulation
                const rand = Math.random();
                if (rand > 0.9) {
                    setNotes(prev => [...prev, { category: 'Definition', text: `Term: ${text.substring(0, 40)}...` }]);
                } else if (rand > 0.8) {
                    setNotes(prev => [...prev, { category: 'Key Point', text: text.substring(0, 50) }]);
                } else if (rand > 0.75) {
                    setNotes(prev => [...prev, { category: 'Formula/Term', text: 'Sigma = √Σ(x-μ)²/N' }]);
                }
            });
            geminiRef.current.connect();

            processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = floatTo16BitPCM(inputData);
                const base64 = arrayBufferToBase64(pcmData.buffer as ArrayBuffer);
                geminiRef.current?.sendAudio(base64);
            };

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    };

    const stopRecording = async () => {
        processorRef.current?.disconnect();
        audioContextRef.current?.close();
        geminiRef.current?.disconnect();
        setIsRecording(false);

        // Auto-save transcript
        if (lecture) {
            await lectureService.updateLecture(lecture.id, {
                transcript,
                notes,
                summary: transcript.length > 5 ? "Comprehensive summary generated from the lecture context..." : null
            });
        }
    };

    const handleFinish = async () => {
        if (isRecording) await stopRecording();
        navigate(`/lecture/${id}/review`);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-ocean-600 animate-spin" />
        </div>
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50">

            {/* Main Content - Transcript */}
            <div className="flex-1 flex flex-col h-full border-r border-slate-200">
                <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
                    <div className="flex-1">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    className="text-xl font-bold text-slate-800 border-b-2 border-ocean-500 focus:outline-none bg-transparent"
                                    autoFocus
                                    onBlur={handleUpdateTitle}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                                />
                                <Button variant="ghost" size="icon" onClick={handleUpdateTitle}><Check className="h-4 w-4 text-green-500" /></Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h1 className="text-xl font-bold text-slate-800">{lecture?.title}</h1>
                                <button onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded">
                                    <Edit2 className="h-4 w-4 text-slate-400" />
                                </button>
                            </div>
                        )}
                        <p className="text-sm text-green-500 font-medium flex items-center gap-1">
                            {isRecording ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Live Streaming to Gemini 2.0
                                </>
                            ) : "Session Ready"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={isRecording ? "destructive" : "default"}
                            onClick={isRecording ? stopRecording : startRecording}
                            className="w-32 transition-all duration-300"
                        >
                            {isRecording ? <><Square className="h-4 w-4 mr-2" /> Stop</> : <><Mic className="h-4 w-4 mr-2" /> Record</>}
                        </Button>
                        <Button variant="default" className="bg-ocean-600 hover:bg-ocean-700" onClick={handleFinish}>
                            Finish & Review
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30" ref={scrollRef}>
                    {transcript.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <Mic className="h-16 w-16 mb-4" />
                            <p className="text-lg">Capturing live lecture audio...</p>
                            <p className="text-sm">Speak or play audio to see real-time transcription</p>
                        </div>
                    ) : (
                        transcript.map((text, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100/50"
                            >
                                <p className="text-slate-700 leading-relaxed">{text}</p>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Live Protection Area (Chat disabled during lecture) */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="flex items-center justify-center gap-2 text-slate-400 italic text-sm py-2">
                        <Sparkles className="h-4 w-4 text-ocean-400" />
                        Interaction is disabled during live session to help you focus.
                    </div>
                </div>
            </div>

            {/* Sidebar - Structured AI Notes */}
            <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-inner">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" /> Live AI Insights
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {notes.length === 0 ? (
                        <div className="text-center text-sm text-slate-400 mt-20">
                            <p>Gemini is categorizing information...</p>
                        </div>
                    ) : (
                        <>
                            {['Key Point', 'Definition', 'Formula/Term'].map(category => {
                                const filtered = notes.filter(n => n.category === category);
                                if (filtered.length === 0) return null;
                                return (
                                    <div key={category} className="space-y-2">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            {category === 'Key Point' && <List className="h-3 w-3" />}
                                            {category === 'Definition' && <FileText className="h-3 w-3" />}
                                            {category === 'Formula/Term' && <Loader2 className="h-3 w-3" />}
                                            {category}s
                                        </h3>
                                        {filtered.map((note, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm text-slate-700 shadow-sm"
                                            >
                                                {note.text}
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
