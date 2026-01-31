import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Mic, Square, Sparkles, Loader2, Edit2, Check, FileText } from 'lucide-react';
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
    const [activeTranscript, setActiveTranscript] = useState('');
    const [notes, setNotes] = useState<{ category: string, text: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState('');
    const [activeTab, setActiveTab] = useState<'transcript' | 'insights'>('transcript');

    const geminiRef = useRef<GeminiLiveService | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (id) {
            fetchLecture();
        }
        return () => {
            stopRecording();
        };
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
            streamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);

            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            geminiRef.current = new GeminiLiveService((text) => {
                setActiveTranscript(prev => prev + ' ' + text);

                // When we get a full sentence or a large chunk, push to list
                if (text.endsWith('.') || text.endsWith('?') || text.endsWith('!')) {
                    setTranscript(prev => [...prev, activeTranscript + ' ' + text]);
                    setActiveTranscript('');
                }

                // AI Insights Logic
                const lowerText = text.toLowerCase();
                if (lowerText.includes('note') || lowerText.includes('important') || lowerText.includes('remember')) {
                    setNotes(prev => [{ category: 'Key Point', text: text }, ...prev]);
                } else if (lowerText.includes('define') || lowerText.includes('means') || lowerText.includes('definition')) {
                    setNotes(prev => [{ category: 'Definition', text: text }, ...prev]);
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
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = async () => {
        if (!isRecording) return;

        processorRef.current?.disconnect();
        audioContextRef.current?.close();
        geminiRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());

        setIsRecording(false);

        if (activeTranscript) {
            setTranscript(prev => [...prev, activeTranscript]);
            setActiveTranscript('');
        }

        // Auto-save
        if (lecture) {
            const finalTranscript = [...transcript, activeTranscript].filter(t => t.trim() !== '');
            await lectureService.updateLecture(lecture.id, {
                transcript: finalTranscript,
                notes,
                summary: finalTranscript.length > 5 ? "Comprehensive summary based on real-time transcription." : null
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
    }, [transcript, activeTranscript]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-ocean-600 animate-spin" />
        </div>
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full border-r border-slate-200 overflow-hidden">
                <header className="bg-white border-b p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm z-10">
                    <div className="flex-1 w-full">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    className="text-lg md:text-xl font-bold text-slate-800 border-b-2 border-ocean-500 focus:outline-none bg-transparent w-full max-w-md"
                                    autoFocus
                                    onBlur={handleUpdateTitle}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                                />
                                <Button variant="ghost" size="icon" onClick={handleUpdateTitle}><Check className="h-4 w-4 text-green-500" /></Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{lecture?.title}</h1>
                                <button onClick={() => setIsEditingTitle(true)} className="p-1 hover:bg-slate-100 rounded transition-colors">
                                    <Edit2 className="h-3 w-3 text-slate-400" />
                                </button>
                            </div>
                        )}
                        <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${isRecording ? 'text-green-500' : 'text-slate-400'}`}>
                            {isRecording ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Live streaming to Gemini 2.0 Flash
                                </>
                            ) : "Session is ready to record"}
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant={isRecording ? "destructive" : "default"}
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`flex-1 sm:flex-none transition-all duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-ocean-600 hover:bg-ocean-700'}`}
                        >
                            {isRecording ? <><Square className="h-4 w-4 mr-2" /> Stop</> : <><Mic className="h-4 w-4 mr-2" /> Record</>}
                        </Button>
                        <Button variant="outline" className="flex-1 sm:flex-none border-slate-200" onClick={handleFinish}>
                            Finish
                        </Button>
                    </div>
                </header>

                {/* Mobile Tabs */}
                <div className="flex md:hidden bg-white border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('transcript')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'transcript' ? 'text-ocean-600 border-b-2 border-ocean-600 bg-ocean-50/30' : 'text-slate-500'}`}
                    >
                        Transcript
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'insights' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' : 'text-slate-500'}`}
                    >
                        AI Insights
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Transcript View */}
                    <div className={`flex-1 flex flex-col overflow-hidden bg-slate-50/30 ${activeTab === 'transcript' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" ref={scrollRef}>
                            {transcript.length === 0 && !activeTranscript ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 text-center px-6">
                                    <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                        <Mic className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Capture</h3>
                                    <p className="text-sm max-w-xs leading-relaxed">Tap record above to start the low-latency transcription pipeline.</p>
                                </div>
                            ) : (
                                <>
                                    {transcript.map((text, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
                                        >
                                            <p className="text-slate-700 leading-relaxed text-sm md:text-base">{text}</p>
                                        </motion.div>
                                    ))}
                                    {activeTranscript && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="bg-ocean-50/50 p-4 rounded-xl border border-ocean-100 border-dashed"
                                        >
                                            <p className="text-ocean-900 leading-relaxed italic text-sm md:text-base">
                                                {activeTranscript}
                                                <span className="inline-block w-1 h-4 ml-1 bg-ocean-400 animate-pulse align-middle"></span>
                                            </p>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Insights View (Hidden on mobile unless active) */}
                    <div className={`w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-inner ${activeTab === 'insights' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Sparkles className="h-4 w-4 text-purple-500" /> Live Insights
                            </h2>
                            {isRecording && <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {notes.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                                    <FileText className="h-12 w-12 mb-3 text-slate-300" />
                                    <p className="text-sm">Gemini will highlight key points here in real-time.</p>
                                </div>
                            ) : (
                                notes.map((note, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`h-2 w-2 rounded-full ${note.category === 'Key Point' ? 'bg-ocean-500' : 'bg-purple-500'}`}></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{note.category}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-snug">{note.text}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 italic text-center">
                            AI analyzes audio every few seconds to extract value.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
