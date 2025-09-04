import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useApiRequest from '@app/core/api-client/useApiRequest';
import { BackendApiName } from '@config/api-config';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import {
	ChatResponseModel,
	SupportResponseModel,
	Message,
	Suggestion,
	ChatOption,
	Faq,
	ChatRequestModel
} from './models/chat.models';

interface ChatbotProps {
	onSupportSent?: () => void;
	className?: string;
	language?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ onSupportSent, className, language = 'en' }) => {
	const [conversationId, setConversationId] = useState<string | undefined>();
	const [messages, setMessages] = useState<Message[]>([]);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [faqs, setFaqs] = useState<Faq[]>([]);
	const [previousFaqs, setPreviousFaqs] = useState<Faq[]>([]); // Store FAQs when entering detail mode
	const [previousSuggestions, setPreviousSuggestions] = useState<Suggestion[]>([]); // Store suggestions when entering detail mode
	const [faqMessages, setFaqMessages] = useState<Message[]>([]); // Messages specific to FAQ detail mode
	const [options, setOptions] = useState<ChatOption[] | undefined>();
	const [loading, setLoading] = useState(false);
	const [supportMode, setSupportMode] = useState(false);
	const [supportText, setSupportText] = useState('');
	const [faqDetailMode, setFaqDetailMode] = useState(false);
	const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
	const [currentTopicName, setCurrentTopicName] = useState<string>('');
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const initializationRef = useRef(false);
	// Floating open/close state
	const [open, setOpen] = useState(false);
	const fabRef = useRef<HTMLButtonElement | null>(null);
	const closeBtnRef = useRef<HTMLButtonElement | null>(null);
	const loadingRef = useRef(false);
	const { t } = useTranslation();

	// Create API request hooks
	const chatApi = useApiRequest<ChatResponseModel>({
		apiName: BackendApiName.CHAT_MESSAGE,
		model: ChatResponseModel
	});

	const supportApi = useApiRequest<SupportResponseModel>({
		apiName: BackendApiName.SUPPORT_SEND,
		model: SupportResponseModel
	});

	const fetchNode = useCallback(
		async (nodeId?: string) => {
			if (loadingRef.current) return; // guard against rapid double clicks
			loadingRef.current = true;
			setLoading(true);
			try {
				const requestBody: ChatRequestModel = {
					conversationId,
					nodeId,
					language
				};
				const data = await chatApi.requestWithOptions({
					body: requestBody
				});
				setConversationId(data.conversationId);
				setMessages(prev => [...prev, { id: uuidv4(), from: 'bot', text: data.answer }]);
				setSuggestions(data.suggestions);
				setFaqs(data.faqs || []);
				setOptions(data.options);
				setSupportMode(false);
				setFaqDetailMode(false);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error('Chat request failed:', e);
			} finally {
				loadingRef.current = false;
				setLoading(false);
			}
		},
		[conversationId, chatApi, language]
	);

	const restart = () => {
		setConversationId(undefined);
		setMessages([]);
		setSuggestions([]);
		setFaqs([]);
		setPreviousFaqs([]);
		setPreviousSuggestions([]);
		setOptions(undefined);
		setFaqDetailMode(false);
		setSelectedFaq(null);
		setCurrentTopicName('');
		initializationRef.current = false;
	};

	const startSupport = () => {
		setSupportMode(true);
		setSupportText('');
		setTimeout(() => {
			try {
				bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
			} catch (e) {}
		}, 50);
	};

	const closeChat = () => {
		setOpen(false);
		setTimeout(() => fabRef.current?.focus(), 0); // restore focus
	};

	const sendSupport = async () => {
		if (!supportText.trim() || !conversationId) return;
		loadingRef.current = true;
		setLoading(true);
		try {
			await supportApi.requestWithOptions({
				body: { conversationId, message: supportText }
			});

			if (faqDetailMode) {
				setFaqMessages(prev => [
					...prev,
					{ id: uuidv4(), from: 'user', text: supportText },
					{ id: uuidv4(), from: 'bot', text: t('chatbot.supportRequestSent') }
				]);
			} else {
				setMessages(prev => [
					...prev,
					{ id: uuidv4(), from: 'user', text: supportText },
					{ id: uuidv4(), from: 'bot', text: t('chatbot.supportRequestSent') }
				]);
			}

			setSupportMode(false);
			setSupportText('');

			onSupportSent?.();
		} catch (e) {
			console.error('Support request failed:', e);
		} finally {
			loadingRef.current = false;
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!initializationRef.current && open) {
			initializationRef.current = true;
			fetchNode();
		}
	}, [fetchNode, open]);

	useEffect(() => {
		if (!open) return;
		closeBtnRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				closeChat();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSuggestionClick = (s: Suggestion) => {
		setMessages(prev => [...prev, { id: uuidv4(), from: 'user', text: s.text }]);
		setCurrentTopicName(s.text);
		fetchNode(s.id);
	};

	const handleFaqClick = (faq: Faq) => {
		setSelectedFaq(faq);
		setFaqDetailMode(true);
		setPreviousFaqs(faqs);
		setPreviousSuggestions(suggestions);
		setSuggestions([]);
		setFaqs([]);
	};

	const goBackFromFaqDetail = () => {
		setFaqDetailMode(false);
		setSupportMode(false);
		setSelectedFaq(null);
		setFaqMessages([]);
		setFaqs(previousFaqs);
		setSuggestions(previousSuggestions);
		setPreviousFaqs([]);
		setPreviousSuggestions([]);

		setTimeout(() => {
			try {
				bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
			} catch (e) {}
		}, 50);
	};

	const handleOption = (action: string) => {
		if (action === 'restart') restart();
		if (action === 'support') startSupport();
	};

	const handleSupportTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (!loading && supportText.trim()) {
				sendSupport();
			}
		}
	};

	// Helper avatar (matches Figma design with person icon)
	const Avatar = ({ size = 36 }: { size?: number }) => (
		<div
			className={`flex items-center justify-center rounded-full bg-[#3F51B5] text-white shrink-0`}
			style={{ width: size, height: size }}
			aria-hidden="true"
		>
			<PersonIcon style={{ fontSize: Math.round(size * 0.67) }} />
		</div>
	);

	// Early return: floating button when closed
	if (!open) {
		return (
			<>
				<button
					ref={fabRef}
					className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-[#3F51B5] text-white shadow-lg shadow-black/25 flex items-center justify-center hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition z-50 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40"
					aria-label={t('chatbot.openHelpAssistant')}
					onClick={() => setOpen(true)}
				>
					<ChatBubbleOutlineIcon fontSize="medium" />
				</button>
			</>
		);
	}

	const lastBotMessage = [...messages].reverse().find(m => m.from === 'bot');
	return (
		<div className="fixed bottom-24 right-5 z-50">
			<div
				className={`flex flex-col w-[430px] h-[600px] rounded-2xl bg-[#F6F8FA] shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_0px_rgba(0,0,0,0.3)] overflow-hidden border border-[#E0E4E7] ${className || ''}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="chatbot-header-title"
			>
				{/* Header - conditional based on FAQ detail mode */}
				<div className="flex items-center gap-3 h-[72px] px-6 py-3 border-b border-[#D2D7DB] bg-white relative">
					{faqDetailMode && (
						<button
							className="w-12 h-12 flex items-center justify-center text-[#696F72] hover:bg-black/5 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40 -ml-2"
							aria-label={t('chatbot.goBackToFaqList')}
							onClick={goBackFromFaqDetail}
						>
							<ArrowBackIcon sx={{ fontSize: 24 }} />
						</button>
					)}
					<h2
						id="chatbot-header-title"
						className="flex-1 text-[22px] leading-[28px] font-semibold tracking-[0.05px] text-[#696F72]"
						style={{ fontFamily: "'Open Sans', sans-serif" }}
					>
						{faqDetailMode && currentTopicName ? currentTopicName : t('chatbot.title')}
					</h2>
					<button
						ref={closeBtnRef}
						className="w-8 h-8 flex items-center justify-center text-[#696F72] hover:bg-black/5 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40"
						aria-label={t('chatbot.closeHelpAssistant')}
						onClick={closeChat}
					>
						<CloseIcon sx={{ fontSize: 24 }} />
					</button>
				</div>

				{/* Conditional content based on FAQ detail mode */}
				{faqDetailMode && selectedFaq ? (
					/* FAQ Detail View - matches Figma design exactly */
					<div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
						{/* Bot message introducing the question */}
						<div className="flex items-start gap-4 w-full">
							<Avatar size={36} />
							<div className="flex flex-col gap-4 flex-1">
								<div
									className="bg-[#E9EBEF] rounded-lg px-3 py-2 text-left text-[#3C4245] text-[16px] leading-[24px] tracking-[0.5px]"
									style={{ fontFamily: "'Open Sans', sans-serif" }}
								>
									{t('chatbot.hereArePossibleAnswers')}
								</div>
								<div
									className="text-[#21272A] text-[18px] leading-[26px] tracking-[0.5px]"
									style={{ fontFamily: "'Open Sans', sans-serif" }}
								>
									{selectedFaq.answer}
								</div>
							</div>
						</div>

						{/* Support section */}
						<div className="flex items-start gap-4 w-full">
							<Avatar size={36} />
							<div className="flex flex-col gap-4 flex-1">
								<div
									className="bg-[#E9EBEF] rounded-lg px-3 py-2 text-left text-[#3C4245] text-[16px] leading-[24px] tracking-[0.5px]"
									style={{ fontFamily: "'Open Sans', sans-serif" }}
								>
									{t('chatbot.ifYouNeedMoreHelp')}
								</div>
								<button
								onClick={startSupport}
								disabled={supportMode || loading}
								className="self-start px-6 py-2.5 h-10 text-[14px] font-bold tracking-[0.1px] rounded-lg border border-[#6F797A] bg-white text-[#004494] hover:bg-[#F6F8FA] focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40 transition disabled:opacity-50"
									style={{ fontFamily: "'Open Sans', sans-serif" }}
								>
									{t('chatbot.askSupport')}
								</button>
							</div>
						</div>

						{/* Display FAQ-specific support messages */}
						{faqMessages.map(m => (
							<div
								key={m.id}
								className={`flex items-start gap-4 w-full ${m.from === 'user' ? 'flex-row-reverse' : ''}`}
							>
								<Avatar size={36} />
								<div
									className={`rounded-lg px-3 py-2 max-w-[80%] text-[16px] leading-[24px] tracking-[0.5px] ${m.from === 'bot' ? 'bg-[#E9EBEF] text-[#000000]' : 'bg-[#004494] text-white'}`}
									style={{ fontFamily: "'Open Sans', sans-serif" }}
								>
									{m.text}
								</div>
							</div>
						))}

						<div ref={bottomRef} />
					</div>
				) : (
					/* Regular chat view */
					<div
						className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
						role="log"
						aria-live="polite"
						aria-relevant="additions text"
					>
						{/* Initial helper intro (if no messages yet) */}
						{messages.length === 0 && !loading && (
							<div className="flex flex-col items-center gap-6 pt-2 text-center">
								<div className="flex flex-col items-center gap-4">
									<p
										className="text-[14px] leading-5 tracking-[0.25px] text-[#3C4245]"
										style={{ fontFamily: "'Open Sans', sans-serif" }}
									>
										{t('chatbot.chatWithVirtualAssistant')}
									</p>
									<Avatar size={64} />
								</div>
								{/* Initial bot message with suggestion chips */}
								<div className="flex items-start gap-4 w-full">
									<Avatar size={36} />
									<div className="flex flex-col gap-4 flex-1">
										<div
											className="bg-[#E9EBEF] rounded-lg px-3 py-2 text-left text-[#000] text-[16px] leading-[24px] tracking-[0.5px]"
											style={{ fontFamily: "'Open Sans', sans-serif" }}
										>
											{t('root')}
										</div>
										{/* Initial suggestion chips */}
										{suggestions.length > 0 && (
											<div className="flex flex-wrap gap-2" aria-label={t('chatbot.suggestions')}>
												{suggestions.map(s => (
													<button
														key={s.id}
														disabled={loading}
														onClick={() => handleSuggestionClick(s)}
														className="px-4 py-1.5 h-8 text-[14px] tracking-[0.1px] rounded-lg border border-[#BFC8CA] bg-white text-[#171D1E] hover:bg-[#F6F8FA] disabled:opacity-50 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40 transition"
														style={{ fontFamily: "'Open Sans', sans-serif" }}
													>
														{s.text}
													</button>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						)}
						{messages.map((m, index) => {
							const isLastBotMessage = m.from === 'bot' && index === messages.length - 1;
							const showFaqs = isLastBotMessage && faqs.length > 0;
							const showSuggestions = isLastBotMessage && suggestions.length > 0;

							return (
								<div key={m.id} className="flex flex-col gap-4">
									<div
										className={`flex items-start gap-4 w-full ${m.from === 'user' ? 'flex-row-reverse' : ''}`}
									>
										<Avatar size={36} />
										<div
											className={`rounded-lg px-3 py-2 max-w-[80%] text-[16px] leading-[24px] tracking-[0.5px] ${m.from === 'bot' ? 'bg-[#E9EBEF] text-[#000000]' : 'bg-[#004494] text-white'}`}
											style={{ fontFamily: "'Open Sans', sans-serif" }}
										>
											{m.text}
										</div>
									</div>

									{/* Show FAQ list after bot message */}
									{showFaqs && (
										<div className="flex items-start gap-4 w-full">
											<div className="w-9 flex-shrink-0" />{' '}
											{/* Spacer for alignment with avatar */}
											<ul className="flex flex-col gap-2 list-disc pl-6">
												{faqs.map(faq => (
													<li key={faq.id} className="list-item">
														<button
															disabled={loading}
															onClick={() => handleFaqClick(faq)}
															className="text-left text-[16px] font-bold leading-[24px] tracking-[0.5px] text-[#004494] underline hover:text-[#003366] disabled:opacity-50 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40 transition"
															style={{ fontFamily: "'Open Sans', sans-serif" }}
														>
															{faq.question}
														</button>
													</li>
												))}
											</ul>
										</div>
									)}

									{/* Show suggestion chips after the FAQ list or when no FAQs */}
									{showSuggestions && (
										<div className="flex items-start gap-4 w-full">
											<div className="w-9 flex-shrink-0" />{' '}
											{/* Spacer for alignment with avatar */}
											<div className="flex flex-col gap-3">
												{/* Label for other topics when FAQs are also shown */}
												{showFaqs && (
													<p
														className="text-[14px] font-medium text-[#696F72] tracking-[0.25px]"
														style={{ fontFamily: "'Open Sans', sans-serif" }}
													>
														{t('chatbot.orSelectAnotherTopic')}
													</p>
												)}
												<div
													className="flex flex-wrap gap-2"
													aria-label={t('chatbot.suggestions')}
												>
													{suggestions.map(s => (
														<button
															key={s.id}
															disabled={loading}
															onClick={() => handleSuggestionClick(s)}
															className="px-4 py-1.5 h-8 text-[14px] tracking-[0.1px] rounded-lg border border-[#BFC8CA] bg-white text-[#171D1E] hover:bg-[#F6F8FA] disabled:opacity-50 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40 transition"
															style={{ fontFamily: "'Open Sans', sans-serif" }}
														>
															{s.text}
														</button>
													))}
												</div>
											</div>
										</div>
									)}
								</div>
							);
						})}
						{loading && (
							<div className="flex items-start gap-4">
								<Avatar size={36} />
								<div
									className="bg-[#E9EBEF] rounded-lg px-3 py-2 text-[#000] text-[16px] leading-[24px] tracking-[0.5px]"
									style={{ fontFamily: "'Open Sans', sans-serif" }}
								>
									...
								</div>
							</div>
						)}
						<div ref={bottomRef} />
						<div className="sr-only" aria-live="polite">
							{lastBotMessage?.text}
						</div>
					</div>
				)}

				{/* Footer - matches Figma structure, show when not in FAQ detail mode OR when in support mode */}
				{(!faqDetailMode || supportMode) && (
					<div className="px-6 pb-4 pt-2 flex flex-col gap-4 bg-white border-t border-[#D2D7DB]">
						{!supportMode && (
							<>
								{/* Option buttons (restart/support) - only show these, not suggestion chips */}
								{options && (
									<div className="flex flex-wrap gap-2">
										{options.map(o => (
											<button
												key={o.action}
												disabled={loading}
												onClick={() => handleOption(o.action)}
												className="px-3 py-1.5 text-[14px] tracking-[0.1px] rounded-lg border border-[#BFC8CA] bg-white text-[#171D1E] hover:bg-[#F6F8FA] disabled:opacity-50 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40 transition"
												style={{ fontFamily: "'Open Sans', sans-serif" }}
											>
												{o.label}
											</button>
										))}
									</div>
								)}
							</>
						)}
						{supportMode && (
							<form
								onSubmit={e => {
									e.preventDefault();
									if (!loading && supportText.trim()) sendSupport();
								}}
								className="flex flex-col gap-3"
							>
								<label
									className="flex flex-col gap-2 text-[14px] tracking-[0.25px] text-[#3C4245]"
									style={{ fontFamily: "'Open Sans', sans-serif" }}
								>
									<span className="font-medium">{t('chatbot.describeYourIssue')}</span>
									<textarea
										value={supportText}
										onChange={e => setSupportText(e.target.value)}
										onKeyDown={handleSupportTextareaKey}
										placeholder={t('chatbot.typeHere')}
										className="w-full resize-y min-h-[100px] rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] leading-5 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40"
										style={{ fontFamily: "'Open Sans', sans-serif" }}
									/>
								</label>
								<div className="flex justify-end gap-3">
									<button
										type="button"
										onClick={() => setSupportMode(false)}
										disabled={loading}
										className="px-5 py-2 rounded-lg border border-[#BFC8CA] bg-white text-[14px] tracking-[0.1px] text-[#171D1E] hover:bg-[#F6F8FA] disabled:opacity-50 focus:outline-none focus-visible:ring focus-visible:ring-[#3F51B5]/40"
										style={{ fontFamily: "'Open Sans', sans-serif" }}
									>
										{t('chatbot.cancel')}
									</button>
									<button
										type="submit"
										disabled={loading || !supportText.trim()}
										className="px-5 py-2 rounded-lg bg-[#004494] text-white text-[14px] tracking-[0.1px] font-medium hover:brightness-110 disabled:opacity-50 focus:outline-none focus-visible:ring focus-visible:ring-[#004494]/40"
										style={{ fontFamily: "'Open Sans', sans-serif" }}
									>
										{t('chatbot.send')}
									</button>
								</div>
							</form>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Chatbot;
