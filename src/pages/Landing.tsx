import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Sparkles, Zap } from 'lucide-react';

export const Landing = () => {
    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 lg:pt-32 bg-gradient-to-br from-ocean-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 font-display">
                                Master Your Lectures with <span className="text-ocean-600">AI-Powered</span> Notes
                            </h1>
                            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                                Ocepa listens to your classes, generates structured notes, and creates memory-optimized summaries.
                                Designed for students who learn differently.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/auth?signup=true">
                                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 h-auto shadow-lg shadow-ocean-500/20">
                                        Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/demo">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 h-auto">
                                        View Demo
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Background Elements */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-30 pointer-events-none">
                    <svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="300" cy="300" r="300" fill="url(#paint0_radial_1_5)" />
                        <defs>
                            <radialGradient id="paint0_radial_1_5" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(300 300) rotate(90) scale(300)">
                                <stop stopColor="#38bdf8" />
                                <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base text-ocean-600 font-semibold tracking-wide uppercase">Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Better learning, built in.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <Zap className="h-8 w-8 text-yellow-500" />,
                                title: "Real-time Transcription",
                                description: "Live speech-to-text ensures you never miss a word. Focus on listening, we'll handle the writing."
                            },
                            {
                                icon: <Brain className="h-8 w-8 text-purple-500" />,
                                title: "Smart Summaries",
                                description: "AI condenses hour-long lectures into key concepts and actionable bullet points for easy review."
                            },
                            {
                                icon: <Sparkles className="h-8 w-8 text-ocean-500" />,
                                title: "Interactive Chat",
                                description: "Chat with your notes. Ask questions, clarify doubts, and quiz yourself on the material."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="bg-white rounded-xl p-3 inline-block shadow-sm mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
