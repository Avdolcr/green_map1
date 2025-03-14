import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaTimes, FaTree, FaLeaf, FaSeedling } from 'react-icons/fa';
import { MdChatBubble, MdOutlineWavingHand } from 'react-icons/md';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isChatButtonHovered, setIsChatButtonHovered] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Suggested questions for users
  const suggestedQuestions = [
    "What are the benefits of trees?",
    "How many trees are in Seattle?",
    "Where do mango trees grow?",
    "Tell me about oak trees"
  ];

  // Welcome message when chat is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = 'Hi there! 👋 Welcome to Green Map! I\'m your tree assistant. You can ask me about different types of trees, where specific trees grow, or general information about our project.';
      setMessages([
        {
          id: 'welcome',
          text: welcomeMessage,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      
      // Start typing animation for welcome message
      setCurrentTypingText('');
      setIsTyping(true);
      simulateTyping(welcomeMessage);
    }
  }, [isOpen, messages.length]);

  // Function to simulate typing animation
  const simulateTyping = (text: string) => {
    // Reset typing state
    setCurrentTypingIndex(0);
    setCurrentTypingText('');
    setTypingComplete(false);
    
    let charIndex = 0;
    const typeCharacter = () => {
      if (charIndex < text.length) {
        setCurrentTypingText(prev => prev + text.charAt(charIndex));
        charIndex++;
        
        // Random typing speed between 10-30ms for realistic effect
        const randomDelay = Math.floor(Math.random() * 20) + 10;
        setTimeout(typeCharacter, randomDelay);
      } else {
        setIsTyping(false);
        setTypingComplete(true);
      }
    };
    
    // Start typing
    typeCharacter();
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTypingText]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessageObj = {
      id: Date.now().toString(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    setMessage('');
    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      // Send message to API
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Bot is now typing the response
      setIsTyping(true);
      
      // Add bot response to messages first but make it invisible
      const botMessageObj = {
        id: Date.now().toString(),
        text: data.response,
        sender: 'bot' as const,
        timestamp: new Date()
      };
      
      // Start typing animation for bot response
      simulateTyping(data.response);
      
      // Add the message to display after a short delay
      // This ensures the typing animation doesn't conflict with the message
      setTimeout(() => {
        setMessages(prev => [...prev, botMessageObj]);
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get a response. Please try again.');
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "I'm having trouble connecting right now. Please try again later.",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
    setShowSuggestions(false);
  };

  // Parse markdown-like formatting in messages
  const formatMessage = (text: string) => {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/🌳/g, '<span style="color: #2F5D50;">🌳</span>')
      .replace(/📍/g, '<span style="color: #E53E3E;">📍</span>')
      .replace(/🌿/g, '<span style="color: #48BB78;">🌿</span>')
      .replace(/🌱/g, '<span style="color: #38A169;">🌱</span>');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      pointerEvents: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
    }}>
      {/* Chat button with enhanced pulse animation */}
      <button
        onClick={toggleChat}
        onMouseEnter={() => setIsChatButtonHovered(true)}
        onMouseLeave={() => setIsChatButtonHovered(false)}
        style={{
          position: 'relative',
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #2F5D50, #3a7566)',
          color: 'white',
          border: 'none',
          boxShadow: '0 6px 20px rgba(47, 93, 80, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isChatButtonHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
          pointerEvents: 'auto'
        }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <FaTimes size={24} /> : <MdChatBubble size={28} />}
        
        {/* Enhanced pulse effect when chat is closed */}
        {!isOpen && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            border: '3px solid rgba(47, 93, 80, 0.4)',
            animation: 'pulse 2s infinite',
          }}></div>
        )}
      </button>
      
      {/* Chat window with enhanced design and animations */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '0',
            width: '380px',
            height: '550px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease-out forwards',
            opacity: 0,
            transform: 'translateY(20px)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Chat header with gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #2F5D50, #3a7566)',
            color: 'white',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '18px',
              letterSpacing: '0.4px'
            }}>
              <FaTree style={{ marginRight: '10px' }} /> Green Map Assistant
            </h3>
            <button 
              onClick={toggleChat}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>
          
          {/* Chat messages with enhanced design */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#f9fafb',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%232F5D50" fill-opacity="0.03" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Ccircle cx="13" cy="13" r="3"/%3E%3C/g%3E%3C/svg%3E")',
            scrollBehavior: 'smooth',
          }}>
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '20px',
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                  animation: `${msg.sender === 'user' ? 'slideInRight' : 'slideInLeft'} 0.3s ease forwards`,
                  opacity: 0,
                  transform: msg.sender === 'user' ? 'translateX(20px)' : 'translateX(-20px)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '14px 18px',
                    borderRadius: '18px',
                    maxWidth: '85%',
                    wordBreak: 'break-word',
                    backgroundColor: msg.sender === 'user' ? '#2F5D50' : 'white',
                    color: msg.sender === 'user' ? 'white' : '#1e293b',
                    borderBottomRightRadius: msg.sender === 'user' ? '5px' : '18px',
                    borderBottomLeftRadius: msg.sender === 'user' ? '18px' : '5px',
                    boxShadow: msg.sender === 'user' 
                      ? '0 3px 10px rgba(47, 93, 80, 0.2)' 
                      : '0 3px 10px rgba(0, 0, 0, 0.05)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(226, 232, 240, 0.7)',
                    fontSize: '15px',
                    lineHeight: '1.5',
                  }}
                >
                  {/* Avatar for bot messages */}
                  {msg.sender === 'bot' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2F5D50, #3a7566)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '8px'
                      }}>
                        <FaTree color="white" size={14} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#2F5D50', fontSize: '14px' }}>Green Map Bot</span>
                    </div>
                  )}
                  <div 
                    style={{
                      color: msg.sender === 'user' ? 'white' : '#1e293b',
                    }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} 
                  />
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  marginTop: '5px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '5px'
                }}>
                  {msg.sender === 'bot' && <FaSeedling size={10} color="#2F5D50" />}
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {/* Enhanced typing indicator */}
            {isTyping && (
              <div 
                style={{ 
                  textAlign: 'left', 
                  marginBottom: '20px',
                  animation: 'fadeIn 0.3s ease forwards',
                  opacity: 0
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '14px 18px',
                  borderRadius: '18px',
                  backgroundColor: 'white',
                  color: '#1e293b',
                  borderBottomLeftRadius: '5px',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)',
                  maxWidth: '85%',
                  border: '1px solid rgba(226, 232, 240, 0.7)',
                  fontSize: '15px',
                  lineHeight: '1.5',
                }}>
                  {/* Avatar for bot typing */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2F5D50, #3a7566)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '8px'
                    }}>
                      <FaTree color="white" size={14} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#2F5D50', fontSize: '14px' }}>Green Map Bot</span>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(currentTypingText) }} />
                  {!typingComplete && (
                    <div style={{ display: 'inline-flex', marginLeft: '4px' }}>
                      <div style={{ 
                        width: '7px', 
                        height: '7px', 
                        backgroundColor: '#2F5D50', 
                        borderRadius: '50%',
                        margin: '0 2px',
                        opacity: 0.7,
                        animation: 'blink 1s infinite'
                      }}></div>
                      <div style={{ 
                        width: '7px', 
                        height: '7px', 
                        backgroundColor: '#2F5D50', 
                        borderRadius: '50%',
                        margin: '0 2px',
                        opacity: 0.7,
                        animation: 'blink 1s infinite',
                        animationDelay: '0.2s'
                      }}></div>
                      <div style={{ 
                        width: '7px', 
                        height: '7px', 
                        backgroundColor: '#2F5D50', 
                        borderRadius: '50%',
                        margin: '0 2px',
                        opacity: 0.7,
                        animation: 'blink 1s infinite',
                        animationDelay: '0.4s'
                      }}></div>
                    </div>
                  )}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  marginTop: '5px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <FaSeedling size={10} color="#2F5D50" />
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSuggestions && messages.length === 1 && !isTyping && (
              <div 
                style={{
                  marginTop: '20px',
                  animation: 'fadeIn 0.5s ease forwards',
                  animationDelay: '0.5s',
                  opacity: 0
                }}
              >
                <p style={{ 
                  fontSize: '14px', 
                  color: '#64748b', 
                  margin: '0 0 10px 0',
                  fontWeight: 500
                }}>
                  <MdOutlineWavingHand style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  You can try asking:
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      style={{
                        background: 'white',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: '12px',
                        padding: '10px 15px',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: '#2F5D50',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: 500,
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        animation: 'fadeIn 0.3s ease forwards',
                        animationDelay: `${0.7 + (index * 0.1)}s`,
                        opacity: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(47, 93, 80, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(47, 93, 80, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                      }}
                    >
                      <FaLeaf size={12} style={{ marginRight: '8px', opacity: 0.7 }} />
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Enhanced chat input */}
          <form 
            onSubmit={handleSendMessage} 
            style={{
              padding: '14px 16px',
              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
              display: 'flex',
              backgroundColor: 'white',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about trees or the Green Map project..."
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '30px 0 0 30px',
                border: '1px solid #cbd5e1',
                borderRight: 'none',
                outline: 'none',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2F5D50';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(47, 93, 80, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #2F5D50, #3a7566)',
                color: 'white',
                padding: '14px 20px',
                borderRadius: '0 30px 30px 0',
                border: '1px solid #2F5D50',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 5px rgba(47, 93, 80, 0.2)'
              }}
              disabled={isLoading}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #1F4D40, #2F5D50)';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(47, 93, 80, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2F5D50, #3a7566)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(47, 93, 80, 0.2)';
                }
              }}
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
          
          {/* Subtle branding footer */}
          <div style={{
            padding: '8px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#94a3b8',
            borderTop: '1px solid rgba(226, 232, 240, 0.4)',
            backgroundColor: 'rgba(249, 250, 251, 0.7)'
          }}>
            Powered by <span style={{ color: '#2F5D50', fontWeight: 600 }}>Green Map AI</span>
          </div>
        </div>
      )}

      {/* Enhanced animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          70% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.8;
            transform: scale(1);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
