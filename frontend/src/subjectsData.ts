/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, QuestionSet } from "./types";

export interface SubjectItem {
  name: string;
  icon: string;
}

export const SUBJECTS_CLASSIFICATION = {
  preclinical: [
    { name: "Anatomy", icon: "💀" },
    { name: "Physiology", icon: "🫁" },
    { name: "Biochemistry", icon: "🧪" },
    { name: "Pathology", icon: "🔬" },
    { name: "Microbiology", icon: "🦠" },
    { name: "Pharmacology", icon: "💊" },
    { name: "Community Medicine", icon: "🌍" }
  ] as SubjectItem[],
  clinical: [
    { name: "Medicine", icon: "🏥" },
    { name: "Surgery", icon: "🔪" },
    { name: "Obstetrics & Gynecology", icon: "🤰" },
    { name: "Pediatrics", icon: "👶" }
  ] as SubjectItem[],
  short: [
    { name: "ENT", icon: "👂" },
    { name: "Ophthalmology", icon: "👁️" },
    { name: "Forensic Medicine", icon: "🔍" },
    { name: "Orthopedics", icon: "🦴" },
    { name: "Psychiatry", icon: "🧠" },
    { name: "Dermatology", icon: "🧴" },
    { name: "Radiology", icon: "🩻" },
    { name: "Anesthesiology", icon: "💤" }
  ] as SubjectItem[]
};

export const ALL_STANDARD_SUBJECTS = [
  ...SUBJECTS_CLASSIFICATION.preclinical.map(s => s.name),
  ...SUBJECTS_CLASSIFICATION.clinical.map(s => s.name),
  ...SUBJECTS_CLASSIFICATION.short.map(s => s.name)
];

/**
 * Helper to match or classify subjects cleanly, supporting subcategories or similar terms.
 */
export function normalizeSubjectName(subName: string | undefined): string {
  if (!subName) return "Other";
  const normalized = subName.trim().toLowerCase();
  
  for (const s of ALL_STANDARD_SUBJECTS) {
    const sLower = s.toLowerCase();
    if (normalized.includes(sLower) || sLower.includes(normalized)) {
      return s;
    }
  }
  
  if (normalized.includes("gynaecology") || normalized.includes("obstetrics") || normalized.includes("obs") || normalized.includes("gyn")) {
    return "Obstetrics & Gynecology";
  }
  if (normalized.includes("community") || normalized.includes("social") || normalized.includes("public health")) {
    return "Community Medicine";
  }
  if (normalized.includes("forensic") || normalized.includes("jurisprudence")) {
    return "Forensic Medicine";
  }
  if (normalized.includes("eye") || normalized.includes("ophthal")) {
    return "Ophthalmology";
  }
  if (normalized.includes("ear") || normalized.includes("nose") || normalized.includes("throat") || normalized.includes("ent")) {
    return "ENT";
  }
  if (normalized.includes("ortho")) {
    return "Orthopedics";
  }
  if (normalized.includes("psych")) {
    return "Psychiatry";
  }
  if (normalized.includes("derma") || normalized.includes("skin")) {
    return "Dermatology";
  }
  if (normalized.includes("radio") || normalized.includes("xray") || normalized.includes("imaging")) {
    return "Radiology";
  }
  if (normalized.includes("anesthesia") || normalized.includes("anaesthesia") || normalized.includes("anesthesi")) {
    return "Anesthesiology";
  }
  
  return subName; // Return original if no match
}

export interface UGTopic {
  name: string;
  icon: string;
  enabled?: boolean;
  weight?: number;
}

export interface UGSubjectCategory {
  subject: string;
  icon: string;
  enabled?: boolean;
  weight?: number;
  targetExam?: string;
  topics: UGTopic[];
}

export const MEC_UG_CLASSIFICATION: UGSubjectCategory[] = [
  {
    subject: "Physics",
    icon: "⚡",
    topics: [
      { name: "Mechanics", icon: "⚙️" },
      { name: "Heat and thermodynamics", icon: "🔥" },
      { name: "Waves and optics", icon: "👓" },
      { name: "Current electricity and magnetism", icon: "🧲" },
      { name: "Electrostatics and capacitors", icon: "🔋" },
      { name: "Modern physics", icon: "⚛️" }
    ]
  },
  {
    subject: "Chemistry",
    icon: "⚗️",
    topics: [
      { name: "Physical chemistry", icon: "📈" },
      { name: "Inorganic chemistry", icon: "💎" },
      { name: "Organic chemistry", icon: "🧬" },
      { name: "Applied chemistry", icon: "🧪" },
      { name: "Analytic chemistry", icon: "📊" }
    ]
  },
  {
    subject: "Botany",
    icon: "🌱",
    topics: [
      { name: "Basic component of life", icon: "🔬" },
      { name: "Biodiversity", icon: "🌸" },
      { name: "Ecology and vegetation", icon: "🌲" },
      { name: "Cell biology", icon: "🧫" },
      { name: "Genetics", icon: "🧬" },
      { name: "Plant anatomy", icon: "🌿" },
      { name: "Plant physiology", icon: "🍃" },
      { name: "Developmental botany", icon: "🥚" },
      { name: "Applied botany", icon: "🌾" }
    ]
  },
  {
    subject: "Zoology",
    icon: "🦁",
    topics: [
      { name: "Evolutionary Biology", icon: "🦕" },
      { name: "Animal Diversity and Classification", icon: "🐙" },
      { name: "Animal Tissues and Histology", icon: "🔬" },
      { name: "Study of Selected Animals", icon: "🐸" },
      { name: "Human Biology and Physiology", icon: "🫁" },
      { name: "Microbial Diseases and Immunology", icon: "🦠" },
      { name: "Medical Technology and Applied Biology", icon: "💉" },
      { name: "Biota, Environment and Conservation", icon: "🌍" }
    ]
  },
  {
    subject: "MAT",
    icon: "🧠",
    topics: [
      { name: "Verbal reasoning", icon: "🗣️" },
      { name: "Numerical reasoning", icon: "🔢" },
      { name: "Logical sequencing", icon: "🧩" },
      { name: "Spatial relation / Abstract reasoning", icon: "📐" }
    ]
  }
];

export const ALL_MECUG_TOPICS = MEC_UG_CLASSIFICATION.flatMap(cat => cat.topics.map(t => t.name));

export const MEC_UG_SUBJECT_WEIGHTS: Record<string, number> = {
  "Physics": 50,
  "Chemistry": 50,
  "Botany": 40,
  "Zoology": 40,
  "MAT": 20
};

export const MEC_UG_TOPIC_WEIGHTS: Record<string, number> = {
  "Mechanics": 10,
  "Heat and thermodynamics": 8,
  "Waves and optics": 8,
  "Current electricity and magnetism": 9,
  "Electrostatics and capacitors": 7,
  "Modern physics": 8,
  "Physical chemistry": 15,
  "Inorganic chemistry": 10,
  "Organic chemistry": 15,
  "Applied chemistry": 5,
  "Analytic chemistry": 5,
  "Basic component of life": 4,
  "Biodiversity": 5,
  "Ecology and vegetation": 5,
  "Cell biology": 5,
  "Genetics": 5,
  "Plant anatomy": 4,
  "Plant physiology": 5,
  "Developmental botany": 4,
  "Applied botany": 3,
  "Evolutionary Biology": 4,
  "Animal Diversity and Classification": 5,
  "Animal Tissues and Histology": 4,
  "Study of Selected Animals": 5,
  "Human Biology and Physiology": 12,
  "Microbial Diseases and Immunology": 4,
  "Medical Technology and Applied Biology": 3,
  "Biota, Environment and Conservation": 3,
  "Verbal reasoning": 5,
  "Numerical reasoning": 5,
  "Logical sequencing": 5,
  "Spatial relation / Abstract reasoning": 5
};

export const MEC_PG_SUBJECT_WEIGHTS: Record<string, number> = {
  "Anatomy": 10,
  "Physiology": 10,
  "Biochemistry": 10,
  "Pathology": 10,
  "Microbiology": 10,
  "Pharmacology": 10,
  "Forensic Medicine": 5,
  "Medicine": 20,
  "Surgery": 20,
  "Obstetrics & Gynecology": 20,
  "Pediatrics": 15,
  "ENT": 8,
  "Ophthalmology": 8,
  "Community Medicine": 12,
  "Orthopedics": 8,
  "Psychiatry": 5,
  "Dermatology": 5,
  "Radiology": 5,
  "Anesthesiology": 4
};

export function generateQuestionIdForSubject(
  subjectName: string,
  topicName: string | undefined,
  existingQuestions: Question[],
  allSetsQuestions: Question[] = []
): string {
  // Normalize subject
  let normSubject = subjectName ? subjectName.trim() : "";
  let isUG = false;
  const sLower = normSubject.toLowerCase();
  
  if (sLower.includes("physics")) {
    normSubject = "Physics";
    isUG = true;
  } else if (sLower.includes("chemistry")) {
    normSubject = "Chemistry";
    isUG = true;
  } else if (sLower.includes("botany")) {
    normSubject = "Botany";
    isUG = true;
  } else if (sLower.includes("zoology")) {
    normSubject = "Zoology";
    isUG = true;
  } else if (sLower.includes("mat") || sLower.includes("mental agility")) {
    normSubject = "MAT";
    isUG = true;
  }
  
  if (isUG) {
    // UG
    let catNum = 1;
    let subNum = 1;
    const subKey = normSubject.toLowerCase();
    if (subKey === "physics") { catNum = 1; subNum = 1; }
    else if (subKey === "chemistry") { catNum = 1; subNum = 2; }
    else if (subKey === "botany") { catNum = 2; subNum = 3; }
    else if (subKey === "zoology") { catNum = 2; subNum = 4; }
    else if (subKey === "mat") { catNum = 3; subNum = 5; }
    
    // Topic Index
    let topicNum = 1;
    if (topicName) {
      const uClass = MEC_UG_CLASSIFICATION.find(s => s.subject.toLowerCase() === subKey);
      if (uClass) {
        const tIdx = uClass.topics.findIndex(t => t.name.toLowerCase() === topicName.toLowerCase() || topicName.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(topicName.toLowerCase()));
        if (tIdx >= 0) topicNum = tIdx + 1;
      }
    }
    
    // Find all existing matching IDs to determine next chronological number
    const prefix = `1-${catNum}-${subNum}-${topicNum}-`;
    let maxChrono = 0;
    const allQs = [...existingQuestions, ...allSetsQuestions];
    allQs.forEach(q => {
      if (q.id && q.id.startsWith(prefix)) {
        const rest = q.id.substring(prefix.length);
        const num = parseInt(rest, 10);
        if (!isNaN(num) && num > maxChrono) {
          maxChrono = num;
        }
      }
    });
    
    return `${prefix}${maxChrono + 1}`;
  } else {
    // Others
    let catNum = 4;
    let subNum = 20;
    const sLower = normSubject.toLowerCase();
    
    // preclinical -> 1
    if (["anatomy", "physiology", "biochemistry", "pathology", "microbiology", "pharmacology", "community medicine"].some(s => sLower.includes(s) || s.includes(sLower))) {
      catNum = 1;
      if (sLower.includes("anatomy")) subNum = 1;
      else if (sLower.includes("physiology")) subNum = 2;
      else if (sLower.includes("biochemistry")) subNum = 3;
      else if (sLower.includes("pathology")) subNum = 4;
      else if (sLower.includes("microbiology")) subNum = 5;
      else if (sLower.includes("pharmacology")) subNum = 6;
      else if (sLower.includes("community")) subNum = 7;
    }
    // clinical -> 2
    else if (["medicine", "surgery", "obstetrics", "gynecology", "pediatrics", "obg"].some(s => sLower.includes(s) || s.includes(sLower))) {
      catNum = 2;
      if (sLower.includes("medicine")) subNum = 8;
      else if (sLower.includes("surgery")) subNum = 9;
      else if (sLower.includes("obstetrics") || sLower.includes("gynecology") || sLower.includes("obg")) subNum = 10;
      else if (sLower.includes("pediatrics")) subNum = 11;
    }
    // short -> 3
    else if (["ent", "ophthalmology", "forensic medicine", "orthopedics", "psychiatry", "dermatology", "radiology", "anesthesiology"].some(s => sLower.includes(s) || s.includes(sLower))) {
      catNum = 3;
      if (sLower.includes("ent")) subNum = 12;
      else if (sLower.includes("ophthalmology") || sLower.includes("eye")) subNum = 13;
      else if (sLower.includes("forensic")) subNum = 14;
      else if (sLower.includes("orthopedics") || sLower.includes("ortho")) subNum = 15;
      else if (sLower.includes("psychiatry") || sLower.includes("psych")) subNum = 16;
      else if (sLower.includes("dermatology") || sLower.includes("derma")) subNum = 17;
      else if (sLower.includes("radiology") || sLower.includes("radio")) subNum = 18;
      else if (sLower.includes("anesthesiology") || sLower.includes("anesthesia")) subNum = 19;
    }
    
    const prefix = `2-${catNum}-${subNum}-`;
    let maxChrono = 0;
    const allQs = [...existingQuestions, ...allSetsQuestions];
    allQs.forEach(q => {
      if (q.id && q.id.startsWith(prefix)) {
        const rest = q.id.substring(prefix.length);
        const num = parseInt(rest, 10);
        if (!isNaN(num) && num > maxChrono) {
          maxChrono = num;
        }
      }
    });
    
    return `${prefix}${maxChrono + 1}`;
  }
}

export function retagAllQuestions(sets: QuestionSet[], independent: Question[]): { sets: QuestionSet[], independent: Question[] } {
  const processedQuestions: Question[] = [];

  const retagQuestion = (q: Question, defaultSubject: string = "Physics"): Question => {
    const subject = q.subject || defaultSubject;
    const topic = q.topic || "General";
    const newId = generateQuestionIdForSubject(subject, topic, processedQuestions, []);
    const updatedQ = {
      ...q,
      id: newId
    };
    processedQuestions.push(updatedQ);
    return updatedQ;
  };

  const updatedSets = sets.map(set => {
    // Guess default subject for this set
    let defaultSetSubject = "Anatomy";
    if (set.examType === "mec-ug") {
      defaultSetSubject = "Physics";
    }
    return {
      ...set,
      questions: set.questions.map(q => retagQuestion(q, defaultSetSubject))
    };
  });

  const updatedIndependent = independent.map(q => retagQuestion(q, "Physics"));

  return {
    sets: updatedSets,
    independent: updatedIndependent
  };
}


