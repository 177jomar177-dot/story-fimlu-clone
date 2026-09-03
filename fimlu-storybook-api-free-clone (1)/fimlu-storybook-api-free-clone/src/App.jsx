import React, { useState, useEffect } from 'react';
import { callLocalEngine, createLocalImageDataUrl } from './localEngine.js';
import { 
  BookOpen, Image as ImageIcon, Megaphone, Puzzle, Palette, 
  Sparkles, RotateCw, MoreHorizontal, ChevronLeft, ChevronDown, Check, Star, AlertTriangle, Edit3, ArrowRight, Play, CheckCircle2, Copy, FileText, Save, List,
  Download, UploadCloud, FileDown, Zap, ImagePlus, ShieldCheck, Flame, Heart, Target, Film, UserCheck, Settings, Moon, Sun
} from 'lucide-react';

// --- API & UTILITIES ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch(e) {}
  }
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
};

const DB_NAME = 'FimluCreatorDB';
const STORE_NAME = 'drafts';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllDrafts = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error fetching drafts from IndexedDB:", err);
    return [];
  }
};

const callLocalStoryEngine = async (prompt, schema = null) => {
  // API-free clone: preserve the original call surface while routing all generation
  // through the browser-only local engine. No key, account, server, or network request.
  return callLocalEngine(prompt, schema);
};

// --- LOCAL IMAGE PREVIEW ENGINE ---
const callImageAPI = async (promptText) => {
  return createLocalImageDataUrl(promptText);
};

// --- PHASE 9: DYNAMIC SEMANTIC SPECIES PARSER ---
const getSpeciesDirective = (category, customCategory) => {
  const activeCategory = category === 'Other / Custom Category' ? customCategory : category;
  const lower = activeCategory.toLowerCase();

  const humanDisciplines = [
    "honesty", "respect & manners", "family", "healthy habits", 
    "safety", "faith & values", "communication", "responsibility"
  ];

  const hasAnimalKeywords = ["animal", "pet", "critter", "dinosaur", "bear", "pig", "dog", "cat", "fox", "bunny", "rabbit", "wildlife", "marine", "sea creature", "ocean animal", "water animal", "safari"].some(kw => lower.includes(kw));
  const hasHumanKeywords = ["boy", "girl", "child", "kid", "human", "sibling", "brother", "sister", "toddler", "student"].some(kw => lower.includes(kw));

  if (hasAnimalKeywords && !hasHumanKeywords) {
    return "STRICT SPECIES DIRECTIVE (ANIMAL/AQUATIC CREATURE): The category specifies an animal theme. The Main Character MUST be an anthropomorphic animal or creature (e.g., specific mammal, sea animal, or bird). Explicitly state exact species, anatomical traits, fur/scale color, and attire. DO NOT suggest humans.";
  }

  if (hasHumanKeywords || humanDisciplines.includes(category.toLowerCase())) {
    return "STRICT SPECIES DIRECTIVE (3D STYLIZED HUMAN CHILD): This category focuses on human social-emotional mirroring, real-world behavioral choices, and family values. The Main Character MUST be a beautiful 3D stylized human child (e.g., specifying hair style, hair color, skin tone, eye color, and human clothing). DO NOT suggest animals, monsters, or non-human creatures.";
  }

  return "DYNAMIC SPECIES DIRECTIVE (HYBRID / CREATIVE MENU): The category is open-ended or imaginative. You MUST provide a diverse menu across your 3-4 suggestions: Provide at least one 3D Stylized Human Child option, one Anthropomorphic Animal option, and one Imaginative / Fantasy Creature option so the creator has full strategic choice.";
};

// --- NEW: DYNAMIC SEMANTIC ENVIRONMENT ENGINE ---
const getSemanticEnvironmentDirective = (category, customCategory) => {
  const activeCategory = category === 'Other / Custom Category' ? customCategory : category;
  const lower = activeCategory.toLowerCase();
  
  const indoorKeywords = ["honesty", "respect", "family", "healthy habits", "safety", "communication", "responsibility", "bedtime", "routine", "manners", "values"];
  const isIndoor = indoorKeywords.some(kw => lower.includes(kw));
  
  if (isIndoor) {
    return "ENVIRONMENT DIRECTIVE (WARM INDOOR): The visual story world MUST feature warm, pristine, relatable indoor settings (e.g., a tidy nursery, a sunlit living room, a cozy bedroom, a real oak table).";
  }
  return "ENVIRONMENT DIRECTIVE (CRISP NATURE/OUTDOOR): The visual story world MUST feature lush, vivid, hyper-realistic outdoor or nature settings (e.g., a sunlit spring garden, a magical forest, crisp green grass, vibrant skies).";
};

// --- FIMLU DYNAMIC ENVIRONMENTAL ENGINE ---
const getDynamicEnvironment = (pageNum) => {
  if (pageNum >= 1 && pageNum <= 5) return "Act 1 (Setup): Wide cinematic establishing shots, sweeping environments, showing the broader story world context. Camera: Extreme wide angle.";
  if (pageNum >= 6 && pageNum <= 10) return "Act 2 (The Problem): Mid-shots focusing on character interaction, specific landmarks, and close-up emotional expressions. Camera: Medium shot to macro close-up.";
  if (pageNum >= 11 && pageNum <= 15) return "Act 3 (The Solution): Action shots, dynamic camera angles, characters actively engaging with the environment to solve the problem. Camera: Dynamic low or high angle.";
  if (pageNum >= 16 && pageNum <= 25) return "Act 4 (Parent Toolkit): Warm, intimate, cozy, and protected environments (e.g., sunset lighting, sitting comfortably in a safe space) to signal psychological safety and learning. Camera: Soft, eye-level portrait framing.";
  return "General cohesive scene";
};

const CATEGORIES = [
  "Communication", "Respect & Manners", "Emotional Regulation", "Friendship",
  "Responsibility", "Confidence & Courage", "Kindness & Empathy", "Honesty",
  "Family", "Bedtime & Routines", "Healthy Habits", "Safety", "Adventure",
  "Fantasy & Magic", "Animal Stories", "Faith & Values", "Other / Custom Category"
];

const TARGET_AGES = ["Ages 3–5", "Ages 4–6", "Ages 4–8", "Ages 6–8", "Custom Age"];

const BRIEF_FIELDS = [
  { id: 'parentProblem', label: 'Parent Problem' },
  { id: 'childPerspective', label: 'Child Perspective' },
  { id: 'coreLesson', label: 'Core Lesson' },
  { id: 'targetSkill', label: 'Target Skill' },
  { id: 'successBehavior', label: 'Observable Success Behavior' },
  { id: 'storyMechanism', label: 'Story Mechanism' },
  { id: 'mainCharacter', label: 'Main Character' },
  { id: 'characterAge', label: 'Character Age-Equivalent' },
  { id: 'characterPersonality', label: 'Character Personality' },
  { id: 'characterAppearance', label: 'Character Appearance' },
  { id: 'supportingCharacters', label: 'Supporting Characters' },
  { id: 'setting', label: 'Setting / Story World' },
  { id: 'parentValue', label: 'Parent Value' },
  { id: 'childAction', label: 'Practical Child Action' },
  { id: 'seriesName', label: 'Series Name' },
  { id: 'seriesPotential', label: 'Series Potential' },
  { id: 'visualDirection', label: 'Global Visual Direction' }
];

const countWords = (text) => {
  if (typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Safely caught render error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-in fade-in zoom-in-95">
           <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
           <h2 className="text-3xl font-extrabold text-slate-900 mb-4">DISPLAY ERROR</h2>
           <p className="text-slate-600 text-lg mb-8">Your storybook data is preserved. Return to production to resume safely.</p>
           <button 
             onClick={() => { this.setState({ hasError: false }); this.props.onRecover(); }} 
             className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-full hover:bg-indigo-700 transition-colors shadow-md w-full sm:w-auto"
           >
             RETURN TO PRODUCTION
           </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- COMPONENTS ---
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-[100] animate-in fade-in slide-in-from-bottom-5 text-center min-w-max">
      <Sparkles className="w-4 h-4 text-amber-300" />
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [toastMessage, setToastMessage] = useState(null);

  // Theme & Local Engine State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiTestStatus, setApiTestStatus] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Library State
  const [savedDrafts, setSavedDrafts] = useState([]);

  // Prompt 1 State
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [targetAge, setTargetAge] = useState('Ages 4–8');
  const [customAge, setCustomAge] = useState('');
  const [titles, setTitles] = useState([]);
  const [isLoadingTitles, setIsLoadingTitles] = useState(false);
  const [regeneratingTitleId, setRegeneratingTitleId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const finalCategory = category === 'Other / Custom Category' ? customCategory : category;
  const finalAge = targetAge === 'Custom Age' ? customAge : targetAge;
  const isFormValid = finalCategory.trim() !== '' && finalAge.trim() !== '';

  // Prompt 2 & Save State
  const [projectId, setProjectId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const [briefError, setBriefError] = useState(false);
  const [briefSuggestions, setBriefSuggestions] = useState({});
  const [briefData, setBriefData] = useState({});
  const [customBriefData, setCustomBriefData] = useState({});
  const [regeneratingField, setRegeneratingField] = useState(null);
  const [warnings, setWarnings] = useState({ foundation: null, world: null });

  // Prompt 3 - Production State
  const [isProducing, setIsProducing] = useState(false);
  const [productionError, setProductionError] = useState(false);
  const [currentProductionStep, setCurrentProductionStep] = useState('story');
  const [productionStageLabel, setProductionStageLabel] = useState('');
  const [productionErrorView, setProductionErrorView] = useState('brief');
  
  const [storyPages, setStoryPages] = useState([]);
  const [editingPageId, setEditingPageId] = useState(null);
  const [editTextVal, setEditTextVal] = useState('');
  const [regeneratingPageId, setRegeneratingPageId] = useState(null);

  // Visual Bible State
  const [visualBible, setVisualBible] = useState(null);

  // Phase 7-9: 5-Tier Multi-Variant Cover State (Including V5)
  const [coverVariants, setCoverVariants] = useState({ v1: null, v2: null, v3: null, v4: null, v5: null });
  const [activeCoverVariant, setActiveCoverVariant] = useState('v1');
  const [isRegeneratingCoverVariant, setIsRegeneratingCoverVariant] = useState(null);
  const [coverImages, setCoverImages] = useState({ v1: null, v2: null, v3: null, v4: null, v5: null });
  const [isGeneratingCoverImageFor, setIsGeneratingCoverImageFor] = useState(null);

  // Page Images & Prompts State
  const [pageImages, setPageImages] = useState({}); 
  const [isGeneratingPageImageFor, setIsGeneratingPageImageFor] = useState(null);

  // Dynamic Page Prompt State
  const [currentPageProduction, setCurrentPageProduction] = useState(1);
  const [pagePrompts, setPagePrompts] = useState({});
  const [generatingPromptFor, setGeneratingPromptFor] = useState(null);
  const [promptErrors, setPromptErrors] = useState({});
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  useEffect(() => {
    // Initialize Theme and API from localStorage
    const theme = localStorage.getItem('fimlu_theme');
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('fimlu_theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setApiTestStatus('⏳ Checking local browser engine...');
    try {
      const sample = await callLocalEngine('Create exactly 5 completely original, high-converting children\'s storybook titles for:\nCategory: "Kindness & Empathy"\nAge: "Ages 4–8"', { type: 'ARRAY' });
      if (Array.isArray(sample) && sample.length === 5) {
        setApiTestStatus('✅ Local engine is ready. No API key or internet connection is required.');
      } else {
        setApiTestStatus('❌ Local engine self-check failed.');
      }
    } catch (e) {
      setApiTestStatus(`❌ Error: ${e.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSaveApi = () => {
    setApiTestStatus('✅ Local engine is active. Nothing to configure.');
    setTimeout(() => { setIsApiModalOpen(false); setApiTestStatus(''); }, 900);
  };

  const showToast = (msg) => setToastMessage(msg);
  const getFinalValue = (fieldId) => briefData[fieldId] === 'CUSTOM' ? customBriefData[fieldId] : briefData[fieldId];
  const getContextString = () => Object.keys(briefData).map(k => `${BRIEF_FIELDS.find(f => f.id === k)?.label || k}: ${getFinalValue(k)}`).join("\n");

  const handleCopyPrompt = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast("Prompt copied.");
    } catch (err) {
      showToast("Failed to copy. Please copy manually.");
    }
  };

  const handleDownloadDoc = () => {
    if (!selectedBook) return;
    const formatText = (text) => text ? text.replace(/\n/g, '<br/>') : '';
    
    let content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${selectedBook.title}</title></head>
    <body style="font-family: Quicksand, Century Gothic, Arial, sans-serif; font-size: 16pt;">
      
      <h1 style="text-align: center; color: #4f46e5;">STORYBOOK ASSETS: ${selectedBook.title.toUpperCase()}</h1>
      <p style="text-align: center;"><strong>Category:</strong> ${selectedBook.category} | <strong>Age:</strong> ${selectedBook.age}</p>
      
      <hr style="margin: 30px 0;"/>
      
      <h2 style="color: #4f46e5; border-bottom: 1px solid #ccc; padding-bottom: 5px;">A/B TESTING COVER PROMPTS (V1 - V5)</h2>
      
      <h3 style="color: #047857;">[V1 CHAMPION / CONTROL]</h3>
      <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 15px;">
        <p style="margin:0;">${formatText(coverVariants.v1?.prompt || 'Not generated.')}</p>
      </div>

      <h3 style="color: #b45309;">[V2 CHALLENGER - ACTION]</h3>
      <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 15px;">
        <p style="margin:0;">${formatText(coverVariants.v2?.prompt || 'Not generated.')}</p>
      </div>

      <h3 style="color: #be185d;">[V3 CHALLENGER - EMOTION]</h3>
      <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 15px;">
        <p style="margin:0;">${formatText(coverVariants.v3?.prompt || 'Not generated.')}</p>
      </div>

      <h3 style="color: #6d28d9;">[V4 THE HOLY GRAIL - ACTIVE RESOLUTION]</h3>
      <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 15px;">
        <p style="margin:0;">${formatText(coverVariants.v4?.prompt || 'Not generated.')}</p>
      </div>

      <h3 style="color: #0f172a;">[V5 BLOCKBUSTER ENSEMBLE]</h3>
      <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin:0;">${formatText(coverVariants.v5?.prompt || 'Not generated.')}</p>
      </div>
      
      <br/><hr style="margin: 30px 0;"/>
      
      <h2 style="color: #4f46e5; border-bottom: 1px solid #ccc; padding-bottom: 5px;">STORY PAGES PROMPTS (1–25)</h2>
    `;
    
    storyPages.forEach(p => {
       content += `
        <h3 style="color: #334155; margin-top: 30px;">--- PAGE ${p.pageNumber} (${p.section}) ---</h3>
        <p><strong>Story Text:</strong> <em style="font-size: 18pt;">"${p.text}"</em></p>
        <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin:0;">${formatText(pagePrompts[p.pageNumber] || 'Prompt not generated yet.')}</p>
        </div>
       `;
    });

    content += `</body></html>`;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedBook.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_prompts.doc`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast("Microsoft Word document downloaded successfully!");
  };

  const handleExportAllData = async () => {
    const drafts = await getAllDrafts();
    if (drafts.length === 0) { showToast("No saved books to export."); return; }
    const blob = new Blob([JSON.stringify(drafts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `FimluCreator_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("Backup exported successfully.");
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const drafts = JSON.parse(event.target.result);
        if (!Array.isArray(drafts)) throw new Error("Invalid format");
        const db = await initDB(); const tx = db.transaction(STORE_NAME, 'readwrite'); const store = tx.objectStore(STORE_NAME);
        drafts.forEach(draft => store.put(draft));
        tx.oncomplete = () => { showToast("Backup imported successfully!"); loadDraftsList(); };
      } catch (err) { showToast("Failed to import. Invalid backup file."); }
    };
    reader.readAsText(file); e.target.value = null;
  };

  const handleSaveDraft = async (silent = false) => {
    if (!selectedBook) return;
    let currentId = projectId || generateId(); setProjectId(currentId);
    try {
      const db = await initDB(); const tx = db.transaction(STORE_NAME, 'readwrite'); const store = tx.objectStore(STORE_NAME);
      const draftData = { id: currentId, title: selectedBook.title, category: selectedBook.category, targetAge: selectedBook.age, selectedBook, briefData, customBriefData, storyPages, visualBible, coverVariants, coverImages, activeCoverVariant, pagePrompts, pageImages, updatedAt: new Date().toISOString() };
      const request = store.put(draftData);
      request.onsuccess = () => { if (!silent) showToast("Draft saved successfully."); };
    } catch (err) { console.error(err); if (!silent) showToast("Database error."); }
  };

  const loadDraftsList = async () => {
    const drafts = await getAllDrafts();
    drafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setSavedDrafts(drafts); setView('saved_books');
  };

  const handleOpenDraft = (draft) => {
    setProjectId(draft.id); setSelectedBook(draft.selectedBook); setBriefData(draft.briefData || {}); setCustomBriefData(draft.customBriefData || {}); setStoryPages(draft.storyPages || []); setVisualBible(draft.visualBible || null);
    if (draft.coverVariants) { 
      setCoverVariants({
        v1: draft.coverVariants.v1 || null, v2: draft.coverVariants.v2 || null, v3: draft.coverVariants.v3 || null, v4: draft.coverVariants.v4 || null, v5: draft.coverVariants.v5 || null
      }); 
      setCoverImages(draft.coverImages || { v1: null, v2: null, v3: null, v4: null, v5: null }); 
      setActiveCoverVariant(draft.activeCoverVariant || 'v1'); 
    } 
    else { setCoverVariants({ v1: null, v2: null, v3: null, v4: null, v5: null }); setCoverImages({ v1: null, v2: null, v3: null, v4: null, v5: null }); setActiveCoverVariant('v1'); }
    setPagePrompts(draft.pagePrompts || {}); setPageImages(draft.pageImages || {}); setCurrentPageProduction(1);
    if (draft.storyPages && draft.storyPages.length > 0) setView('review'); else setView('brief');
    showToast("Draft loaded successfully.");
  };

  // --- Prompt 1: Titles ---
  const handleGenerateTitles = async (isRegenerateAll = false) => {
    if (!isFormValid) return;
    setIsLoadingTitles(true); setMenuOpenId(null);
    const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, whyItWorks: { type: "STRING" }, ratings: { type: "OBJECT", properties: { memorability: { type: "NUMBER" }, curiosity: { type: "NUMBER" }, parentAppeal: { type: "NUMBER" }, childAppeal: { type: "NUMBER" }, storyPotential: { type: "NUMBER" }, overallRating: { type: "NUMBER" } } } } } };
    
    // NEW STRICT TYPOGRAPHY PROMPT
    const prompt = `Create exactly 5 completely original, high-converting children's storybook titles for:
    Category: "${finalCategory}"
    Age: "${finalAge}"
    CRITICAL TYPOGRAPHY & LENGTH RULES:
    1. Titles MUST be ultra-short, punchy, and strictly 2 to 4 words maximum.
    2. DO NOT use subtitles. DO NOT use colons.
    3. Keep it simple, memorable, and easy to fit on a book cover.`;

    try {
      const data = await callLocalStoryEngine(prompt, schema);
      setTitles(data.map((item, index) => ({ id: generateId(), rank: index + 1, ...item })));
    } catch (error) { showToast(error.message); } finally { setIsLoadingTitles(false); }
  };

  const handleRegenerateSingleTitle = async (titleObj, index) => {
    setRegeneratingTitleId(titleObj.id); setMenuOpenId(null);
    const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, whyItWorks: { type: "STRING" }, ratings: { type: "OBJECT", properties: { memorability: { type: "NUMBER" }, curiosity: { type: "NUMBER" }, parentAppeal: { type: "NUMBER" }, childAppeal: { type: "NUMBER" }, storyPotential: { type: "NUMBER" }, overallRating: { type: "NUMBER" } } } } } };
    const existingStr = titles.map(t => t.title).join(", ");
    
    const prompt = `Create exactly 1 completely new children's storybook title. Category: "${finalCategory}". Age: "${finalAge}". MUST be genuinely different from: ${existingStr}. CRITICAL RULE: Must be strictly 2 to 4 words maximum. NO colons. NO subtitles.`;
    
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      setTitles(prev => { const updated = [...prev]; updated[index] = { ...updated[index], ...data[0] }; return updated; });
    } catch (error) { showToast(error.message); } finally { setRegeneratingTitleId(null); }
  };

  // --- Prompt 2: Brief with Demographic Species Alignment ---
  const handleGenerateStorybook = (titleObj) => {
    setMenuOpenId(null); setSelectedBook({ title: titleObj.title, category: finalCategory, age: finalAge, rank: titleObj.rank, ratings: titleObj.ratings }); setProjectId(generateId());
    setBriefData({}); setCustomBriefData({}); setBriefSuggestions({}); setWarnings({ foundation: null, world: null }); setBriefError(false); setIsLoadingBrief(true);
    setStoryPages([]); setVisualBible(null); setCoverVariants({ v1: null, v2: null, v3: null, v4: null, v5: null }); setCoverImages({ v1: null, v2: null, v3: null, v4: null, v5: null });
    setPagePrompts({}); setPageImages({}); setCurrentPageProduction(1); setView('brief');
    generateInitialBriefSuggestions(titleObj.title, finalCategory, finalAge);
  };

  const generateInitialBriefSuggestions = async (title, cat, age) => {
    setIsLoadingBrief(true); setBriefError(false);
    const properties = {}; BRIEF_FIELDS.forEach(f => { properties[f.id] = { type: "ARRAY", items: { type: "STRING" } }; });
    const schema = { type: "OBJECT", properties, required: BRIEF_FIELDS.map(f => f.id) };
    
    const speciesDirective = getSpeciesDirective(category, customCategory);

    const prompt = `Expert children's book director and child psychologist. Plan a Storybook Creation Brief. 
      Title: "${title}". 
      Category: "${cat}". 
      Target Age: "${age}". 
      
      ${speciesDirective}
      
      For EACH field, provide 3 to 4 strong, specific suggestions. 
      FIRST suggestion MUST start exactly with "⭐ ".`;
      
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      setBriefSuggestions(data);
      setBriefData(prev => {
        const newBriefData = { ...prev };
        BRIEF_FIELDS.forEach(field => { if (!newBriefData[field.id] || (newBriefData[field.id] === 'CUSTOM' && !customBriefData[field.id])) { if (data[field.id] && data[field.id].length > 0) newBriefData[field.id] = data[field.id][0]; } });
        return newBriefData;
      });
    } catch (error) { setBriefError(true); showToast("Suggestions failed to load. Please retry."); } finally { setIsLoadingBrief(false); }
  };

  const handleRegenerateField = async (fieldId) => {
    setRegeneratingField(fieldId); const schema = { type: "ARRAY", items: { type: "STRING" } }; const fieldLabel = BRIEF_FIELDS.find(f => f.id === fieldId)?.label;
    const speciesDirective = getSpeciesDirective(category, customCategory);
    
    const prompt = `Title: "${selectedBook.title}". Current Plan Selections:\n${getContextString()}\n${speciesDirective}\nGenerate 3 NEW suggestions for: "${fieldLabel}". FIRST suggestion MUST start with "⭐ ".`;
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      setBriefSuggestions(prev => ({ ...prev, [fieldId]: data }));
      if (data && data.length > 0) setBriefData(prev => ({ ...prev, [fieldId]: data[0] }));
    } catch (error) { showToast("Failed to regenerate field."); } finally { setRegeneratingField(null); }
  };

  const handleAcceptAll = () => {
    const newBriefData = { ...briefData };
    BRIEF_FIELDS.forEach(field => { if (!newBriefData[field.id] || (newBriefData[field.id] === 'CUSTOM' && !customBriefData[field.id])) { if (briefSuggestions[field.id] && briefSuggestions[field.id].length > 0) newBriefData[field.id] = briefSuggestions[field.id][0]; } });
    setBriefData(newBriefData);
  };

  const getCompletedCount = () => {
    let count = 0;
    BRIEF_FIELDS.forEach(f => { if (briefData[f.id] && briefData[f.id] !== 'CUSTOM') count++; else if (briefData[f.id] === 'CUSTOM' && customBriefData[f.id]?.trim()) count++; });
    return count;
  };
  const isBriefComplete = getCompletedCount() === BRIEF_FIELDS.length;

  // --- Prompt 3: Lightweight Production Generation (Staged) ---
  const handleGenerateCompleteStorybook = async () => {
    setView('producing'); setIsProducing(true); setProductionError(false); setCurrentProductionStep('story'); setProductionStageLabel('Generating Story Pages 1–15...'); setProductionErrorView('brief');
    const contextLines = getContextString();
    const schema = { type: "OBJECT", properties: { pages: { type: "ARRAY", items: { type: "OBJECT", properties: { pageNumber: { type: "NUMBER" }, section: { type: "STRING" }, text: { type: "STRING" } } } } }, required: ["pages"] };
    const prompt = `Write ONLY Story Pages 1-15 for "${selectedBook?.title || 'Unknown'}". Target Age: ${selectedBook?.age || 'Unknown'}. FOUNDATION: One Problem: ${getFinalValue('parentProblem')}. One Skill: ${getFinalValue('targetSkill')}. One Action: ${getFinalValue('childAction')}. BRIEF DETAILS: \n${contextLines}\nSTORY STRUCTURE REQUIREMENTS: - Return exactly 15 pages in an array. Preferred 15-22 words, Absolute Max 25 words per page. - Pages 1-2: Hook, Pages 3-4: Problem, Pages 5-6: Impact, Pages 7-8: Recognition, Pages 9-10: Discovery, Pages 11-12: Practice, Page 13: Struggle / Retry, Page 14: Success & Repair, Page 15: Warm Resolution. DO NOT output brackets [ ] around the text.`;
    
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      if (!data || !data.pages || !Array.isArray(data.pages)) throw new Error("Missing pages array in response.");
      const processedPages = data.pages.map(p => {
        let text = (p.text || "").replace(/\[|\]/g, ''); 
        let words = text.split(/\s+/).filter(w => w.length > 0);
        if (words.length > 25) text = words.slice(0, 25).join(" ") + ".";
        return { pageNumber: p.pageNumber, section: p.section || "Story", text: text, wordCount: countWords(text) };
      }).sort((a, b) => a.pageNumber - b.pageNumber);
      setStoryPages(processedPages); setView('review'); handleSaveDraft(true); 
    } catch (error) { console.error(error); setProductionError(true); } finally { setIsProducing(false); }
  };

  const handleGenerateLearningPages = async () => {
    setView('producing'); setIsProducing(true); setProductionError(false); setCurrentProductionStep('learning'); setProductionStageLabel('Generating Premium Parent Toolkit 16–25...'); setProductionErrorView('review');
    const contextLines = getContextString(); const storyContext = storyPages.filter(p => p.pageNumber <= 15).map(p => `Page ${p.pageNumber}: ${p.text}`).join('\n');
    const schema = { type: "OBJECT", properties: { pages: { type: "ARRAY", items: { type: "OBJECT", properties: { pageNumber: { type: "NUMBER" }, section: { type: "STRING" }, text: { type: "STRING" } } } } }, required: ["pages"] };
    const prompt = `Write ONLY Pages 16-25 (learning section) for "${selectedBook?.title || 'Unknown'}". Target Age: ${selectedBook?.age || 'Unknown'}. FOUNDATION: One Problem: ${getFinalValue('parentProblem')}. One Skill: ${getFinalValue('targetSkill')}. One Action: ${getFinalValue('childAction')}. BRIEF DETAILS: \n${contextLines}\nPREVIOUS STORY CONTEXT (Pages 1-15): \n${storyContext}\nSECTION REQUIREMENTS (Exactly 10 pages total, numbered 16-25): - Pages 16-17: EMOTIONAL LESSON. - Pages 18-19: REAL-LIFE APPLICATION. - Pages 20-21: PARENT CONVERSATION. - Pages 22-23: CHILD ACTION. - Pages 24-25: ENCOURAGING CONCLUSION. WORD COUNT RULES: 40 to 60 words per page. Ensure 100% flawless grammar. DO NOT output brackets [ ] around the text.`;
    
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      if (!data || !data.pages || !Array.isArray(data.pages)) throw new Error("Missing learning pages array in response.");
      const processedLearningPages = data.pages.map(p => {
        let text = (p.text || "").replace(/\[|\]/g, '');
        return { pageNumber: p.pageNumber, section: p.section || "Learning Section", text: text, wordCount: countWords(text) };
      }).sort((a, b) => a.pageNumber - b.pageNumber);
      setStoryPages(prev => [...prev.filter(p => p.pageNumber <= 15), ...processedLearningPages]); setView('review'); handleSaveDraft(true);
    } catch (error) { console.error(error); setProductionError(true); } finally { setIsProducing(false); }
  };

  const handleGenerateVisualBible = async () => {
    setView('producing'); setIsProducing(true); setProductionError(false); setCurrentProductionStep('bible'); setProductionStageLabel('Generating Character & Visual Bible...'); setProductionErrorView('review');
    const schema = { type: "OBJECT", properties: { mainCharacter: { type: "STRING" }, supportingCharacters: { type: "STRING" }, recurringObjects: { type: "STRING" }, storyWorld: { type: "STRING" } }, required: ["mainCharacter", "supportingCharacters", "recurringObjects", "storyWorld"] };
    const speciesDirective = getSpeciesDirective(category, customCategory);
    const environmentDirective = getSemanticEnvironmentDirective(category, customCategory);

    const prompt = `Create the CHARACTER & VISUAL BIBLE for "${selectedBook?.title || 'Unknown'}". Target Age: ${selectedBook?.age || 'Unknown'}. 
      APPROVED BRIEF DETAILS:\n${getContextString()}\n
      ${speciesDirective}
      ${environmentDirective}
      
      REQUIREMENTS: 
      1. MAIN CHARACTER: Define exact name, species, and anatomical features. 
         IF HUMAN: You MUST provide this exact 6-point checklist: 1. Face (Shape/Features) 2. Hairstyle & Hair Color 3. Skin Color 4. Top Attire (Design & Color) 5. Lower Attire (Design & Color) 6. Shoe Design & Color.
         IF ANIMAL/CREATURE: You MUST define exact species, fur/scale/skin color, specific anatomical markings, and exact clothing/accessories.
      2. SUPPORTING CHARACTERS. 
      3. RECURRING OBJECTS. 
      4. STORY WORLD. 
      Return ONLY these 4 fields as a JSON object.`;
      
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      if (!data || !data.mainCharacter) throw new Error("Missing Character Bible data in response.");
      const lockedVisualStyle = "Premium colorful stylized 3D children's picture-book render. Deep depth of field, f/11 aperture, crystal clear background. Absolutely NO blurry, out-of-focus, or messy AI background artifacts. Everything must be razor-sharp and in perfect focus. Consistent 3D render, expressive eyes with glossy white sclera and clear pupils (never hollow or black sockets), clear facial emotion, vibrant controlled colors, warm cinematic lighting, child-friendly proportions, premium professional quality, 3:4 portrait.";
      setVisualBible({ ...data, visualStyle: lockedVisualStyle }); setView('review'); handleSaveDraft(true);
    } catch (error) { console.error(error); setProductionError(true); } finally { setIsProducing(false); }
  };

  // --- MULTI-VARIANT COVER PROMPT GENERATOR ---
  const handleGenerateCoverPrompt = async () => {
    setView('producing'); setIsProducing(true); setProductionError(false); setCurrentProductionStep('cover'); setProductionStageLabel('Generating 5-Tier Cinematic Cover Suite...'); setProductionErrorView('review');
    
    const climaxText = storyPages.filter(p => p.pageNumber >= 13 && p.pageNumber <= 15).map(p => p.text).join(' ').replace(/\[|\]/g, '');

    const schema = { 
      type: "OBJECT", 
      properties: { 
        v1: { type: "OBJECT", properties: { concept: { type: "STRING" }, typographyStyle: { type: "STRING" } }, required: ["concept", "typographyStyle"] }, 
        v2: { type: "OBJECT", properties: { concept: { type: "STRING" }, typographyStyle: { type: "STRING" } }, required: ["concept", "typographyStyle"] }, 
        v3: { type: "OBJECT", properties: { concept: { type: "STRING" }, typographyStyle: { type: "STRING" } }, required: ["concept", "typographyStyle"] }, 
        v4: { type: "OBJECT", properties: { concept: { type: "STRING" }, typographyStyle: { type: "STRING" } }, required: ["concept", "typographyStyle"] },
        v5: { type: "OBJECT", properties: { concept: { type: "STRING" }, typographyStyle: { type: "STRING" } }, required: ["concept", "typographyStyle"] }
      }, 
      required: ["v1", "v2", "v3", "v4", "v5"] 
    };

    const prompt = `Create 5 DISTINCT PREMIUM COVER CONCEPTS for "${selectedBook?.title}". 
      Visual Bible: Main Character: ${visualBible.mainCharacter}. Story World: ${visualBible.storyWorld}. 
      
      STORY CLIMAX EXTRACT (MANDATORY FOR V5 SETTING):
      "${climaxText}"
      
      Variants: 
      1. V1 (Control): Baseline picture-book. 
      2. V2 (Action Hook): High-energy movement. 
      3. V3 (Emotional Hook): Heartwarming triumph. 
      4. V4 (Active Resolution Hook): Kinetic motion moving toward a safe, emotional resolution.
      5. V5 (Cinematic Ensemble Blockbuster): Features the Main Character AND Supporting Characters in the EXACT setting of the Story Climax Extract provided above. Do not invent a new setting for V5.`;
    
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      if (!data || !data.v1 || !data.v2 || !data.v3 || !data.v4 || !data.v5) throw new Error("Missing cover variant data.");

      const buildPrompt = (conceptData, variantType) => {
        const antiGlitch = "ANTI-GLITCH PADLOCKS (STRICT): 1. STRICT IDENTITY LOCK: The character anatomy must explicitly match the visual bible. If human, remain human; if animal, remain exact species. 2. ACCESSORY BAN: Characters must NEVER wear unapproved ribbons, bows, or jewelry. 3. NO GRAPHIC DESIGN: DO NOT generate flat color boxes, banners, or badges. 4. NO SOUND EFFECTS: DO NOT generate subtitles or speech bubbles.";
        const aspectLock = "ASPECT RATIO LOCK (STRICT PHASE 8): This image MUST be generated in a vertical 3:4 portrait aspect ratio (or standard A4 vertical). Do NOT generate landscape, widescreen, or square images.";
        const textMarginLock = "TEXT MARGIN LOCK (CRITICAL): The text MUST NOT touch or bleed off the left and right edges of the canvas. Force a strict 15% clear safety margin on both sides of the text block. Center-align the paragraph so it is perfectly contained within the safe zone.";
        
        let v5Rules = "";
        if (variantType.includes('V5')) {
           v5Rules = "CINEMATIC ENSEMBLE RULES: 1. FOREGROUND/MIDGROUND ROSTER: Place the Main Character prominently in the dynamic foreground and Supporting Character(s) in the midground. 2. MOVIE POSTER COMPOSITION: The ensemble cast and action MUST be strictly restricted to the bottom 60% of the frame. The top 40% MUST remain a deep, uncluttered atmospheric backdrop (e.g., dark glowing sky, blurred canopy) specifically designed to hold our flawless, jumbo typography.";
        }

        return `COVER [${variantType}]\n\nTITLE: "${selectedBook?.title}"\n\nSCENE & HOOK: ${conceptData.concept}\n\nBIBLE: Main Character: ${visualBible.mainCharacter}. ${variantType.includes('V5') ? `Supporting Characters: ${visualBible.supportingCharacters}. ` : ''}World: ${visualBible.storyWorld}.\n\nSTYLE: ${visualBible.visualStyle}\n\n${antiGlitch}\n\n${aspectLock}\n\n${v5Rules}\n\nTITLE PLACEMENT LOCK (CRITICAL): The book title MUST be placed exactly at the TOP of the canvas. Force massive, uncluttered natural negative space in the upper 30% of the image to hold the typography. NEVER place the title at the bottom or the middle. DO NOT use solid-color text boxes.\n\n${textMarginLock}\n\nCOGNITIVE TYPOGRAPHY PADLOCK: Use ONLY chunky, high-contrast, rounded sans-serif or ultra-thick slab-serif fonts. No thin fonts or cursive. Letters may be textured to match the story: [${conceptData.typographyStyle}].\n\nEXACT TEXT OVERLAY\n\n"${selectedBook?.title}"\n\nRender exact approved title ONCE ONLY. DO NOT WRAP TEXT IN BRACKETS.`;
      };

      const newVariants = {
        v1: { ...data.v1, label: 'Control (Champion)', hook: 'Baseline Iconic Picture-Book', prompt: buildPrompt(data.v1, 'V1 CONTROL') },
        v2: { ...data.v2, label: 'Challenger (Action Hook)', hook: 'Dynamic Stakes & High-Energy Action', prompt: buildPrompt(data.v2, 'V2 CHALLENGER') },
        v3: { ...data.v3, label: 'Challenger (Emotional Hook)', hook: 'Heartwarming Connection & Triumph', prompt: buildPrompt(data.v3, 'V3 CHALLENGER') },
        v4: { ...data.v4, label: 'The Holy Grail', hook: 'Active Resolution (Motion + Empathy)', prompt: buildPrompt(data.v4, 'V4 ACTIVE RESOLUTION') },
        v5: { ...data.v5, label: 'Blockbuster Ensemble', hook: 'Full Cast + Climax + Deep Negative Space', prompt: buildPrompt(data.v5, 'V5 CINEMATIC ENSEMBLE') }
      };

      setCoverVariants(newVariants); setActiveCoverVariant('v5'); setView('review'); handleSaveDraft(true);
    } catch (error) { console.error(error); setProductionError(true); } finally { setIsProducing(false); }
  };

  const handleRegenerateSingleCover = async (variantKey) => {
    setIsRegeneratingCoverVariant(variantKey);
    const schema = { type: "OBJECT", properties: { concept: { type: "STRING" }, typographyStyle: { type: "STRING" } }, required: ["concept", "typographyStyle"] };
    
    let variantDirective = "Regenerate the iconic baseline picture-book cover concept."; 
    if (variantKey === 'v2') variantDirective = "Regenerate with High-Energy Action."; 
    if (variantKey === 'v3') variantDirective = "Regenerate with deep Warmth and emotional milestone."; 
    if (variantKey === 'v4') variantDirective = "Regenerate the Active Resolution hook. Kinetic motion directly towards a warm resolution.";
    if (variantKey === 'v5') {
       const climaxText = storyPages.filter(p => p.pageNumber >= 13 && p.pageNumber <= 15).map(p => p.text).join(' ').replace(/\[|\]/g, '');
       variantDirective = `Regenerate the Cinematic Ensemble hook. Feature the Main Character AND Supporting Characters in the EXACT setting of this story climax: "${climaxText}".`;
    }

    const prompt = `Regenerate ONLY ${variantKey.toUpperCase()} cover concept for "${selectedBook?.title}". ${variantDirective} Keep style identical, change composition dramatically.`;
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      const antiGlitch = "ANTI-GLITCH PADLOCKS (STRICT): 1. STRICT IDENTITY LOCK: The character anatomy must explicitly match the visual bible. If human, remain human; if animal, remain exact species. 2. ACCESSORY BAN: NO unapproved ribbons/bows/jewelry. 3. NO GRAPHIC DESIGN: NO flat color boxes or banners. 4. NO SOUND EFFECTS.";
      const aspectLock = "ASPECT RATIO LOCK (STRICT PHASE 8): This image MUST be generated in a vertical 3:4 portrait aspect ratio (or standard A4 vertical). Do NOT generate landscape, widescreen, or square images.";
      const textMarginLock = "TEXT MARGIN LOCK (CRITICAL): The text MUST NOT touch or bleed off the left and right edges of the canvas. Force a strict 15% clear safety margin on both sides of the text block. Center-align the paragraph so it is perfectly contained within the safe zone.";
      
      let v5Rules = "";
      if (variantKey === 'v5') {
         v5Rules = "CINEMATIC ENSEMBLE RULES: 1. FOREGROUND/MIDGROUND ROSTER: Place the Main Character prominently in the dynamic foreground and Supporting Character(s) in the midground. 2. MOVIE POSTER COMPOSITION: The ensemble cast and action MUST be strictly restricted to the bottom 60% of the frame. The top 40% MUST remain a deep, uncluttered atmospheric backdrop specifically designed to hold our flawless, jumbo typography.";
      }

      const aiFlowPrompt = `COVER [${variantKey.toUpperCase()}]\n\nTITLE: "${selectedBook?.title}"\n\nSCENE & HOOK: ${data.concept}\n\nBIBLE: Main Character: ${visualBible?.mainCharacter}. ${variantKey === 'v5' ? `Supporting Characters: ${visualBible?.supportingCharacters}. ` : ''}World: ${visualBible?.storyWorld}.\n\nSTYLE: ${visualBible?.visualStyle}\n\n${antiGlitch}\n\n${aspectLock}\n\n${v5Rules}\n\nTITLE PLACEMENT LOCK (CRITICAL): The book title MUST be placed exactly at the TOP of the canvas. Force massive, uncluttered natural negative space in the upper 30% of the image to hold the typography. NEVER place the title at the bottom or the middle. DO NOT use solid-color text boxes.\n\n${textMarginLock}\n\nCOGNITIVE TYPOGRAPHY PADLOCK: Use ONLY chunky, high-contrast, rounded sans-serif or ultra-thick slab-serif fonts. [${data.typographyStyle}].\n\nEXACT TEXT OVERLAY\n\n"${selectedBook?.title}"\n\nRender exact approved title ONCE ONLY. DO NOT WRAP IN BRACKETS.`;
      
      setCoverVariants(prev => ({ ...prev, [variantKey]: { ...prev[variantKey], ...data, prompt: aiFlowPrompt } })); showToast(`Cover ${variantKey.toUpperCase()} regenerated.`); handleSaveDraft(true);
    } catch (e) { showToast(`Failed to regenerate cover.`); } finally { setIsRegeneratingCoverVariant(null); }
  };

  const handleGenerateCoverImage = async (variantKey) => {
    setIsGeneratingCoverImageFor(variantKey);
    try { const imageUrl = await callImageAPI(coverVariants[variantKey].prompt); setCoverImages(prev => { const updated = { ...prev, [variantKey]: imageUrl }; setTimeout(() => handleSaveDraft(true), 500); return updated; }); showToast(`Image generated!`); } catch (error) { showToast("Failed to generate image."); } finally { setIsGeneratingCoverImageFor(null); }
  };

  // --- Dynamic Prompt Generator for SINGLE Page ---
  const handleGeneratePagePrompt = async (pageNum) => {
    setGeneratingPromptFor(pageNum); setPromptErrors(prev => ({ ...prev, [pageNum]: false }));
    const page = storyPages.find(p => p.pageNumber === pageNum);
    if (!page || !visualBible) { setPromptErrors(prev => ({ ...prev, [pageNum]: true })); setGeneratingPromptFor(null); return; }

    const dynamicEnv = getDynamicEnvironment(pageNum);
    const cleanPageText = page.text.replace(/\[|\]/g, '');
    
    const textMarginLock = pageNum <= 15
      ? "TEXT MARGIN LOCK (CRITICAL): The text MUST NOT touch or bleed off the left and right edges of the canvas. Force a strict 15% clear safety margin on both sides of the text block. Center-align the paragraph so it is perfectly contained within the safe zone."
      : "TEXT MARGIN LOCK (CRITICAL): The text MUST NOT touch or bleed off the left and right edges of the canvas. Force a strict 20% clear safety margin on both sides of the text block to safely accommodate this longer paragraph. Center-align the text so it is perfectly contained within the safe zone.";

    const prompt = `
      Write ONE complete plain-text Google AI Flow prompt for Page ${pageNum} of "${selectedBook?.title || ''}".
      
      STRICT IDENTITY ANCHOR (PHASE 6 & 9 LOCK):
      Main Character: ${visualBible.mainCharacter}
      
      REFERENCE IMAGE PADLOCK (CRITICAL):
      A reference image (the book cover) has been provided. You MUST use this reference image to achieve 100% Main Character consistency. 
      IF HUMAN: Strictly copy the character's face, hairstyle, skin color, top attire, lower attire, and shoes exactly as they appear in the reference image.
      IF ANIMAL: Strictly copy the exact species, fur/scale/skin markings, and attire/accessories exactly as they appear in the reference image.
      Do not change their clothing colors or physical traits.

      ${pageNum > 1 ? `Supporting Characters: ${visualBible.supportingCharacters || 'None'}` : ''}
      
      STORY WORLD & ENVIRONMENTAL PROGRESSION:
      Base World: ${visualBible.storyWorld}
      Current Act Modifier: ${dynamicEnv}
      
      PAGE TEXT: "${cleanPageText}"
      
      SAFETY & PRIVACY SANITIZATION (CRITICAL): 
      Image generation APIs will automatically block prompts containing words like 'scary', 'fear', 'hiding', 'alone in the dark', 'monster', 'shadows grabbing', or 'frightened child'. You MUST translate the emotional subtext of the PAGE TEXT into purely benign, safe, and descriptive visual terms. (e.g., instead of 'frightened child hiding from scary shadows', use 'child sitting quietly under a cozy tree root, tall soft purple tree silhouettes'). NEVER use words that trigger safety/privacy filters.

      EXACT TEXT OVERLAY RULE:
      "${cleanPageText}"
      Render this exact text ONCE ONLY. DO NOT wrap the text in brackets [ ]. Do not duplicate, rewrite, or misspell.
      
      FIMLU PREMIUM STANDARDS:
      1. ASPECT RATIO LOCK (STRICT PHASE 8): You MUST generate this image in a vertical 3:4 portrait aspect ratio (standard A4 vertical). Do NOT generate landscape, widescreen, or square images.
      2. ORGANIC TEXT INTEGRATION (NO BOXES): DO NOT generate flat, solid-color text boxes, letterboxing, or hard rectangular banners under the text. Compose the scene with natural negative space (e.g., open sky, soft grass) at the top or bottom.
      3. ${textMarginLock}
      4. COGNITIVE TYPOGRAPHY PADLOCK: ONLY chunky, high-contrast, rounded sans-serif or ultra-thick slab-serif fonts. 
      5. PROP ERADICATION RULE: Characters hold NO items unless explicitly demanded by the page text. Hands must remain empty otherwise.
      
      Return ONLY the plain-text prompt string. Do not return JSON.
    `;

    try {
      const plainText = await callLocalStoryEngine(prompt, null);
      if (!plainText || typeof plainText !== 'string') throw new Error("Invalid text response.");
      
      const sanitizedText = plainText.trim().replace(/^\[|\]$/g, '').replace(/\[|\]/g, '');

      setPagePrompts(prev => {
         const newPrompts = { ...prev, [pageNum]: sanitizedText };
         setTimeout(() => handleSaveDraft(true), 500); 
         return newPrompts;
      });
    } catch (e) {
      setPromptErrors(prev => ({ ...prev, [pageNum]: true }));
    } finally {
      setGeneratingPromptFor(null);
    }
  };

  const handleGeneratePageImage = async (pageNum) => {
    setIsGeneratingPageImageFor(pageNum);
    try { const imageUrl = await callImageAPI(pagePrompts[pageNum]); setPageImages(prev => { const updated = { ...prev, [pageNum]: imageUrl }; setTimeout(() => handleSaveDraft(true), 500); return updated; }); showToast(`Image generated!`); } catch (error) { showToast("Failed to generate image."); } finally { setIsGeneratingPageImageFor(null); }
  };

  // --- PHASE 3: HIGH-SPEED BATCH PROMPT GENERATOR ---
  const handleAutoGenerateAllPrompts = async () => {
    setIsAutoGenerating(true);
    let currentPrompts = { ...pagePrompts };
    const missingPages = storyPages.filter(p => !currentPrompts[p.pageNumber]);
    if (missingPages.length === 0) { setIsAutoGenerating(false); showToast("All prompts already generated!"); return; }

    const chunkSize = 10; 
    for (let i = 0; i < missingPages.length; i += chunkSize) {
      const chunk = missingPages.slice(i, i + chunkSize);
      const chunkDetails = chunk.map(p => {
         const cleanText = p.text.replace(/\[|\]/g, '');
         return `PAGE ${p.pageNumber}\nStory Text: "${cleanText}"\nAct Modifier: ${getDynamicEnvironment(p.pageNumber)}`;
      }).join('\n\n');

      const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { pageNumber: { type: "NUMBER" }, prompt: { type: "STRING" } }, required: ["pageNumber", "prompt"] } };

      const prompt = `
        You are generating a HIGH-SPEED BATCH of ${chunk.length} Google AI Flow image prompts.
        
        STRICT IDENTITY ANCHOR (PHASE 6 & 9 LOCK):
        Main Character: ${visualBible.mainCharacter}
        CRITICAL: The physical anatomy and species MUST remain 100% consistent across all pages. 
        
        REFERENCE IMAGE PADLOCK (CRITICAL):
        A reference image (the book cover) has been provided. You MUST use this reference image to achieve 100% Main Character consistency. 
        IF HUMAN: Strictly copy the character's face, hairstyle, skin color, top attire, lower attire, and shoes exactly as they appear in the reference image.
        IF ANIMAL: Strictly copy the exact species, fur/scale/skin markings, and attire/accessories exactly as they appear in the reference image.
        Do not change their clothing colors or physical traits.
        
        SAFETY & PRIVACY SANITIZATION (CRITICAL): 
        Image generation APIs will block prompts containing words like 'scary', 'fear', 'hiding', 'alone in the dark', 'monster', or 'frightened child'. You MUST translate the emotional subtext of the page text into purely benign, safe, and descriptive visual terms.
        
        FIMLU PREMIUM STANDARDS:
        1. ASPECT RATIO LOCK (STRICT PHASE 8): You MUST generate every image in a vertical 3:4 portrait aspect ratio (standard A4 vertical). Do NOT generate landscape, widescreen, or square images.
        2. EXACT TEXT OVERLAY: Always include: "[The exact page text]" followed by "Render this exact text ONCE ONLY." CRITICAL: DO NOT wrap the output text in brackets [ ] in the final image design.
        3. ORGANIC TEXT INTEGRATION (NO BOXES): DO NOT generate flat, solid-color text boxes, letterboxing, or hard rectangular banners. Compose with cinematic, natural negative space.
        4. DYNAMIC TEXT MARGIN LOCK (CRITICAL): For Pages 1-15, force a strict 15% safety margin on the left and right. For Pages 16-25, force a strict 20% safety margin on the left and right. Never stretch text full-width. Center-align the text.
        5. COGNITIVE TYPOGRAPHY PADLOCK: ONLY chunky, high-contrast, rounded sans-serif or ultra-thick slab-serif fonts. 
        6. PROP ERADICATION RULE: Characters hold NO items unless explicitly demanded by the page text. Hands must remain empty otherwise.
        
        PAGES TO GENERATE PROMPTS FOR:
        ${chunkDetails}
        
        Return an array of JSON objects containing the "pageNumber" and the fully constructed plain-text "prompt" string for that page. Make the prompts completely friendly to AI generation flows without any brackets.
      `;

      try {
        const data = await callLocalStoryEngine(prompt, schema);
        if (data && Array.isArray(data)) {
           data.forEach(item => {
              if (item.pageNumber && item.prompt) {
                 const sanitizedPrompt = item.prompt.trim().replace(/^\[|\]$/g, '').replace(/\[|\]/g, '');
                 currentPrompts[item.pageNumber] = sanitizedPrompt;
              }
           });
           setPagePrompts({ ...currentPrompts });
        }
      } catch (e) {
         console.error("Batch auto gen failed", e); showToast(`Auto-generation paused due to an API error. Click Auto-Generate to resume.`); break;
      }
    }
    
    setIsAutoGenerating(false); handleSaveDraft(true); showToast("High-Speed Batch generation completed!");
  };

  const handleSavePageEdit = (pageNum) => {
    setStoryPages(prev => prev.map(p => {
      if (p.pageNumber === pageNum) {
        let cleanText = editTextVal.replace(/\[|\]/g, '');
        let words = cleanText.split(/\s+/).filter(w => w.length > 0);
        let finalTxt = cleanText;
        if (pageNum <= 15 && words.length > 25) finalTxt = words.slice(0, 25).join(" ") + ".";
        return { ...p, text: finalTxt, wordCount: countWords(finalTxt) };
      }
      return p;
    }));
    setEditingPageId(null); showToast(`Page ${pageNum} updated.`); handleSaveDraft(true);
  };

  const handleRegeneratePage = async (pageNum) => {
    setRegeneratingPageId(pageNum);
    const schema = { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] };
    const prompt = `Rewrite ONLY Page ${pageNum} of "${selectedBook?.title}". Keep simple, child-friendly language. DO NOT use brackets [ ].`;
    try {
      const data = await callLocalStoryEngine(prompt, schema);
      let newText = (data.text || "").replace(/\[|\]/g, '');
      let words = newText.split(/\s+/).filter(w => w.length > 0);
      if (pageNum <= 15 && words.length > 25) newText = words.slice(0, 25).join(" ") + ".";
      setStoryPages(prev => prev.map(p => p.pageNumber === pageNum ? { ...p, text: newText, wordCount: countWords(newText) } : p));
      showToast(`Page ${pageNum} regenerated.`); handleSaveDraft(true);
    } catch (e) { showToast("Failed to regenerate page."); } finally { setRegeneratingPageId(null); }
  };

  // --- VIEWS ---
  const renderHome = () => (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex justify-end mb-6">
         <button onClick={loadDraftsList} className="bg-indigo-100 text-indigo-700 font-bold py-2 px-6 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-2 shadow-sm dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800">
           <List className="w-4 h-4" /> SAVED BOOKS
         </button>
      </div>
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">FIMLU CREATOR TOOL</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Premium production suite for children's publishing. Select a generator to begin crafting engaging, high-quality content.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button onClick={() => setView('generator')} className="col-span-1 lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-6 opacity-20 transition-transform group-hover:scale-110"><BookOpen size={120} /></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm"><BookOpen className="text-white" size={28} /></div>
            <h2 className="text-3xl font-bold text-white mb-2">Storybook Title Generator</h2>
            <p className="text-indigo-100 max-w-md text-lg">Generate perfectly balanced, emotionally resonant titles ready for premium story development.</p>
          </div>
        </button>
        {['Thumbnail Generator', 'Promotional Generator', 'Activity Generator', 'Coloring Book Generator'].map((label, idx) => (
          <button key={idx} onClick={() => showToast("Coming in a future update.")} className="group relative overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 text-left transition-all hover:shadow-md">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{label}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Additional functionality module.</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSavedBooks = () => (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-32 animate-in fade-in zoom-in-95">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <button onClick={() => setView('home')} className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium transition-colors"><ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard</button>
        
        <div className="flex flex-wrap gap-3">
           <button onClick={handleExportAllData} className="text-sm font-bold bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-full hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4"/> BACKUP DATA
           </button>
           <label className="text-sm font-bold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full hover:bg-indigo-100 flex items-center gap-2 cursor-pointer transition-colors">
              <UploadCloud className="w-4 h-4"/> IMPORT DATA
              <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
           </label>
        </div>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">MY SAVED BOOKS</h2>
        <p className="text-slate-600 dark:text-slate-400">Resume your preserved storybook projects across sessions.</p>
      </div>
      
      {savedDrafts.length === 0 ? (
         <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-500 font-medium text-lg">No saved books yet.</p>
         </div>
      ) : (
         <div className="space-y-6">
           {savedDrafts.map(draft => (
             <div key={draft.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div>
                 <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-serif mb-2">{draft.title}</h3>
                 <p className="text-xs text-slate-400 font-medium">Last Saved: {new Date(draft.updatedAt).toLocaleString()}</p>
               </div>
               <button onClick={() => handleOpenDraft(draft)} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 shadow-md">OPEN DRAFT</button>
             </div>
           ))}
         </div>
      )}
    </div>
  );

  const renderTitleGenerator = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <button onClick={() => setView('home')} className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium mb-8 transition-colors"><ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard</button>
      <div className="mb-10"><h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Storybook Title Generator</h2></div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Story Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 font-medium">
              <option value="" disabled>Select...</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {category === 'Other / Custom Category' && (<input type="text" placeholder="Enter custom category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 mt-2 font-medium" />)}
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Target Age</label>
            <select value={targetAge} onChange={(e) => setTargetAge(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 font-medium">
              {TARGET_AGES.map(age => <option key={age} value={age}>{age}</option>)}
            </select>
            {targetAge === 'Custom Age' && (<input type="text" placeholder="e.g., Ages 2-4" value={customAge} onChange={(e) => setCustomAge(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 mt-2 font-medium" />)}
          </div>
        </div>
        <button onClick={() => handleGenerateTitles(false)} disabled={!isFormValid || isLoadingTitles} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${(!isFormValid || isLoadingTitles) ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isLoadingTitles ? <RotateCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} GENERATE TITLES
        </button>
      </div>

      {titles.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Generated Concepts</h3>
          {titles.map((t, index) => {
            const isTop = t.rank === 1;
            return (
              <div key={t.id} className={`bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border-2 ${isTop ? 'border-amber-300 dark:border-amber-500 bg-amber-50/10' : 'border-slate-100 dark:border-slate-700'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm">#{t.rank}</span>{isTop && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold px-3 py-1 rounded-full">TOP RECOMMENDATION</span>}</div>
                </div>
                <h4 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-6 font-serif">{t.title}</h4>
                <div className="mb-6"><span className="font-bold text-sm text-slate-800 dark:text-slate-300 mr-2">Why This Works:</span><span className="text-slate-600 dark:text-slate-400">{t.whyItWorks}</span></div>
                <div className="flex flex-wrap justify-end gap-6 border-t border-slate-100 dark:border-slate-700 pt-5">
                  <button onClick={() => handleRegenerateSingleTitle(t, index)} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">REGENERATE</button>
                  <button onClick={() => handleGenerateStorybook(t)} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">GENERATE STORYBOOK</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderBriefGenerator = () => {
    const completedCount = getCompletedCount();
    const totalCount = BRIEF_FIELDS.length;

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setView('generator')} className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium"><ChevronLeft className="w-5 h-5 mr-1" /> Back to Titles</button>
          <button onClick={() => handleSaveDraft(false)} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-4 py-2 rounded-full hover:bg-indigo-100 flex items-center gap-2"><Save className="w-4 h-4"/> SAVE DRAFT</button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 border-t-4 border-t-indigo-500">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 font-serif">{selectedBook?.title}</h2>
          <div className="flex gap-4 text-sm font-medium">
            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">{selectedBook?.category}</span>
            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">{selectedBook?.age}</span>
          </div>
        </div>

        {isLoadingBrief && (
          <div className="text-center py-16"><RotateCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-6" /><h2 className="text-2xl font-bold dark:text-white">Generating...</h2></div>
        )}

        {!isLoadingBrief && !briefError && (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div><h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Storybook Creation Brief</h3></div>
              <div className="flex gap-4">
                <span className="text-sm font-bold text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full">{completedCount} / {totalCount} Complete</span>
                <button onClick={handleAcceptAll} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-full text-sm">ACCEPT ALL</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {BRIEF_FIELDS.map(field => {
                  const suggestions = briefSuggestions[field.id] || [];
                  const value = briefData[field.id] || '';
                  const customVal = customBriefData[field.id] || '';
                  
                  return (
                    <div key={field.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-4 focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/30">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">{field.label}</label>
                        <button onClick={() => handleRegenerateField(field.id)} className="text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">Regenerate</button>
                      </div>
                      <select value={value} onChange={(e) => setBriefData({ ...briefData, [field.id]: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 font-medium">
                        <option value="" disabled>Select...</option>
                        {suggestions.map((sug, i) => <option key={i} value={sug}>{sug}</option>)}
                        <option value="CUSTOM">Enter My Own...</option>
                      </select>
                      {value === 'CUSTOM' && (<textarea value={customVal} onChange={(e) => setCustomBriefData({ ...customBriefData, [field.id]: e.target.value })} className="w-full mt-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 min-h-[80px]" />)}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-3xl p-6 sticky top-6 border dark:border-slate-700">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Book Foundation</h4>
                  <div className="space-y-4 mb-6">
                    <div><span className="block text-xs text-slate-400 mb-1">One Problem:</span><span className="text-sm font-semibold">{getFinalValue('parentProblem') || 'Not selected'}</span></div>
                    <div><span className="block text-xs text-slate-400 mb-1">One Skill:</span><span className="text-sm font-semibold">{getFinalValue('targetSkill') || 'Not selected'}</span></div>
                    <div><span className="block text-xs text-slate-400 mb-1">One Action:</span><span className="text-sm font-semibold">{getFinalValue('childAction') || 'Not selected'}</span></div>
                  </div>
                  {warnings.foundation && (<div className="bg-rose-500/20 text-rose-200 p-4 rounded-xl text-sm mb-4">⚠ {warnings.foundation}</div>)}
                  {warnings.world && (<div className="bg-amber-500/20 text-amber-200 p-4 rounded-xl text-sm mt-4">⚠ {warnings.world}</div>)}
                  <div className="mt-8 pt-6 border-t border-slate-700">
                    <button onClick={handleGenerateCompleteStorybook} disabled={!isBriefComplete} className={`w-full py-4 rounded-xl font-bold flex justify-center gap-2 ${isBriefComplete ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-500'}`}>GENERATE COMPLETE STORYBOOK</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderProducing = () => {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-in fade-in zoom-in-95">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">STORYBOOK PRODUCTION</h2>
          {productionError ? (
            <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl font-bold flex flex-col items-center gap-4">
               Generation failed. Your data is safe.
               <button onClick={() => setView(productionErrorView)} className="bg-white border border-slate-200 py-2 px-6 rounded-full">Back</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <RotateCw className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">{productionStageLabel}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReview = () => {
    const activeCover = coverVariants[activeCoverVariant];
    const activeImage = coverImages[activeCoverVariant];
    const isRegenActive = isRegeneratingCoverVariant === activeCoverVariant;
    const isImageActive = isGeneratingCoverImageFor === activeCoverVariant;

    return (
      <div className="max-w-4xl mx-auto px-4 py-12 pb-32 animate-in fade-in zoom-in-95">
         <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">REVIEW STORY — PAGES 1–{storyPages.length}</h2>
         </div>
         <div className="flex justify-end mb-6">
             <button onClick={() => handleSaveDraft(false)} className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 px-4 py-2 rounded-full hover:bg-indigo-100 flex items-center gap-2"><Save className="w-4 h-4"/> SAVE DRAFT</button>
         </div>

         <div className="space-y-6">
            {storyPages.map((p) => {
               const isEditing = editingPageId === p.pageNumber;
               return (
                  <div key={p.pageNumber} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden`}>
                     <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-sm uppercase text-slate-500 dark:text-slate-400">Page {p.pageNumber} — {p.section}</span>
                        <span className="text-xs font-bold px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full">Word Count: {p.wordCount}</span>
                     </div>
                     <div className="p-5 md:p-6">
                        {isEditing ? (
                           <div className="space-y-4">
                              <textarea value={editTextVal} onChange={(e) => setEditTextVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4 font-serif min-h-[120px]" />
                              <div className="flex justify-end gap-3">
                                 <button onClick={() => setEditingPageId(null)} className="text-sm font-bold text-slate-500 dark:text-slate-400 px-4 py-2">CANCEL</button>
                                 <button onClick={() => handleSavePageEdit(p.pageNumber)} className="text-sm font-bold bg-indigo-600 text-white px-5 py-2 rounded-lg">SAVE TEXT</button>
                              </div>
                           </div>
                        ) : (
                           <div>
                              <p className="text-lg text-slate-800 dark:text-slate-200 font-serif leading-relaxed mb-6">{p.text}</p>
                              <div className="flex gap-4">
                                 <button onClick={() => { setEditingPageId(p.pageNumber); setEditTextVal(p.text); }} className="text-xs font-bold text-indigo-500 border border-indigo-100 dark:border-indigo-900/50 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30">EDIT</button>
                                 <button onClick={() => handleRegeneratePage(p.pageNumber)} className="text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">REGENERATE</button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
         
         {visualBible && (
            <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 mt-12 animate-in fade-in zoom-in-95">
               <div className="flex items-center gap-2 mb-6 border-b dark:border-slate-700 pb-4">
                  <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Character & Visual Bible (Demographic Lock Active)</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700"><h4 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">1. Main Character</h4><p className="text-sm text-slate-700 dark:text-slate-300">{visualBible.mainCharacter}</p></div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700"><h4 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">2. Supporting Characters</h4><p className="text-sm text-slate-700 dark:text-slate-300">{visualBible.supportingCharacters}</p></div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700"><h4 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">3. Recurring Objects</h4><p className="text-sm text-slate-700 dark:text-slate-300">{visualBible.recurringObjects}</p></div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700"><h4 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">4. Story World</h4><p className="text-sm text-slate-700 dark:text-slate-300">{visualBible.storyWorld}</p></div>
               </div>
            </section>
         )}

         {/* 5-TIER MULTI-VARIANT COVER PRODUCTION SUITE */}
         {coverVariants.v1 && (
            <section className="bg-slate-900 rounded-3xl p-6 md:p-8 mt-12 animate-in fade-in zoom-in-95 text-white">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-slate-700 pb-6">
                  <div>
                     <h3 className="text-2xl font-extrabold text-white mb-1">A/B TESTING COVER SUITE</h3>
                     <p className="text-slate-400 text-sm">Select a variant to view prompt, generate image, or export.</p>
                  </div>
               </div>

               {/* VARIANT TABS */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                  <button 
                    onClick={() => setActiveCoverVariant('v1')} 
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${activeCoverVariant === 'v1' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md ring-2 ring-emerald-500/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
                  >
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                        <div className="font-extrabold text-sm text-white">V1 CHAMPION</div>
                     </div>
                     <div className="text-xs text-emerald-300/80">Control / Baseline</div>
                  </button>

                  <button 
                    onClick={() => setActiveCoverVariant('v2')} 
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${activeCoverVariant === 'v2' ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-500/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
                  >
                     <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 shrink-0 text-amber-400" />
                        <div className="font-extrabold text-sm text-white">V2 CHALLENGER</div>
                     </div>
                     <div className="text-xs text-amber-300/80">Action / High Stakes</div>
                  </button>

                  <button 
                    onClick={() => setActiveCoverVariant('v3')} 
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${activeCoverVariant === 'v3' ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-md ring-2 ring-rose-500/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
                  >
                     <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 shrink-0 text-rose-400" />
                        <div className="font-extrabold text-sm text-white">V3 CHALLENGER</div>
                     </div>
                     <div className="text-xs text-rose-300/80">Emotional / Triumph</div>
                  </button>

                  <button 
                    onClick={() => setActiveCoverVariant('v4')} 
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${activeCoverVariant === 'v4' ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-md ring-2 ring-purple-500/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
                  >
                     <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 shrink-0 text-purple-400" />
                        <div className="font-extrabold text-sm text-white">V4 HOLY GRAIL</div>
                     </div>
                     <div className="text-xs text-purple-300/80">Active Resolution</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveCoverVariant('v5')} 
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${activeCoverVariant === 'v5' ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-md ring-2 ring-indigo-500/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
                  >
                     <div className="flex items-center gap-2">
                        <Film className="w-5 h-5 shrink-0 text-indigo-400" />
                        <div className="font-extrabold text-sm text-white">V5 ENSEMBLE</div>
                     </div>
                     <div className="text-xs text-indigo-300/80">Cinematic Climax</div>
                  </button>
               </div>

               {/* ACTIVE VARIANT DISPLAY */}
               {activeCover && (
                 <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 mb-6">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                          {activeCoverVariant.toUpperCase()} — {activeCover.label}
                       </span>
                       <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
                          {activeCover.hook}
                       </span>
                    </div>
                    
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
                       <p className="font-mono text-sm whitespace-pre-wrap text-slate-200">{activeCover.prompt}</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                       <button onClick={() => handleCopyPrompt(activeCover.prompt)} className="bg-indigo-500 font-bold py-2.5 px-5 rounded-full text-sm hover:bg-indigo-400 flex items-center gap-2">
                          <Copy className="w-4 h-4"/> COPY {activeCoverVariant.toUpperCase()} PROMPT
                       </button>
                       <button onClick={() => handleGenerateCoverImage(activeCoverVariant)} disabled={isImageActive} className="bg-amber-500 text-amber-950 font-bold py-2.5 px-5 rounded-full text-sm flex items-center gap-2 hover:bg-amber-400">
                          {isImageActive ? <RotateCw className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} 
                          GENERATE {activeCoverVariant.toUpperCase()} IMAGE
                       </button>
                       <button onClick={() => handleRegenerateSingleCover(activeCoverVariant)} disabled={isRegenActive} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-full text-sm flex items-center gap-2">
                          {isRegenActive ? <RotateCw className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />} 
                          REGENERATE {activeCoverVariant.toUpperCase()} ONLY
                       </button>
                    </div>

                    {activeImage && (
                      <div className="mt-6 border-t border-slate-800 pt-6 animate-in fade-in">
                        <h4 className="text-sm font-bold text-amber-400 mb-4">GENERATED {activeCoverVariant.toUpperCase()} ASSET</h4>
                        <img src={activeImage} alt={`Generated Cover ${activeCoverVariant}`} className="w-full max-w-sm rounded-xl border border-slate-700 shadow-xl" />
                      </div>
                    )}
                 </div>
               )}
            </section>
         )}

         <div className="pt-12 text-center flex flex-col items-center gap-4">
            {storyPages.length === 15 && <button onClick={handleGenerateLearningPages} className="bg-slate-900 dark:bg-indigo-600 text-white font-extrabold py-4 px-10 rounded-full hover:bg-indigo-700 shadow-xl">CONTINUE STORYBOOK PRODUCTION</button>}
            {storyPages.length === 25 && !visualBible && <button onClick={handleGenerateVisualBible} className="bg-emerald-600 text-white font-extrabold py-4 px-10 rounded-full shadow-xl hover:bg-emerald-700">CONTINUE TO VISUAL PRODUCTION</button>}
            {visualBible && !coverVariants.v1 && <button onClick={handleGenerateCoverPrompt} className="bg-purple-600 text-white font-extrabold py-4 px-10 rounded-full shadow-xl hover:bg-purple-700">CONTINUE TO COVER SUITE (V1 - V5)</button>}
            {coverVariants.v1 && <button onClick={() => { setCurrentPageProduction(1); setView('page_production'); }} className="bg-amber-500 text-amber-950 font-extrabold py-4 px-10 rounded-full shadow-xl hover:bg-amber-400">CONTINUE TO PAGE PROMPTS</button>}
         </div>
      </div>
    );
  };

  // --- SINGLE DYNAMIC COMPONENT FOR ALL PAGES ---
  const renderPageProduction = () => {
    const pageNum = currentPageProduction;
    const page = storyPages.find(p => p.pageNumber === pageNum);
    const currentPrompt = pagePrompts[pageNum];
    const currentImage = pageImages[pageNum];
    const isGenerating = generatingPromptFor === pageNum;
    const isGeneratingImage = isGeneratingPageImageFor === pageNum;
    const hasError = promptErrors[pageNum];
    const totalPages = storyPages.length;
    
    const isBookComplete = storyPages.length > 0 && Object.keys(pagePrompts).length === totalPages;
    const generatedCount = Object.keys(pagePrompts).length;

    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in zoom-in-95 pb-32">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
          
          <div className="absolute top-6 right-6 hidden sm:block">
             <button onClick={() => handleSaveDraft(false)} className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1.5 z-10 relative"><Save className="w-3.5 h-3.5"/> SAVE DRAFT</button>
          </div>
          
          <div className="mb-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">PAGE {pageNum} PRODUCTION</h2>
            <p className="text-slate-600 dark:text-slate-400">Generate the complete Google AI Flow prompt and Premium Image.</p>
          </div>
          
          {page ? (
            <div className="space-y-6 relative z-10">
              <div className="bg-slate-50 dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Page {pageNum} Exact Story Text</span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Word Count: {page.wordCount}</span>
                </div>
                <p className="text-lg text-slate-800 dark:text-slate-200 font-serif leading-relaxed">{page.text}</p>
              </div>

              {/* PHASE 3 HIGH-SPEED BATCH PROGRESS UI */}
              {isAutoGenerating && (
                <div className="text-center py-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 mt-8 animate-in fade-in zoom-in-95">
                  <RotateCw className="w-12 h-12 text-indigo-500 dark:text-indigo-400 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-extrabold text-indigo-900 dark:text-indigo-300 mb-2">High-Speed Batch Generation Active...</h3>
                  <p className="text-indigo-700 dark:text-indigo-400 font-bold mb-6">Processing multiple pages simultaneously. Enforcing strict character consistency. Do not close this window.</p>
                  <div className="w-full max-w-md mx-auto bg-indigo-200 dark:bg-indigo-900 rounded-full h-4 mb-3 overflow-hidden">
                    <div className="bg-indigo-600 h-4 rounded-full transition-all duration-300" style={{ width: `${(generatedCount / totalPages) * 100}%` }}></div>
                  </div>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{generatedCount} of {totalPages} Prompts Generated</p>
                </div>
              )}

              {!currentPrompt && !isGenerating && !hasError && !isAutoGenerating && (
                <div className="flex flex-col gap-4 pt-8 mt-8 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => handleGeneratePagePrompt(pageNum)} 
                      className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
                    >
                      <Sparkles className="w-5 h-5 shrink-0" /> GENERATE THIS PAGE ONLY
                    </button>
                    <button 
                      onClick={handleAutoGenerateAllPrompts} 
                      className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
                    >
                      <Zap className="w-5 h-5 shrink-0" /> BATCH-GENERATE ALL REMAINING (FAST)
                    </button>
                  </div>
                </div>
              )}

              {isGenerating && !isAutoGenerating && (
                <div className="text-center py-12">
                  <RotateCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-bold text-indigo-600 animate-pulse">Generating Page {pageNum} prompt…</p>
                </div>
              )}

              {hasError && !isAutoGenerating && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 p-6 rounded-2xl font-bold text-center mt-8">
                  <AlertTriangle className="w-10 h-10 mx-auto text-rose-500 mb-4" />
                  <p>Prompt generation failed.</p>
                  <button onClick={() => handleGeneratePagePrompt(pageNum)} className="bg-indigo-600 text-white py-2 px-6 rounded-full mt-4">RETRY</button>
                </div>
              )}

              {currentPrompt && !isGenerating && !isAutoGenerating && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 mt-8">
                  <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> PAGE {pageNum} — GOOGLE AI FLOW PROMPT
                    </h3>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto mb-6">
                      <p className="text-slate-200 text-sm leading-relaxed font-mono whitespace-pre-wrap break-words">{currentPrompt}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => handleCopyPrompt(currentPrompt)} className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 px-6 rounded-full flex gap-2 text-sm">
                        <Copy className="w-4 h-4" /> COPY PROMPT
                      </button>
                      <button onClick={() => handleGeneratePageImage(pageNum)} disabled={isGeneratingImage} className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-2.5 px-6 rounded-full flex items-center gap-2 text-sm">
                        {isGeneratingImage ? <RotateCw className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                        GENERATE PREMIUM IMAGE
                      </button>
                      <button onClick={() => handleGeneratePagePrompt(pageNum)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-6 rounded-full flex gap-2 text-sm">
                        <RotateCw className="w-4 h-4" /> REGENERATE PROMPT
                      </button>
                    </div>

                    {currentImage && (
                      <div className="mt-6 border-t border-slate-700 pt-6 animate-in fade-in">
                        <h4 className="text-sm font-bold text-amber-400 mb-4">GENERATED PAGE {pageNum} ASSET</h4>
                        <img src={currentImage} alt={`Generated Page ${pageNum}`} className="w-full max-w-sm rounded-xl border border-slate-700 shadow-xl" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NAVIGATION & DOWNLOAD FOOTER */}
              {!isAutoGenerating && (
                <div className="pt-8 text-center border-t border-slate-100 dark:border-slate-700 flex flex-col items-center gap-6">
                  
                  {isBookComplete && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 p-6 rounded-2xl w-full animate-in fade-in zoom-in">
                      <h3 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-300 mb-2">🎉 All Prompts Generated!</h3>
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium mb-6">Your entire storybook is ready to be exported.</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                          onClick={handleDownloadDoc} 
                          className="bg-emerald-600 text-white font-extrabold text-base md:text-lg py-4 px-8 rounded-full hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-xl w-full sm:w-auto"
                        >
                          <FileDown className="w-5 h-5 shrink-0" /> DOWNLOAD FULL DOC (WORD)
                        </button>
                        <button 
                          onClick={() => setView('home')} 
                          className="bg-slate-800 text-white font-extrabold text-base md:text-lg py-4 px-8 rounded-full hover:bg-slate-900 flex items-center justify-center gap-2 shadow-xl w-full sm:w-auto"
                        >
                          GO TO DASHBOARD
                        </button>
                      </div>
                    </div>
                  )}

                  {pageNum < totalPages && !isBookComplete && currentPrompt && (
                    <button 
                      onClick={() => setCurrentPageProduction(pageNum + 1)} 
                      className="bg-slate-900 dark:bg-indigo-600 text-white font-extrabold text-lg py-4 px-10 rounded-full hover:bg-indigo-700 w-full sm:w-auto shadow-xl"
                    >
                      CONTINUE TO PAGE {pageNum + 1}
                    </button>
                  )}
                  
                  <button 
                    onClick={() => { pageNum === 1 ? setView('review') : setCurrentPageProduction(pageNum - 1) }} 
                    className="text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-800 dark:hover:text-white transition-colors flex items-center justify-center gap-1 mt-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Go Back to {pageNum === 1 ? 'Cover' : `Page ${pageNum - 1}`}
                  </button>

                  {/* Allows moving forward if prompt isn't generated yet, but book is complete elsewhere */}
                  {pageNum < totalPages && isBookComplete && (
                    <button 
                      onClick={() => setCurrentPageProduction(pageNum + 1)} 
                      className="text-indigo-500 font-bold text-sm hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1"
                    >
                      Skip to Page {pageNum + 1} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
               <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
               <p className="text-slate-600 font-bold mb-6">Page data not found.</p>
               <button onClick={() => setView('review')} className="bg-indigo-600 text-white px-6 py-3 font-bold rounded-full">Back to Review</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary onRecover={() => setView('brief')}>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-300">
        
        {/* CSS Override for Easy Tailwind Dark Mode Compatibility */}
        <style>{`
          .dark .bg-white { background-color: #1e293b !important; border-color: #334155 !important; color: #f8fafc !important; }
          .dark .bg-slate-50 { background-color: #0f172a !important; border-color: #334155 !important; color: #f8fafc !important; }
          .dark .text-slate-900, .dark .text-slate-800, .dark .text-slate-700 { color: #f8fafc !important; }
          .dark .text-slate-600, .dark .text-slate-500 { color: #cbd5e1 !important; }
          .dark .border-slate-200, .dark .border-slate-100 { border-color: #334155 !important; }
        `}</style>

        {/* Global Floating Action Bar */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button onClick={() => setIsApiModalOpen(true)} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Local Engine
          </button>
          <button onClick={toggleTheme} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* API Settings Modal Overlay */}
        {isApiModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Local Engine</h2>
                <button onClick={() => setIsApiModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold p-2 bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors">Close</button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-1">100% Browser-Local Mode</h3>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">Titles, briefs, story pages, visual bibles, cover prompts, page prompts, drafts, backups, and preview assets are generated directly in this browser. No API key, account, server, or external generation endpoint is required.</p>
                    </div>
                  </div>
                </div>

                <button onClick={handleTestApi} disabled={isTestingApi} className="w-full bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2">
                  {isTestingApi ? <RotateCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Check Local Engine
                </button>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Mode:</strong> Deterministic local story engine + local SVG preview generator. Your saved books remain in this device/browser through IndexedDB.
                </div>

                {apiTestStatus && <div className="text-sm font-bold text-center mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg dark:text-white">{apiTestStatus}</div>}
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button onClick={handleSaveApi} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'home' && renderHome()}
        {view === 'saved_books' && renderSavedBooks()}
        {view === 'generator' && renderTitleGenerator()}
        {view === 'brief' && renderBriefGenerator()}
        {view === 'producing' && renderProducing()}
        {view === 'review' && renderReview()}
        {view === 'page_production' && renderPageProduction()}
        
        {!['home', 'saved_books', 'generator', 'brief', 'producing', 'review', 'page_production'].includes(view) && (
           <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-in fade-in zoom-in-95">
             <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
             <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">APPLICATION STATE ERROR</h2>
             <button onClick={() => setView('brief')} className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-full mt-4">
               Return to Storybook Brief
             </button>
           </div>
        )}

        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </div>
    </ErrorBoundary>
  );
}