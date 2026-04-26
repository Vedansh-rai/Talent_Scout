import React, { useState, useEffect, useRef } from 'react';

const MOCK_CANDIDATES = [
  {
    id: 1,
    name: "Arjun Mehta",
    role: "Senior SDE",
    company: "Zomato",
    location: "Gurugram, India",
    matchScore: 94,
    interestScore: 90,
    skills: ["Python", "FastAPI", "PostgreSQL", "AWS", "Docker"],
    whyMatched: ["5+ years Python experience", "Expertise in FastAPI", "Strong PostgreSQL schema design"],
    conversation: [
      { role: "agent", text: "Hi Arjun, impressed by your work at Zomato. We have a Senior Backend role needing strong FastAPI skills. Open to a quick chat?" },
      { role: "candidate", text: "Hi! Thanks for reaching out. Yes, I'm currently exploring new opportunities. What's the domain?" },
      { role: "agent", text: "It's a high-growth US-based Fintech platform processing millions of txns. Remote-friendly. Salary range $150k-$190k." },
      { role: "candidate", text: "Sounds very interesting. The compensation aligns with my expectations. I have a 30-day notice period." }
    ]
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Microsoft",
    location: "Seattle, WA",
    matchScore: 87,
    interestScore: 82,
    skills: ["C#", "Python", "SQL", "Azure", "Kubernetes"],
    whyMatched: ["Experience building high-throughput APIs", "Container orchestration expert"],
    conversation: [
      { role: "agent", text: "Hi Sarah, your backend systems experience at Microsoft caught my eye. Open to a Senior Backend role in Fintech?" },
      { role: "candidate", text: "Hey! I'm relatively happy at MSFT, but open to hearing more if it's fully remote." },
      { role: "agent", text: "It is 100% remote. Stack is Python/FastAPI/Postgres. We need someone to scale our transaction processing." },
      { role: "candidate", text: "I've been working mostly in C# lately, but I have 4 years of Python. I'd be open to an introductory call." }
    ]
  },
  {
    id: 3,
    name: "Rahul Sharma",
    role: "Backend Developer",
    company: "Razorpay",
    location: "Bengaluru, India",
    matchScore: 91,
    interestScore: 71,
    skills: ["Go", "Python", "Redis", "Kafka", "PostgreSQL"],
    whyMatched: ["Fintech domain experience", "Message queue (Kafka) expertise", "Strong SQL"],
    conversation: [
      { role: "agent", text: "Hi Rahul, given your background at Razorpay, you'd be a great fit for a Senior Backend role we're scouting for." },
      { role: "candidate", text: "Thanks. I'm actually not actively looking right now unless the offer is exceptional." },
      { role: "agent", text: "Understood. The role is with a US Fintech, $150k-$190k range, remote. Any interest in just learning more?" },
      { role: "candidate", text: "That is a strong range. I could be persuaded to have a quick chat next week." }
    ]
  },
  {
    id: 4,
    name: "David Kim",
    role: "Product Manager",
    company: "Google",
    location: "San Francisco, CA",
    matchScore: 55,
    interestScore: 38,
    skills: ["Product Strategy", "SQL", "A/B Testing", "Agile"],
    whyMatched: ["Strong analytical skills", "Tech-adjacent role"],
    conversation: [
      { role: "agent", text: "Hi David, reaching out about a Senior Backend role. Your technical background looks interesting." },
      { role: "candidate", text: "I think you have the wrong profile. I'm a Product Manager, not a backend engineer." },
      { role: "agent", text: "My apologies! I saw your early career engineering experience and reached out. Are you open to technical PM roles?" },
      { role: "candidate", text: "No, I'm happy where I am right now. Thanks." }
    ]
  },
  {
    id: 5,
    name: "Elena Rodriguez",
    role: "Data Scientist",
    company: "Uber",
    location: "New York, NY",
    matchScore: 63,
    interestScore: 45,
    skills: ["Python", "Machine Learning", "SQL", "Spark"],
    whyMatched: ["Strong Python skills", "Data pipeline experience"],
    conversation: [
      { role: "agent", text: "Hi Elena, your Python expertise is exactly what we need for a Senior Backend Engineering role." },
      { role: "candidate", text: "Hi, I'm focused on ML/Data Science right now, not general backend engineering." },
      { role: "agent", text: "I completely understand. The role does involve heavy data processing if that's of any interest." },
      { role: "candidate", text: "Not really what I'm looking for. Best of luck with the search." }
    ]
  },
  {
    id: 6,
    name: "Michael Chang",
    role: "Lead Software Engineer",
    company: "Flipkart",
    location: "Bengaluru, India",
    matchScore: 88,
    interestScore: 88,
    skills: ["Java", "Python", "Spring Boot", "MySQL", "AWS"],
    whyMatched: ["8 years of total experience", "E-commerce scale backend systems"],
    conversation: [
      { role: "agent", text: "Hi Michael, your scale experience at Flipkart is impressive. Open to a Senior role with a US Fintech?" },
      { role: "candidate", text: "Thanks for reaching out. Yes, I'm looking to transition to a global remote role." },
      { role: "agent", text: "Great! Stack is Python/FastAPI. The salary is $150k-$190k. Notice period constraints?" },
      { role: "candidate", text: "I have a 60-day notice period, but I'm very interested. Let's schedule a call." }
    ]
  },
  {
    id: 7,
    name: "Priya Patel",
    role: "Backend Engineer",
    company: "Stripe",
    location: "Remote",
    matchScore: 79,
    interestScore: 60,
    skills: ["Ruby", "Python", "PostgreSQL", "Redis"],
    whyMatched: ["Payments/Fintech background", "Remote work experience"],
    conversation: [
      { role: "agent", text: "Hi Priya, given your Stripe experience, you'd be a perfect fit for a US Fintech we're representing." },
      { role: "candidate", text: "Hi, I just started at Stripe 6 months ago, so I'm not actively looking." },
      { role: "agent", text: "Ah, I see. Would you be open to connecting for future opportunities?" },
      { role: "candidate", text: "Sure, let's connect. Keep me in mind for late next year." }
    ]
  },
  {
    id: 8,
    name: "James Wilson",
    role: "Senior SDE",
    company: "Netflix",
    location: "Los Gatos, CA",
    matchScore: 74,
    interestScore: 77,
    skills: ["Java", "Python", "Cassandra", "AWS", "Microservices"],
    whyMatched: ["High-throughput distributed systems", "AWS expert"],
    conversation: [
      { role: "agent", text: "Hi James, we're looking for someone to build high-throughput APIs for a Fintech startup. Interested?" },
      { role: "candidate", text: "Maybe. What's the compensation and equity structure?" },
      { role: "agent", text: "Base is $150k-$190k + early stage equity. Fully remote." },
      { role: "candidate", text: "Base is a bit low for me, but the equity could make it interesting. Send me the JD." }
    ]
  }
];

// Reusable Circular Progress Ring
const ProgressRing = ({ radius, stroke, progress, color }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg height={radius * 2} width={radius * 2} className="absolute transform -rotate-90">
        <circle
          stroke="#1F1F22"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-sm font-medium absolute text-white">{progress}</span>
    </div>
  );
};

export default function TalentScoutAgent() {
  const [step, setStep] = useState(1);
  const [jdText, setJdText] = useState("");
  const [agentStatus, setAgentStatus] = useState("Idle");
  
  const [shortlist, setShortlist] = useState([]);
  const [engagingCandidate, setEngagingCandidate] = useState(null);
  
  // Chat Simulation State
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [liveInterestScore, setLiveInterestScore] = useState(0);
  const chatEndRef = useRef(null);

  // --- Step 1: Deploy Agent ---
  const handleDeployAgent = () => {
    if (!jdText) return;
    setAgentStatus("Scanning 10,000+ profiles...");
    
    setTimeout(() => {
      setAgentStatus("Parsing JD...");
      setTimeout(() => {
        setAgentStatus("Shortlisting top candidates...");
        setTimeout(() => {
          setAgentStatus("Complete");
          setStep(2);
        }, 1200);
      }, 1200);
    }, 1500);
  };

  // --- Step 3: Outreach Simulation ---
  const handleEngage = (candidate) => {
    setEngagingCandidate(candidate);
    setStep(3);
    setChatMessages([]);
    setLiveInterestScore(0);
    simulateConversation(candidate);
  };

  const simulateConversation = (candidate) => {
    let msgIndex = 0;
    
    const nextMessage = () => {
      if (msgIndex >= candidate.conversation.length) return;
      
      const msg = candidate.conversation[msgIndex];
      
      if (msg.role === 'agent') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setChatMessages(prev => [...prev, msg]);
          msgIndex++;
          setTimeout(nextMessage, 1500);
        }, 1500);
      } else {
        // Candidate response
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setChatMessages(prev => [...prev, msg]);
          // Boost score dynamically based on candidate reply
          setLiveInterestScore(prev => Math.min(candidate.interestScore, prev + (candidate.interestScore / 2)));
          msgIndex++;
          setTimeout(nextMessage, 1500);
        }, 2000);
      }
    };
    
    setTimeout(nextMessage, 500);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleMarkComplete = () => {
    if (!shortlist.find(c => c.id === engagingCandidate.id)) {
      setShortlist([...shortlist, engagingCandidate]);
    }
    setStep(4);
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return '#00D4FF'; // Cyan
    if (score >= 60) return '#F5A623'; // Amber
    return '#E53E3E'; // Red
  };

  const jdTags = ["Senior Backend Engineer", "Python", "FastAPI", "PostgreSQL", "$150k-$190k"];

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#E2E8F0] font-sans overflow-x-hidden selection:bg-[#F5A623] selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap');
        
        .font-display { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        
        /* Subtly textured background */
        body {
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0F; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #F5A623; }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(245, 166, 35, 0.4); }
          50% { box-shadow: 0 0 25px rgba(245, 166, 35, 0.8); }
        }

        @keyframes typeDots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }

        .typing-indicator::after {
          content: '';
          animation: typeDots 1.5s infinite linear;
        }

        .stagger-1 { animation: fadeIn 0.4s ease-out forwards; animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation: fadeIn 0.4s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation: fadeIn 0.4s ease-out forwards; animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation: fadeIn 0.4s ease-out forwards; animation-delay: 0.4s; opacity: 0; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10 px-8 py-5 flex justify-between items-center bg-[#0D0D0F]/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#F5A623] to-[#00D4FF] flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl tracking-wide text-white">TALENT<span className="text-[#F5A623]">SCOUT</span></h1>
        </div>
        
        {/* Navigation Steps */}
        <div className="flex gap-6 text-sm font-mono text-white/50">
          {[1, 2, 3, 4].map((num, idx) => (
            <div key={num} className={`flex items-center gap-2 transition-colors duration-300 ${step >= num ? 'text-[#00D4FF]' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= num ? 'border-[#00D4FF] bg-[#00D4FF]/10' : 'border-white/20'}`}>
                {num}
              </div>
              <span className="hidden md:block">
                {idx === 0 ? 'JD INPUT' : idx === 1 ? 'DISCOVERY' : idx === 2 ? 'OUTREACH' : 'SHORTLIST'}
              </span>
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        
        {/* PANEL 1: JD INPUT */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto stagger-1">
            <h2 className="font-display text-4xl mb-2 text-white">Brief the Agent</h2>
            <p className="text-white/50 mb-8 font-sans">Input your requirements and let the AI scout the market.</p>
            
            <div className="glass-card rounded-xl p-6 mb-6">
              <textarea
                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white/90 font-mono text-sm focus:outline-none focus:border-[#F5A623] transition-colors resize-none h-64"
                placeholder="Paste Job Description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              ></textarea>
              
              {jdText.length > 50 && (
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2 stagger-2">
                  <span className="text-xs font-mono text-white/40 mr-2 uppercase self-center">Auto-detected tags:</span>
                  {jdTags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 text-xs font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">
                <span className="text-white/40">Agent Status: </span>
                <span className={agentStatus === 'Idle' ? 'text-white/70' : 'text-[#F5A623] animate-pulse'}>{agentStatus}</span>
              </div>
              <button
                onClick={handleDeployAgent}
                disabled={!jdText || agentStatus !== 'Idle'}
                className="bg-[#F5A623] hover:bg-[#d48c1a] text-black font-bold py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(245,166,35,0.3)] hover:shadow-[0_0_25px_rgba(245,166,35,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Deploy Agent
              </button>
            </div>
          </div>
        )}

        {/* PANEL 2: CANDIDATE DISCOVERY */}
        {step === 2 && (
          <div className="stagger-1">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-display text-4xl mb-2 text-white">Talent Radar</h2>
                <p className="text-white/50 font-sans">Scanned 12,450 profiles. Found {MOCK_CANDIDATES.length} strong matches.</p>
              </div>
              <button onClick={() => setStep(4)} className="text-[#00D4FF] hover:text-white font-mono text-sm border border-[#00D4FF]/30 px-4 py-2 rounded hover:bg-[#00D4FF]/10 transition-colors">
                View Shortlist →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_CANDIDATES.map((candidate, idx) => (
                <div key={candidate.id} className={`glass-card rounded-xl p-6 hover:border-white/20 transition-all duration-300 stagger-${(idx % 4) + 1}`}>
                  <div className="flex gap-4 items-start mb-4">
                    <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${candidate.name}&backgroundColor=1f1f22`} alt={candidate.name} className="w-16 h-16 rounded-full border border-white/10 bg-[#1F1F22]" />
                    <div className="flex-1">
                      <h3 className="font-display text-xl text-white">{candidate.name}</h3>
                      <p className="text-[#F5A623] text-sm">{candidate.role} @ {candidate.company}</p>
                      <p className="text-white/40 text-xs mt-1 font-mono">{candidate.location}</p>
                    </div>
                    <div>
                      <ProgressRing radius={24} stroke={4} progress={candidate.matchScore} color={getScoreColor(candidate.matchScore)} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded text-xs font-mono border ${["Python", "FastAPI", "PostgreSQL"].includes(skill) ? 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20' : 'bg-white/5 text-white/50 border-white/10'}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/30 rounded p-3 mb-5 border border-white/5">
                    <p className="text-xs font-mono text-[#00D4FF] mb-1 uppercase tracking-wider">Why Matched</p>
                    <ul className="text-sm text-white/70 space-y-1">
                      {candidate.whyMatched.map((reason, i) => (
                        <li key={i} className="flex gap-2"><span className="text-[#00D4FF]">•</span> {reason}</li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleEngage(candidate)}
                    className="w-full py-2.5 rounded bg-white/5 hover:bg-[#F5A623] text-white hover:text-black border border-white/10 hover:border-[#F5A623] font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Engage Candidate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PANEL 3: OUTREACH SIMULATOR */}
        {step === 3 && engagingCandidate && (
          <div className="stagger-1 h-[80vh] flex flex-col">
            <button onClick={() => setStep(2)} className="text-white/50 hover:text-white font-mono text-sm mb-6 flex items-center gap-2 w-fit">
              ← Back to Radar
            </button>
            
            <div className="flex gap-6 flex-1 min-h-0">
              {/* Profile Side */}
              <div className="w-1/3 glass-card rounded-xl p-6 flex flex-col">
                <div className="text-center mb-6">
                  <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${engagingCandidate.name}&backgroundColor=1f1f22`} alt={engagingCandidate.name} className="w-24 h-24 rounded-full border-2 border-white/10 mx-auto mb-4 bg-[#1F1F22]" />
                  <h2 className="font-display text-2xl text-white">{engagingCandidate.name}</h2>
                  <p className="text-[#F5A623]">{engagingCandidate.role}</p>
                  <p className="text-white/40 text-sm font-mono mt-1">{engagingCandidate.company}</p>
                </div>
                
                <div className="flex-1">
                  <div className="mb-6">
                    <p className="text-xs font-mono text-white/40 uppercase mb-2">Match Score</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-black/50 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00D4FF]" style={{ width: `${engagingCandidate.matchScore}%` }}></div>
                      </div>
                      <span className="font-mono text-[#00D4FF]">{engagingCandidate.matchScore}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-mono text-white/40 uppercase mb-2">Live Interest Score</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-black/50 h-4 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full transition-all duration-1000 ease-out" 
                          style={{ 
                            width: `${liveInterestScore}%`, 
                            backgroundColor: getScoreColor(liveInterestScore) 
                          }}
                        ></div>
                      </div>
                      <span className="font-mono" style={{ color: getScoreColor(liveInterestScore) }}>
                        {Math.round(liveInterestScore)}%
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleMarkComplete}
                  className="w-full mt-auto py-3 rounded bg-[#00D4FF] hover:bg-[#00b0d4] text-black font-bold transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                >
                  Add to Shortlist
                </button>
              </div>

              {/* Chat Side */}
              <div className="flex-1 glass-card rounded-xl flex flex-col overflow-hidden relative">
                <div className="bg-black/40 border-b border-white/10 p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-display text-lg">AI Engagement Simulator</h3>
                    <p className="text-xs font-mono text-white/40">Negotiation & Profiling Protocol</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00D4FF]">
                    <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse"></span>
                    Agent Active
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'} stagger-1`}>
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                        msg.role === 'agent' 
                          ? 'bg-[#1F1F22] border border-white/10 rounded-tr-sm text-white/90' 
                          : 'bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-tl-sm text-white/90'
                      }`}>
                        <p className="text-xs font-mono mb-1 opacity-50 uppercase tracking-wider">{msg.role === 'agent' ? 'AI Agent' : engagingCandidate.name}</p>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start stagger-1">
                      <div className="bg-[#1F1F22] border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4">
                        <span className="text-xs font-mono text-white/40 uppercase">System <span className="typing-indicator text-[#00D4FF]"></span></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: RANKED SHORTLIST */}
        {step === 4 && (
          <div className="stagger-1">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-display text-4xl mb-2 text-white">Recruiter's Goldmine</h2>
                <p className="text-white/50 font-sans">Final ranked shortlist of engaged candidates.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="text-white/50 hover:text-white font-mono text-sm px-4 py-2">
                  + Add More
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white font-mono text-sm border border-white/20 px-4 py-2 rounded transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export JSON
                </button>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/40 border-b border-white/10 font-mono text-xs uppercase text-white/50">
                  <tr>
                    <th className="p-4 font-normal">Rank</th>
                    <th className="p-4 font-normal">Candidate</th>
                    <th className="p-4 font-normal">Match Score</th>
                    <th className="p-4 font-normal">Interest Score</th>
                    <th className="p-4 font-normal">Combined</th>
                    <th className="p-4 font-normal">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shortlist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/40 font-mono">No candidates shortlisted yet.</td>
                    </tr>
                  ) : (
                    // Sort by combined score (Match * 0.6 + Interest * 0.4)
                    [...shortlist].sort((a, b) => {
                      const scoreA = (a.matchScore * 0.6) + (a.interestScore * 0.4);
                      const scoreB = (b.matchScore * 0.6) + (b.interestScore * 0.4);
                      return scoreB - scoreA;
                    }).map((candidate, idx) => {
                      const combined = (candidate.matchScore * 0.6) + (candidate.interestScore * 0.4);
                      let recTag = { text: "❌ Pass", color: "text-red-400 bg-red-400/10 border-red-400/20" };
                      if (combined >= 85) recTag = { text: "🔥 Hot Lead", color: "text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/20" };
                      else if (combined >= 75) recTag = { text: "✅ Strong Fit", color: "text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/20" };
                      else if (combined >= 60) recTag = { text: "⚡ Explore Further", color: "text-white/80 bg-white/10 border-white/20" };

                      return (
                        <tr key={candidate.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                          <td className="p-4 font-display text-xl text-white/50">#{idx + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${candidate.name}&backgroundColor=1f1f22`} alt={candidate.name} className="w-10 h-10 rounded-full border border-white/10 bg-[#1F1F22]" />
                              <div>
                                <p className="font-semibold text-white">{candidate.name}</p>
                                <p className="text-xs text-white/50 font-mono">{candidate.company}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-lg" style={{ color: getScoreColor(candidate.matchScore) }}>{candidate.matchScore}</td>
                          <td className="p-4 font-mono text-lg" style={{ color: getScoreColor(candidate.interestScore) }}>{candidate.interestScore}</td>
                          <td className="p-4 font-mono text-xl font-bold text-white">{combined.toFixed(1)}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded text-xs font-mono border ${recTag.color}`}>
                              {recTag.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
