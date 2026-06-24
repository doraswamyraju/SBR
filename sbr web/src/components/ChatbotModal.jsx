import React, { useState, useEffect, useRef } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
// These icons are specifically used within the ChatbotModal.
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IconRobot = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.05 7.44-7 7.93zM10 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>;
const IconSend = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;


// Chatbot Modal Component
const ChatbotModal = ({ isOpen, onClose }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef(null);

    // Scroll to bottom of chat history when chat history updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Handle sending a message to the chatbot (now with a dummy response)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim()) return; // Prevent sending empty messages

        const newUserMessage = { role: 'user', text: userMessage };
        setChatHistory((prev) => [...prev, newUserMessage]); // Add user message to history
        setUserMessage(''); // Clear input field
        setIsLoading(true); // Show loading indicator

        // --- DUMMY CHATBOT RESPONSE ---
        // Simulate a network delay and provide a generic response
        setTimeout(() => {
            const dummyBotResponse = "Thank you for your message! Our team will get back to you shortly. For immediate assistance, please use our contact form.";
            setChatHistory((prev) => [...prev, { role: 'bot', text: dummyBotResponse }]);
            setIsLoading(false); // Hide loading indicator
        }, 1500); // Simulate a 1.5 second delay
        // --- END DUMMY CHATBOT RESPONSE ---
    };

    // If the modal is not open, return null to not render anything
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl p-8 w-full max-w-md relative border border-white/50 animate-scale-in flex flex-col h-[80vh] max-h-[600px]">
                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors" aria-label="Close chatbot">
                    <IconX className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 text-center">Sri Balaji Renewables Bot</h2>
                
                {/* Chat history display area */}
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto custom-scrollbar p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                    {/* Initial welcome message if chat is empty */}
                    {chatHistory.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                            <IconRobot className="h-12 w-12 mx-auto text-brand-blue mb-2" />
                            <p>Hi there! How can I help you today?</p>
                        </div>
                    )}
                    {/* Map through chat history to display messages */}
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <span className={`inline-block p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {msg.text}
                            </span>
                        </div>
                    ))}
                    {/* Loading indicator when waiting for bot response */}
                    {isLoading && (
                        <div className="text-left mb-3">
                            <span className="inline-block p-3 rounded-lg bg-gray-200 text-gray-800">
                                Thinking...
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Message input form */}
                <form onSubmit={handleSendMessage} className="flex">
                    <input
                        type="text"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        placeholder="Ask me a question..."
                        className="flex-grow p-3 rounded-l-md border border-gray-300 focus:ring-2 focus:ring-brand-blue outline-none"
                        disabled={isLoading} // Disable input while loading
                    />
                    <button
                        type="submit"
                        className="bg-brand-blue text-white p-3 rounded-r-md hover:bg-brand-dark-blue transition-colors flex items-center justify-center"
                        disabled={isLoading} // Disable button while loading
                    >
                        <IconSend className="h-6 w-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotModal;
