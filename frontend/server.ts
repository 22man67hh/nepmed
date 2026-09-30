/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

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

// ==========================================
// FILE DATABASE UTILITIES
// ==========================================

const FORUM_FILE = path.join(process.cwd(), "forum_threads.json");
const TICKETS_FILE = path.join(process.cwd(), "tickets.json");
const REPORTS_FILE = path.join(process.cwd(), "reports.json");
const OTP_FILE = path.join(process.cwd(), "otp_codes.json");
const CMS_FILE = path.join(process.cwd(), "content_config.json");
const QUESTION_SETS_FILE = path.join(process.cwd(), "question_sets.json");
const INDEPENDENT_QUESTIONS_FILE = path.join(process.cwd(), "independent_questions.json");
const DRAFT_QUESTIONS_FILE = path.join(process.cwd(), "draft_questions.json");

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`[DB Error] Reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[DB Error] Writing ${filePath}:`, err);
  }
}

// ==========================================
// DEFAULT SEED DATA
// ==========================================

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
        content: "Hey Sunil! Yes, a classic high-yield mnemonic we use is: **'A Professional Surgeon Ought Many Pretty Clinical Things'**.\n\n- **A**: Anterior Choroidal Artery\n- **P**: Posterior Communicating Artery\n- **S**: Superior Hypophyseal Artery\n- **O**: Ophthalmic Artery\n- **M**: Middle Cerebral Artery (terminal branch)\n- **A**: Anterior Cerebral Artery (terminal branch)\n\nThis covers the cerebral segment branches perfectly.",
        authorName: "Prof. Dr. Ramesh Koirala",
        authorEmail: "koirala.ramesh@nepmed.edu",
        authorAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ramesh",
        createdAt: new Date(Date.now() - 2.5 * 3600000 * 24).toISOString(),
      }
    ]
  }
];

const DEFAULT_CMS_CONTENT = {
  brandName: "PrepzaNepal",
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
  ]
};

// ==========================================
// MIDDLEWARE & PROXY CONFIGURATION
// ==========================================

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
  "/api/payment",
  "/api/question-attempts",
  "/api/leaderboard",
  "/api/my-history",
  "/api/pages",
  "/api/teams",
  "/storage"
];

// Configure reverse proxy using http-proxy-middleware
const laravelProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  headers: {
    host: "127.0.0.1:8000"
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] Path ${req.path}:`, err);
    res.status(500).json({
      error: "Failed to connect to backend API server",
      details: err.message
    });
  }
});

// Selectively attach proxy before standard express body-parsing
app.use((req: Request, res: Response, next: NextFunction) => {
  const shouldProxy = proxyPrefixes.some(prefix => 
    req.path === prefix || req.path.startsWith(prefix + "/")
  );
  if (shouldProxy) {
    return laravelProxy(req, res, next);
  }
  next();
});

// JSON Body Parser for non-proxied routes
app.use(express.json());

// ==========================================
// GEMINI AI INTEGRATION
// ==========================================

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" }
      }
    });
  }
  return aiInstance;
}

app.post("/api/tutor", async (req: Request, res: Response) => {
  try {
    const { questionText, options = [], explanation, subject } = req.body;
    if (!questionText) {
      return res.status(400).json({ error: "questionText is required" });
    }

    let client: GoogleGenAI;
    try {
      client = getGeminiClient();
    } catch (err: any) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please set GEMINI_API_KEY."
      });
    }

    const formattedOptions = options
      .map((opt: string, i: number) => `  ${i + 1}. ${opt}`)
      .join("\n");

    const prompt = `You are an expert Nepalese Medical entrance/licensing exam tutor (specializing in MEC-UG, MEC-PG, NMCLE, and Loksewa medical officer preparation).
Analyze the following multiple-choice question and provide a high-yield, engaging, and clear study explanation for a Nepalese medical student.

Question details:
- Subject: ${subject || "General Medicine"}
- Question: "${questionText}"
- Options:
${formattedOptions}
- Standard Explanation: "${explanation || "None provided"}"

Please structure your response in Markdown with the following clear headers:
1. **🎓 High-Yield Concept**: Explain clearly and concisely why the correct option is the right answer.
2. **❌ Elimination Breakdown**: Take 1-2 sentences per alternative choice to explain why it is incorrect.
3. **💡 Premium Mnemonic**: Create or share a memorable medical mnemonic or High-Yield Pearl.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("[Gemini Tutor Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI tutor explanation." });
  }
});

// ==========================================
// REST API ROUTES
// ==========================================

// --- Discussion Forum ---
app.get("/api/forum", (_req: Request, res: Response) => {
  const threads = readJsonFile<ForumThread[]>(FORUM_FILE, DEFAULT_FORUM_THREADS);
  if (!fs.existsSync(FORUM_FILE)) {
    writeJsonFile(FORUM_FILE, DEFAULT_FORUM_THREADS);
  }
  res.json(threads);
});

app.post("/api/forum/thread", (req: Request, res: Response) => {
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

app.post("/api/forum/reply", (req: Request, res: Response) => {
  const { threadId, content, authorName, authorEmail, authorAvatar } = req.body;
  if (!threadId || !content || !authorName || !authorEmail) {
    return res.status(400).json({ error: "Missing required reply parameters" });
  }

  const threads = readJsonFile<ForumThread[]>(FORUM_FILE, DEFAULT_FORUM_THREADS);
  const index = threads.findIndex(t => t.id === threadId);
  if (index === -1) {
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

  threads[index].replies.push(newReply);
  writeJsonFile(FORUM_FILE, threads);
  res.json(newReply);
});

// --- Support Tickets ---
app.post("/api/support/ticket", (req: Request, res: Response) => {
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

app.get("/api/support/tickets", (_req: Request, res: Response) => {
  res.json(readJsonFile<SupportTicket[]>(TICKETS_FILE, []));
});

// --- CMS & Content Management ---
app.get("/api/cms/content", (_req: Request, res: Response) => {
  const content = readJsonFile<any>(CMS_FILE, DEFAULT_CMS_CONTENT);
  const mergedContent = { ...DEFAULT_CMS_CONTENT, ...content };
  
  if (!fs.existsSync(CMS_FILE)) {
    writeJsonFile(CMS_FILE, mergedContent);
  }
  res.json(mergedContent);
});

app.post("/api/cms/content", (req: Request, res: Response) => {
  writeJsonFile(CMS_FILE, req.body);
  res.json({ success: true, content: req.body });
});

// --- Admin Question Bank CRUD ---
app.get("/api/admin/sets", (_req: Request, res: Response) => {
  res.json(readJsonFile<any[]>(QUESTION_SETS_FILE, []));
});

app.post("/api/admin/sets", (req: Request, res: Response) => {
  writeJsonFile(QUESTION_SETS_FILE, req.body);
  res.json({ success: true });
});

app.get("/api/admin/independent-questions", (_req: Request, res: Response) => {
  res.json(readJsonFile<any[]>(INDEPENDENT_QUESTIONS_FILE, []));
});

app.post("/api/admin/independent-questions", (req: Request, res: Response) => {
  writeJsonFile(INDEPENDENT_QUESTIONS_FILE, req.body);
  res.json({ success: true });
});

app.get("/api/admin/draft-questions", (_req: Request, res: Response) => {
  res.json(readJsonFile<any[]>(DRAFT_QUESTIONS_FILE, []));
});

app.post("/api/admin/draft-questions", (req: Request, res: Response) => {
  writeJsonFile(DRAFT_QUESTIONS_FILE, req.body);
  res.json({ success: true });
});

// --- Question Reports ---
app.post("/api/reports", (req: Request, res: Response) => {
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

app.get("/api/reports", (_req: Request, res: Response) => {
  res.json(readJsonFile<MCQReport[]>(REPORTS_FILE, []));
});

// --- Authentication & OTP Handling ---
app.post("/api/auth/send-otp", (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

  const otps = readJsonFile<OTPRecord[]>(OTP_FILE, []);
  const filtered = otps.filter(o => o.email !== email);
  filtered.push({ email, otp, expiresAt });
  writeJsonFile(OTP_FILE, filtered);

  res.json({
    success: true,
    email,
    sentViaEmail: false,
    simulatedOtp: otp
  });
});

app.post("/api/auth/verify-otp", (req: Request, res: Response) => {
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

  const updated = otps.filter(o => o.email !== email);
  writeJsonFile(OTP_FILE, updated);

  res.json({ success: true, message: "Email verified successfully" });
});

// ==========================================
// SERVER BOOTSTRAP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
});