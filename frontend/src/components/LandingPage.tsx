import { useState, useEffect } from 'react';
import { 
  Network, Moon, Sun, ArrowRight, Sparkles, Terminal, 
  Eye, MessageSquare, Award, Check, Play, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from './UIComponents';

interface LandingPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onGetStarted: () => void;
}

const BAD_CODE_EXAMPLES = [
  {
    language: 'javascript',
    title: 'React useEffect Fetch',
    snippet: `useEffect(() => {
  fetch('/api/user')
    .then(res => res.json())
    .then(data => setUser(data))
}, [])`,
    roast: `• Race condition city: If the component unmounts, your setState will throw a memory leak warning.
• Error handling? Never heard of her. What if the API returns 500?
• Loading state is missing. Your users are just staring at a blank void.
• Hardcoded API endpoint. Good luck deploying this to staging.`
  },
  {
    language: 'css',
    title: 'Centering a Div (2012 Style)',
    snippet: `.centered-box {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -150px;
  margin-top: -100px;
  width: 300px;
  height: 200px;
}`,
    roast: `• Absolute margins? What is this, 2012?
• Fixed width and height make this completely non-responsive.
• Display: flex or grid literally takes two lines and doesn't break on mobile.
• If the parent container isn't position: relative, this box is flying off-screen.`
  },
  {
    language: 'javascript',
    title: 'Nested Callbacks',
    snippet: `getUser(userId, (user) => {
  getProfile(user.profileId, (profile) => {
    getSettings(profile.settingsId, (settings) => {
      updateTheme(settings.theme, (result) => {
        console.log('Theme updated!');
      })
    })
  })
})`,
    roast: `• Welcome to Callback Hell. Here is your pitchfork.
• Ever heard of Promises? Or async/await? They were released in 2015.
• Error handling on each nested step is going to require 40 lines of boilerplate.
• This code is shaped like a pyramid. Reading it makes my neck hurt.`
  }
];

export default function LandingPage({ theme, onToggleTheme, onGetStarted }: LandingPageProps) {
  const [selectedSnippetIdx, setSelectedSnippetIdx] = useState(0);
  const [typedRoast, setTypedRoast] = useState('');
  const [isRoasting, setIsRoasting] = useState(false);
  const [activePlaypenTab, setActivePlaypenTab] = useState<'input' | 'roast'>('input');

  // Interactive Playpen Roasting Simulation
  useEffect(() => {
    if (!isRoasting) return;
    setTypedRoast('');
    setActivePlaypenTab('roast');
    
    const targetText = BAD_CODE_EXAMPLES[selectedSnippetIdx].roast;
    let index = 0;
    const interval = setInterval(() => {
      setTypedRoast((prev) => prev + targetText.charAt(index));
      index++;
      if (index >= targetText.length) {
        clearInterval(interval);
        setIsRoasting(false);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [isRoasting, selectedSnippetIdx]);

  const handleRoastTrigger = () => {
    setIsRoasting(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden font-sans">
      
      {/* CSS Grid Overlay and Ambient Glow Elements */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)]" />
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-1/4 h-[500px] w-[500px] rounded-full bg-rose-500/5 dark:bg-rose-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-10 h-[500px] w-[500px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] pointer-events-none z-0" />
 
      {/* Header */}
      <header className="relative z-10 border-b border-zinc-200 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/70 sticky top-0">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.hash = ''}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 dark:bg-rose-500 shadow-lg shadow-rose-500/20">
                <Network className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-white">
                Nexus
              </span>
            </div>
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors">How it Works</a>
              <a href="#playpen" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors">Simulator</a>
              <a href="#stats" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors">Impact</a>
            </nav>
          </div>
 
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <Button variant="secondary" size="sm" onClick={onGetStarted} className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button variant="primary" size="sm" onClick={onGetStarted}>
              Launch App
            </Button>
          </div>
        </div>
      </header>        {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Constructive criticism for devs</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              Share knowledge. <br />
              <span className="bg-gradient-to-r from-rose-600 via-purple-600 to-rose-500 bg-clip-text text-transparent dark:from-rose-400 dark:via-purple-400 dark:to-rose-300">
                Build verified networks.
              </span>
            </h1>
 
            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Stop working in silos. Share your repositories, components, or mockup designs, and let the developer community review them constructively and share knowledge.
            </p>
 
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 pt-2">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={onGetStarted} 
                className="w-full sm:w-auto font-semibold group shadow-lg shadow-rose-600/20 dark:shadow-rose-500/15"
              >
                Get Started
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              </Button>
              <a href="#playpen" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-semibold">
                  Try Simulator
                </Button>
              </a>
            </div>
 
            {/* Micro Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-8 gap-y-4 pt-6 border-t border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" strokeWidth={3} />
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">100% Free & Open</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" strokeWidth={3} />
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Brutal Honesty</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" strokeWidth={3} />
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">UI/UX & Code Annotations</span>
              </div>
            </div>
          </div>
          
          {/* Right Visual Card Mock */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="w-full max-w-[500px] bg-white rounded-2xl border border-zinc-200 shadow-2xl dark:bg-surface-raised dark:border-white/10 p-5 z-10 transition-transform duration-300 hover:scale-[1.01] hover:shadow-panel dark:hover:shadow-panel-dark">
              
              {/* Card Header Bar */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2.5 py-0.5 rounded">
                  AuthService.ts
                </div>
              </div>
 
              {/* Bad Code block */}
              <div className="rounded-lg bg-zinc-950 p-4 font-mono text-[12px] leading-relaxed text-zinc-300 overflow-x-auto shadow-inner relative group/code">
                <div className="absolute top-2 right-2 rounded bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 border border-rose-500/20">TypeScript</div>
                <span className="text-zinc-500">1</span> <span className="text-rose-400">class</span> <span className="text-yellow-400">AuthService</span> &#123;<br />
                <span className="text-zinc-500">2</span> &nbsp;&nbsp;<span className="text-rose-400">login</span>(user: <span className="text-emerald-400">any</span>) &#123;<br />
                <span className="text-zinc-500">3</span> &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-400">localStorage</span>.<span className="text-rose-300">setItem</span>(<span className="text-amber-300">'pwd'</span>, user.<span className="text-zinc-300">password</span>);<br />
                <span className="text-zinc-500">4</span> &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-400">return</span> <span className="text-rose-300">fetch</span>(<span className="text-amber-300">`/api/login`</span>);<br />
                <span className="text-zinc-500">5</span> &nbsp;&nbsp;&#125;<br />
                <span className="text-zinc-500">6</span> &#125;
              </div>
 
              {/* Critiques */}
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 flex items-start gap-3 transition-colors duration-150 hover:bg-rose-500/15">
                  <div className="mt-0.5 shrink-0 rounded bg-rose-500/20 p-1 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-rose-700 dark:text-rose-400">Fatal Security Flaw</h4>
                    <p className="text-[12px] text-rose-600 dark:text-rose-400/80 mt-0.5">
                      Storing plain text passwords in `localStorage`? That's an invitation to every XSS script on the internet.
                    </p>
                  </div>
                </div>
 
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 flex items-start gap-3 transition-colors duration-150 hover:bg-amber-500/15">
                  <div className="mt-0.5 shrink-0 rounded bg-amber-500/20 p-1 text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400">Lazy Code Quality</h4>
                    <p className="text-[12px] text-amber-600 dark:text-amber-400/80 mt-0.5">
                      Using the `any` type in TypeScript defeats the entire purpose of compiling types. Specify a user schema!
                    </p>
                  </div>
                </div>
              </div>
 
              {/* Micro interactive indicator */}
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3 developers currently roasting</span>
                </div>
                <span>Score: 12%</span>
              </div>
            </div>
            
            {/* Visual background blob cards */}
            <div className="absolute top-8 -right-4 w-[280px] h-[180px] bg-rose-600/5 dark:bg-rose-500/10 border border-rose-500/10 rounded-2xl -z-10 transform rotate-3 blur-[2px] hidden md:block" />
            <div className="absolute -bottom-8 -left-4 w-[280px] h-[180px] bg-emerald-600/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl -z-10 transform -rotate-3 blur-[2px] hidden md:block" />
          </div>
        </div>
      </section>
 
      {/* Features Bento Grid Section */}
      <section id="features" className="relative z-10 bg-zinc-100/50 py-20 dark:bg-surface-raised/40 border-y border-zinc-200 dark:border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400">Developer Playbook</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">Built by developers, for developers.</p>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">Everything you need to gather raw, unfiltered feedback and accelerate your technical growth.</p>
          </div>
 
          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Grid 1: UI/UX Reviews (Col span 2) */}
            <div className="md:col-span-2 group rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-surface-raised flex flex-col justify-between shadow-sm hover:border-rose-300 dark:hover:border-white/20 transition-all duration-200 hover:shadow-md hover:bg-zinc-55/30 dark:hover:bg-white/[0.01]">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Visual UI/UX Criticisms</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Pinpoint flaws directly on your layout screenshots. Highlight styling bugs, alignment errors, poor contrasts, and bad layout layouts using visual drop-pins.
                </p>
              </div>
 
              {/* Visual Mock inside card */}
              <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-white/5 dark:bg-white/5 relative overflow-hidden h-36">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-6 w-16 rounded bg-rose-500/20 text-[10px] flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold">Hero.jsx</div>
                  <div className="h-2 w-24 rounded bg-zinc-200 dark:bg-white/10" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-10 rounded bg-white dark:bg-surface border border-zinc-200 dark:border-white/10 flex items-center px-4 relative">
                    <span className="text-[11px] text-zinc-400">Submit Email Address</span>
                    {/* Visual markers */}
                    <div className="absolute right-4 top-2 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-bounce">1</div>
                  </div>
                </div>
                <div className="absolute right-12 bottom-2 bg-rose-500/10 text-rose-500 dark:text-rose-400 text-[11px] px-2 py-1 rounded border border-rose-500/20 font-medium">
                  "No form placeholder validation!"
                </div>
              </div>
            </div>
 
            {/* Grid 2: Code Roasts (Col span 1) */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-surface-raised flex flex-col justify-between shadow-sm hover:border-rose-300 dark:hover:border-white/20 transition-all duration-200 hover:shadow-md hover:bg-zinc-55/30 dark:hover:bg-white/[0.01]">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Terminal className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Syntax & Architecture</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Submit code snippets or links to your GitHub pull requests. Receive structured architectural feedback directly inside files.
                </p>
              </div>
 
              {/* Code visual mock */}
              <div className="mt-6 rounded-xl bg-zinc-950 p-4 font-mono text-[11px] text-zinc-400 h-36 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-rose-400"><AlertTriangle className="h-3.5 w-3.5" /> <span className="font-semibold">Security Critical</span></div>
                <div className="mt-1 bg-rose-500/10 p-2 rounded border border-rose-500/20 text-[10px] text-rose-300">
                  API Key committed in index.html! Change this immediately.
                </div>
              </div>
            </div>
 
            {/* Grid 3: Real-Time Chat (Col span 1) */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-surface-raised flex flex-col justify-between shadow-sm hover:border-rose-300 dark:hover:border-white/20 transition-all duration-200 hover:shadow-md hover:bg-zinc-55/30 dark:hover:bg-white/[0.01]">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Active Chat Collaboration</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Need clarification on a critique? Trigger dynamic drawer chats to discuss code changes and pair-program solutions directly in real time.
                </p>
              </div>
 
              {/* Chat bubbles preview */}
              <div className="mt-6 space-y-2 h-36 flex flex-col justify-end">
                <div className="bg-zinc-100 dark:bg-white/5 rounded-xl p-2.5 text-[11px] self-start max-w-[80%]">
                  <p className="font-semibold text-[10px] text-zinc-500 dark:text-zinc-400">Reviewer (git_roaster)</p>
                  <span>Use axios cancel token here or abort controller to fix the memory leak!</span>
                </div>
                <div className="bg-rose-600 text-white rounded-xl p-2.5 text-[11px] self-end max-w-[80%]">
                  <span>Ah, thanks! Writing the controller logic now.</span>
                </div>
              </div>
            </div>
 
            {/* Grid 4: Leveling & Reputation (Col span 2) */}
            <div className="md:col-span-2 group rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-surface-raised flex flex-col justify-between shadow-sm hover:border-rose-300 dark:hover:border-white/20 transition-all duration-200 hover:shadow-md hover:bg-zinc-55/30 dark:hover:bg-white/[0.01]">
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gamified Reputation System</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Earn points, obtain levels, and build your profile reputation. Top feedback creators gain elite tags, unlock specialized dashboard features, and rank on the leaderboards.
                </p>
              </div>
 
              {/* Profile Card Mock */}
              <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-white/5 dark:bg-white/5 flex items-center justify-between h-36">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20 text-sm">
                    LV 5
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Alex Rodriguez</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Rank: Senior Roast Master</p>
                  </div>
                </div>
                <div className="w-1/2 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-zinc-400">XP Progress</span>
                    <span className="text-amber-600 dark:text-amber-400">820 / 1000 XP</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>
              </div>
            </div>
 
          </div>
        </div>
      </section>
 
      {/* How it Works Section */}
      <section id="how-it-works" className="relative z-10 py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400">Simple Workflow</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">How it works</p>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">Three steps to elevate your development process.</p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Step 1 */}
            <div className="bg-white dark:bg-surface-raised border border-zinc-200 dark:border-white/10 rounded-2xl p-6 relative group transition-all duration-200 hover:scale-[1.02]">
              <span className="absolute -top-4 -left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-sm shadow shadow-rose-600/30">
                1
              </span>
              <div className="mt-2 space-y-2">
                <h3 className="text-md font-bold text-zinc-900 dark:text-white">Post Your Submission</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Provide a brief summary, add tags (Roast, UI/UX, Code, General), upload a screenshot, or copy your code snippet directly to our dashboard editor.
                </p>
              </div>
            </div>
 
            {/* Step 2 */}
            <div className="bg-white dark:bg-surface-raised border border-zinc-200 dark:border-white/10 rounded-2xl p-6 relative group transition-all duration-200 hover:scale-[1.02]">
              <span className="absolute -top-4 -left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-sm shadow shadow-rose-600/30">
                2
              </span>
              <div className="mt-2 space-y-2">
                <h3 className="text-md font-bold text-zinc-900 dark:text-white">Receive Honest Critiques</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  The developer community leaves detailed annotations, comments, and recommendations inside your codebase or designs.
                </p>
              </div>
            </div>
 
            {/* Step 3 */}
            <div className="bg-white dark:bg-surface-raised border border-zinc-200 dark:border-white/10 rounded-2xl p-6 relative group transition-all duration-200 hover:scale-[1.02]">
              <span className="absolute -top-4 -left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-sm shadow shadow-rose-600/30">
                3
              </span>
              <div className="mt-2 space-y-2">
                <h3 className="text-md font-bold text-zinc-900 dark:text-white">Iterate & Improve</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Fix the architectural weaknesses or visual discrepancies, discuss changes with reviewers via direct messages, and ship cleaner projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* Interactive Roast Playpen (Simulator) */}
      <section id="playpen" className="relative z-10 bg-zinc-100/50 py-20 dark:bg-surface-raised/40 border-y border-zinc-200 dark:border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-rose-500">Live Simulator</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">Roast Simulator</p>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">Test our critique style by choosing one of the common mistakes below and hitting "Roast Code".</p>
          </div>
 
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* Snippet Picker (4 columns) */}
            <div className="md:col-span-4 flex flex-col gap-3 justify-center">
              {BAD_CODE_EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedSnippetIdx(idx);
                    setTypedRoast('');
                    setActivePlaypenTab('input');
                  }}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all duration-150',
                    selectedSnippetIdx === idx
                      ? 'bg-white border-rose-500 shadow text-rose-600 dark:bg-surface dark:border-rose-500 dark:text-rose-400'
                      : 'bg-transparent border-zinc-200 text-zinc-600 hover:bg-zinc-200/50 dark:border-white/5 dark:text-zinc-400 dark:hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{ex.title}</span>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded uppercase">
                      {ex.language}
                    </span>
                  </div>
                </button>
              ))}
            </div>
 
            {/* Editor & Output Container (8 columns) */}
            <div className="md:col-span-8 flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden min-h-[300px]">
              
              {/* Tab Selector */}
              <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActivePlaypenTab('input')}
                    className={cn(
                      'text-xs font-medium px-2.5 py-1 rounded transition-colors',
                      activePlaypenTab === 'input' 
                        ? 'bg-zinc-800 text-white' 
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    Input Code
                  </button>
                  <button
                    onClick={() => setActivePlaypenTab('roast')}
                    className={cn(
                      'text-xs font-medium px-2.5 py-1 rounded transition-colors flex items-center gap-1.5',
                      activePlaypenTab === 'roast' 
                        ? 'bg-zinc-800 text-white' 
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <span>Roast Output</span>
                    {isRoasting && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />}
                  </button>
                </div>
                
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleRoastTrigger} 
                  disabled={isRoasting}
                  className="h-7 text-xs bg-rose-600 hover:bg-rose-500 active:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 gap-1"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Roast Code
                </Button>
              </div>
 
              {/* Pane Content */}
              <div className="flex-1 p-5 font-mono text-[12px] overflow-y-auto themed-scrollbar leading-relaxed">
                {activePlaypenTab === 'input' ? (
                  <pre className="text-zinc-300 whitespace-pre-wrap">
                    <code>{BAD_CODE_EXAMPLES[selectedSnippetIdx].snippet}</code>
                  </pre>
                ) : (
                  <div className="space-y-2 text-rose-400 whitespace-pre-wrap font-medium">
                    <code>
                      {typedRoast || (
                        <span className="text-zinc-500 italic">Click "Roast Code" above to run the roast analysis simulator...</span>
                      )}
                    </code>
                    {isRoasting && <span className="inline-block w-1.5 h-4 bg-rose-500 ml-0.5 animate-pulse" />}
                  </div>
                )}
              </div>
 
            </div>
 
          </div>
        </div>
      </section>
 
      {/* Community Stats Section */}
      <section id="stats" className="relative z-10 py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div className="space-y-1">
              <h4 className="text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">12,400+</h4>
              <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Active Reviewers</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">48,900+</h4>
              <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Roasts Executed</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">89%</h4>
              <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Devs Improved</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">15 min</h4>
              <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Avg Response Time</p>
            </div>
          </div>
        </div>
      </section>
 
      {/* Call to Action Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 pb-24">
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto overflow-hidden shadow-2xl dark:bg-zinc-950 dark:border-white/5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-rose-500/10 dark:bg-rose-500/20 blur-[80px]" />
          <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-rose-500/5 dark:bg-rose-500/10 blur-[80px]" />
 
          <div className="relative z-10 max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              Ready to write better software?
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 dark:text-zinc-400 leading-relaxed">
              Join thousands of developers leveling up their UI design, engineering standards, and code quality. Get direct annotations from experienced engineers.
            </p>
            <div className="pt-2">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={onGetStarted} 
                className="w-full sm:w-auto font-semibold px-8 shadow-xl shadow-rose-600/30"
              >
                Launch App Now
              </Button>
            </div>
          </div>
        </div>
      </section>
 
      {/* Landing Footer */}
      <footer className="relative z-10 border-t border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950 py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Nexus. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#features" className="hover:text-zinc-700 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-700 dark:hover:text-white transition-colors">How it Works</a>
            <a href="#playpen" className="hover:text-zinc-700 dark:hover:text-white transition-colors">Simulator</a>
          </div>
          <p>Built for developers, by developers.</p>
        </div>
      </footer>
    </div>
  );
}
