// Gemini Multimodal Live API Helper
// Requires a WebSocket connection and PCM 16-bit 16kHz audio

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.MultimodalLive?key=${API_KEY}`;

export class GeminiLiveService {
    private ws: WebSocket | null = null;
    private onTranscriptCallback: (text: string) => void = () => { };

    constructor(onTranscript: (text: string) => void) {
        this.onTranscriptCallback = onTranscript;
    }

    connect() {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
            console.log('Gemini Live Connected');
            this.sendSetup();
        };

        this.ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.server_content?.input_transcription) {
                this.onTranscriptCallback(response.server_content.input_transcription);
            }
        };

        this.ws.onerror = (error) => {
            console.error('Gemini Live Error:', error);
        };

        this.ws.onclose = () => {
            console.log('Gemini Live Closed');
        };
    }

    private sendSetup() {
        const setup = {
            setup: {
                model: "models/gemini-2.0-flash-exp",
                generation_config: {
                    response_modalities: ["text"]
                }
            }
        };
        this.ws?.send(JSON.stringify(setup));
    }

    sendAudio(base64Audio: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const payload = {
                realtime_input: {
                    media_chunks: [
                        {
                            data: base64Audio,
                            mime_type: "audio/pcm"
                        }
                    ]
                }
            };
            this.ws.send(JSON.stringify(payload));
        }
    }

    disconnect() {
        this.ws?.close();
        this.ws = null;
    }
}
