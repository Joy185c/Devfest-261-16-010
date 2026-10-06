import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, ChevronRight } from 'lucide-react';
import { chatWithCopilot } from '../services/aiService';
import { buildAIContext } from '../utils/buildAIContext';
import './AICopilot.css';

export default function AICopilot({ 
  aiConfig, 
  tenderData, 
  uploadedFiles, 
  matchMap, 
  expiryMap, 
  duplicateFileIds, 
  workflowStates, 
  navigate,
  onOpenAiSetup,
  lang,
  t
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsgs, setErrorMsgs] = useState([]);
  
  const messagesEndRef = useRef(null);

  const contextData = buildAIContext(tenderData, uploadedFiles, matchMap, expiryMap, duplicateFileIds, workflowStates);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Contextual initial message
  useEffect(() => {
    if (isOpen && messages.length === 0 && contextData) {
      let initialMsg = "Hi! I'm your AI Tender Copilot. ";
      
      if (contextData.summary.uploadedDocuments === 0) {
        initialMsg += "Start by uploading your tender PDFs. I can guide you through each step.";
      } else if (contextData.summary.readyToGenerate) {
        initialMsg += "Your package looks ready to generate. I can summarize the package or explain what happens next.";
      } else if (contextData.summary.missingMandatory > 0 || contextData.summary.expiryNeeded > 0 || contextData.summary.expired > 0) {
        initialMsg += `Your package currently has ${contextData.summary.missingMandatory + contextData.summary.expiryNeeded + contextData.summary.expired} blocking issues. I can explain them or help you find what needs to be fixed.`;
      } else {
        initialMsg += "How can I assist you with your tender package today?";
      }

      setMessages([{ role: 'ai', content: initialMsg, actions: [] }]);
    }
  }, [isOpen, contextData, messages.length]);

  const handleSend = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim() || isTyping) return;

    setInput('');
    const newMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);
    setErrorMsgs([]);

    try {
      if (!aiConfig) {
        throw new Error('AI not configured');
      }

      const res = await chatWithCopilot({
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        contextData,
        message: text,
        history: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
        lang
      });

      setMessages(prev => [...prev, { role: 'ai', content: res.message, actions: res.actions }]);
    } catch (err) {
      console.error(err);
      setErrorMsgs(["AI couldn't respond right now. Your data is safe. Please try again."]);
      // Remove the user message so they can try again, or keep it. Let's just keep it and show error.
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.type === 'NAVIGATE') {
      if (['setup', 'upload', 'analyze', 'review', 'generate'].includes(action.target)) {
        navigate(action.target);
      }
    }
  };

  // Generate Quick Actions based on context
  const getQuickActions = () => {
    const actions = [];
    if (!contextData) return [];

    if (contextData.summary.missingMandatory > 0) {
      actions.push("What's missing?");
    }
    if (contextData.summary.expiryNeeded > 0) {
      actions.push("Which documents need expiry dates?");
    }
    if (contextData.summary.duplicates > 0) {
      actions.push("Explain duplicates");
    }
    if (!contextData.summary.readyToGenerate && contextData.summary.uploadedDocuments > 0) {
      actions.push("Why can't I generate?");
    }
    if (contextData.summary.readyToGenerate) {
      actions.push("Is my package ready?");
      actions.push("Summarize package");
    }
    if (contextData.summary.uploadedDocuments === 0) {
      actions.push("How do I start?");
    }

    actions.push("What should I do next?");
    
    // De-duplicate and limit
    return [...new Set(actions)].slice(0, 4);
  };

  const renderMarkdown = (text) => {
    // A very simple markdown bold and bullet list renderer for safety
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

    // Simple bullet points (not perfect, but works for the prompt limits)
    html = html.replace(/• (.*?)<br\/>/g, '<li>$1</li>');
    html = html.replace(/- (.*?)<br\/>/g, '<li>$1</li>');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="ai-copilot-wrapper">
      {isOpen && (
        <div className="ai-copilot-panel">
          <div className="ai-copilot-header">
            <div className="ai-header-info">
              <h3><Sparkles size={16} className="ai-icon" /> AI Tender Copilot</h3>
              <p>Your tender package assistant</p>
              <div className={`ai-status ${aiConfig ? 'enabled' : 'disabled'}`}>
                <span className="dot"></span>
                {aiConfig ? 'AI Enabled' : 'AI Disabled'}
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="ai-messages-area">
            {!aiConfig ? (
              <div className="ai-disabled-state">
                <Sparkles size={32} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                <h4>AI Assistant is optional</h4>
                <p>Enable AI using your own API key to get document insights and workflow assistance.</p>
                <button className="btn-primary mt-4" onClick={onOpenAiSetup}>Enable AI</button>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.role}`}>
                    {renderMarkdown(m.content)}
                    
                    {m.actions && m.actions.length > 0 && (
                      <div className="chat-actions">
                        {m.actions.map((act, j) => (
                          <button key={j} className="chat-action-btn" onClick={() => handleActionClick(act)}>
                            {act.type === 'NAVIGATE' ? `Go to ${act.target}` : act.type} <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="chat-bubble ai typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                )}
                
                {errorMsgs.map((err, i) => (
                  <div key={i} className="chat-bubble chat-error">{err}</div>
                ))}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {aiConfig && !isTyping && (
            <div className="quick-actions-bar">
              {getQuickActions().map((action, i) => (
                <button key={i} className="quick-action-pill" onClick={() => handleSend(action)}>
                  {action}
                </button>
              ))}
            </div>
          )}

          {aiConfig && (
            <div className="chat-input-area">
              <input 
                type="text" 
                placeholder="Ask about your tender..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={isTyping}
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <button className="ai-copilot-button" onClick={() => setIsOpen(true)}>
          <Sparkles size={20} />
          <span>Ask AI Copilot</span>
        </button>
      )}
    </div>
  );
}
