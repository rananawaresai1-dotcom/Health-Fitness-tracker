import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dumbbell, Flame, Leaf, Apple, Clock, ChevronRight, Play, X,
  CheckCircle, Menu, Star, Target, Trophy, Calculator,
  Pencil, Save, RotateCcw, LogOut, Droplets, Footprints, Moon,
  Salad, Scale, Pill, ListChecks, CheckSquare, Square, Award,
  ChevronDown, Crown, TrendingUp, Calendar, Activity, Shield,
  Eye, EyeOff, BarChart2, Dna, ClipboardList, Headphones,
  Beaker, Sparkles,
} from "lucide-react";

// ─── Storage ─────────────────────────────────────────────────────────────────
const db = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === "undefined") return fallback;
      return JSON.parse(raw) as T;
    } catch { return fallback; }
  },
  set(key: string, val: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  del(key: string): void { try { localStorage.removeItem(key); } catch {} },
};

// ─── Types ───────────────────────────────────────────────────────────────────
type DietTab    = "veg" | "nonveg";
type WorkoutCat = "all" | "strength" | "cardio" | "flexibility";
type BMICat     = "underweight" | "normal" | "overweight" | "obese";
type AuthMode   = "login" | "register" | "profile" | "forgot" | "reset";
type PlanName   = "Basic" | "Pro" | "Elite" | "";

interface AppUser {
  id: string; name: string; email: string;
  plan: PlanName; planStartDate: string; joinedAt: string;
  age: number; gender: "male" | "female";
  heightCm: number; weightKg: number;
  bmi: number | null; bmiCat: BMICat | null;
  calorieGoal: number; totalPoints: number;
}
interface Meal  { time: string; name: string; baseCal: number; protein: string; items: string[]; }
interface Video { id: string; title: string; dur: string; level: string; cat: WorkoutCat; ytId: string; muscle: string; photo: string; bmiTags: BMICat[]; }

// ─── Constants ───────────────────────────────────────────────────────────────
const PLAN_RANK: Record<PlanName, number> = { "": 0, Basic: 1, Pro: 2, Elite: 3 };
const hasAccess = (user: AppUser | null, min: PlanName) =>
  !!user && PLAN_RANK[user.plan] >= PLAN_RANK[min];

const PLANS = [
  {
    name: "Basic" as PlanName, price: 99, badge: "", border: "border-white/20",
    cta: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    icon: <Shield size={20} />,
    tagline: "Start your journey",
    features: [
      { text: "Gym access (6 AM – 10 PM)", included: true },
      { text: "Daily task tracker (8 habits)", included: true },
      { text: "Basic diet overview", included: true },
      { text: "Locker & shower facility", included: true },
      { text: "Points & leaderboard", included: true },
      { text: "Full 6-meal diet plans", included: false },
      { text: "BMI calculator & analytics", included: false },
      { text: "Workout video library", included: false },
      { text: "Calorie goal editor", included: false },
      { text: "Personal trainer sessions", included: false },
      { text: "Body composition analysis", included: false },
      { text: "Elite supplement guide", included: false },
    ],
  },
  {
    name: "Pro" as PlanName, price: 199, badge: "POPULAR", border: "border-[#e63000]",
    cta: "bg-[#e63000] hover:bg-[#cc2a00] text-white",
    icon: <Star size={20} />,
    tagline: "For serious athletes",
    features: [
      { text: "24/7 Gym access", included: true },
      { text: "Daily task tracker (8 habits)", included: true },
      { text: "Full 6-meal diet plans (Veg & Non-Veg)", included: true },
      { text: "BMI calculator & analytics", included: true },
      { text: "Workout video library (demo library, 11 workouts)", included: true },
      { text: "Points & leaderboard", included: true },
      { text: "Progress tracking dashboard", included: true },
      { text: "Calorie goal editor", included: false },
      { text: "Personal trainer sessions", included: false },
      { text: "Body composition analysis", included: false },
      { text: "Elite supplement guide", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Elite" as PlanName, price: 299, badge: "BEST VALUE", border: "border-yellow-400",
    cta: "bg-yellow-400 hover:bg-yellow-300 text-black",
    icon: <Crown size={20} />,
    tagline: "The complete transformation",
    features: [
      { text: "24/7 Gym access + exclusive hours", included: true },
      { text: "Daily task tracker (8 habits)", included: true },
      { text: "Full 6-meal diet plans (Veg & Non-Veg)", included: true },
      { text: "BMI calculator & analytics", included: true },
      { text: "Workout video library (demo library, 11 workouts)", included: true },
      { text: "Editable calorie & macro goals", included: true },
      { text: "Personal trainer sessions [Demo]", included: true },
      { text: "Body composition estimate (BMI-based)", included: true },
      { text: "BMI-matched supplement guide", included: true },
      { text: "BMI-matched smart workout filter", included: true },
      { text: "Monthly progress report [Demo]", included: true },
      { text: "Priority support [Demo]", included: true },
    ],
  },
];

const BMI_META: Record<BMICat, { label: string; color: string; bg: string; border: string; goal: string; calMult: number }> = {
  underweight: { label: "Underweight",    color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   goal: "Gain lean muscle with caloric surplus",       calMult: 1.2  },
  normal:      { label: "Healthy Weight", color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  goal: "Maintain weight & build functional strength", calMult: 1.0  },
  overweight:  { label: "Overweight",     color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", goal: "Moderate caloric deficit with cardio focus",  calMult: 0.85 },
  obese:       { label: "Obese",          color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    goal: "Structured fat loss, low-impact training",   calMult: 0.75 },
};

const TASKS = [
  { id: "water",   label: "Drink 3L of water",        sub: "Hydrate consistently through the day",      cat: "Hydration",   pts: 10, icon: <Droplets   size={15}/> },
  { id: "workout", label: "Complete today's workout",  sub: "Follow your assigned workout plan",         cat: "Training",    pts: 30, icon: <Dumbbell    size={15}/> },
  { id: "meals",   label: "Log all 6 meals",           sub: "Track every meal in your diet plan",        cat: "Nutrition",   pts: 20, icon: <Salad       size={15}/> },
  { id: "steps",   label: "Hit 10,000 steps",          sub: "Walk or jog to hit your step goal",         cat: "Cardio",      pts: 20, icon: <Footprints  size={15}/> },
  { id: "sleep",   label: "Sleep 7–8 hours",           sub: "Quality rest powers recovery",              cat: "Recovery",    pts: 15, icon: <Moon        size={15}/> },
  { id: "stretch", label: "10-min stretch or yoga",    sub: "Flexibility reduces injury risk",           cat: "Flexibility", pts: 15, icon: <Target      size={15}/> },
  { id: "weigh",   label: "Log today's weight",        sub: "Track progress consistently",               cat: "Check-in",    pts: 10, icon: <Scale       size={15}/> },
  { id: "supps",   label: "Take daily supplements",    sub: "Vitamins, protein, or as prescribed",       cat: "Nutrition",   pts: 10, icon: <Pill        size={15}/> },
];
const MAX_PTS = TASKS.reduce((s, t) => s + t.pts, 0);

const VEG_MEALS: Meal[] = [
  { time: "7:00 AM",  name: "Breakfast",    baseCal: 420, protein: "22g", items: ["Overnight oats with chia seeds", "Sliced banana & berries", "Almond milk protein shake"] },
  { time: "10:30 AM", name: "Mid-Morning",  baseCal: 210, protein: "14g", items: ["Greek yogurt with honey", "Mixed nuts", "Green apple"] },
  { time: "1:00 PM",  name: "Lunch",        baseCal: 620, protein: "28g", items: ["Brown rice or quinoa", "Yellow dal tadka", "Paneer bhurji", "Mixed sabzi", "Raita"] },
  { time: "4:00 PM",  name: "Pre-Workout",  baseCal: 280, protein: "10g", items: ["Banana with peanut butter", "Whole wheat toast", "Black coffee"] },
  { time: "7:00 PM",  name: "Post-Workout", baseCal: 380, protein: "32g", items: ["Plant whey shake", "Paneer tikka skewers", "Sweet potato mash"] },
  { time: "9:00 PM",  name: "Dinner",       baseCal: 520, protein: "24g", items: ["Multigrain roti (2)", "Palak tofu curry", "Mixed salad", "Turmeric milk"] },
];
const NV_MEALS: Meal[] = [
  { time: "7:00 AM",  name: "Breakfast",    baseCal: 480, protein: "34g", items: ["4 egg whites + 1 whole egg", "Whole wheat toast", "Avocado", "Orange juice"] },
  { time: "10:30 AM", name: "Mid-Morning",  baseCal: 240, protein: "28g", items: ["Grilled chicken breast 100g", "Apple or pear", "Almonds"] },
  { time: "1:00 PM",  name: "Lunch",        baseCal: 680, protein: "48g", items: ["Brown rice", "Grilled chicken thigh", "Egg bhurji", "Steamed broccoli & carrots"] },
  { time: "4:00 PM",  name: "Pre-Workout",  baseCal: 260, protein: "18g", items: ["2 boiled eggs", "Banana", "Black coffee or green tea"] },
  { time: "7:00 PM",  name: "Post-Workout", baseCal: 440, protein: "46g", items: ["Whey protein shake", "Tuna sandwich on whole wheat", "Greek yogurt"] },
  { time: "9:00 PM",  name: "Dinner",       baseCal: 540, protein: "42g", items: ["Grilled salmon 200g", "Baked sweet potato", "Sautéed spinach", "Bone broth"] },
];

const VIDEOS: Video[] = [
  { id:"1",  title:"Full Body Strength Blitz",  dur:"45 min", level:"Intermediate", cat:"strength",    ytId:"UItWltVZZmE", muscle:"Full Body",                photo:"photo-1534438327276-14e5300c3a48", bmiTags:["normal","overweight"] },
  { id:"2",  title:"Chest & Triceps Power",     dur:"38 min", level:"Advanced",     cat:"strength",    ytId:"gey73xiS8F4", muscle:"Chest, Triceps",           photo:"photo-1571019613454-1cb2f99b2d8b", bmiTags:["normal","underweight"] },
  { id:"3",  title:"Leg Day Destruction",       dur:"50 min", level:"Advanced",     cat:"strength",    ytId:"ePTSMy5dpG0", muscle:"Quads, Hamstrings, Glutes",photo:"photo-1517836357463-d25dfeac3438", bmiTags:["normal","underweight"] },
  { id:"4",  title:"Back & Biceps Builder",     dur:"42 min", level:"Intermediate", cat:"strength",    ytId:"sw_yDnDqwpU", muscle:"Back, Biceps",             photo:"photo-1549060279-7e168fcee0c2", bmiTags:["normal","underweight"] },
  { id:"5",  title:"HIIT Cardio Inferno",       dur:"30 min", level:"Beginner",     cat:"cardio",      ytId:"ml6cT4AZdqI", muscle:"Full Body",                photo:"photo-1538805060514-97d9cc17730c", bmiTags:["overweight","obese"] },
  { id:"6",  title:"Core & Abs Shred",          dur:"25 min", level:"Intermediate", cat:"cardio",      ytId:"AnYl6Nk9GOA", muscle:"Abs, Obliques",            photo:"photo-1583454110551-21f2fa2afe61", bmiTags:["overweight","obese","normal"] },
  { id:"7",  title:"Yoga Flow for Athletes",    dur:"40 min", level:"Beginner",     cat:"flexibility", ytId:"v7AYKMP6rOE", muscle:"Full Body",                photo:"photo-1544367567-0f2fcb009e0b", bmiTags:["underweight","normal","overweight","obese"] },
  { id:"8",  title:"Shoulders & Traps Pump",    dur:"35 min", level:"Intermediate", cat:"strength",    ytId:"IODxDxX7oi4", muscle:"Shoulders, Traps",         photo:"photo-1518644961665-ed172691aaa1", bmiTags:["normal","underweight"] },
  { id:"9",  title:"Deep Stretch Recovery",     dur:"20 min", level:"Beginner",     cat:"flexibility", ytId:"sTANio_2E0Q", muscle:"Full Body",                photo:"photo-1506126613408-eca07ce68773", bmiTags:["underweight","normal","overweight","obese"] },
  { id:"10", title:"Low-Impact Fat Burn",       dur:"35 min", level:"Beginner",     cat:"cardio",      ytId:"ml6cT4AZdqI", muscle:"Full Body",                photo:"photo-1538805060514-97d9cc17730c", bmiTags:["obese","overweight"] },
  { id:"11", title:"Beginner Muscle Build",     dur:"40 min", level:"Beginner",     cat:"strength",    ytId:"UItWltVZZmE", muscle:"Full Body",                photo:"photo-1571019613454-1cb2f99b2d8b", bmiTags:["underweight"] },
];

const LVL_CLR: Record<string, string> = {
  Beginner: "text-green-400 bg-green-400/10",
  Intermediate: "text-yellow-400 bg-yellow-400/10",
  Advanced: "text-red-400 bg-red-400/10",
};
const TASK_CAT_CLR: Record<string, string> = {
  Hydration: "text-blue-400 bg-blue-400/10",
  Training: "text-[#e63000] bg-[#e63000]/10",
  Nutrition: "text-green-400 bg-green-400/10",
  Cardio: "text-orange-400 bg-orange-400/10",
  Recovery: "text-purple-400 bg-purple-400/10",
  Flexibility: "text-cyan-400 bg-cyan-400/10",
  "Check-in": "text-yellow-400 bg-yellow-400/10",
};

function bmiCatFn(bmi: number): BMICat {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25)   return "normal";
  if (bmi < 30)   return "overweight";
  return "obese";
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Video Modal ─────────────────────────────────────────────────────────────
function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={video.title}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-black text-base uppercase tracking-wide" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{video.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LVL_CLR[video.level]}`}>{video.level}</span>
              <span className="text-xs text-muted-foreground">{video.dur} · {video.muscle}</span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close video" className="text-muted-foreground hover:text-foreground transition-colors"><X size={20}/></button>
        </div>
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${video.ytId}?autoplay=1&rel=0`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="px-5 py-3 bg-secondary/50 border-t border-border">
          <p className="text-xs text-muted-foreground">Demo content — YouTube video embedded for portfolio demonstration only.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ user, draft, setDraft, onSave, onClose }: {
  user: AppUser;
  draft: Partial<AppUser>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<AppUser>>>;
  onSave: (up: Partial<AppUser>) => void;
  onClose: () => void;
}) {
  const [err, setErr] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const val = (key: keyof AppUser) =>
    draft[key] !== undefined ? String(draft[key]) : String(user[key] ?? "");

  const handleSave = () => {
    setErr("");
    const name = (draft.name !== undefined ? String(draft.name) : user.name).trim();
    if (!name) { setErr("Name cannot be empty."); return; }

    const age = draft.age !== undefined ? Number(draft.age) : user.age;
    if (!age || age < 10 || age > 100) { setErr("Enter a valid age (10–100)."); return; }

    const h = draft.heightCm !== undefined ? Number(draft.heightCm) : user.heightCm;
    if (!h || h < 100 || h > 250) { setErr("Enter a valid height (100–250 cm)."); return; }

    const w = draft.weightKg !== undefined ? Number(draft.weightKg) : user.weightKg;
    if (!w || w < 20 || w > 300) { setErr("Enter a valid weight (20–300 kg)."); return; }

    const hm = h / 100;
    const bmiVal = parseFloat((w / (hm * hm)).toFixed(1));
    const cat = bmiCatFn(bmiVal);
    const base = user.gender === "female" ? 1900 : 2200;

    onSave({ name, age, heightCm: h, weightKg: w, bmi: bmiVal, bmiCat: cat,
      calorieGoal: Math.round(base * BMI_META[cat].calMult) });
  };

  const Inp = "w-full bg-secondary border border-border text-foreground px-4 py-2.5 text-sm focus:outline-none focus:border-[#e63000] transition-colors";

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h3 id="edit-profile-title" className="font-black uppercase tracking-wider" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Edit Profile</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Full Name</label>
            <input type="text" value={val("name")} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} className={Inp}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Age</label>
              <input type="number" min={10} max={100} value={val("age")} onChange={e=>setDraft(p=>({...p,age:+e.target.value}))} className={Inp}/>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Gender</label>
              <div className="flex h-[42px] border border-border rounded-sm overflow-hidden">
                {(["male","female"] as const).map(g=>(
                  <button key={g} onClick={()=>setDraft(p=>({...p,gender:g}))}
                    className={`flex-1 text-xs font-bold uppercase transition-all ${(draft.gender??user.gender)===g?"bg-[#e63000] text-white":"text-muted-foreground hover:bg-white/5"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Height (cm)</label>
              <input type="number" min={100} max={250} value={val("heightCm")} onChange={e=>setDraft(p=>({...p,heightCm:+e.target.value}))} className={Inp}/>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Weight (kg)</label>
              <input type="number" min={20} max={300} value={val("weightKg")} onChange={e=>setDraft(p=>({...p,weightKg:+e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleSave()} className={Inp}/>
            </div>
          </div>
          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5">
              <X size={13} className="text-red-400 shrink-0"/>
              <p className="text-red-400 text-xs">{err}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground/50">Height and weight changes will recalculate your BMI and recommended calorie goal.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-border text-sm font-semibold py-2.5 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 bg-[#e63000] text-white font-bold uppercase tracking-wider py-2.5 hover:bg-[#cc2a00] transition-colors text-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Screen (Email + Password) ──────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (u: AppUser) => void }) {
  const [mode, setMode]     = useState<AuthMode>("login");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr]       = useState("");

  // login fields
  const [loginEmail, setLoginEmail] = useState(() => db.get<string>("ipf_remembered_email", ""));
  const [loginPw, setLoginPw]       = useState("");
  const [remember, setRemember]     = useState(() => !!db.get<string>("ipf_remembered_email", ""));

  // forgot/reset password fields
  const [fpEmail, setFpEmail]   = useState("");
  const [fpPw, setFpPw]         = useState("");
  const [fpPw2, setFpPw2]       = useState("");
  const [fpSuccess, setFpSuccess] = useState(false);

  // register fields
  const [regName, setRegName]     = useState("");
  const [regEmail, setRegEmail]   = useState("");
  const [regPw, setRegPw]         = useState("");
  const [regPw2, setRegPw2]       = useState("");

  // profile fields (step 2 for new users)
  const [regAge, setRegAge]         = useState("");
  const [regGender, setRegGender]   = useState<"male" | "female">("male");
  const [regHeight, setRegHeight]   = useState("");
  const [regWeight, setRegWeight]   = useState("");

  const switchMode = (m: AuthMode) => { setMode(m); setErr(""); };

  const handleLogin = () => {
    setErr("");
    const e = loginEmail.trim().toLowerCase();
    if (!e || !loginPw) { setErr("Please fill in all fields."); return; }
    const all = db.get<AppUser[]>("ipf_users", []);
    const found = all.find(u => u.email === e && (u as AppUser & { password?: string }).password === loginPw);
    if (!found) { setErr("Email or password is incorrect."); return; }
    if (remember) db.set("ipf_remembered_email", e);
    else db.del("ipf_remembered_email");
    db.set("ipf_session", found.id);
    onAuth(found);
  };

  const handleForgotLookup = () => {
    setErr("");
    const e = fpEmail.trim().toLowerCase();
    if (!e.includes("@") || !e.includes(".")) { setErr("Enter a valid email address."); return; }
    const all = db.get<AppUser[]>("ipf_users", []);
    if (!all.find(u => u.email === e)) { setErr("No account found with that email."); return; }
    switchMode("reset");
  };

  const handleResetPassword = () => {
    setErr("");
    if (fpPw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (fpPw !== fpPw2) { setErr("Passwords do not match."); return; }
    const e = fpEmail.trim().toLowerCase();
    const all = db.get<AppUser[]>("ipf_users", []);
    const updated = all.map(u => u.email === e ? { ...u, password: fpPw } : u);
    db.set("ipf_users", updated);
    setFpSuccess(true);
    setTimeout(() => {
      setLoginEmail(e);
      setLoginPw("");
      setFpSuccess(false);
      setFpEmail(""); setFpPw(""); setFpPw2("");
      switchMode("login");
    }, 2000);
  };

  const handleRegister = () => {
    setErr("");
    if (!regName.trim()) { setErr("Enter your full name."); return; }
    const e = regEmail.trim().toLowerCase();
    if (!e.includes("@") || !e.includes(".")) { setErr("Enter a valid email address."); return; }
    if (regPw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (regPw !== regPw2) { setErr("Passwords do not match."); return; }
    const all = db.get<AppUser[]>("ipf_users", []);
    if (all.find(u => u.email === e)) { setErr("This email is already registered. Please sign in."); return; }
    switchMode("profile");
  };

  const handleFinishProfile = () => {
    setErr("");
    const age = parseInt(regAge);
    const h   = parseFloat(regHeight);
    const w   = parseFloat(regWeight);
    if (!age || age < 10 || age > 100) { setErr("Enter a valid age (10–100)."); return; }
    if (!h || h < 100 || h > 250)      { setErr("Enter a valid height (100–250 cm)."); return; }
    if (!w || w < 20  || w > 300)      { setErr("Enter a valid weight (20–300 kg)."); return; }
    const hm     = h / 100;
    const bmiVal = parseFloat((w / (hm * hm)).toFixed(1));
    const cat    = bmiCatFn(bmiVal);
    const base   = regGender === "female" ? 1900 : 2200;
    const newUser: AppUser & { password: string } = {
      id: crypto.randomUUID(),
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPw,
      plan: "", planStartDate: "",
      joinedAt: new Date().toISOString(),
      age, gender: regGender, heightCm: h, weightKg: w,
      bmi: bmiVal, bmiCat: cat,
      calorieGoal: Math.round(base * BMI_META[cat].calMult),
      totalPoints: 0,
    };
    const all = db.get<AppUser[]>("ipf_users", []);
    db.set("ipf_users", [...all, newUser]);
    db.set("ipf_session", newUser.id);
    onAuth(newUser);
  };

  const Inp = "w-full bg-[#0f0f0f] border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#e63000] transition-colors placeholder:text-white/25 rounded-sm";

  return (
    <div className="min-h-screen bg-[#080808] flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=1400&fit=crop&auto=format"
          alt="Gym"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#080808] via-[#080808]/70 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Dumbbell className="text-[#e63000]" size={26} />
            <span className="text-2xl font-black tracking-widest uppercase text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Iron <span className="text-[#e63000]">Pulse</span> Fitness
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-[clamp(2.5rem,4vw,4rem)] font-black uppercase leading-none text-white mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Train Smarter.<br /><span className="text-[#e63000]">Live Stronger.</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            BMI-personalised diet plans, expert workout videos, daily habit tracking, and real points rewards — all in one place.
          </p>
          <div className="flex gap-8 mt-8 pt-8 border-t border-white/10">
            {[["5,000+","Members (Demo)"],["11","Workouts"],["Demo","Project"],].map(([n,l])=>(
              <div key={l}>
                <div className="text-2xl font-black text-white" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{n}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Dumbbell className="text-[#e63000]" size={24}/>
              <span className="text-2xl font-black tracking-widest uppercase text-white" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Iron <span className="text-[#e63000]">Pulse</span> Fitness</span>
            </div>
          </div>

          {/* ── Login ── */}
          {mode === "login" && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tight text-white" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Welcome back</h1>
                <p className="text-white/40 text-sm mt-1">Sign in to your account to continue</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Email Address</label>
                  <input
                    type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="you@email.com" className={Inp} autoFocus autoComplete="email"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Password</label>
                    <button onClick={() => { setFpEmail(loginEmail); switchMode("forgot"); }} className="text-[10px] text-[#e63000] hover:text-[#ff5500] transition-colors uppercase tracking-widest">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={loginPw} onChange={e => setLoginPw(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      placeholder="Your password" className={Inp + " pr-11"}
                      autoComplete="current-password"
                    />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div
                    onClick={() => setRemember(!remember)}
                    className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-all ${remember ? "bg-[#e63000] border-[#e63000]" : "border-white/20 bg-transparent group-hover:border-white/40"}`}
                  >
                    {remember && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Remember me</span>
                </label>

                {err && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5">
                    <X size={13} className="text-red-400 shrink-0"/>
                    <p className="text-red-400 text-xs">{err}</p>
                  </div>
                )}

                <button onClick={handleLogin}
                  className="w-full bg-[#e63000] text-white font-black uppercase tracking-widest py-3.5 hover:bg-[#cc2a00] active:scale-[0.98] transition-all text-sm rounded-sm mt-2">
                  Sign In →
                </button>
              </div>

              <p className="text-center text-sm text-white/30 mt-6">
                New to Iron Pulse?{" "}
                <button onClick={() => switchMode("register")} className="text-[#e63000] hover:text-[#ff5500] font-semibold transition-colors underline underline-offset-2">
                  Create account
                </button>
              </p>
            </>
          )}

          {/* ── Register ── */}
          {mode === "register" && (
            <>
              <div className="mb-8">
                <button onClick={() => switchMode("login")} className="text-white/30 hover:text-white/70 text-xs flex items-center gap-1.5 mb-4 transition-colors">
                  ← Back to sign in
                </button>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Create Account</h1>
                <p className="text-white/40 text-sm mt-1">Step 1 of 2 — Account credentials</p>
                <div className="flex gap-1 mt-3">
                  <div className="h-0.5 flex-1 bg-[#e63000] rounded-full"/>
                  <div className="h-0.5 flex-1 bg-white/10 rounded-full"/>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Full Name</label>
                  <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Alex Johnson" className={Inp} autoFocus/>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Email Address</label>
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@email.com" className={Inp}/>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={regPw} onChange={e => setRegPw(e.target.value)}
                      placeholder="Min. 6 characters" className={Inp + " pr-11"}
                    />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Confirm Password</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={regPw2} onChange={e => setRegPw2(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRegister()}
                    placeholder="Repeat password" className={Inp}
                  />
                </div>

                {err && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5">
                    <X size={13} className="text-red-400 shrink-0"/>
                    <p className="text-red-400 text-xs">{err}</p>
                  </div>
                )}

                <button onClick={handleRegister}
                  className="w-full bg-[#e63000] text-white font-black uppercase tracking-widest py-3.5 hover:bg-[#cc2a00] active:scale-[0.98] transition-all text-sm rounded-sm mt-2">
                  Continue →
                </button>
              </div>

              <p className="text-center text-sm text-white/30 mt-6">
                Already have an account?{" "}
                <button onClick={() => switchMode("login")} className="text-[#e63000] hover:text-[#ff5500] font-semibold transition-colors underline underline-offset-2">
                  Sign in
                </button>
              </p>
            </>
          )}

          {/* ── Profile setup (step 2) ── */}
          {mode === "profile" && (
            <>
              <div className="mb-8">
                <div className="text-3xl font-black uppercase tracking-tight text-white mb-1" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Your Body Profile</div>
                <p className="text-white/40 text-sm">Step 2 of 2 — Physical details for personalised plans</p>
                <div className="flex gap-1 mt-3">
                  <div className="h-0.5 flex-1 bg-[#e63000] rounded-full"/>
                  <div className="h-0.5 flex-1 bg-[#e63000] rounded-full"/>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Age</label>
                    <input type="number" value={regAge} onChange={e => setRegAge(e.target.value)} placeholder="e.g. 25" className={Inp}/>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Gender</label>
                    <div className="flex h-[46px] rounded-sm overflow-hidden border border-white/10">
                      {(["male","female"] as const).map(g => (
                        <button key={g} onClick={() => setRegGender(g)}
                          className={`flex-1 text-xs font-bold uppercase transition-all ${regGender===g?"bg-[#e63000] text-white":"text-white/40 hover:text-white hover:bg-white/5"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Height (cm)</label>
                    <input type="number" value={regHeight} onChange={e => setRegHeight(e.target.value)} placeholder="e.g. 175" className={Inp}/>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Weight (kg)</label>
                    <input type="number" value={regWeight} onChange={e => setRegWeight(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleFinishProfile()}
                      placeholder="e.g. 72" className={Inp}/>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/8 rounded-sm p-3 flex items-start gap-2">
                  <Activity size={14} className="text-[#e63000] mt-0.5 shrink-0"/>
                  <p className="text-white/40 text-xs leading-relaxed">
                    We use height &amp; weight to calculate your BMI, set your calorie goal, and recommend the right diet and workouts for you.
                  </p>
                </div>

                {err && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5">
                    <X size={13} className="text-red-400 shrink-0"/>
                    <p className="text-red-400 text-xs">{err}</p>
                  </div>
                )}

                <button onClick={handleFinishProfile}
                  className="w-full bg-[#e63000] text-white font-black uppercase tracking-widest py-3.5 hover:bg-[#cc2a00] active:scale-[0.98] transition-all text-sm rounded-sm">
                  Create My Account 🔥
                </button>

                <button onClick={() => switchMode("register")} className="w-full text-white/30 hover:text-white/60 text-xs transition-colors text-center py-1">
                  ← Back
                </button>
              </div>
            </>
          )}

          {/* ── Forgot Password (step 1: email lookup) ── */}
          {mode === "forgot" && (
            <>
              <div className="mb-8">
                <button onClick={() => switchMode("login")} className="text-white/30 hover:text-white/70 text-xs flex items-center gap-1.5 mb-4 transition-colors">
                  ← Back to sign in
                </button>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Reset Password</h1>
                <p className="text-white/40 text-sm mt-1">Enter your account email to continue</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Email Address</label>
                  <input
                    type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleForgotLookup()}
                    placeholder="you@email.com" className={Inp} autoFocus autoComplete="email"
                  />
                </div>

                {err && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5">
                    <X size={13} className="text-red-400 shrink-0"/>
                    <p className="text-red-400 text-xs">{err}</p>
                  </div>
                )}

                <button onClick={handleForgotLookup}
                  className="w-full bg-[#e63000] text-white font-black uppercase tracking-widest py-3.5 hover:bg-[#cc2a00] active:scale-[0.98] transition-all text-sm rounded-sm mt-2">
                  Continue →
                </button>
              </div>

              <p className="text-center text-sm text-white/30 mt-6">
                Remembered it?{" "}
                <button onClick={() => switchMode("login")} className="text-[#e63000] hover:text-[#ff5500] font-semibold transition-colors underline underline-offset-2">
                  Sign in
                </button>
              </p>
            </>
          )}

          {/* ── Reset Password (step 2: new password) ── */}
          {mode === "reset" && (
            <>
              <div className="mb-8">
                <button onClick={() => switchMode("forgot")} className="text-white/30 hover:text-white/70 text-xs flex items-center gap-1.5 mb-4 transition-colors">
                  ← Back
                </button>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>New Password</h1>
                <p className="text-white/40 text-sm mt-1">Choose a new password for <span className="text-white/60">{fpEmail}</span></p>
              </div>

              {fpSuccess ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <p className="text-white font-semibold text-center">Password updated!</p>
                  <p className="text-white/40 text-sm text-center">Redirecting to sign in…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={fpPw} onChange={e => setFpPw(e.target.value)}
                        placeholder="Min. 6 characters" className={Inp + " pr-11"}
                        autoFocus autoComplete="new-password"
                      />
                      <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Confirm New Password</label>
                    <input
                      type={showPw ? "text" : "password"}
                      value={fpPw2} onChange={e => setFpPw2(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleResetPassword()}
                      placeholder="Repeat password" className={Inp}
                      autoComplete="new-password"
                    />
                  </div>

                  {err && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5">
                      <X size={13} className="text-red-400 shrink-0"/>
                      <p className="text-red-400 text-xs">{err}</p>
                    </div>
                  )}

                  <button onClick={handleResetPassword}
                    className="w-full bg-[#e63000] text-white font-black uppercase tracking-widest py-3.5 hover:bg-[#cc2a00] active:scale-[0.98] transition-all text-sm rounded-sm mt-2">
                    Reset Password →
                  </button>
                </div>
              )}
            </>
          )}

          <div className="mt-8 space-y-1.5">
            <p className="text-center text-[11px] text-white/20">Data stored locally on your device · No tracking</p>
            <p className="text-center text-[10px] text-yellow-500/50">Demo project: credentials stored in browser localStorage (not production-secure)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => {
    const id = db.get<string | null>("ipf_session", null);
    if (!id) return null;
    return db.get<AppUser[]>("ipf_users", []).find(u => u.id === id) ?? null;
  });

  const [dietTab, setDietTab]           = useState<DietTab>("veg");
  const [workoutCat, setWorkoutCat]     = useState<WorkoutCat>("all");
  const [activeVideo, setActiveVideo]   = useState<Video | null>(null);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [showBmiOnly, setShowBmiOnly]   = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [editingCal, setEditingCal]     = useState(false);
  const [calInput, setCalInput]         = useState(String(user?.calorieGoal ?? 2000));
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Partial<AppUser>>({});
  const [bmiW, setBmiW]                 = useState(String(user?.weightKg || ""));
  const [bmiH, setBmiH]                 = useState(String(user?.heightCm || ""));
  const [toast, setToast]               = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [bmiErr, setBmiErr]             = useState("");
  const [calErr, setCalErr]             = useState("");

  const dashRef    = useRef<HTMLDivElement>(null);
  const plansRef   = useRef<HTMLDivElement>(null);
  const tasksRef   = useRef<HTMLDivElement>(null);
  const bmiRef     = useRef<HTMLDivElement>(null);
  const dietRef    = useRef<HTMLDivElement>(null);
  const workoutRef = useRef<HTMLDivElement>(null);

  const taskKey   = user ? `ipf_tasks_${user.id}_${todayKey()}` : "";
  const pointsKey = user ? `ipf_pts_log_${user.id}_${todayKey()}` : "";

  const [tasksDone, setTasksDone] = useState<Record<string, boolean>>(() =>
    user ? db.get<Record<string,boolean>>(taskKey, {}) : {}
  );
  const [ptsLog, setPtsLog] = useState<Record<string, boolean>>(() =>
    user ? db.get<Record<string,boolean>>(pointsKey, {}) : {}
  );

  useEffect(() => { if (taskKey) db.set(taskKey, tasksDone); }, [tasksDone, taskKey]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Keep BMI calculator inputs in sync with profile (e.g. after profile edit)
  useEffect(() => {
    if (user?.weightKg) setBmiW(String(user.weightKg));
    if (user?.heightCm) setBmiH(String(user.heightCm));
  }, [user?.weightKg, user?.heightCm]);

  // Clear BMI error when user changes inputs
  useEffect(() => { setBmiErr(""); }, [bmiW, bmiH]);

  // Keep calInput in sync when calorie goal changes externally (e.g. profile edit recalculates it)
  useEffect(() => {
    if (!editingCal && user?.calorieGoal) setCalInput(String(user.calorieGoal));
  }, [user?.calorieGoal, editingCal]);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      if (y < 600) setActiveSection("dashboard");
      else if (y < 1300) setActiveSection("plans");
      else if (y < 2000) setActiveSection("tasks");
      else if (y < 2800) setActiveSection("bmi");
      else if (y < 3600) setActiveSection("diet");
      else setActiveSection("workout");
    };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false); setProfileOpen(false);
  };

  const persistUser = useCallback((updates: Partial<AppUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    db.set("ipf_users", db.get<AppUser[]>("ipf_users", []).map(u => u.id === updated.id ? updated : u));
  }, [user]);

  const handleAuth = (u: AppUser) => { setUser(u); setCalInput(String(u.calorieGoal)); setBmiW(String(u.weightKg||"")); setBmiH(String(u.heightCm||"")); };
  const handleLogout = () => { db.del("ipf_session"); setUser(null); };

  const handleJoin = (plan: PlanName) => {
    persistUser({ plan, planStartDate: new Date().toISOString() });
    setToast({ msg: `${plan} plan activated — welcome!`, type: "success" });
    setTimeout(() => tasksRef.current?.scrollIntoView({ behavior: "smooth" }), 400);
  };

  const toggleTask = (taskId: string) => {
    if (!user) return;
    const task = TASKS.find(t => t.id === taskId)!;
    const wasDone = !!tasksDone[taskId];
    const next = { ...tasksDone, [taskId]: !wasDone };
    setTasksDone(next);
    db.set(taskKey, next);
    if (!wasDone && !ptsLog[taskId]) {
      const newLog = { ...ptsLog, [taskId]: true };
      setPtsLog(newLog);
      db.set(pointsKey, newLog);
      persistUser({ totalPoints: (user.totalPoints ?? 0) + task.pts });
    }
  };

  const handleSaveCal = () => {
    const v = parseInt(calInput);
    if (!v || v < 800 || v > 5000) {
      setCalErr("Enter a value between 800 and 5000 kcal.");
      return;
    }
    setCalErr("");
    persistUser({ calorieGoal: v });
    setEditingCal(false);
    setToast({ msg: `Calorie goal updated to ${v.toLocaleString()} kcal`, type: "success" });
  };

  const handleBmiCalc = () => {
    setBmiErr("");
    const w = parseFloat(bmiW);
    const h = parseFloat(bmiH);
    if (!w || !h || w < 20 || w > 300 || h < 100 || h > 250) {
      setBmiErr("Enter a valid weight (20–300 kg) and height (100–250 cm).");
      return;
    }
    const hm = h / 100;
    const bmiVal = parseFloat((w / (hm * hm)).toFixed(1));
    if (!isFinite(bmiVal)) return;
    const cat = bmiCatFn(bmiVal);
    const base = user?.gender === "female" ? 1900 : 2200;
    const newCalGoal = Math.round(base * BMI_META[cat].calMult);
    persistUser({ bmi: bmiVal, bmiCat: cat, weightKg: w, heightCm: h, calorieGoal: newCalGoal });
    setTimeout(() => dietRef.current?.scrollIntoView({ behavior: "smooth" }), 400);
  };

  const scaleMeals = (meals: Meal[]) => {
    const base = meals.reduce((s, m) => s + m.baseCal, 0);
    return meals.map(m => ({ ...m, cal: Math.round((m.baseCal / base) * (user?.calorieGoal ?? 2000)) }));
  };

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  const doneCount   = TASKS.filter(t => tasksDone[t.id]).length;
  const todayPts    = TASKS.filter(t => ptsLog[t.id]).reduce((s, t) => s + t.pts, 0);
  const activeMeals = scaleMeals(dietTab === "veg" ? VEG_MEALS : NV_MEALS);
  const filtVids    = VIDEOS.filter(v => {
    const catOk = workoutCat === "all" || v.cat === workoutCat;
    const bmiOk = !user.bmiCat || !showBmiOnly || v.bmiTags.includes(user.bmiCat);
    return catOk && bmiOk;
  });
  const memberDays  = user.planStartDate ? Math.floor((Date.now() - new Date(user.planStartDate).getTime()) / 86400000) : 0;
  const tierIcon    = user.plan === "Elite" ? <Crown size={13}/> : user.plan === "Pro" ? <Star size={13}/> : <Shield size={13}/>;

  const NavBtn = ({ label, section, r }: { label: string; section: string; r: React.RefObject<HTMLDivElement | null> }) => (
    <button onClick={() => scrollTo(r)}
      className={`text-xs font-semibold uppercase tracking-wider transition-colors ${activeSection===section?"text-[#e63000]":"text-muted-foreground hover:text-foreground"}`}>
      {label}
    </button>
  );

  // Elite-exclusive body composition estimates
  const fatPct = user.bmi
    ? user.gender === "male"
      ? Math.max(5, Math.round(1.2 * user.bmi + 0.23 * (user.age ?? 25) - 16.2))
      : Math.max(10, Math.round(1.2 * user.bmi + 0.23 * (user.age ?? 25) - 5.4))
    : null;
  const leanMass = fatPct && user.weightKg
    ? Math.round(user.weightKg * (1 - fatPct / 100))
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ─── NAV ──────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
          <button onClick={() => scrollTo(dashRef)} className="flex items-center gap-2">
            <Dumbbell className="text-[#e63000]" size={20}/>
            <span className="font-black tracking-widest uppercase text-[1.05rem] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Iron <span className="text-[#e63000]">Pulse</span> <span className="hidden sm:inline">Fitness</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-6">
            <NavBtn label="Dashboard"   section="dashboard" r={dashRef}/>
            <NavBtn label="Plans"       section="plans"     r={plansRef}/>
            <NavBtn label="Daily Goals" section="tasks"     r={tasksRef}/>
            <NavBtn label="BMI"         section="bmi"       r={bmiRef}/>
            <NavBtn label="Diet"        section="diet"      r={dietRef}/>
            <NavBtn label="Workouts"    section="workout"   r={workoutRef}/>
          </div>

          <div className="flex items-center gap-2">
            <button aria-label="View points and daily goals" onClick={() => scrollTo(tasksRef)}
              className="hidden md:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 bg-[#e63000]/10 text-[#e63000] rounded-full hover:bg-[#e63000]/20 transition-colors">
              <Trophy size={11}/> {user.totalPoints ?? 0} pts
            </button>
            <button aria-label="View daily goals progress" onClick={() => scrollTo(tasksRef)}
              className="hidden md:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 bg-secondary border border-border rounded-full hover:border-[#e63000]/30 transition-colors">
              <ListChecks size={11}/> {doneCount}/{TASKS.length}
            </button>

            <div className="relative">
              <button aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 bg-secondary border border-border px-2.5 py-1.5 rounded-sm hover:border-[#e63000]/40 transition-colors">
                <div className="w-6 h-6 rounded-full bg-[#e63000] flex items-center justify-center text-xs font-black text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
                <ChevronDown size={12} className={`text-muted-foreground transition-transform ${profileOpen?"rotate-180":""}`}/>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-sm shadow-2xl shadow-black/50 z-50 overflow-hidden">
                  <div className="p-4 bg-secondary/50 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e63000] flex items-center justify-center text-lg font-black text-white">{user.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="font-bold text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        {user.plan && <div className="flex items-center gap-1 text-xs text-[#e63000] font-semibold mt-0.5">{tierIcon} {user.plan} Member</div>}
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    {[
                      { icon: <Activity size={13}/>, label: "Dashboard",   action: () => scrollTo(dashRef) },
                      { icon: <ListChecks size={13}/>, label: `Daily Goals  ${doneCount}/${TASKS.length}`, action: () => scrollTo(tasksRef) },
                      { icon: <Calculator size={13}/>, label: "BMI",       action: () => scrollTo(bmiRef) },
                      { icon: <Pencil size={13}/>,    label: "Edit Profile", action: () => { setEditProfileOpen(true); setProfileDraft({}); setProfileOpen(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary rounded-sm transition-colors text-left">
                        <span className="text-[#e63000]">{item.icon}</span> {item.label}
                      </button>
                    ))}
                    <hr className="border-border my-1"/>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-sm transition-colors">
                      <LogOut size={13}/> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen?<X size={20}/>:<Menu size={20}/>}</button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-card border-t border-border px-5 py-4 flex flex-col gap-3">
            {([["Dashboard","dashboard",dashRef],["Plans","plans",plansRef],["Daily Goals","tasks",tasksRef],["BMI","bmi",bmiRef],["Diet","diet",dietRef],["Workouts","workout",workoutRef]] as [string,string,React.RefObject<HTMLDivElement|null>][]).map(([l,s,r])=>(
              <button key={s} onClick={()=>scrollTo(r)} className={`text-left text-xs font-semibold uppercase tracking-wider ${activeSection===s?"text-[#e63000]":"text-muted-foreground"}`}>{l}</button>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-400 font-semibold uppercase tracking-wider pt-1 border-t border-border"><LogOut size={12}/> Sign Out</button>
          </div>
        )}
      </nav>

      {/* ─── DASHBOARD ────────────────────────────────────── */}
      <section ref={dashRef} className="pt-14 min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop&auto=format" alt="" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-black/60"/>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 py-10">
          <div className="mb-8">
            <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-tight mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Welcome back, <span className="text-[#e63000]">{user.name.split(" ")[0]}</span>
            </h1>
            {user.plan && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#e63000]/10 border border-[#e63000]/30 rounded-full text-xs font-bold text-[#e63000]">
                {tierIcon} {user.plan} Member · Day {memberDays + 1}
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label:"Total Points",  value:(user.totalPoints??0).toLocaleString(), sub:`+${todayPts} today`,   icon:<Trophy size={18}/>, cls:"text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
              { label:"Daily Goals",   value:`${doneCount}/${TASKS.length}`,         sub:`${Math.round(doneCount/TASKS.length*100)}% done`, icon:<ListChecks size={18}/>, cls:"text-[#e63000] bg-[#e63000]/10 border-[#e63000]/20" },
              { label:"BMI",           value:user.bmi?String(user.bmi):"—",          sub:user.bmiCat?BMI_META[user.bmiCat].label:"Not calculated", icon:<Activity size={18}/>, cls:user.bmiCat?`${BMI_META[user.bmiCat].color} ${BMI_META[user.bmiCat].bg} ${BMI_META[user.bmiCat].border}`:"text-muted-foreground bg-secondary border-border" },
              { label:"Calorie Goal",  value:`${user.calorieGoal.toLocaleString()}`, sub:"kcal / day",           icon:<Flame size={18}/>,  cls:"text-orange-400 bg-orange-400/10 border-orange-400/20" },
            ].map(({label,value,sub,icon,cls})=>(
              <div key={label} className="bg-card border border-border rounded-sm p-5">
                <div className={`inline-flex p-2 rounded-sm mb-3 border ${cls}`}>{icon}</div>
                <div className="text-2xl font-black leading-none mb-0.5" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-xs text-muted-foreground/50 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Elite body composition card */}
          {hasAccess(user,"Elite") && user.bmi && (
            <div className="bg-gradient-to-r from-yellow-400/10 to-transparent border border-yellow-400/20 rounded-sm p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={16} className="text-yellow-400"/>
                <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Elite — Body Composition Estimate</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label:"Body Fat %",   value:`${fatPct}%`,                icon:<Dna size={15}/> },
                  { label:"Lean Mass",    value:`${leanMass} kg`,            icon:<Dumbbell size={15}/> },
                  { label:"Fat Mass",     value:`${user.weightKg && fatPct ? Math.round(user.weightKg*fatPct/100) : "—"} kg`, icon:<BarChart2 size={15}/> },
                  { label:"Fitness Age",  value:`${user.age && user.bmiCat==="normal"?user.age-2:user.age?user.age+2:"—"} yrs`, icon:<Activity size={15}/> },
                ].map(({label,value,icon})=>(
                  <div key={label} className="bg-yellow-400/5 border border-yellow-400/10 rounded-sm p-3">
                    <div className="flex items-center gap-1.5 text-yellow-400 mb-1">{icon}<span className="text-[10px] uppercase tracking-widest">{label}</span></div>
                    <div className="text-xl font-black text-foreground" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile + quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black uppercase tracking-wider text-sm" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>My Profile</h3>
                <button onClick={()=>{setEditProfileOpen(true);setProfileDraft({});}} className="text-xs text-[#e63000] hover:underline flex items-center gap-1"><Pencil size={11}/> Edit</button>
              </div>
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                <div className="w-14 h-14 rounded-full bg-[#e63000] flex items-center justify-center text-2xl font-black text-white">{user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="font-bold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  ["Age",         user.age?`${user.age} years`:"—"],
                  ["Gender",      user.gender?user.gender.charAt(0).toUpperCase()+user.gender.slice(1):"—"],
                  ["Height",      user.heightCm?`${user.heightCm} cm`:"—"],
                  ["Weight",      user.weightKg?`${user.weightKg} kg`:"—"],
                  ["Member Since",user.joinedAt?new Date(user.joinedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"],
                  ["Plan",        user.plan||"No plan"],
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {/* Progress mini */}
              <div className="bg-card border border-border rounded-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black uppercase tracking-wider text-sm" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Today's Progress</h3>
                  <button onClick={()=>scrollTo(tasksRef)} className="text-xs text-[#e63000] hover:underline flex items-center gap-1">All tasks <ChevronRight size={11}/></button>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[#e63000] rounded-full transition-all duration-500" style={{width:`${Math.round(doneCount/TASKS.length*100)}%`}}/>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {TASKS.slice(0,4).map(t=>(
                    <div key={t.id} className={`flex flex-col items-center gap-1 p-2 rounded-sm border text-xs transition-colors ${tasksDone[t.id]?"border-[#e63000]/30 bg-[#e63000]/5":"border-border"}`}>
                      <span className={tasksDone[t.id]?"text-[#e63000]":"text-muted-foreground"}>{t.icon}</span>
                      <span className="text-center text-muted-foreground" style={{fontSize:"9px"}}>{t.cat}</span>
                      {tasksDone[t.id]&&<CheckCircle size={9} className="text-[#e63000]"/>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Quick tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {icon:<Crown size={17}/>,      label:"Membership",  sub:user.plan||"Get a plan",          action:()=>scrollTo(plansRef), c:"text-yellow-400"},
                  {icon:<Calculator size={17}/>, label:"BMI Check",   sub:user.bmi?`BMI: ${user.bmi}`:"Calculate", action:()=>scrollTo(bmiRef),   c:"text-blue-400"},
                  {icon:<Salad size={17}/>,      label:"Diet Plan",   sub:hasAccess(user,"Pro")?"View meals":"Pro required", action:()=>scrollTo(dietRef), c:"text-green-400"},
                  {icon:<Play size={17}/>,       label:"Workouts",    sub:hasAccess(user,"Pro")?"Watch videos":"Pro required", action:()=>scrollTo(workoutRef), c:"text-[#e63000]"},
                  {icon:<TrendingUp size={17}/>, label:"Points",      sub:`${user.totalPoints??0} total`,   action:()=>scrollTo(tasksRef), c:"text-purple-400"},
                  {icon:<Calendar size={17}/>,   label:"Member Days", sub:`Day ${memberDays+1}`,            action:()=>scrollTo(tasksRef), c:"text-cyan-400"},
                ].map(({icon,label,sub,action,c})=>(
                  <button key={label} onClick={action} className="group bg-card border border-border rounded-sm p-4 text-left hover:border-[#e63000]/40 transition-all hover:-translate-y-0.5">
                    <span className={`${c} block mb-2 group-hover:scale-110 transition-transform origin-left`}>{icon}</span>
                    <div className="text-sm font-bold">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MEMBERSHIP PLANS ─────────────────────────────── */}
      <section ref={plansRef} className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#e63000] mb-3 block">Choose Your Path</span>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Membership Plans</h2>
            <p className="text-muted-foreground mt-3 text-sm max-w-xl mx-auto">Every tier unlocks more. Elite gives you everything Pro has, plus body analytics, trainer sessions, supplement guidance, and monthly reports.</p>
          </div>

          {/* Comparison table intro for Pro vs Elite */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {PLANS.map(plan=>(
              <div key={plan.name} className={`relative bg-card border-2 ${plan.border} rounded-sm p-7 flex flex-col`}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-widest px-4 py-1 ${plan.name==="Elite"?"bg-yellow-400 text-black":"bg-[#e63000] text-white"}`}>{plan.badge}</div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className={plan.name==="Elite"?"text-yellow-400":plan.name==="Pro"?"text-[#e63000]":"text-white/60"}>{plan.icon}</span>
                  <h3 className="text-2xl font-black uppercase tracking-wider" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{plan.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-black" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>₹{plan.price}</span>
                  <span className="text-muted-foreground text-sm mb-1">/month</span>
                </div>
                <ul className="space-y-2 flex-1 mb-7">
                  {plan.features.map(f=>(
                    <li key={f.text} className={`flex items-start gap-2 text-sm ${f.included?"text-foreground/85":"text-muted-foreground/40 line-through"}`}>
                      {f.included
                        ? <CheckCircle size={13} className={`mt-0.5 shrink-0 ${plan.name==="Elite"?"text-yellow-400":plan.name==="Pro"?"text-[#e63000]":"text-white/60"}`}/>
                        : <X size={13} className="mt-0.5 shrink-0 text-muted-foreground/30"/>}
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={()=>{ if(PLAN_RANK[user.plan]<=PLAN_RANK[plan.name]) handleJoin(plan.name); }}
                  disabled={user.plan===plan.name||PLAN_RANK[user.plan]>PLAN_RANK[plan.name]}
                  className={`w-full py-3 font-bold uppercase tracking-wider text-sm transition-all disabled:cursor-not-allowed
                    ${user.plan===plan.name?"border border-green-500 text-green-400 bg-green-500/5":
                      PLAN_RANK[user.plan]>PLAN_RANK[plan.name]?"border border-border text-muted-foreground/40":plan.cta}`}>
                  {user.plan===plan.name?"✓ Current Plan":PLAN_RANK[user.plan]>PLAN_RANK[plan.name]?"Lower than current plan":"Get "+plan.name}
                </button>
              </div>
            ))}
          </div>

          {/* Elite exclusive perks callout */}
          <div className="bg-gradient-to-r from-yellow-400/5 via-yellow-400/10 to-yellow-400/5 border border-yellow-400/20 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={18} className="text-yellow-400"/>
              <h3 className="font-black uppercase tracking-widest text-yellow-400 text-sm">What makes Elite (₹299) worth it over Pro (₹199)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon:<BarChart2 size={18}/>,     title:"Body Analytics",    desc:"BMI-based body fat %, lean mass, and fitness age estimates shown in your dashboard." },
                { icon:<Headphones size={18}/>,    title:"Trainer Sessions [Demo]", desc:"4 personal trainer sessions/month shown as a plan benefit — contact the gym to schedule." },
                { icon:<Beaker size={18}/>,        title:"Supplement Guide",  desc:"BMI-matched supplement recommendations shown in the BMI section — estimates only, not medical advice." },
                { icon:<ClipboardList size={18}/>, title:"Monthly Report [Demo]",desc:"Monthly progress report feature shown in-app — PDF email delivery requires a real backend." },
              ].map(({icon,title,desc})=>(
                <div key={title} className="bg-yellow-400/5 border border-yellow-400/10 rounded-sm p-4">
                  <div className="text-yellow-400 mb-2">{icon}</div>
                  <div className="font-bold text-sm mb-1">{title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DAILY GOALS ──────────────────────────────────── */}
      <section ref={tasksRef} className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#e63000] mb-3 block">Stay Consistent</span>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Daily Goals</h2>
            <p className="text-muted-foreground mt-3 text-sm">Complete habits to earn points. Resets midnight.</p>
          </div>
          {!user.plan ? (
            <div className="max-w-md mx-auto text-center bg-card border border-border rounded-sm p-10">
              <ListChecks size={32} className="text-[#e63000] mx-auto mb-4"/>
              <h3 className="font-black uppercase tracking-wider mb-2" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Members Only</h3>
              <p className="text-muted-foreground text-sm mb-5">Join Iron Pulse to unlock daily habit tracking and points.</p>
              <button onClick={()=>scrollTo(plansRef)} className="bg-[#e63000] text-white font-bold uppercase tracking-wider px-7 py-3 hover:bg-[#cc2a00] transition-colors text-sm">Get a Plan</button>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-sm p-6 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
                    <div className="text-xl font-black uppercase mt-0.5" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{doneCount===TASKS.length?"🔥 Perfect Day!":`${doneCount} / ${TASKS.length} Complete`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#e63000]" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{todayPts}</div>
                    <div className="text-xs text-muted-foreground">/ {MAX_PTS} pts today</div>
                    <div className="text-xs text-yellow-400 font-semibold mt-0.5">Total: {user.totalPoints??0} pts</div>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-[#e63000] rounded-full transition-all duration-500" style={{width:`${Math.round(doneCount/TASKS.length*100)}%`}}/>
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">{Math.round(doneCount/TASKS.length*100)}% complete</span>
                  {doneCount===TASKS.length&&<span className="text-xs text-yellow-400 font-bold flex items-center gap-1"><Award size={11}/> Max points!</span>}
                </div>
              </div>
              <div className="space-y-2.5">
                {TASKS.map(task=>{
                  const done=!!tasksDone[task.id]; const open=expandedTask===task.id;
                  return (
                    <div key={task.id} className={`bg-card border rounded-sm overflow-hidden transition-colors ${done?"border-[#e63000]/30 bg-[#e63000]/5":"border-border"}`}>
                      <div className="flex items-center gap-3 p-4">
                        <button onClick={()=>toggleTask(task.id)} className="shrink-0 hover:scale-110 transition-transform">
                          {done?<CheckSquare size={20} className="text-[#e63000]"/>:<Square size={20} className="text-muted-foreground"/>}
                        </button>
                        <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
                          <span className={`text-sm font-semibold ${done?"line-through text-muted-foreground":""}`}>{task.label}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TASK_CAT_CLR[task.cat]??""}`}>{task.cat}</span>
                          {ptsLog[task.id]&&<span className="text-xs text-green-400 font-bold">✓ Earned</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-sm font-black ${done?"text-[#e63000]":"text-muted-foreground"}`} style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>+{task.pts}pts</span>
                          <button onClick={()=>setExpandedTask(open?null:task.id)} className="text-muted-foreground hover:text-foreground">
                            <ChevronDown size={14} className={`transition-transform ${open?"rotate-180":""}`}/>
                          </button>
                        </div>
                      </div>
                      {open&&(
                        <div className="flex items-center gap-3 px-4 pb-4 border-t border-border/50">
                          <div className={`p-2 rounded-sm ${TASK_CAT_CLR[task.cat]??""}`}>{task.icon}</div>
                          <p className="text-xs text-muted-foreground">{task.sub}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── BMI CALCULATOR ───────────────────────────────── */}
      <section ref={bmiRef} className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#e63000] mb-3 block">Know Your Body</span>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>BMI Calculator</h2>
          </div>
          {!hasAccess(user,"Pro") ? (
            <div className="max-w-md mx-auto text-center bg-card border border-border rounded-sm p-10">
              <Calculator size={32} className="text-[#e63000] mx-auto mb-4"/>
              <h3 className="font-black uppercase tracking-wider mb-2" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Pro Feature</h3>
              <p className="text-muted-foreground text-sm mb-5">Upgrade to Pro (₹199/mo) to unlock BMI calculator and personalised plans.</p>
              <button onClick={()=>scrollTo(plansRef)} className="bg-[#e63000] text-white font-bold uppercase tracking-wider px-7 py-3 hover:bg-[#cc2a00] transition-colors text-sm">Upgrade to Pro</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-card border border-border rounded-sm p-7">
                <h3 className="font-black uppercase tracking-wider mb-5 text-base" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Calculate BMI</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Weight (kg)</label>
                    <input type="number" value={bmiW} onChange={e=>setBmiW(e.target.value)} placeholder={String(user.weightKg||"72")}
                      className="w-full bg-secondary border border-border text-foreground px-4 py-3 text-sm focus:outline-none focus:border-[#e63000] transition-colors"/>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Height (cm)</label>
                    <input type="number" value={bmiH} onChange={e=>setBmiH(e.target.value)} placeholder={String(user.heightCm||"175")}
                      className="w-full bg-secondary border border-border text-foreground px-4 py-3 text-sm focus:outline-none focus:border-[#e63000] transition-colors"/>
                  </div>
                </div>
                <button onClick={handleBmiCalc}
                  className="w-full bg-[#e63000] text-white font-bold uppercase tracking-wider py-3 hover:bg-[#cc2a00] transition-colors text-sm flex items-center justify-center gap-2 mb-3">
                  <Calculator size={14}/> Calculate
                </button>
                {bmiErr && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2 mb-4">
                    <X size={12} className="text-red-400 shrink-0"/>
                    <p className="text-red-400 text-xs">{bmiErr}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {(["underweight","normal","overweight","obese"] as BMICat[]).map(cat=>(
                    <div key={cat} className={`flex justify-between text-xs px-3 py-2 rounded-sm transition-all ${user.bmiCat===cat?`${BMI_META[cat].bg} ${BMI_META[cat].border} border`:"bg-secondary"}`}>
                      <span className={user.bmiCat===cat?BMI_META[cat].color:"text-muted-foreground"}>{BMI_META[cat].label}</span>
                      <span className="text-muted-foreground font-mono">{cat==="underweight"?"< 18.5":cat==="normal"?"18.5–24.9":cat==="overweight"?"25–29.9":"≥ 30"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {user.bmi ? (
                <div className="space-y-5">
                  <div className={`bg-card border-2 ${BMI_META[user.bmiCat!].border} rounded-sm p-7`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your BMI</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${BMI_META[user.bmiCat!].bg} ${BMI_META[user.bmiCat!].color}`}>{BMI_META[user.bmiCat!].label}</span>
                    </div>
                    <div className={`text-7xl font-black mb-2 ${BMI_META[user.bmiCat!].color}`} style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{user.bmi}</div>
                    <p className="text-sm text-muted-foreground mb-4">kg/m²  ·  {user.gender}  ·  Age {user.age}</p>
                    <div className="bg-secondary rounded-sm p-4 text-sm">{BMI_META[user.bmiCat!].goal}</div>
                    <p className="text-xs text-muted-foreground/50 mt-3">BMI is a general screening tool only and is not a medical diagnosis. Consult a healthcare professional for personalised advice.</p>
                  </div>

                  <div className="bg-card border border-border rounded-sm p-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily Calorie Goal</span>
                      {hasAccess(user,"Elite") ? (
                        !editingCal
                          ? <button onClick={()=>{setEditingCal(true);setCalInput(String(user.calorieGoal));}} className="flex items-center gap-1 text-xs font-bold text-[#e63000] uppercase tracking-wider"><Pencil size={11}/> Edit</button>
                          : <div className="flex gap-2">
                              <button onClick={handleSaveCal} className="flex items-center gap-1 text-xs font-bold text-green-400 uppercase tracking-wider"><Save size={11}/> Save</button>
                              <button onClick={()=>setEditingCal(false)} className="text-xs text-muted-foreground uppercase tracking-wider">Cancel</button>
                            </div>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Crown size={11}/> Elite only</span>
                      )}
                    </div>
                    {editingCal ? (
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <input type="number" value={calInput} onChange={e=>{setCalInput(e.target.value);setCalErr("");}} min={800} max={5000}
                            onKeyDown={e=>e.key==="Enter"&&handleSaveCal()}
                            className="flex-1 bg-secondary border border-[#e63000] text-foreground px-4 py-2 text-2xl font-black focus:outline-none" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}/>
                          <span className="text-muted-foreground text-sm">kcal</span>
                        </div>
                        {calErr && <p className="text-red-400 text-xs mb-2">{calErr}</p>}
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-black text-[#e63000]" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{user.calorieGoal.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm mb-1.5">kcal/day</span>
                      </div>
                    )}
                    {hasAccess(user,"Elite") && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {[1500,1800,2000,2200,2500,3000].map(v=>(
                          <button key={v} onClick={()=>{persistUser({calorieGoal:v});setCalInput(String(v));setEditingCal(false);}}
                            className={`px-3 py-1 text-xs font-bold border transition-all ${user.calorieGoal===v?"bg-[#e63000] border-[#e63000] text-white":"border-border text-muted-foreground hover:border-[#e63000]/40"}`}>{v}</button>
                        ))}
                      </div>
                    )}
                    {!hasAccess(user,"Elite") && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5"><Crown size={11} className="text-yellow-400"/> Upgrade to Elite to edit your calorie goal</p>
                    )}
                  </div>

                  {/* Elite supplement guide */}
                  {hasAccess(user,"Elite") && user.bmiCat && (
                    <div className="bg-gradient-to-r from-yellow-400/5 to-transparent border border-yellow-400/20 rounded-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown size={14} className="text-yellow-400"/>
                        <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Elite — Supplement Guide</span>
                      </div>
                      <ul className="space-y-1.5">
                        {(user.bmiCat==="underweight"
                          ? ["Whey Protein (post-workout)", "Creatine Monohydrate (5g/day)", "Mass Gainer (if needed)", "Vitamin D3 + K2", "Omega-3 Fish Oil"]
                          : user.bmiCat==="normal"
                          ? ["Whey Protein (post-workout)", "Creatine Monohydrate (5g/day)", "Multivitamin (daily)", "Omega-3 Fish Oil", "Magnesium Glycinate"]
                          : user.bmiCat==="overweight"
                          ? ["Whey Protein (low-cal, post-workout)", "L-Carnitine (pre-cardio)", "Green Tea Extract", "Omega-3 Fish Oil", "Fiber Supplement"]
                          : ["Whey Protein (low-cal)", "L-Carnitine", "CLA (Conjugated Linoleic Acid)", "Vitamin D3 + B12", "Fiber + Probiotic"]
                        ).map(s=>(
                          <li key={s} className="flex items-center gap-2 text-sm text-foreground/80">
                            <Sparkles size={11} className="text-yellow-400 shrink-0"/> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-dashed border-border rounded-sm p-12 flex flex-col items-center justify-center text-center min-h-64">
                  <Calculator size={36} className="text-muted-foreground/20 mb-4"/>
                  <p className="text-muted-foreground text-sm">Enter weight &amp; height and click Calculate.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── DIET PLAN ────────────────────────────────────── */}
      <section ref={dietRef} className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#e63000] mb-3 block">Fuel Your Gains</span>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Diet Plan</h2>
            {user.bmiCat&&<div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-semibold ${BMI_META[user.bmiCat].bg} ${BMI_META[user.bmiCat].color}`}>{BMI_META[user.bmiCat].label} · {user.calorieGoal.toLocaleString()} kcal/day</div>}
          </div>
          {!hasAccess(user,"Pro") ? (
            <div className="max-w-md mx-auto text-center bg-card border border-border rounded-sm p-10">
              <Apple size={32} className="text-[#e63000] mx-auto mb-4"/>
              <h3 className="font-black uppercase tracking-wider mb-2" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Pro Feature</h3>
              <p className="text-muted-foreground text-sm mb-5">Upgrade to Pro (₹199/mo) for personalised 6-meal diet plans.</p>
              <button onClick={()=>scrollTo(plansRef)} className="bg-[#e63000] text-white font-bold uppercase tracking-wider px-7 py-3 hover:bg-[#cc2a00] transition-colors text-sm">Upgrade to Pro</button>
            </div>
          ) : (
            <>
              {user.bmiCat&&(
                <div className={`mb-7 border rounded-sm p-5 flex items-start gap-3 ${BMI_META[user.bmiCat].bg} ${BMI_META[user.bmiCat].border}`}>
                  <Target size={17} className={`${BMI_META[user.bmiCat].color} shrink-0 mt-0.5`}/>
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${BMI_META[user.bmiCat].color}`}>{BMI_META[user.bmiCat].label} Strategy</div>
                    <p className="text-sm text-foreground/80">
                      {user.bmiCat==="underweight"&&"Caloric surplus with nutrient-dense foods. Eat every 2–3 hours, prioritise protein + complex carbs."}
                      {user.bmiCat==="normal"&&"Balanced macros. Cycle strength and cardio. High protein to build and preserve muscle."}
                      {user.bmiCat==="overweight"&&"300–500 kcal daily deficit. Prioritise lean proteins and fibre-rich vegetables. Combine cardio with resistance training."}
                      {user.bmiCat==="obese"&&"Gradual 500–750 kcal deficit. Cut processed sugars. Start with low-impact cardio and consult your trainer."}
                    </p>
                  </div>
                </div>
              )}
              <div className="bg-card border border-border rounded-sm p-4 mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Daily Calorie Goal</div>
                  <div className="text-3xl font-black text-[#e63000]" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{user.calorieGoal.toLocaleString()} <span className="text-base text-muted-foreground font-normal">kcal</span></div>
                </div>
                {hasAccess(user,"Elite") ? (
                  <button onClick={()=>{setEditingCal(true);scrollTo(bmiRef);}} className="flex items-center gap-1.5 text-xs font-bold border border-[#e63000] text-[#e63000] px-4 py-2 hover:bg-[#e63000] hover:text-white transition-all uppercase tracking-wider">
                    <Pencil size={11}/> Edit Goal
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Crown size={11} className="text-yellow-400"/> Elite only — upgrade to edit</span>
                )}
              </div>
              <div className="flex justify-center mb-8">
                <div className="bg-card border border-border inline-flex p-1">
                  <button onClick={()=>setDietTab("veg")} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${dietTab==="veg"?"bg-green-500 text-white":"text-muted-foreground hover:text-foreground"}`}><Leaf size={14}/> Vegetarian</button>
                  <button onClick={()=>setDietTab("nonveg")} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${dietTab==="nonveg"?"bg-[#e63000] text-white":"text-muted-foreground hover:text-foreground"}`}><Flame size={14}/> Non-Veg</button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/50 text-center mb-4">Estimated nutritional values for general guidance only. Not a personalised medical prescription.</p>
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl mx-auto">
                {[
                  {label:"Total Calories",value:`${user.calorieGoal.toLocaleString()} kcal`},
                  {label:"Est. Protein",  value:dietTab==="veg"?`~${Math.round(user.calorieGoal*0.055)}g`:`~${Math.round(user.calorieGoal*0.082)}g`},
                  {label:"Meals / Day",   value:"6"},
                ].map(({label,value})=>(
                  <div key={label} className="bg-card border border-border rounded-sm p-4 text-center">
                    <div className="text-xl font-black text-[#e63000]" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMeals.map(meal=>(
                  <div key={meal.name} className="bg-card border border-border rounded-sm p-5 hover:border-[#e63000]/40 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-1.5"><Clock size={12} className="text-muted-foreground"/><span className="text-xs text-muted-foreground">{meal.time}</span></div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dietTab==="veg"?"text-green-400 bg-green-400/10":"text-[#e63000] bg-[#e63000]/10"}`}>{meal.cal} kcal</span>
                    </div>
                    <h4 className="text-base font-black uppercase tracking-wide mb-1" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{meal.name}</h4>
                    <div className="text-xs text-muted-foreground mb-3">Protein: <span className="text-foreground font-medium">{meal.protein}</span></div>
                    <ul className="space-y-1.5">
                      {meal.items.map(item=>(
                        <li key={item} className="flex items-start gap-2 text-sm text-foreground/70">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dietTab==="veg"?"bg-green-400":"bg-[#e63000]"}`}/> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── WORKOUTS ─────────────────────────────────────── */}
      <section ref={workoutRef} className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#e63000] mb-3 block">Train Like a Pro</span>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Workout Library</h2>
          </div>
          {!hasAccess(user,"Pro") ? (
            <div className="max-w-md mx-auto text-center bg-card border border-border rounded-sm p-10">
              <Play size={32} className="text-[#e63000] mx-auto mb-4"/>
              <h3 className="font-black uppercase tracking-wider mb-2" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Pro Feature</h3>
              <p className="text-muted-foreground text-sm mb-5">Upgrade to Pro (₹199/mo) for the full workout video library.</p>
              <button onClick={()=>scrollTo(plansRef)} className="bg-[#e63000] text-white font-bold uppercase tracking-wider px-7 py-3 hover:bg-[#cc2a00] transition-colors text-sm">Upgrade to Pro</button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-3 mb-7">
                {hasAccess(user,"Elite") && user.bmiCat && (
                  <button onClick={()=>setShowBmiOnly(!showBmiOnly)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider border transition-all ${showBmiOnly?"bg-yellow-400 border-yellow-400 text-black":"border-yellow-400/40 text-yellow-400 hover:border-yellow-400"}`}>
                    <Crown size={13}/> {showBmiOnly?"BMI-Matched Only":"Elite: Filter by BMI"}
                  </button>
                )}
                {(["all","strength","cardio","flexibility"] as WorkoutCat[]).map(cat=>(
                  <button key={cat} onClick={()=>setWorkoutCat(cat)}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border transition-all ${workoutCat===cat?"bg-[#e63000] border-[#e63000] text-white":"border-border text-muted-foreground hover:border-[#e63000]/50"}`}>
                    {cat==="all"?"All":cat==="strength"?"Strength":cat==="cardio"?"Cardio":"Flexibility"}
                  </button>
                ))}
              </div>
              {filtVids.length===0 ? (
                <div className="text-center py-14"><RotateCcw size={28} className="mx-auto mb-3 text-muted-foreground/30"/><p className="text-muted-foreground text-sm">No videos match — try removing the BMI filter.</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtVids.map(video=>(
                    <div key={video.id} onClick={()=>setActiveVideo(video)} className="group bg-card border border-border rounded-sm overflow-hidden hover:border-[#e63000]/40 transition-all hover:-translate-y-0.5 cursor-pointer">
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img src={`https://images.unsplash.com/${video.photo}?w=640&h=360&fit=crop&auto=format`} alt={video.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"/>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#e63000] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-[#e63000]/30">
                            <Play size={17} className="text-white ml-0.5" fill="white"/>
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-1.5 py-0.5 rounded">{video.dur}</div>
                        {user.bmiCat&&video.bmiTags.includes(user.bmiCat)&&hasAccess(user,"Elite")&&(
                          <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded flex items-center gap-1"><Crown size={9}/> For you</div>
                        )}
                        {user.bmiCat&&video.bmiTags.includes(user.bmiCat)&&!hasAccess(user,"Elite")&&(
                          <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded ${BMI_META[user.bmiCat].bg} ${BMI_META[user.bmiCat].color}`}>✓ Recommended</div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LVL_CLR[video.level]}`}>{video.level}</span>
                          <span className="text-xs text-muted-foreground">{video.muscle}</span>
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-wide leading-snug" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>{video.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-background border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><Dumbbell className="text-[#e63000]" size={18}/><span className="font-black tracking-widest uppercase text-sm" style={{ fontFamily:"'Barlow Condensed',sans-serif"}}>Iron <span className="text-[#e63000]">Pulse</span> Fitness</span></div>
          <p className="text-xs text-muted-foreground text-center">© 2026 Iron Pulse Fitness · Demo / Portfolio Project · Data stored locally</p>
          <p className="text-xs text-muted-foreground/50 text-center">No real payments · No backend · LocalStorage only</p>
        </div>
      </footer>

      {/* ─── TOAST ────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-sm shadow-2xl text-sm font-semibold transition-all
            ${toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"}`}
        >
          {toast.type === "success" ? <CheckCircle size={15}/> : <X size={15}/>}
          {toast.msg}
        </div>
      )}

      {/* ─── VIDEO MODAL ──────────────────────────────────── */}
      {activeVideo&&(
        <VideoModal video={activeVideo} onClose={()=>setActiveVideo(null)}/>
      )}

      {/* ─── EDIT PROFILE MODAL ───────────────────────────── */}
      {editProfileOpen&&(
        <EditProfileModal
          user={user}
          draft={profileDraft}
          setDraft={setProfileDraft}
          onSave={(up)=>{persistUser(up);setEditProfileOpen(false);setBmiW(String(up.weightKg??user.weightKg));setBmiH(String(up.heightCm??user.heightCm));}}
          onClose={()=>setEditProfileOpen(false)}
        />
      )}
    </div>
  );
}
