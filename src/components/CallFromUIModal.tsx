import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Phone, Mic, MicOff, Volume2, VolumeX, Loader2, X, User } from 'lucide-react';
import { cn } from '../utils/cn';
import { CallStatusIndicator } from './CallStatusIndicator';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';

const LAST_CALLED_NUMBER_KEY = 'vocallabs_last_called_number';
const LAST_TOKEN_ID_KEY = 'vocallabs_last_token_id';

interface CallFromUIModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialPhoneNumber?: string;
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

export function CallFromUIModal({ isOpen, onClose, initialPhoneNumber = '' }: CallFromUIModalProps) {
	const [phoneNumber, setPhoneNumber] = useState('+919493992099');
	const [tokenId, setTokenId] = useState('919240215978');
	const [connecting, setConnecting] = useState(false);
	const [connected, setConnected] = useState(false);
	const [muted, setMuted] = useState(false);
	const [speakerMuted, setSpeakerMuted] = useState(false);
	const [isTalking, setIsTalking] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [callId, setCallId] = useState<string | null>(null);
	const [hangingUp, setHangingUp] = useState(false);
	const [callStatus, setCallStatus] = useState<string | null>(null);
	const [callBilling, setCallBilling] = useState<number | null>(null);

	const contacts = [];
	const searchLoading = false;
	const searchContacts = () => {};

	const audioClientRef = useRef<AudioClientRef | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const gainNodeRef = useRef<GainNode | null>(null);
	const talkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const { user } = useAuthStore();
	const authToken = user?.auth_token;

	// Initialize with saved values from localStorage
	useEffect(() => {
		const savedNumber = localStorage.getItem(LAST_CALLED_NUMBER_KEY);
		const savedTokenId = localStorage.getItem(LAST_TOKEN_ID_KEY);

		if (savedNumber && !initialPhoneNumber) {
			setPhoneNumber(savedNumber);
		}

		if (savedTokenId) {
			setTokenId(savedTokenId);
		}
	}, [initialPhoneNumber]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (audioClientRef.current?.isConnected) {
				audioClientRef.current.disconnect();
			}

			if (audioContextRef.current) {
				audioContextRef.current.close();
			}

			if (talkingTimeoutRef.current) {
				clearTimeout(talkingTimeoutRef.current);
			}

			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, []);

	// Poll call status when call is active
	useEffect(() => {
		if (!callId || !authToken || !connected) {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			return;
		}

		const pollCallStatus = async () => {
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
				const { vocallabs_calls } = result.data;

				if (vocallabs_calls && vocallabs_calls.length > 0) {
					const call = vocallabs_calls[0];
					const newStatus = call.call_status;
					const newBilling = call.call_billing;

					if (newStatus !== callStatus) {
						setCallStatus(newStatus);
						addLog(`Call status updated: ${newStatus}`, newStatus === 'fail' ? 'error' : 'info');

						if (newStatus === 'fail' || newStatus === 'completed') {
							addLog(`Call ended with status: ${newStatus}`, newStatus === 'fail' ? 'error' : 'success');
							if (audioClientRef.current) {
								audioClientRef.current.disconnect();
							}
							setConnected(false);
							setConnecting(false);
						}
					}

					if (newBilling !== callBilling) {
						setCallBilling(newBilling);
						if (newBilling) {
							addLog(`Call billing: $${newBilling}`, 'info');
						}
					}
				}
			} catch (err) {
				console.error('Error polling call status:', err);
				addLog('Error checking call status', 'warning');
			}
		};

		pollCallStatus();
		pollingIntervalRef.current = setInterval(pollCallStatus, 5000);

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [callId, authToken, connected, callStatus, callBilling]);

	// Stub functions for removed logging functionality
	const addLog = (_message: string, _type = 'info') => {
		// Logging removed for cleaner UI
	};

	const updateStats = () => {
		// Stats tracking removed for cleaner UI
	};

	const setTalkingState = (talking: boolean) => {
		setIsTalking(talking);

		if (talking) {
			if (talkingTimeoutRef.current) {
				clearTimeout(talkingTimeoutRef.current);
			}

			talkingTimeoutRef.current = setTimeout(() => {
				setIsTalking(false);
			}, 150);
		}
	};

	const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setPhoneNumber(value);

		if (value.length >= 3) {
			searchContacts(value);
			setShowSuggestions(true);
		} else {
			setShowSuggestions(false);
		}
	};

	const handleSelectContact = (contact: { name: string; phone: string }) => {
		setPhoneNumber(contact.phone);
		setShowSuggestions(false);
	};

	const handleInputFocus = () => {
		if (phoneNumber.length >= 3) {
			searchContacts(phoneNumber);
			setShowSuggestions(true);
		}
	};

	const handleInputBlur = (e: React.FocusEvent) => {
		setTimeout(() => {
			if (!e.currentTarget?.contains(document.activeElement)) {
				setShowSuggestions(false);
			}
		}, 200);
	};

	const handleMakeCall = async () => {
		if (!phoneNumber.trim() || !tokenId || !user?.id || !authToken) {
			toast.error('Please enter a phone number and select an API token');
			return;
		}

		try {
			setConnecting(true);
			addLog('Initiating call...', 'info');

			localStorage.setItem(LAST_CALLED_NUMBER_KEY, phoneNumber);
			localStorage.setItem(LAST_TOKEN_ID_KEY, tokenId);

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
							this.disconnect();
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

					const rms = Math.sqrt(inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length);
					if (rms > 0.01) {
						setTalkingState(true);
					}

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
					setIsTalking(false);
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

	const getMicIcon = () => {
		if (muted) {
			return <MicOff className="w-5 h-5" />;
		}

		if (isTalking) {
			return <Mic className="w-5 h-5 text-green-500 animate-pulse" />;
		}

		return <Mic className="w-5 h-5 text-primary-500" />;
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={connected ? handleDisconnect : onClose}
			title="Call from UI"
		>
			<div className="p-6 space-y-6 relative z-10">
				{!connected ? (
					<div className="space-y-4">
						<div>
							<label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Phone Number <span className="text-red-500">*</span>
							</label>
							<div
								className="relative"
								onFocus={handleInputFocus}
								onBlur={handleInputBlur}
							>
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Phone className="h-5 w-5 text-gray-400" />
								</div>
								<input
									type="tel"
									id="phoneNumber"
									value={phoneNumber}
									onChange={handlePhoneInputChange}
									className={cn(
										"block w-full pl-10 pr-3 py-2 border rounded-md",
										"border-gray-300 dark:border-gray-600",
										"focus:ring-primary-500 focus:border-primary-500",
										"dark:bg-gray-700 dark:text-white",
										"placeholder-gray-500 dark:placeholder-gray-400",
										"sm:text-sm"
									)}
									placeholder="Enter phone number"
									disabled={connecting}
									required
								/>
								{showSuggestions && contacts.length > 0 && (
									<div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
										{searchLoading ? (
											<div className="p-2 text-center text-gray-500 dark:text-gray-400">
												<Loader2 className="w-4 h-4 animate-spin mx-auto" />
												<span className="text-xs mt-1">Searching contacts...</span>
											</div>
										) : (
											<ul className="py-1">
												{contacts.map((contact) => (
													<li
														key={contact.id}
														className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
														onClick={() => handleSelectContact(contact)}
													>
														<div className="flex items-center">
															<div className="flex-shrink-0">
																<div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
																	<User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
																</div>
															</div>
															<div className="ml-3">
																<p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
																<p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
															</div>
														</div>
													</li>
												))}
											</ul>
										)}
									</div>
								)}
							</div>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Format: +919182517283 (with country code)
							</p>
						</div>

						{/* <div>
							<label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								API Token <span className="text-red-500">*</span>
							</label>
							<TokenSelect
								value={tokenId}
								onChange={setTokenId}
								className="w-full"
							/>
						</div> */}

						<div className="flex justify-end pt-4">
							<button
								type="button"
								onClick={() => {
									onClose();
								}}
								className={cn(
									"px-4 py-2 text-sm font-medium rounded-md mr-3",
									"text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300",
									"border border-gray-300 dark:border-gray-600",
									"hover:bg-gray-50 dark:hover:bg-gray-600",
									"focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
								)}
								disabled={connecting}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleMakeCall}
								disabled={connecting || !phoneNumber.trim() || !tokenId}
								className={cn(
									"inline-flex items-center px-4 py-2 text-sm font-medium rounded-md",
									"text-white bg-primary-600",
									"hover:bg-primary-700",
									"focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
									"disabled:opacity-50 disabled:cursor-not-allowed"
								)}
							>
								{connecting ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Connecting...
									</>
								) : (
									<>
										<Phone className="w-4 h-4 mr-2" />
										Make Call
									</>
								)}
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						{/* Call Info */}
						<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									{callStatus ? (
										<CallStatusIndicator
											status={callStatus === 'fail' ? 'failed' : callStatus}
											className="flex-shrink-0"
										/>
									) : (
										<div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
											<Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
										</div>
									)}
									<div>
										<h3 className="text-sm font-medium text-gray-900 dark:text-white">
											{callStatus === 'fail' ? 'Call Failed' :
												callStatus === 'completed' ? 'Call Completed' :
													callStatus === 'in-progress' ? 'Call in Progress' :
														callStatus === 'ringing' ? 'Ringing...' :
															callStatus === 'connecting' ? 'Connecting...' :
																callStatus === 'queued' ? 'Queued' :
																	callStatus === 'pending' ? 'Pending' :
																		'Call in Progress'}
										</h3>
										<div className="space-y-1">
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{phoneNumber}
											</p>
											{callBilling && (
												<div className="flex items-center space-x-2">
													<span className="text-xs text-gray-500 dark:text-gray-400">
														Cost: ${callBilling.toFixed(4)}
													</span>
												</div>
											)}
										</div>
									</div>
								</div>
								<div className="flex space-x-2">
									<button
										onClick={handleToggleMute}
										className={cn(
											"p-2 rounded-full transition-colors",
											muted
												? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
												: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
										)}
										title={muted ? "Unmute microphone" : "Mute microphone"}
									>
										{getMicIcon()}
									</button>
									<button
										onClick={handleToggleSpeaker}
										className={cn(
											"p-2 rounded-full transition-colors",
											speakerMuted
												? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
												: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
										)}
										title={speakerMuted ? "Unmute speaker" : "Mute speaker"}
									>
										{speakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
									</button>
								</div>
							</div>
						</div>

						{/* End Call Action */}
						<div className="flex justify-center pt-4">
							<button
								type="button"
								onClick={handleDisconnect}
								disabled={hangingUp}
								className={cn(
									"inline-flex items-center px-6 py-3 text-sm font-medium rounded-md",
									"text-white bg-red-600",
									"hover:bg-red-700",
									"focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
									"transition-colors",
									"disabled:opacity-50 disabled:cursor-not-allowed"
								)}
							>
								{hangingUp ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Ending Call...
									</>
								) : (
									<>
										<X className="w-4 h-4 mr-2" />
										End Call
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
}