'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Minimize2, Maximize2, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupportAvailabilityIndicator } from './SupportAvailabilityIndicator';

interface LiveChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  userContext?: {
    isGuest?: boolean;
    currentAction?: string;
    loftId?: string;
    bookingId?: string;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  message: string;
  timestamp: Date;
  agentName?: string;
}

/**
 * Live chat widget with contextual assistance
 */
export function LiveChatWidget({ 
  isOpen, 
  onClose, 
  locale,
  userContext = {}
}: LiveChatWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agentInfo, setAgentInfo] = useState({
    name: 'Sarah',
    avatar: '👩‍💼',
    status: 'online'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Multilingual content
  const content = {
    fr: {
      title: 'Chat en direct',
      subtitle: 'Assistance instantanée',
      placeholder: 'Tapez votre message...',
      send: 'Envoyer',
      connecting: 'Connexion...',
      connected: 'Connecté avec',
      typing: 'tape...',
      welcomeMessage: 'Bonjour ! Je suis Sarah, votre assistante. Comment puis-je vous aider aujourd\'hui ?',
      contextualGreeting: {
        browsing: 'Je vois que vous explorez nos lofts. Puis-je vous aider à trouver quelque chose de spécifique ?',
        booking: 'Je peux vous aider avec votre réservation. Avez-vous des questions ?',
        searching: 'Vous cherchez quelque chose en particulier ? Je peux vous guider.',
        viewing_loft: 'Vous regardez un loft intéressant ! Voulez-vous plus d\'informations ?',
        checkout: 'Je vois que vous finalisez votre réservation. Tout se passe bien ?'
      },
      quickReplies: [
        'Disponibilités',
        'Prix et tarifs',
        'Réservation',
        'Annulation',
        'Services inclus'
      ]
    },
    en: {
      title: 'Live Chat',
      subtitle: 'Instant assistance',
      placeholder: 'Type your message...',
      send: 'Send',
      connecting: 'Connecting...',
      connected: 'Connected with',
      typing: 'is typing...',
      welcomeMessage: 'Hello! I\'m Sarah, your assistant. How can I help you today?',
      contextualGreeting: {
        browsing: 'I see you\'re exploring our lofts. Can I help you find something specific?',
        booking: 'I can help you with your booking. Do you have any questions?',
        searching: 'Looking for something specific? I can guide you.',
        viewing_loft: 'You\'re looking at an interesting loft! Would you like more information?',
        checkout: 'I see you\'re finalizing your booking. Is everything going well?'
      },
      quickReplies: [
        'Availability',
        'Prices & rates',
        'Booking',
        'Cancellation',
        'Included services'
      ]
    },
    ar: {
      title: 'دردشة مباشرة',
      subtitle: 'مساعدة فورية',
      placeholder: 'اكتب رسالتك...',
      send: 'إرسال',
      connecting: 'جاري الاتصال...',
      connected: 'متصل مع',
      typing: 'يكتب...',
      welcomeMessage: 'مرحباً! أنا سارة، مساعدتك. كيف يمكنني مساعدتك اليوم؟',
      contextualGreeting: {
        browsing: 'أرى أنك تتصفح شققنا. هل يمكنني مساعدتك في العثور على شيء محدد؟',
        booking: 'يمكنني مساعدتك في حجزك. هل لديك أي أسئلة؟',
        searching: 'تبحث عن شيء محدد؟ يمكنني إرشادك.',
        viewing_loft: 'تنظر إلى شقة مثيرة للاهتمام! هل تريد المزيد من المعلومات؟',
        checkout: 'أرى أنك تنهي حجزك. هل كل شيء يسير بشكل جيد؟'
      },
      quickReplies: [
        'التوفر',
        'الأسعار والتعرفة',
        'الحجز',
        'الإلغاء',
        'الخدمات المشمولة'
      ]
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Simulate connection
      setTimeout(() => {
        setIsConnected(true);
        
        // Add welcome message
        const welcomeMsg: ChatMessage = {
          id: '1',
          type: 'agent',
          message: text.welcomeMessage,
          timestamp: new Date(),
          agentName: agentInfo.name
        };
        
        setMessages([welcomeMsg]);
        
        // Add contextual greeting if user has context
        if (userContext.currentAction) {
          setTimeout(() => {
            const contextualMsg: ChatMessage = {
              id: '2',
              type: 'agent',
              message: text.contextualGreeting[userContext.currentAction as keyof typeof text.contextualGreeting] || '',
              timestamp: new Date(),
              agentName: agentInfo.name
            };
            
            if (contextualMsg.message) {
              setMessages(prev => [...prev, contextualMsg]);
            }
          }, 1500);
        }
      }, 1000);
    }
  }, [isOpen, messages.length, text, userContext, agentInfo.name]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setNewMessage('');
    
    // Simulate agent typing
    setIsTyping(true);
    
    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        message: getAgentResponse(newMessage),
        timestamp: new Date(),
        agentName: agentInfo.name
      };
      
      setMessages(prev => [...prev, agentMsg]);
    }, 1500 + Math.random() * 1000);
  };

  const getAgentResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('prix') || lowerMsg.includes('price') || lowerMsg.includes('tarif')) {
      return locale === 'fr' 
        ? 'Nos tarifs varient selon la saison et le loft. Puis-je vous aider à trouver un loft spécifique pour voir les prix exacts ?'
        : 'Our rates vary by season and loft. Can I help you find a specific loft to see exact prices?';
    }
    
    if (lowerMsg.includes('disponib') || lowerMsg.includes('availab')) {
      return locale === 'fr'
        ? 'Je peux vérifier les disponibilités pour vous. Quelles sont vos dates de séjour préférées ?'
        : 'I can check availability for you. What are your preferred stay dates?';
    }
    
    if (lowerMsg.includes('réserv') || lowerMsg.includes('book')) {
      return locale === 'fr'
        ? 'Parfait ! Je peux vous guider dans le processus de réservation. Avez-vous déjà choisi un loft ?'
        : 'Perfect! I can guide you through the booking process. Have you already chosen a loft?';
    }
    
    return locale === 'fr'
      ? 'Je comprends votre question. Laissez-moi vous aider avec cela. Pouvez-vous me donner plus de détails ?'
      : 'I understand your question. Let me help you with that. Can you give me more details?';
  };

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
    handleSendMessage();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className={`w-80 ${isMinimized ? 'h-16' : 'h-96'} shadow-2xl transition-all duration-300`}>
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-2xl">{agentInfo.avatar}</div>
                <div>
                  <CardTitle className="text-sm">{text.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <SupportAvailabilityIndicator isAvailable={isConnected} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {isConnected ? `${text.connected} ${agentInfo.name}` : text.connecting}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-80">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
                        : 'bg-gray-100 dark:bg-gray-700 rounded-r-lg rounded-tl-lg'
                    } p-3 text-sm`}>
                      {message.type === 'agent' && (
                        <div className="flex items-center space-x-1 mb-1">
                          <User className="w-3 h-3" />
                          <span className="text-xs font-medium">{message.agentName}</span>
                        </div>
                      )}
                      <p>{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-r-lg rounded-tl-lg p-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span className="text-xs font-medium">{agentInfo.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{text.typing}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-1">
                    {text.quickReplies.slice(0, 3).map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleQuickReply(reply)}
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={text.placeholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}