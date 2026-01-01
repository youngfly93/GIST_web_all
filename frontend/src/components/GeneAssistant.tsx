import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, Dna } from 'lucide-react';

interface SuggestedGene {
  symbol: string;
  reason?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedGene?: string; // Backward compatibility for single suggestion
  suggestedGenes?: SuggestedGene[]; // Multiple suggestions
}

interface GeneAssistantProps {
  onGeneSelect: (gene: string) => void; // Callback function to fill gene into main input box
  height?: string;
}

const GeneAssistant: React.FC<GeneAssistantProps> = ({ 
  onGeneSelect,
  height = "250px"
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Use container's scrollTop instead of scrollIntoView to avoid affecting the entire page
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Delayed scrolling to ensure DOM update is complete
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Extract multiple gene suggestions from model output (prefers JSON, falls back to regex)
  const extractGenesFromText = (text: string): SuggestedGene[] => {
    // Try fenced JSON first
    const fenced = text.match(/```json[\s\S]*?```/i);
    const jsonCandidate = fenced ? fenced[0].replace(/```json|```/gi, '').trim() : text;
    const tryParse = (s: string): SuggestedGene[] | null => {
      try {
        const obj = JSON.parse(s);
        const items = (obj.genes || obj.items || obj.suggestions) as any[];
        if (Array.isArray(items)) {
          return items
            .map((it) => ({ symbol: String(it.symbol || it.gene || it.name || '').toUpperCase(), reason: it.reason || it.rationale || it.note }))
            .filter((g) => /^[A-Z][A-Z0-9]{1,9}$/.test(g.symbol));
        }
      } catch (_) { /* ignore */ }
      return null;
    };

    let parsed = tryParse(jsonCandidate);
    if (parsed && parsed.length > 0) return parsed;

    // Fallback: parse markdown list like "1. KIT - reason"
    const lines = text.split(/\n+/);
    const results: SuggestedGene[] = [];
    for (const line of lines) {
      const m = line.match(/^[\-*\d\.\s]*([A-Z][A-Z0-9]{1,9})\b[\s:\-–]*([^\n]*)/);
      if (m) {
        const symbol = m[1].toUpperCase();
        const reason = (m[2] || '').trim();
        if (/^[A-Z][A-Z0-9]{1,9}$/.test(symbol)) {
          results.push({ symbol, reason });
        }
      }
    }
    // De-duplicate while preserving order
    const seen = new Set<string>();
    const dedup = results.filter((g) => (seen.has(g.symbol) ? false : (seen.add(g.symbol), true)));
    return dedup.slice(0, 10);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);

    try {
      // Prompt: return a ranked list of relevant genes in JSON only
      const genePrompt = `You are a GIST gene screening assistant. The user says: "${currentInput}".

Please recommend up to 10 GIST-related genes most relevant to the user's intent.

Output strictly in JSON only (no extra text). Use this schema:
{
  "genes": [
    { "symbol": "KIT", "reason": "brief rationale in 5-20 words" }
  ]
}

Rules:
- Symbols must be valid gene symbols in uppercase (e.g., KIT, PDGFRA, TP53, CDKN2A, RB1, NF1, BRAF, PIK3CA, APC, CTNNB1)
- Sort by relevance (most relevant first)
- Keep reasons concise
- Do not include any text outside the JSON object.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: genePrompt,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const reply: string = data.reply || '';

      // Try to parse structured genes
      const genes = extractGenesFromText(reply);

      // Build a friendly markdown list for display
      const display = genes.length > 0
        ? genes.map((g, i) => `${i + 1}. **${g.symbol}** - ${g.reason || ''}`.trim()).join('\n')
        : reply;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: display,
          suggestedGenes: genes
        }
      ]);
    } catch (error: any) {
      console.error('Gene Assistant error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, the gene recommendation service is temporarily unavailable. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseGene = (gene: string) => {
    onGeneSelect(gene);
    // Add a success notification
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `✅ Gene **${gene}** has been filled into the search box. You can click the query button to search.`
    }]);
  };

  return (
    <div className="gene-assistant" style={{ height }}>
      <div className="gene-assistant-header">
        <Bot size={16} />
        <span>Gene Screening Assistant</span>
      </div>

      <div className="gene-assistant-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="gene-assistant-welcome">
            <Dna size={24} color="#3B82F6" />
            <p>Describe your research needs</p>
            <p>I'll recommend relevant genes</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`gene-message ${message.role}`}>
              <div className="gene-message-content">
                {message.role === 'assistant' ? (
                  <>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    {message.suggestedGenes && message.suggestedGenes.length > 0 && (
                      <div className="gene-suggestions">
                        {message.suggestedGenes.map((g, idx) => (
                          <button
                            key={`${g.symbol}-${idx}`}
                            className="use-gene-button"
                            onClick={() => handleUseGene(g.symbol)}
                          >
                            Use {g.symbol}
                          </button>
                        ))}
                      </div>
                    )}
                    {message.suggestedGene && !message.suggestedGenes && (
                      <button
                        className="use-gene-button"
                        onClick={() => handleUseGene(message.suggestedGene!)}
                      >
                        Use {message.suggestedGene}
                      </button>
                    )}
                  </>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="gene-loading">🧬 Analyzing genes...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="gene-assistant-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe your research needs, e.g., GIST drug resistance related genes"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="gene-send-button"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default GeneAssistant;
