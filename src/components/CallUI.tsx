import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mic, Volume2, VolumeX, Loader2, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { CallStatusIndicator } from './CallStatusIndicator';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface CallUIProps {
	phoneNumber: string;
	tokenId: string;
	onCallEnd?: () => void;
	autoStart?: boolean;
}

interface AudioClientRef {
	connect: () => Promise<void>;
	disconnect: () => void;
	toggleMute: () => void;
	clearAudioQueue: () => void;
	isConnected: boolean;
	isMuted: boolean;
	sentChunks: number;
	receivedChunks: number;
	incomingQueue: any[];
	ws: WebSocket | null;
}

export function CallUI({ phoneNumber, tokenId, onCallEnd, autoStart = false }: CallUIProps) {
	const [connecting, setConnecting] = useState(false);
	const [connected, setConnected] = useState(false);
	const [muted, setMuted] = useState(false);
	const [speakerMuted, setSpeakerMuted] = useState(false);
	const [callId, setCallId] = useState<string | null>(null);
	const [hangingUp, setHangingUp] = useState(false);
	const [callStatus, setCallStatus] = useState<string | null>(null);
	const [callBilling, setCallBilling] = useState<number | null>(null);

	const audioClientRef = useRef<AudioClientRef | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const gainNodeRef = useRef<GainNode | null>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const { user } = useAuthStore();
	// const authToken = user?.auth_token;
	const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXJlZXJfdXNlcl9pZCI6bnVsbCwiY2FycmllciI6InBob25lIiwiZHAiOiJodHRwczovL2Nkbi5zdWJzcGFjZS5tb25leS93aGF0c3ViX2ltYWdlcy91c2VyLTM3MTE4NTAtMzEwNTI2NSsxLnBuZyIsImNyZWF0ZWRfYXQiOiIyMDI1LTA0LTA1VDE1OjI3OjEyLjA2NjQ3NiswMDowMCIsImVtYWlsIjoibXJpdHVuam95LmRhc0BzdWJzcGFjZS5tb25leSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsbmFtZSI6Ik1yaXR1bmpveSBEYXMiLCJpZCI6IjM4ZmJiMjk2LTg4OTktNGJjZi05Y2VlLTg3MDljMjQyZWJiYyIsInBob25lIjoiKzkxODA3Mzc1NjQxMSIsInBob25lX3ZlcmlmaWVkIjp0cnVlLCJ1cGRhdGVkX2F0IjoiMjAyNS0xMC0yOVQxNzo0MjowNy43ODg0MiswMDowMCIsInVzZXJuYW1lIjoibXJpdHVuam95ZGFzIiwicm9sZSI6InVzZXIiLCJ3ZWJzaXRlX2lkIjoiZTM0NGNhZjctODMxYS00Mjk4LWI0YmQtYzgzNWZiZmY5YmU3IiwiaWF0IjoxNzYxNzU5NzI4LCJleHAiOjE3NjE4NDYxMjh9.gOihN17dQ5RlKxuvhqzlqgcqt4PJqLcg2ZO1e7KaWe4";
	// console.log('Auth Token:', authToken);

	// Auto-start call if enabled
	useEffect(() => {
		if (autoStart && phoneNumber && tokenId && !connecting && !connected) {
			handleMakeCall();
		}
	}, [autoStart, phoneNumber, tokenId]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (audioClientRef.current?.isConnected) {
				audioClientRef.current.disconnect();
			}

			if (audioContextRef.current) {
				audioContextRef.current.close();
			}

			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, []);

	// Handle call end callback when disconnected
	const prevConnectedRef = useRef(connected);
	useEffect(() => {
		// Only trigger onCallEnd if we were previously connected and now disconnected
		if (prevConnectedRef.current && !connected && callId && onCallEnd) {
			onCallEnd();
		}
		prevConnectedRef.current = connected;
	}, [connected, callId, onCallEnd]);

	// Poll call status when call is active
	useEffect(() => {
		if (!callId || !authToken) {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			return;
		}

		const pollCallStatus = async () => {
			console.log('Polling call status');
			try {
				const response = await fetch('https://db.vocallabs.ai/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${authToken}`
					},
					body: JSON.stringify({
						query: `
							query LiveDataQuery($call_id: uuid = "") {
								vocallabs_call_data(where: {call_id: {_eq: $call_id}, type: {_eq: "external"}}, order_by: {created_at: desc}) {
									id
									key
									value
									created_at
								}
								vocallabs_calls(where: {id: {_eq: $call_id}}) {
									call_billing
									call_status
								}
							}
						`,
						variables: {
							call_id: callId
						}
					})
				});

				const result = await response.json();
				console.log('call status ', result);
				const { vocallabs_calls } = result.data;

				if (vocallabs_calls && vocallabs_calls.length > 0) {
					const call = vocallabs_calls[0];
					const newStatus = call.call_status;
					const newBilling = call.call_billing;

					console.log('new status:', newStatus);

					if (newStatus !== callStatus) {
						setCallStatus(newStatus);
						console.log('Call status updated:', newStatus);
						
						// Check for terminal call states
						const terminalStatuses = ['fail', 'failed', 'completed', 'ended', 'busy', 'no-answer', 'canceled', 'cancelled'];
						if (terminalStatuses.includes(newStatus?.toLowerCase() || '')) {
							console.log('Terminal status detected, disconnecting...');
							if (audioClientRef.current && audioClientRef.current.isConnected) {
								audioClientRef.current.disconnect();
							}
							setConnected(false);
							setConnecting(false);
						}
					}

					if (newBilling !== callBilling) {
						setCallBilling(newBilling);
						if (newBilling) {
							console.log('Call billing updated:', newBilling);
						}
					}
				}
			} catch (err) {
				console.error('Error polling call status:', err);
			}
		};

		pollCallStatus();
		pollingIntervalRef.current = setInterval(pollCallStatus, 5000);

		return () => {
			if (pollingIntervalRef.current) {
				console.log('call status polling ended')
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [callId, authToken, callStatus, callBilling]);

	const addLog = (_message: string, _type = 'info') => {
		// Logging removed for cleaner UI
	};

	const updateStats = () => {
		// Stats tracking removed for cleaner UI
	};

	const handleMakeCall = async () => {
		if (!phoneNumber.trim() || !tokenId || !user?.id || !authToken) {
			toast.error('Please enter a phone number and select an API token');
			return;
		}

		try {
			setConnecting(true);
			addLog('Initiating call...', 'info');

			const response = await fetch('https://db.vocallabs.ai/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify({
					query: `
						query MakeDirectCall($number:String!,$client_token_id:uuid!){
							VocallabsCreateDirectCall(request:{number:$number,client_token_id:$client_token_id}){
								status
								call_id
								message
								websocket
							}
						}
					`,
					variables: {
						number: phoneNumber,
						client_token_id: '65ad06a0-8289-4c45-87dd-a4221110b9d7'
					}
				})
			});

			const result = await response.json();
			const { VocallabsCreateDirectCall } = result.data;

			if (!VocallabsCreateDirectCall?.websocket) {
				throw new Error(VocallabsCreateDirectCall?.message || 'Failed to get WebSocket URL');
			}

			setCallId(VocallabsCreateDirectCall.call_id);
			setCallStatus(VocallabsCreateDirectCall?.status || 'queued'); // Set initial status
			addLog(`Call initiated with ID: ${VocallabsCreateDirectCall.call_id}`, 'success');

			initializeAudioClient(VocallabsCreateDirectCall.websocket);

		} catch (err: any) {
			console.error('Error making call:', err);
			addLog(`Error making call: ${err.message}`, 'error');
			toast.error('Failed to make call');
			setConnecting(false);
		}
	};

	const initializeAudioClient = async (wsUrl: string) => {
		try {
			const sampleRt = new URL(wsUrl).searchParams.get("sampleRate");
			const sampleRate = Number(sampleRt);

			const AudioClient: any = {
				ruptureUrl: 'https://rupture2.vocallabs.ai',
				ws: null,
				audioContext: null,
				mediaStream: null,
				sourceNode: null,
				processorNode: null,
				gainNode: null,

				isConnected: false,
				isMuted: false,
				sampleRate: sampleRate,
				chunkSize: (sampleRate === 8000 ? 320 : 640),

				MAX_QUEUE_SIZE: 15,
				outgoingBuffer: new Float32Array(0),
				incomingQueue: [],
				audioPumping: false,
				pumpTimer: null,
				nextScheduledTime: 0,

				filterNode: null,
				compressorNode: null,
				noiseGateThreshold: -50,
				noiseGateRatio: 10,
				smoothingFactor: 0.9,
				currentLevel: 0,

				sentChunks: 0,
				receivedChunks: 0,

				async connect() {
					try {
						addLog('Connecting to WebSocket...', 'info');
						await this.connectWebSocket(wsUrl);
						await this.initializeAudio();

						this.isConnected = true;
						setConnected(true);
						setConnecting(false);
						addLog('Connected successfully', 'success');

					} catch (error: any) {
						addLog(`Connection failed: ${error.message}`, 'error');
						this.disconnect();
						this.isConnected = false;
						setConnected(false);
						setConnecting(false);
					}
				},

				connectWebSocket(url: string) {
					return new Promise((resolve, reject) => {
						this.ws = new WebSocket(url);

						this.ws.onopen = () => {
							addLog('WebSocket connected', 'success');
							resolve(null);
						};

						this.ws.onmessage = (event: MessageEvent) => {
							this.handleWebSocketMessage(event);
						};

						this.ws.onclose = () => {
							addLog('WebSocket disconnected', 'warning');
							if (this.isConnected) {
								this.isConnected = false;
								setConnected(false);
								this.disconnect();
							}
						};

						this.ws.onerror = () => {
							addLog('WebSocket error', 'error');
							reject(new Error('WebSocket connection failed'));
						};

						setTimeout(() => {
							if (this.ws?.readyState !== WebSocket.OPEN) {
								reject(new Error('Connection timeout'));
							}
						}, 10000);
					});
				},

				async initializeAudio() {
					try {
						this.mediaStream = await navigator.mediaDevices.getUserMedia({
							audio: {
								sampleRate: this.sampleRate,
								channelCount: 1,
								echoCancellation: true,
								noiseSuppression: true,
								autoGainControl: true,
								suppressLocalAudioPlayback: true
							}
						});

						this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
							sampleRate: this.sampleRate
						});

						audioContextRef.current = this.audioContext;

						if (this.audioContext.state === 'suspended') {
							await this.audioContext.resume();
						}

						this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

						this.filterNode = this.audioContext.createBiquadFilter();
						this.filterNode.type = 'highpass';
						this.filterNode.frequency.setValueAtTime(80, this.audioContext.currentTime);
						this.filterNode.Q.setValueAtTime(0.7, this.audioContext.currentTime);

						this.compressorNode = this.audioContext.createDynamicsCompressor();
						this.compressorNode.threshold.setValueAtTime(-24, this.audioContext.currentTime);
						this.compressorNode.knee.setValueAtTime(30, this.audioContext.currentTime);
						this.compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime);
						this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime);
						this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime);

						this.gainNode = this.audioContext.createGain();
						gainNodeRef.current = this.gainNode;

						this.processorNode = this.audioContext.createScriptProcessor(1024, 1, 1);

						this.sourceNode.connect(this.filterNode);
						this.filterNode.connect(this.compressorNode);
						this.compressorNode.connect(this.gainNode);
						this.gainNode.connect(this.processorNode);
						this.processorNode.connect(this.audioContext.destination);

						this.processorNode.onaudioprocess = this.handleAudioProcess.bind(this);

						addLog('Audio initialized with advanced processing', 'success');
					} catch (error: any) {
						throw new Error(`Failed to initialize audio: ${error.message}`);
					}
				},

				handleAudioProcess(event: any) {
					if (!this.isMuted && this.isConnected) {
						const inputBuffer = event.inputBuffer;
						const processedBuffer = this.applyNoiseGate(inputBuffer);
						this.processAudioInput(processedBuffer);
					}
				},

				processAudioInput(inputBuffer: AudioBuffer) {
					const inputData = inputBuffer.getChannelData(0);

					const combined = new Float32Array(this.outgoingBuffer.length + inputData.length);
					combined.set(this.outgoingBuffer);
					combined.set(inputData, this.outgoingBuffer.length);
					this.outgoingBuffer = combined;

					const samplesPerChunk = this.chunkSize / 2;

					while (this.outgoingBuffer.length >= samplesPerChunk) {
						const chunk = this.outgoingBuffer.slice(0, samplesPerChunk);
						this.outgoingBuffer = this.outgoingBuffer.slice(samplesPerChunk);

						this.sendAudioChunk(chunk);
					}
				},

				sendAudioChunk(audioData: Float32Array) {
					if (!this.ws || this.ws?.readyState !== WebSocket.OPEN) return;

					const pcmData = new Int16Array(audioData.length);
					for (let i = 0; i < audioData.length; i++) {
						pcmData[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767));
					}

					const bytes = new Uint8Array(pcmData.buffer);
					const base64Data = btoa(String.fromCharCode(...bytes));

					const message = {
						event: 'media',
						media: {
							contentType: 'audio/x-l16',
							sampleRate: this.sampleRate,
							payload: base64Data
						}
					};

					try {
						this.ws.send(JSON.stringify(message));
						this.sentChunks++;
						updateStats();
					} catch (error: any) {
						console.error('Failed to send audio chunk:', error);
						addLog(`Audio send error: ${error.message}`, 'error');
					}
				},

				handleWebSocketMessage(event: MessageEvent) {
					try {
						const message = JSON.parse(event.data);

						if (message.event === 'playAudio' && message.media && message.media.payload) {
							this.handleIncomingAudio(message.media.payload);
							this.receivedChunks++;
							updateStats();
						}

					} catch (error: any) {
						addLog(`Error parsing message: ${error.message}`, 'error');
					}
				},

				handleIncomingAudio(base64Data: string) {
					try {
						if (speakerMuted) return;

						const binaryString = atob(base64Data);
						const bytes = new Uint8Array(binaryString.length);
						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}

						const pcmData = new Int16Array(bytes.buffer);
						const floatData = new Float32Array(pcmData.length);
						for (let i = 0; i < pcmData.length; i++) {
							floatData[i] = pcmData[i] / 32767;
						}

						if (this.incomingQueue.length >= this.MAX_QUEUE_SIZE) {
							this.incomingQueue.shift();
						}

						this.incomingQueue.push(floatData);
						updateStats();

						if (!this.audioPumping) {
							this.startAudioPump();
						}

					} catch (error: any) {
						addLog(`Error processing incoming audio: ${error.message}`, 'error');
					}
				},

				async startAudioPump() {
					if (this.audioPumping || !this.audioContext) return;

					this.audioPumping = true;
					this.nextScheduledTime = this.audioContext.currentTime + 0.1;

					const pump = () => {
						if (!this.isConnected || !this.audioContext) {
							this.audioPumping = false;
							if (this.pumpTimer) {
								clearTimeout(this.pumpTimer);
								this.pumpTimer = null;
							}
							return;
						}

						const minBuffer = 3;
						const maxBuffer = 15;

						if (this.incomingQueue.length >= minBuffer || this.incomingQueue.length > maxBuffer) {
							while (this.incomingQueue.length > 0 && this.incomingQueue.length >= minBuffer) {
								const audioData = this.incomingQueue.shift();
								if (!speakerMuted) {
									this.playAudioChunk(audioData);
								}
								updateStats();

								if (this.incomingQueue.length <= minBuffer) break;
							}
						}

						const samplesPerChunk = this.chunkSize / 2;
						const chunkDuration = samplesPerChunk / this.sampleRate;
						const intervalMs = chunkDuration * 1000;

						this.pumpTimer = setTimeout(pump, intervalMs);
					};

					pump();
				},

				applyNoiseGate(inputBuffer: AudioBuffer) {
					const inputData = inputBuffer.getChannelData(0);
					const outputData = new Float32Array(inputData.length);

					for (let i = 0; i < inputData.length; i++) {
						this.currentLevel = this.smoothingFactor * this.currentLevel +
							(1 - this.smoothingFactor) * Math.abs(inputData[i]);

						const levelDb = 20 * Math.log10(Math.max(this.currentLevel, 0.000001));

						let gateGain = 1.0;
						if (levelDb < this.noiseGateThreshold) {
							const reduction = Math.min(1.0, Math.max(0.0,
								(levelDb - this.noiseGateThreshold + 10) / 10));
							gateGain = Math.pow(reduction, this.noiseGateRatio);
						}

						outputData[i] = inputData[i] * gateGain;
					}

					const processedBuffer = this.audioContext.createBuffer(1, outputData.length, this.audioContext.sampleRate);
					processedBuffer.getChannelData(0).set(outputData);

					return processedBuffer;
				},

				playAudioChunk(audioData: Float32Array) {
					if (!this.audioContext) return;

					try {
						const buffer = this.audioContext.createBuffer(1, audioData.length, this.sampleRate);
						buffer.getChannelData(0).set(audioData);

						const source = this.audioContext.createBufferSource();
						source.buffer = buffer;
						source.connect(this.audioContext.destination);

						const now = this.audioContext.currentTime;

						if (this.nextScheduledTime <= now) {
							this.nextScheduledTime = now;
						}

						source.start(this.nextScheduledTime);

						const chunkDuration = audioData.length / this.sampleRate;
						this.nextScheduledTime += chunkDuration;

						const maxFutureTime = now + 1.0;
						if (this.nextScheduledTime > maxFutureTime) {
							this.nextScheduledTime = maxFutureTime;
						}

					} catch (error: any) {
						addLog(`Error playing audio chunk: ${error.message}`, 'error');
						this.nextScheduledTime = this.audioContext.currentTime;
					}
				},

				toggleMute() {
					this.isMuted = !this.isMuted;
					setMuted(this.isMuted);
					addLog(`Microphone ${this.isMuted ? 'muted' : 'unmuted'}`, 'info');
				},

				clearAudioQueue() {
					this.incomingQueue = [];
					this.outgoingBuffer = new Float32Array(0);

					if (this.audioContext) {
						this.nextScheduledTime = this.audioContext.currentTime;
					}

					updateStats();
					addLog('Audio queues cleared', 'info');
				},

				disconnect() {
					this.isConnected = false;
					setConnected(false);

					if (this.ws) {
						this.ws.close();
						this.ws = null;
					}

					if (this.processorNode) {
						this.processorNode.disconnect();
						this.processorNode = null;
					}

					if (this.sourceNode) {
						this.sourceNode.disconnect();
						this.sourceNode = null;
					}

					if (this.gainNode) {
						this.gainNode.disconnect();
						this.gainNode = null;
					}

					if (this.filterNode) {
						this.filterNode.disconnect();
						this.filterNode = null;
					}

					if (this.compressorNode) {
						this.compressorNode.disconnect();
						this.compressorNode = null;
					}

					this.currentLevel = 0;

					if (this.audioContext) {
						this.audioContext.close();
						this.audioContext = null;
						audioContextRef.current = null;
					}

					if (this.mediaStream) {
						this.mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
						this.mediaStream = null;
					}

					this.audioPumping = false;
					if (this.pumpTimer) {
						clearTimeout(this.pumpTimer);
						this.pumpTimer = null;
					}

					this.incomingQueue = [];
					this.outgoingBuffer = new Float32Array(0);
					this.isMuted = false;

					setMuted(false);
					updateStats();
					addLog('Disconnected', 'warning');
				}
			};

			audioClientRef.current = AudioClient;
			await AudioClient.connect();

		} catch (err: any) {
			console.error('Error initializing audio client:', err);
			addLog(`Error initializing audio client: ${err.message}`, 'error');
			setConnecting(false);
		}
	};

	const handleToggleMute = () => {
		if (audioClientRef.current) {
			audioClientRef.current.toggleMute();
		}
	};

	const handleToggleSpeaker = () => {
		setSpeakerMuted(!speakerMuted);

		if (gainNodeRef.current) {
			gainNodeRef.current.gain.value = !speakerMuted ? 0 : 1;
		}

		addLog(`Speaker ${!speakerMuted ? 'muted' : 'unmuted'}`, 'info');
	};

	const handleDisconnect = async () => {
		if (!callId || !user?.id || !authToken) {
			if (audioClientRef.current) {
				audioClientRef.current.disconnect();
			}
			if (onCallEnd) {
				onCallEnd();
			}
			return;
		}

		try {
			setHangingUp(true);
			addLog('Ending call...', 'info');

			await fetch('https://db.vocallabs.ai/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify({
					query: `
						mutation HangUpCall($call_id: uuid = "", $client_id: uuid = "") {
							vocallabsCallHangUp(request: {call_id: $call_id, client_id: $client_id}) {
								affected_rows
								call_id
							}
						}
					`,
					variables: {
						call_id: callId,
						client_id: user.id
					}
				})
			});

			addLog('Call ended successfully', 'success');
			toast.success('Call ended successfully');

			if (audioClientRef.current) {
				audioClientRef.current.disconnect();
			}

			setCallId(null);
			setConnected(false);
			setConnecting(false);
			setCallStatus(null);
			setCallBilling(null);

			if (onCallEnd) {
				onCallEnd();
			}

		} catch (err: any) {
			console.error('Error hanging up call:', err);
			addLog(`Error ending call: ${err.message}`, 'error');
			toast.error('Failed to end call');

			if (audioClientRef.current) {
				audioClientRef.current.disconnect();
			}
		} finally {
			setHangingUp(false);
		}
	};

	if (!connected && !connecting) {
		return (
			<div className="flex justify-center">
				<button
					type="button"
					onClick={handleMakeCall}
					disabled={connecting || !phoneNumber.trim() || !tokenId}
					className={cn(
						"inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg",
						"text-white bg-green-500",
						"hover:bg-green-600",
						"transition-colors",
						"disabled:opacity-50 disabled:cursor-not-allowed"
					)}
				>
					<Phone className="w-4 h-4 mr-2" />
					Call
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{connecting && (
				<div className="flex items-center justify-center py-8">
					<div className="text-center">
						<Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500 mb-2" />
						<p className="text-sm text-gray-400">Connecting call...</p>
					</div>
				</div>
			)}

			{connected && (
				<div className="space-y-3 sm:space-y-4">
					{/* Call Status Info */}
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
							{callStatus ? (
								<CallStatusIndicator
									status={callStatus === 'fail' ? 'failed' : callStatus}
									className="flex-shrink-0"
								/>
							) : (
								<div className="p-1.5 sm:p-2 bg-green-500/20 rounded-full flex-shrink-0">
									<Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
								</div>
							)}
							<div className="min-w-0 flex-1">
								<p className="text-xs sm:text-sm text-white font-medium truncate">
									{phoneNumber}
								</p>
								{callBilling && (
									<span className="text-xs text-gray-400">
										Cost: ${callBilling.toFixed(4)}
									</span>
								)}
							</div>
						</div>
						<div className="flex space-x-1.5 sm:space-x-2 flex-shrink-0">
							<button
								onClick={handleToggleMute}
								className={cn(
									"p-1.5 sm:p-2 rounded-lg transition-colors",
									muted
										? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
										: "bg-dark-300 text-gray-400 hover:bg-dark-200"
								)}
								title={muted ? "Unmute microphone" : "Mute microphone"}
							>
								<Mic className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
							<button
								onClick={handleToggleSpeaker}
								className={cn(
									"p-1.5 sm:p-2 rounded-lg transition-colors",
									speakerMuted
										? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
										: "bg-dark-300 text-gray-400 hover:bg-dark-200"
								)}
								title={speakerMuted ? "Unmute speaker" : "Mute speaker"}
							>
								{speakerMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
							</button>
						</div>
					</div>

					{/* End Call Button */}
					<button
						type="button"
						onClick={handleDisconnect}
						disabled={hangingUp}
						className={cn(
							"w-full py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg",
							"text-white bg-red-600",
							"hover:bg-red-700",
							"transition-colors flex items-center justify-center gap-1.5 sm:gap-2",
							"disabled:opacity-50 disabled:cursor-not-allowed"
						)}
					>
						{hangingUp ? (
							<>
								<Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
								Ending Call...
							</>
						) : (
							<>
								<X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
								End Call
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
