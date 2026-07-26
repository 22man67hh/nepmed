/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";


dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Proxy specific routes to Laravel backend
const BACKEND_URL = "http://127.0.0.1:8000";
const proxyPrefixes = [
  "/api/login",
  "/api/logout",
  "/api/register",
  "/api/verify-otp",
  "/api/resend-otp",
  "/api/me",
  "/api/callback/google",
  "/api/subjects",
  "/api/exams",
  "/api/topics",
  "/api/admin-login",
  "/api/question-sets",
  "/api/questions",
  "/api/premium-packages",
  "/api/question-import",
];

app.use(async (req, res, next) => {
  const shouldProxy = proxyPrefixes.some(prefix => 
    req.path === prefix || req.path.startsWith(prefix + "/")
  );

  if (shouldProxy) {
    try {
      const url = `${BACKEND_URL}${req.originalUrl || req.url}`;
      
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
        }
      }

      headers["host"] = "127.0.0.1:8000";

      const requestInit: RequestInit = {
        method: req.method,
        headers: headers,
      };

      if (!["GET", "HEAD"].includes(req.method)) {
        requestInit.body = JSON.stringify(req.body);
      }

      const response = await fetch(url, requestInit);
      
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "content-encoding") {
          res.setHeader(key, value);
        }
      });
      
      const responseText = await response.text();
      res.send(responseText);
    } catch (error: any) {
      console.error(`Proxy error for path ${req.path}:`, error);
      res.status(500).json({ error: "Failed to connect to backend API server", details: error.message });
    }
  } else {
    next();
  }
});

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in AI Studio Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiInstance;
}

// API Route for AI Medical Tutor explanation
app.post("/api/tutor", async (req, res) => {
  try {
    const { questionText, options, explanation, subject } = req.body;
    if (!questionText) {
      return res.status(400).json({ error: "questionText is required" });
    }

    let client: GoogleGenAI;
    try {
      client = getGeminiClient();
    } catch (err: any) {
      return res.status(503).json({
        error: "Gemini API key is not configured. To use the AI Tutor, please add 'GEMINI_API_KEY' in the AI Studio Secrets panel.",
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert Nepalese Medical entrance/licensing exam tutor (specializing in MEC-UG, MEC-PG, NMCLE, and Loksewa medical officer preparation).
Analyze the following multiple-choice question and provide a high-yield, engaging, and clear study explanation for a Nepalese medical student.

Question details:
- Subject: ${subject || "General Medicine"}
- Question: "${questionText}"
- Options:
${options.map((opt: string, i: number) => `  ${i + 1}. ${opt}`).join("\n")}
- Standard Explanation: "${explanation}"

Please structure your response in Markdown with the following clear headers:
1. **🎓 High-Yield Concept**: Explain clearly and concisely why the correct option is the right answer, referencing Nepalese clinical guidelines or diagnostic criteria where appropriate.
2. **❌ Elimination Breakdown**: Take 1-2 sentences per alternative choice to explain why it is incorrect or in what clinical context it would be selected.
3. **💡 Premium Mnemonic**: Create or share a memorable medical mnemonic (or a "High-Yield Pearl") to help the student easily retain this concept for the actual exam.

Ensure your tone is encouraging, professional, and directly focused on passing medical exams in Nepal. Keep it highly readable and visually styled with clean formatting.`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Tutor Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI tutor explanation." });
  }
});

// ==========================================
// FILE-BASED DATABASE STORAGE & ENTIRE APIS
// ==========================================

const FORUM_FILE = path.join(process.cwd(), "forum_threads.json");
const TICKETS_FILE = path.join(process.cwd(), "tickets.json");
const REPORTS_FILE = path.join(process.cwd(), "reports.json");
const OTP_FILE = path.join(process.cwd(), "otp_codes.json");

// Helper to read JSON file safely
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

// Helper to write JSON file safely
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Default threads to load if the forum is fresh
interface ForumReply {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  createdAt: string;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  category: string;
  createdAt: string;
  replies: ForumReply[];
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}

interface MCQReport {
  id: string;
  questionId: string;
  setName: string;
  questionText: string;
  issueText: string;
  reporterEmail: string;
  createdAt: string;
}

interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: number;
}

const DEFAULT_FORUM_THREADS: ForumThread[] = [
  {
    id: "thread-1",
    title: "How to memorize the branches of the Internal Carotid Artery (ICA)?",
    content: "Hi everyone! I am struggling to recall all the branches of the cerebral part of the Internal Carotid Artery for my upcoming MEC-UG entrance. Does anyone have a solid, high-yield clinical mnemonic?",
    authorName: "Dr. Sunil Subedi",
    authorEmail: "subedi.sunil@nepmed.edu",
    authorAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sunil",
    category: "Anatomy",
    createdAt: new Date(Date.now() - 3 * 3600000 * 24).toISOString(),
    replies: [
      {
        id: "reply-1-1",
        content: "Hey Sunil! Yes, a classic high-yield mnemonic we use is: **'A Professional Surgeon Ought Many Pretty Clinical Things'**.\n\n- **A**: Anterior Choroidal Artery\n- **P**: Posterior Communicating Artery\n- **S**: Superior Hypophyseal Artery\n- **O**: Ophthalmic Artery\n- **M**: Middle Cerebral Artery (terminal branch)\n- **A**: Anterior Cerebral Artery (terminal branch)\n\nThis covers the cerebral segment branches perfectly. Keep focused on the Ophthalmic branch, they love asking about it in licensing exams!",
        authorName: "Prof. Dr. Ramesh Koirala",
        authorEmail: "koirala.ramesh@nepmed.edu",
        authorAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ramesh",
        createdAt: new Date(Date.now() - 2.5 * 3600000 * 24).toISOString(),
      },
      {
        id: "reply-1-2",
        content: "This is super elegant! Thanks Prof. Ramesh. Memorizing this mnemonic made it so simple.",
        authorName: "Dr. Anjana Adhikari",
        authorEmail: "anjana.adhikari@nepmed.edu",
        authorAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=anjana",
        createdAt: new Date(Date.now() - 2 * 3600000 * 24).toISOString(),
      }
    ]
  },
  {
    id: "thread-2",
    title: "MEC-PG Eligibility & Internship Guidelines for 2026",
    content: "Is there any official update from the Medical Education Commission (MEC) regarding internship duration completion requirements for PG eligibility this year? Do we need exactly 12 months completed before registering?",
    authorName: "Dr. Niranjan Sharma",
    authorEmail: "sharma.niranjan@nepmed.edu",
    authorAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sharma",
    category: "MEC-PG Rules",
    createdAt: new Date(Date.now() - 2 * 3600000 * 24).toISOString(),
    replies: [
      {
        id: "reply-2-1",
        content: "Hello Dr. Niranjan. Yes, the current guidelines mandate that candidates must complete exactly 1 year (12 months) of regular rotatory internship and register with the NMC (temporary/permanent licensing) by the deadline specified in the application call. There are no exemptions as of the latest committee meeting.",
        authorName: "Prof. Dr. Ramesh Koirala",
        authorEmail: "koirala.ramesh@nepmed.edu",
        authorAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ramesh",
        createdAt: new Date(Date.now() - 1 * 3600000 * 24).toISOString(),
      }
    ]
  }
];

// 1. DISCUSSION FORUM ENDPOINTS

app.get("/api/forum", (req, res) => {
  const threads = readJsonFile<ForumThread[]>(FORUM_FILE, DEFAULT_FORUM_THREADS);
  if (!fs.existsSync(FORUM_FILE)) {
    writeJsonFile(FORUM_FILE, DEFAULT_FORUM_THREADS);
  }
  res.json(threads);
});

app.post("/api/forum/thread", (req, res) => {
  const { title, content, authorName, authorEmail, authorAvatar, category } = req.body;
  if (!title || !content || !authorName || !authorEmail) {
    return res.status(400).json({ error: "Title, content, and author details are required" });
  }
  const threads = readJsonFile<ForumThread[]>(FORUM_FILE, DEFAULT_FORUM_THREADS);
  const newThread: ForumThread = {
    id: `thread-${Date.now()}`,
    title,
    content,
    authorName,
    authorEmail,
    authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(authorName)}`,
    category: category || "General",
    createdAt: new Date().toISOString(),
    replies: []
  };
  threads.unshift(newThread);
  writeJsonFile(FORUM_FILE, threads);
  res.json(newThread);
});

app.post("/api/forum/reply", (req, res) => {
  const { threadId, content, authorName, authorEmail, authorAvatar } = req.body;
  if (!threadId || !content || !authorName || !authorEmail) {
    return res.status(400).json({ error: "Missing required reply parameters" });
  }
  const threads = readJsonFile<ForumThread[]>(FORUM_FILE, DEFAULT_FORUM_THREADS);
  const idx = threads.findIndex(t => t.id === threadId);
  if (idx === -1) {
    return res.status(404).json({ error: "Forum thread not found" });
  }
  const newReply: ForumReply = {
    id: `reply-${Date.now()}`,
    content,
    authorName,
    authorEmail,
    authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(authorName)}`,
    createdAt: new Date().toISOString()
  };
  threads[idx].replies.push(newReply);
  writeJsonFile(FORUM_FILE, threads);
  res.json(newReply);
});

// 2. SUPPORT & OPEN TICKETS ENDPOINTS

app.post("/api/support/ticket", (req, res) => {
  const { name, email, subject, category, message } = req.body;
  if (!name || !email || !subject || !category || !message) {
    return res.status(400).json({ error: "All support inquiry fields are required" });
  }
  const tickets = readJsonFile<SupportTicket[]>(TICKETS_FILE, []);
  const newTicket: SupportTicket = {
    id: `ticket-${Date.now()}`,
    name,
    email,
    subject,
    category,
    message,
    status: "open",
    createdAt: new Date().toISOString()
  };
  tickets.unshift(newTicket);
  writeJsonFile(TICKETS_FILE, tickets);
  res.json(newTicket);
});

app.get("/api/support/tickets", (req, res) => {
  const tickets = readJsonFile<SupportTicket[]>(TICKETS_FILE, []);
  res.json(tickets);
});

// 3. MCQ REPORTS ENDPOINTS

const CMS_FILE = path.join(process.cwd(), "content_config.json");

const DEFAULT_CMS_CONTENT = {
  brandName: "nepmedmcq",
  sidebarLabels: {
    dashboard: "Dashboard",
    set_practice: "Set wise Practice",
    practice: "Subject Wise Practice",
    bookmarks: "Saved Questions",
    history: "My Report",
    leaderboard: "Leaderboard",
    forum: "Discussion Forum",
    subscription: "Premium Subscription",
    refer_earn: "Refer & Earn",
    about: "About Us & Support",
    admin: "Question Upload & Pricing"
  },
  dashboardLabels: {
    preparingFor: "Currently Preparing For",
    papersAvailable: "sets of previous board papers and new mock modules available.",
    browseButton: "Browse Available Papers",
    arenaTitle: "Practice MCQ Arena",
    arenaSubtitle: "Select any of the curated question papers below to begin simulating with active timer constraints.",
    allPapersButton: "View All Arena Papers",
    arenaSelectSubtitle: "Choose a specific Nepalese province or central public service commission to access localized question sets."
  },
  examDescriptions: {
    "mec-ug": "Medical Education Commission - Undergraduate (MBBS/BDS/BSc Nursing Entrance Exam preparation modules and detailed past papers).",
    "mec-pg": "Medical Education Commission - Postgraduate (MD/MS MDGP entrance modules with advanced clinical case explanations).",
    "nmcle": "Nepal Medical Council Licensing Exam (booster question sets aligned with official syllabus blocks & past papers).",
    "ku-mcq": "Kathmandu University undergraduate entrance and licensing examination past question bank.",
    "loksewa": "Public Service Commission (Loksewa Aayog) General Medical Officer and Healthcare Services exams."
  },
  aboutUsLabels: {
    heroTitle: "About nepmedmcq Editorial Board",
    heroDescription: "NepMedMCQ is Nepal's premier full-stack interactive medical education engine. We are dedicated to providing high-yield multiple choice test questions, detailed clinical rationales, and memory mnemonics meticulously aligned with the standards of the Medical Education Commission (MEC) and the Nepal Medical Council (NMC) licensing examinations.",
    teamTitle: "Our Eminent Editorial Board",
    contactTitle: "Official Contact Details",
    contactDescription: "If you have institutional registration queries, partnership opportunities, or feedback regarding NMCLE syllabus coverage, reach us directly or visit our office.",
    officeTitle: "Our Office Address",
    officeText: "Maharajgunj Clinical Complex\nOpposite Teaching Hospital (IOM)\nKathmandu 44600, Nepal",
    emailTitle: "Email Addresses",
    emailText: "Editorial: info@nepmedmcq.edu.np\nSupport: support@nepmedmcq.edu.np",
    phoneTitle: "Phone & Support Hours",
    phoneText: "Landline: +977-1-4412345\nCell: +977-98510-00000\nSun - Fri, 9:00 AM - 5:00 PM (NST)"
  },
  editorialTeam: [
    {
      name: "Prof. Dr. Ramesh Koirala",
      role: "Chief Editorial Director",
      institution: "Institute of Medicine (IOM), Maharajgunj, Kathmandu",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ramesh",
      specialty: "Clinical Surgery, NMCLE Curriculum & High-Yield Case Scenarios"
    },
    {
      name: "Dr. Sunil Subedi",
      role: "Associate Professor of Pathology",
      institution: "Kathmandu University School of Medical Sciences (KUSMS)",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sunil",
      specialty: "General Pathology, Immunology & MEC-PG Exam Frameworks"
    },
    {
      name: "Dr. Anjana Adhikari",
      role: "Senior Consultant Gynecologist",
      institution: "Patan Academy of Health Sciences (PAHS), Lalitpur",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=anjana",
      specialty: "Maternal Health Policy, Obstetrics & Public Health Programs"
    }
  ],
  subscriptionPlans: [
    {
      id: "pass-2",
      days: 2,
      tag: "Quick Sprint",
      title: "2 Days Full Access",
      description: "Excellent for a quick review before exam date.",
      price: 100
    },
    {
      id: "pass-7",
      days: 7,
      tag: "Weekly booster",
      title: "1 Week Unlimited",
      description: "Thoroughly solve all past questions with full AI explanations.",
      price: 300
    },
    {
      id: "pass-30",
      days: 30,
      tag: "Exam Mastery",
      title: "30 Days Unlimited",
      description: "Full comprehensive access with upcoming mock updates.",
      price: 500
    }
  ],
  loginLabels: {
    brandName: "nepmedmcq",
    brandSubtitle: "Nepal's Premier Medical MCQs & License Prep Engine",
    signupGoogleButton: "Sign Up with Google",
    signinGoogleButton: "Sign In with Google",
    termsAcceptedLabel: "I explicitly agree to the Terms & Conditions and Privacy Policy",
    registerButton: "Register Account",
    loginButton: "Access Prep Dashboard",
    dividerText: "or continue with"
  },
  sidebarItems: [
    { id: "dashboard", label: "Dashboard", enabled: true, order: 1 },
    { id: "set_practice", label: "Set wise Practice", enabled: true, order: 2 },
    { id: "practice", label: "Subject Wise Practice", enabled: true, order: 3 },
    { id: "bookmarks", label: "Saved Questions", enabled: true, order: 4 },
    { id: "history", label: "My Report", enabled: true, order: 5 },
    { id: "leaderboard", label: "Leaderboard", enabled: true, order: 6 },
    { id: "forum", label: "Discussion Forum", enabled: true, order: 7 },
    { id: "subscription", label: "Premium Subscription", enabled: true, order: 8 },
    { id: "refer_earn", label: "Refer & Earn", enabled: true, order: 9 },
    { id: "about", label: "About Us & Support", enabled: true, order: 10 },
    { id: "admin", label: "Question Upload & Pricing", enabled: true, order: 11 }
  ],
  subscriptionConfig: {
    title: "Upgrade to Premium Pass",
    subtitle: "Get unlimited access to high-yield clinical MCQs, past papers, and premium AI explanations.",
    benefits: [
      "Access 25,500+ syllabus-aligned medical MCQs",
      "Real-time mock boards with national-level leaderboards",
      "Meticulous textbook references & memory mnemonics",
      "Premium 24/7 Gemini Medical AI Tutor access",
      "Detailed progress graphs and exam preparation reports"
    ],
    promoBanner: "🎉 SPECIAL OFFER: 15% discount applied automatically on checkout!",
    paymentMethods: [
      { name: "eSewa Pay", logo: "🟢", description: "Instant activation via standard Nepal eSewa wallet connection." },
      { name: "Khalti Wallet", logo: "🟣", description: "Fast billing using Khalti OTP verification API." },
      { name: "Nepal Fonepay", logo: "🔴", description: "Scan-to-Pay QR code secure terminal access." }
    ]
  },
  referEarnConfig: {
    title: "Refer Friends, Earn Cash & Points!",
    subtitle: "Invite other medical students/doctors to NepMedMCQ. Get rewarded instantly upon registration and subscription purchase.",
    pointsPerReg: 50,
    pointsPerSub: 500,
    promoMessage: "Hey! Check out NepMedMCQ, Nepal's best app for MECEE and Licensing MCQs. Use my code to register and get bonus access!",
    rules: [
      "Share your unique custom referral link or code with friends.",
      "Get 50 points as soon as they register their verified account.",
      "Get 500 premium points if they upgrade to any of the unlimited board preparation packages.",
      "Redeem points directly to unlock individual premium exam sets or extend your current pass!"
    ]
  },
  mecUgClassification: [
    {
      subject: "Physics",
      icon: "⚡",
      weight: 50,
      topics: [
        { name: "Mechanics", icon: "⚙️", weight: 10 },
        { name: "Heat and thermodynamics", icon: "🔥", weight: 8 },
        { name: "Waves and optics", icon: "👓", weight: 8 },
        { name: "Current electricity and magnetism", icon: "🧲", weight: 9 },
        { name: "Electrostatics and capacitors", icon: "🔋", weight: 7 },
        { name: "Modern physics", icon: "⚛️", weight: 8 }
      ]
    },
    {
      subject: "Chemistry",
      icon: "⚗️",
      weight: 50,
      topics: [
        { name: "Physical chemistry", icon: "📈", weight: 15 },
        { name: "Inorganic chemistry", icon: "💎", weight: 10 },
        { name: "Organic chemistry", icon: "🧬", weight: 15 },
        { name: "Applied chemistry", icon: "🧪", weight: 5 },
        { name: "Analytic chemistry", icon: "📊", weight: 5 }
      ]
    },
    {
      subject: "Botany",
      icon: "🌱",
      weight: 40,
      topics: [
        { name: "Basic component of life", icon: "🔬", weight: 4 },
        { name: "Biodiversity", icon: "🌸", weight: 5 },
        { name: "Ecology and vegetation", icon: "🌲", weight: 5 },
        { name: "Cell biology", icon: "🧫", weight: 5 },
        { name: "Genetics", icon: "🧬", weight: 5 },
        { name: "Plant anatomy", icon: "🌿", weight: 4 },
        { name: "Plant physiology", icon: "🍃", weight: 5 },
        { name: "Developmental botany", icon: "🥚", weight: 4 },
        { name: "Applied botany", icon: "🌾", weight: 3 }
      ]
    },
    {
      subject: "Zoology",
      icon: "🦁",
      weight: 40,
      topics: [
        { name: "Evolutionary Biology", icon: "🦕", weight: 4 },
        { name: "Animal Diversity and Classification", icon: "🐙", weight: 5 },
        { name: "Animal Tissues and Histology", icon: "🔬", weight: 4 },
        { name: "Study of Selected Animals", icon: "🐸", weight: 5 },
        { name: "Human Biology and Physiology", icon: "🫁", weight: 12 },
        { name: "Microbial Diseases and Immunology", icon: "🦠", weight: 4 },
        { name: "Medical Technology and Applied Biology", icon: "💉", weight: 3 },
        { name: "Biota, Environment and Conservation", icon: "🌍", weight: 3 }
      ]
    },
    {
      subject: "MAT",
      icon: "🧠",
      weight: 20,
      topics: [
        { name: "Verbal reasoning", icon: "🗣️", weight: 5 },
        { name: "Numerical reasoning", icon: "🔢", weight: 5 },
        { name: "Logical sequencing", icon: "🧩", weight: 5 },
        { name: "Spatial relation / Abstract reasoning", icon: "📐", weight: 5 }
      ]
    }
  ],
  mecPgClassification: [
    { category: "preclinical", subject: "Anatomy", icon: "💀", weight: 10, targetExam: "mec-pg", enabled: true },
    { category: "preclinical", subject: "Physiology", icon: "🫁", weight: 10, targetExam: "mec-pg", enabled: true },
    { category: "preclinical", subject: "Biochemistry", icon: "🧪", weight: 10, targetExam: "mec-pg", enabled: true },
    { category: "preclinical", subject: "Pathology", icon: "🔬", weight: 10, targetExam: "mec-pg", enabled: true },
    { category: "preclinical", subject: "Microbiology", icon: "🦠", weight: 10, targetExam: "mec-pg", enabled: true },
    { category: "preclinical", subject: "Pharmacology", icon: "💊", weight: 10, targetExam: "mec-pg", enabled: true },
    { category: "preclinical", subject: "Community Medicine", icon: "🌍", weight: 12, targetExam: "mec-pg", enabled: true },
    { category: "clinical", subject: "Medicine", icon: "🏥", weight: 20, targetExam: "mec-pg", enabled: true },
    { category: "clinical", subject: "Surgery", icon: "🔪", weight: 20, targetExam: "mec-pg", enabled: true },
    { category: "clinical", subject: "Obstetrics & Gynecology", icon: "🤰", weight: 20, targetExam: "mec-pg", enabled: true },
    { category: "clinical", subject: "Pediatrics", icon: "👶", weight: 15, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "ENT", icon: "👂", weight: 8, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "Ophthalmology", icon: "👁️", weight: 8, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "Forensic Medicine", icon: "🔍", weight: 5, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "Orthopedics", icon: "🦴", weight: 8, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "Psychiatry", icon: "🧠", weight: 5, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "Dermatology", icon: "🧴", weight: 5, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "Radiology", icon: "🩻", weight: 5, targetExam: "mec-pg", enabled: true },
    { category: "short", subject: "Anesthesiology", icon: "💤", weight: 4, targetExam: "mec-pg", enabled: true },

    { category: "preclinical", subject: "Anatomy", icon: "💀", weight: 10, targetExam: "nmcle", enabled: true },
    { category: "preclinical", subject: "Physiology", icon: "🫁", weight: 10, targetExam: "nmcle", enabled: true },
    { category: "preclinical", subject: "Biochemistry", icon: "🧪", weight: 10, targetExam: "nmcle", enabled: true },
    { category: "preclinical", subject: "Pathology", icon: "🔬", weight: 10, targetExam: "nmcle", enabled: true },
    { category: "preclinical", subject: "Microbiology", icon: "🦠", weight: 10, targetExam: "nmcle", enabled: true },
    { category: "preclinical", subject: "Pharmacology", icon: "💊", weight: 10, targetExam: "nmcle", enabled: true },
    { category: "preclinical", subject: "Community Medicine", icon: "🌍", weight: 12, targetExam: "nmcle", enabled: true },
    { category: "clinical", subject: "Medicine", icon: "🏥", weight: 20, targetExam: "nmcle", enabled: true },
    { category: "clinical", subject: "Surgery", icon: "🔪", weight: 20, targetExam: "nmcle", enabled: true },
    { category: "clinical", subject: "Obstetrics & Gynecology", icon: "🤰", weight: 20, targetExam: "nmcle", enabled: true },
    { category: "clinical", subject: "Pediatrics", icon: "👶", weight: 15, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "ENT", icon: "👂", weight: 8, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "Ophthalmology", icon: "👁️", weight: 8, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "Forensic Medicine", icon: "🔍", weight: 5, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "Orthopedics", icon: "🦴", weight: 8, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "Psychiatry", icon: "🧠", weight: 5, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "Dermatology", icon: "🧴", weight: 5, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "Radiology", icon: "🩻", weight: 5, targetExam: "nmcle", enabled: true },
    { category: "short", subject: "Anesthesiology", icon: "💤", weight: 4, targetExam: "nmcle", enabled: true },

    { category: "preclinical", subject: "Anatomy", icon: "💀", weight: 10, targetExam: "loksewa", enabled: true },
    { category: "preclinical", subject: "Physiology", icon: "🫁", weight: 10, targetExam: "loksewa", enabled: true },
    { category: "preclinical", subject: "Biochemistry", icon: "🧪", weight: 10, targetExam: "loksewa", enabled: true },
    { category: "preclinical", subject: "Pathology", icon: "🔬", weight: 10, targetExam: "loksewa", enabled: true },
    { category: "preclinical", subject: "Microbiology", icon: "🦠", weight: 10, targetExam: "loksewa", enabled: true },
    { category: "preclinical", subject: "Pharmacology", icon: "💊", weight: 10, targetExam: "loksewa", enabled: true },
    { category: "preclinical", subject: "Community Medicine", icon: "🌍", weight: 12, targetExam: "loksewa", enabled: true },
    { category: "clinical", subject: "Medicine", icon: "🏥", weight: 20, targetExam: "loksewa", enabled: true },
    { category: "clinical", subject: "Surgery", icon: "🔪", weight: 20, targetExam: "loksewa", enabled: true },
    { category: "clinical", subject: "Obstetrics & Gynecology", icon: "🤰", weight: 20, targetExam: "loksewa", enabled: true },
    { category: "clinical", subject: "Pediatrics", icon: "👶", weight: 15, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "ENT", icon: "👂", weight: 8, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "Ophthalmology", icon: "👁️", weight: 8, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "Forensic Medicine", icon: "🔍", weight: 5, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "Orthopedics", icon: "🦴", weight: 8, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "Psychiatry", icon: "🧠", weight: 5, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "Dermatology", icon: "🧴", weight: 5, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "Radiology", icon: "🩻", weight: 5, targetExam: "loksewa", enabled: true },
    { category: "short", subject: "Anesthesiology", icon: "💤", weight: 4, targetExam: "loksewa", enabled: true },

    { category: "preclinical", subject: "Anatomy", icon: "💀", weight: 10, targetExam: "ku-mcq", enabled: true },
    { category: "preclinical", subject: "Physiology", icon: "🫁", weight: 10, targetExam: "ku-mcq", enabled: true },
    { category: "preclinical", subject: "Biochemistry", icon: "🧪", weight: 10, targetExam: "ku-mcq", enabled: true },
    { category: "preclinical", subject: "Pathology", icon: "🔬", weight: 10, targetExam: "ku-mcq", enabled: true },
    { category: "preclinical", subject: "Microbiology", icon: "🦠", weight: 10, targetExam: "ku-mcq", enabled: true },
    { category: "preclinical", subject: "Pharmacology", icon: "💊", weight: 10, targetExam: "ku-mcq", enabled: true },
    { category: "preclinical", subject: "Community Medicine", icon: "🌍", weight: 12, targetExam: "ku-mcq", enabled: true },
    { category: "clinical", subject: "Medicine", icon: "🏥", weight: 20, targetExam: "ku-mcq", enabled: true },
    { category: "clinical", subject: "Surgery", icon: "🔪", weight: 20, targetExam: "ku-mcq", enabled: true },
    { category: "clinical", subject: "Obstetrics & Gynecology", icon: "🤰", weight: 20, targetExam: "ku-mcq", enabled: true },
    { category: "clinical", subject: "Pediatrics", icon: "👶", weight: 15, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "ENT", icon: "👂", weight: 8, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "Ophthalmology", icon: "👁️", weight: 8, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "Forensic Medicine", icon: "🔍", weight: 5, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "Orthopedics", icon: "🦴", weight: 8, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "Psychiatry", icon: "🧠", weight: 5, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "Dermatology", icon: "🧴", weight: 5, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "Radiology", icon: "🩻", weight: 5, targetExam: "ku-mcq", enabled: true },
    { category: "short", subject: "Anesthesiology", icon: "💤", weight: 4, targetExam: "ku-mcq", enabled: true }
  ],
  leaderboardConfig: {
    title: "Prep Leaderboard",
    subtitle: "See how your total correct MCQ counts stack up against Nepal's top licensing and entrance candidates.",
    subTitleTag: "National Medical Exam Standings",
    competitors: [
      { name: "Dr. Sandeep Adhikari", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sandeep", totalCorrect: 285, testsCompleted: 15, accuracy: 92, city: "Kathmandu" },
      { name: "Pooja Shrestha", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Pooja", totalCorrect: 242, testsCompleted: 13, accuracy: 88, city: "Lalitpur" },
      { name: "Sushant Thapa", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sushant", totalCorrect: 215, testsCompleted: 11, accuracy: 86, city: "Pokhara" },
      { name: "Aayushma Bhandari", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aayushma", totalCorrect: 198, testsCompleted: 12, accuracy: 81, city: "Biratnagar" },
      { name: "Dr. Ramesh Kushwaha", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh", totalCorrect: 184, testsCompleted: 10, accuracy: 84, city: "Janakpur" },
      { name: "Niranjan Chaudhary", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Niranjan", totalCorrect: 172, testsCompleted: 9, accuracy: 79, city: "Butwal" },
      { name: "Samikshya Devkota", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Samikshya", totalCorrect: 158, testsCompleted: 8, accuracy: 82, city: "Chitwan" }
    ]
  }
};

app.get("/api/cms/content", (req, res) => {
  const content = readJsonFile<any>(CMS_FILE, DEFAULT_CMS_CONTENT);
  const mergedContent = {
    ...DEFAULT_CMS_CONTENT,
    ...content,
    sidebarLabels: {
      ...DEFAULT_CMS_CONTENT.sidebarLabels,
      ...(content.sidebarLabels || {})
    },
    subscriptionConfig: {
      ...DEFAULT_CMS_CONTENT.subscriptionConfig,
      ...(content.subscriptionConfig || {})
    },
    referEarnConfig: {
      ...DEFAULT_CMS_CONTENT.referEarnConfig,
      ...(content.referEarnConfig || {})
    }
  };

  const currentItems = content.sidebarItems || [];
  const mergedItems = [...DEFAULT_CMS_CONTENT.sidebarItems];
  
  mergedItems.forEach((defaultItem) => {
    const existing = currentItems.find((i: any) => i.id === defaultItem.id);
    if (existing) {
      defaultItem.label = existing.label;
      defaultItem.enabled = existing.enabled !== undefined ? existing.enabled : defaultItem.enabled;
      defaultItem.order = existing.order !== undefined ? existing.order : defaultItem.order;
    }
  });

  currentItems.forEach((item: any) => {
    if (!mergedItems.some((i: any) => i.id === item.id)) {
      mergedItems.push(item);
    }
  });

  mergedContent.sidebarItems = mergedItems.sort((a, b) => a.order - b.order);

  if (!fs.existsSync(CMS_FILE)) {
    writeJsonFile(CMS_FILE, DEFAULT_CMS_CONTENT);
  } else {
    writeJsonFile(CMS_FILE, mergedContent);
  }
  res.json(mergedContent);
});

app.post("/api/cms/content", (req, res) => {
  writeJsonFile(CMS_FILE, req.body);
  res.json({ success: true, content: req.body });
});

const QUESTION_SETS_FILE = path.join(process.cwd(), "question_sets.json");
const INDEPENDENT_QUESTIONS_FILE = path.join(process.cwd(), "independent_questions.json");
const DRAFT_QUESTIONS_FILE = path.join(process.cwd(), "draft_questions.json");

app.get("/api/admin/sets", (req, res) => {
  const sets = readJsonFile<any[]>(QUESTION_SETS_FILE, []);
  res.json(sets);
});

app.post("/api/admin/sets", (req, res) => {
  writeJsonFile(QUESTION_SETS_FILE, req.body);
  res.json({ success: true });
});

app.get("/api/admin/independent-questions", (req, res) => {
  const qs = readJsonFile<any[]>(INDEPENDENT_QUESTIONS_FILE, []);
  res.json(qs);
});

app.post("/api/admin/independent-questions", (req, res) => {
  writeJsonFile(INDEPENDENT_QUESTIONS_FILE, req.body);
  res.json({ success: true });
});

app.get("/api/admin/draft-questions", (req, res) => {
  const qs = readJsonFile<any[]>(DRAFT_QUESTIONS_FILE, []);
  res.json(qs);
});

app.post("/api/admin/draft-questions", (req, res) => {
  writeJsonFile(DRAFT_QUESTIONS_FILE, req.body);
  res.json({ success: true });
});

app.post("/api/reports", (req, res) => {
  const { questionId, setName, questionText, issueText, reporterEmail } = req.body;
  if (!questionId || !setName || !questionText || !issueText || !reporterEmail) {
    return res.status(400).json({ error: "All report fields are required" });
  }
  const reports = readJsonFile<MCQReport[]>(REPORTS_FILE, []);
  const newReport: MCQReport = {
    id: `report-${Date.now()}`,
    questionId,
    setName,
    questionText,
    issueText,
    reporterEmail,
    createdAt: new Date().toISOString()
  };
  reports.unshift(newReport);
  writeJsonFile(REPORTS_FILE, reports);
  res.json(newReport);
});

app.get("/api/reports", (req, res) => {
  const reports = readJsonFile<MCQReport[]>(REPORTS_FILE, []);
  res.json(reports);
});

// 4. EMAIL CONFIRMATION WITH OTP ENDPOINTS

app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  // Generate a random 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // valid for 10 mins

  const otps = readJsonFile<OTPRecord[]>(OTP_FILE, []);
  const filtered = otps.filter(o => o.email !== email);
  filtered.push({ email, otp, expiresAt });
  writeJsonFile(OTP_FILE, filtered);

  const isSmtpConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  let sentViaEmail = false;
  let emailError = "";

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || `"NepMedMCQ Support" <no-reply@nepmedmcq.edu.np>`,
        to: email,
        subject: `🔑 [NepMedMCQ] Verify Your Medical Account - OTP: ${otp}`,
        text: `Hello,

Thank you for registering with NepMedMCQ Study Engine, Nepal's premier medical licensing & entrance exam prep system.

Your secure 6-digit OTP confirmation code is: ${otp}

This code is valid for 10 minutes. If you did not register, please ignore this email.

Warm regards,
NepMedMCQ Editorial Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">
              <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: bold;">nepmed<span style="color: #10b981;">mcq</span></h1>
              <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Medical Entrance & Licensing Prep Engine</p>
            </div>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello Candidate,</p>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">Thank you for registering with NepMedMCQ. To complete your activation and begin taking practice MCQ exams, please verify your email address using the secure OTP code below:</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #166534; letter-spacing: 4px;">${otp}</span>
              <p style="color: #15803d; font-size: 12px; margin: 8px 0 0 0; font-weight: 500;">Valid for 10 minutes only</p>
            </div>
            
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you did not initiate this registration request, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <div style="text-align: center; color: #94a3b8; font-size: 11px;">
              <p style="margin: 0;">© 2026 NepMedMCQ Editorial Board. All Rights Reserved.</p>
              <p style="margin: 5px 0 0 0;">Maharajgunj, Kathmandu, Nepal (Near IOM)</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      sentViaEmail = true;
    } catch (err: any) {
      console.error("Failed to send real SMTP email:", err);
      emailError = err.message || "Unknown SMTP error";
    }
  }

  console.log(`[OTP TRANSACTION LOG] Email: ${email} | Code: ${otp} | Sent Real Email: ${sentViaEmail}`);

  res.json({
    success: true,
    email,
    sentViaEmail,
    simulatedOtp: otp, // Always return so our inside-app developer-sandbox console handles it effortlessly!
    emailError: emailError || undefined
  });
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const otps = readJsonFile<OTPRecord[]>(OTP_FILE, []);
  const record = otps.find(o => o.email === email);

  if (!record) {
    return res.status(400).json({ error: "No OTP request found for this email address" });
  }

  if (record.expiresAt < Date.now()) {
    return res.status(400).json({ error: "The OTP code has expired. Please request a new one." });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: "Invalid OTP code. Please check and try again." });
  }

  // Verification succeeded! Clear the code
  const updated = otps.filter(o => o.email !== email);
  writeJsonFile(OTP_FILE, updated);

  res.json({ success: true, message: "Email verified successfully" });
});


// Setup Vite or static serving
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring development Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NepMedMCQ Server running at http://localhost:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error("Failed to start NepMedMCQ server:", err);
});
