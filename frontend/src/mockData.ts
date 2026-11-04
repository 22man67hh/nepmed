
import { QuestionSet } from "./types";

export const INITIAL_QUESTION_SETS: QuestionSet[] = [
  // ==========================================
  // MEC-UG Exam Sets
  // ==========================================
  {
    id: "mec-ug-2023",
    title: "MEC-UG Past Year Questions (2023)",
    examType: "mec-ug",
    type: "past-year",
    yearOrDate: "2023-09-15",
    isFree: true,
    price: 0,
    durationMinutes: 45,
    questions: [
      {
        id: "ug-q1",
        questionText: "Which of the following vectors is responsible for the transmission of Kala-azar (Visceral Leishmaniasis) in Nepal?",
        options: [
          "Phlebotomus argentipes",
          "Anopheles minimus",
          "Culex quinquefasciatus",
          "Aedes aegypti"
        ],
        correctOptionIndex: 0,
        explanation: "Phlebotomus argentipes (sandfly) is the primary vector for visceral leishmaniasis (Kala-azar) in the Terai region of Nepal. Anopheles transmits Malaria, Culex transmits Lymphatic Filariasis/Japanese Encephalitis, and Aedes transmits Dengue.",
        subject: "Zoology / Parasitology",
        referenceYear: "2023"
      },
      {
        id: "ug-q2",
        questionText: "An object is projected with a velocity of 40 m/s at an angle of 30 degrees with the horizontal. What is its time of flight? (Take g = 10 m/s²)",
        options: [
          "2 seconds",
          "4 seconds",
          "6 seconds",
          "8 seconds"
        ],
        correctOptionIndex: 1,
        explanation: "Time of flight T = (2 * u * sinθ) / g. Given u = 40, θ = 30° (sin30° = 0.5), g = 10.\nT = (2 * 40 * 0.5) / 10 = 40 / 10 = 4 seconds.",
        subject: "Physics - Projectile Motion",
        referenceYear: "2023"
      },
      {
        id: "ug-q3",
        questionText: "Which of the following is an example of an amphoteric oxide?",
        options: [
          "Na2O",
          "CO2",
          "Al2O3",
          "SO2"
        ],
        correctOptionIndex: 2,
        explanation: "Aluminium oxide (Al2O3) is amphoteric as it reacts with both acids and bases to form salts and water. Sodium oxide (Na2O) is basic, whereas Carbon dioxide (CO2) and Sulfur dioxide (SO2) are acidic.",
        subject: "Chemistry - Periodic Properties",
        referenceYear: "2023"
      },
      {
        id: "ug-q4",
        questionText: "In plant kingdom, double fertilization is a unique characteristic of which of the following groups?",
        options: [
          "Gymnosperms",
          "Angiosperms",
          "Pteridophytes",
          "Bryophytes"
        ],
        correctOptionIndex: 1,
        explanation: "Double fertilization is a complex fertilization mechanism of flowering plants (Angiosperms) where one male gamete fuses with the egg (syngamy) and the other fuses with two polar nuclei (triple fusion).",
        subject: "Botany - Plant Embryology",
        referenceYear: "2023"
      }
    ]
  },
  {
    id: "mec-ug-mock-1",
    title: "MEC-UG Premium Mock Practice Test 01",
    examType: "mec-ug",
    type: "mock-test",
    yearOrDate: "Mock 2026",
    isFree: false,
    price: 20,
    durationMinutes: 60,
    questions: [
      {
        id: "ug-q5",
        questionText: "A patient presents to a health post in Jhapa with high-grade fever, retro-orbital pain, and a maculopapular rash. Which disease should be suspected first?",
        options: [
          "Malaria",
          "Dengue Fever",
          "Scrub Typhus",
          "Typhoid Fever"
        ],
        correctOptionIndex: 1,
        explanation: "The triad of high-grade fever, retro-orbital pain, and maculopapular rash, especially in outbreak-prone areas like Jhapa, is highly suggestive of Dengue Fever.",
        subject: "Clinical / Zoology Interaction",
        referenceYear: "2026"
      },
      {
        id: "ug-q6",
        questionText: "What is the pH of a 10⁻⁸ M solution of HCl at room temperature?",
        options: [
          "8",
          "6",
          "6.98",
          "7.02"
        ],
        correctOptionIndex: 2,
        explanation: "For an extremely dilute acid solution (like 10⁻⁸ M HCl), the auto-ionization of water cannot be ignored. [H⁺] total = [H⁺] from HCl (10⁻⁸) + [H⁺] from water (~10⁻⁷). Solving this yields a pH slightly below 7, around 6.96 to 6.98. It can never be alkaline (pH 8) or highly acidic (pH 6).",
        subject: "Chemistry - Ionic Equilibrium"
      },
      {
        id: "ug-q7",
        questionText: "Which of the following cell organelles is known as the 'Suicidal Bag' of the cell?",
        options: [
          "Mitochondria",
          "Lysosome",
          "Golgi Body",
          "Ribosome"
        ],
        correctOptionIndex: 1,
        explanation: "Lysosomes contain hydrolytic enzymes that can digest macromolecular wastes, worn-out organelles, or even the whole cell in case of damage or cell death, hence called suicidal bags.",
        subject: "Zoology - Cytology"
      }
    ]
  },

  // ==========================================
  // MEC-PG Exam Sets
  // ==========================================
  {
    id: "mec-pg-2024",
    title: "MEC-PG Past Year High-Yield Questions (2024)",
    examType: "mec-pg",
    type: "past-year",
    yearOrDate: "2024-01-20",
    isFree: false,
    price: 30,
    durationMinutes: 90,
    questions: [
      {
        id: "pg-q1",
        questionText: "A 45-year-old farmer is brought to the emergency department of T.U. Teaching Hospital with miosis, copious salivation, bradycardia, and fasciculations. What is the antidote of choice?",
        options: [
          "Atropine sulfate",
          "N-acetylcysteine",
          "Physostigmine",
          "Deferoxamine"
        ],
        correctOptionIndex: 0,
        explanation: "This clinical picture represents Organophosphate insecticide poisoning, common among Nepalese farmers. Atropine sulfate is the competitive antagonist at muscarinic receptors and is the immediate antidote of choice, titrated to dry secretions and heart rate >80 bpm.",
        subject: "Pharmacology & Toxicology",
        referenceYear: "2024"
      },
      {
        id: "pg-q2",
        questionText: "Which of the following is the most sensitive imaging modality for diagnosing acute pancreatitis within the first 24 hours of onset?",
        options: [
          "Contrast-Enhanced CT (CECT) of abdomen",
          "Abdominal Ultrasound (USG)",
          "MRI of abdomen",
          "Plain Abdominal X-ray"
        ],
        correctOptionIndex: 0,
        explanation: "Contrast-Enhanced CT (CECT) of the abdomen is the gold standard and most sensitive modality for diagnosing acute pancreatitis, assessing severity (Balthazar score), and detecting pancreatic necrosis, particularly when symptoms are severe or biochemical markers are ambiguous.",
        subject: "Radiology / Surgery",
        referenceYear: "2024"
      },
      {
        id: "pg-q3",
        questionText: "In a patient presenting with postpartum hemorrhage (PPH) unresponsive to uterine massage and oxytocin, what is the next first-line pharmacological agent?",
        options: [
          "Methylergometrine",
          "Misoprostol",
          "Carboprost (PGF2a)",
          "Tranexamic Acid"
        ],
        correctOptionIndex: 0,
        explanation: "If PPH is unresponsive to oxytocin, methylergometrine (ergometrine) is administered intramuscularly unless contraindicated (e.g., in patients with hypertension or preeclampsia, in which case prostaglandins like Carboprost or Misoprostol are preferred).",
        subject: "Obstetrics & Gynecology",
        referenceYear: "2024"
      }
    ]
  },
  {
    id: "mec-pg-mock-free",
    title: "MEC-PG Free Residency Mock Exam",
    examType: "mec-pg",
    type: "mock-test",
    yearOrDate: "Mock 2026",
    isFree: true,
    price: 0,
    durationMinutes: 30,
    questions: [
      {
        id: "pg-q4",
        questionText: "What is the primary diagnostic marker found on immunohistochemistry for Gastrointestinal Stromal Tumor (GIST)?",
        options: [
          "CD117 (c-kit)",
          "CD20",
          "S100",
          "Desmin"
        ],
        correctOptionIndex: 0,
        explanation: "CD117, a tyrosine kinase receptor protein encoded by the c-kit proto-oncogene, is positive in over 95% of GISTs and serves as the primary diagnostic immunohistochemical marker.",
        subject: "Pathology & Surgical Oncology"
      },
      {
        id: "pg-q5",
        questionText: "A patient with newly diagnosed tuberculosis in Nepal is started on the standard HRZE regimen. Two weeks later, she complains of orange-red discoloration of urine and tears. Which drug is responsible?",
        options: [
          "Isoniazid",
          "Rifampicin",
          "Pyrazinamide",
          "Ethambutol"
        ],
        correctOptionIndex: 1,
        explanation: "Rifampicin causes a benign, orange-red discoloration of bodily secretions, including urine, saliva, sweat, and tears. Patients should be reassured about this side effect to prevent non-compliance.",
        subject: "Internal Medicine / Pulmonology"
      }
    ]
  },

  // ==========================================
  // NMCLE Exam Sets
  // ==========================================
  {
    id: "nmcle-2023",
    title: "NMCLE Council Licensing Past Set (2023)",
    examType: "nmcle",
    type: "past-year",
    yearOrDate: "2023-11-12",
    isFree: true,
    price: 0,
    durationMinutes: 60,
    questions: [
      {
        id: "nmcle-q1",
        questionText: "Which of the following is the most common cause of neonatal mortality in Nepal?",
        options: [
          "Preterm birth complications",
          "Birth asphyxia",
          "Neonatal sepsis",
          "Congenital anomalies"
        ],
        correctOptionIndex: 0,
        explanation: "According to Nepal Demographic and Health Survey (NDHS) and WHO data, complications related to preterm birth and low birth weight are the leading causes of neonatal mortality in Nepal, followed by birth asphyxia and neonatal infections/sepsis.",
        subject: "Pediatrics & Community Medicine",
        referenceYear: "2023"
      },
      {
        id: "nmcle-q2",
        questionText: "A 25-year-old postpartum female complains of sudden chest pain and severe shortness of breath on day 3 after a Cesarean section. She has bilateral pedal edema. What is the most likely diagnosis?",
        options: [
          "Amniotic fluid embolism",
          "Pulmonary Embolism",
          "Acute Myocardial Infarction",
          "Pneumothorax"
        ],
        correctOptionIndex: 1,
        explanation: "A postpartum state combined with post-major surgery is a highly hypercoagulable state. Sudden onset pleuritic chest pain, dyspnea, and bilateral swelling suggest deep vein thrombosis leading to Pulmonary Embolism.",
        subject: "Clinical Medicine / Emergency",
        referenceYear: "2023"
      }
    ]
  },
  {
    id: "nmcle-mock-1",
    title: "NMCLE Premium License booster Set 03",
    examType: "nmcle",
    type: "mock-test",
    yearOrDate: "Mock 2026",
    isFree: false,
    price: 25,
    durationMinutes: 45,
    questions: [
      {
        id: "nmcle-q3",
        questionText: "A patient presents with high fever, chills, headachce, and a black, painless scab-like lesion (eschar) with a surrounding red halo on his lower abdomen. What is the vector of this disease?",
        options: [
          "Chigger mite (Leptotrombidium)",
          "Hard tick (Ixodes)",
          "Xenopsylla cheopis",
          "Pediculus humanus"
        ],
        correctOptionIndex: 0,
        explanation: "An eschar is pathognomonic for Scrub Typhus (caused by Orientia tsutsugamushi). The vector is the larval stage of trombiculid mites, commonly known as the chigger mite.",
        subject: "Infectious Diseases / Dermatology"
      },
      {
        id: "nmcle-q4",
        questionText: "What is the legal age limit for termination of pregnancy in Nepal on request, under the Safe Motherhood and Reproductive Health Rights Act?",
        options: [
          "Up to 12 weeks of gestation",
          "Up to 18 weeks of gestation",
          "Up to 20 weeks of gestation",
          "Up to 24 weeks of gestation"
        ],
        correctOptionIndex: 0,
        explanation: "Under Nepal's current reproductive laws, abortion/termination of pregnancy is permitted on request of the pregnant woman up to 12 weeks of gestation. It is permitted up to 28 weeks under specific conditions (rape, incest, threat to life, fetal anomaly).",
        subject: "Forensic Medicine & Medical Jurisprudence"
      }
    ]
  },

  // ==========================================
  // KU MCQ Exam Sets
  // ==========================================
  {
    id: "ku-mcq-2022",
    title: "Kathmandu University past paper (KU MCQ 2022)",
    examType: "ku-mcq",
    type: "past-year",
    yearOrDate: "2022-08-05",
    isFree: false,
    price: 20,
    durationMinutes: 45,
    questions: [
      {
        id: "ku-q1",
        questionText: "Which of the following cranial nerves is the longest and has the most extensive distribution in the body?",
        options: [
          "CN VII (Facial Nerve)",
          "CN X (Vagus Nerve)",
          "CN XII (Hypoglossal Nerve)",
          "CN XI (Accessory Nerve)"
        ],
        correctOptionIndex: 1,
        explanation: "The Vagus nerve (CN X) is the longest cranial nerve, extending from the brainstem all the way into the abdomen, supplying parasympathetic innervation to the heart, lungs, and digestive tract.",
        subject: "Anatomy",
        referenceYear: "2022"
      },
      {
        id: "ku-q2",
        questionText: "Which of the following vitamins acts as a coenzyme in decarboxylation reactions and is severely deficient in chronic alcoholics leading to Wernicke-Korsakoff syndrome?",
        options: [
          "Thiamine (Vitamin B1)",
          "Riboflavin (Vitamin B2)",
          "Niacin (Vitamin B3)",
          "Pyridoxine (Vitamin B6)"
        ],
        correctOptionIndex: 0,
        explanation: "Thiamine (B1) is a coenzyme for pyruvate dehydrogenase and alpha-ketoglutarate dehydrogenase. Deficiency in alcoholics leads to Wernicke's encephalopathy and Korsakoff psychosis due to impaired cerebral energy utilization.",
        subject: "Biochemistry",
        referenceYear: "2022"
      }
    ]
  },
  {
    id: "ku-mcq-mock-1",
    title: "KU Undergraduate Free Mock Exam",
    examType: "ku-mcq",
    type: "mock-test",
    yearOrDate: "Mock 2026",
    isFree: true,
    price: 0,
    durationMinutes: 30,
    questions: [
      {
        id: "ku-q3",
        questionText: "What is the renal threshold for glucose in healthy human adults?",
        options: [
          "120 mg/dL",
          "150 mg/dL",
          "180 mg/dL",
          "220 mg/dL"
        ],
        correctOptionIndex: 2,
        explanation: "The renal threshold for glucose is approximately 180 mg/dL (10 mmol/L). Above this level, the sodium-glucose cotransporters in the proximal convoluted tubules become saturated, and glucose begins to spill into the urine (glucosuria).",
        subject: "Physiology"
      }
    ]
  },

  // ==========================================
  // Loksewa Medical Exam Sets
  // ==========================================
  {
    id: "loksewa-2023",
    title: "Loksewa Medical Officer past question paper (2023)",
    examType: "loksewa",
    type: "past-year",
    yearOrDate: "2023-04-10",
    isFree: false,
    price: 30,
    durationMinutes: 50,
    province: "central",
    questions: [
      {
        id: "lok-q1",
        questionText: "Under the Constitution of Nepal, which tier of government holds the primary responsibility for basic health services?",
        options: [
          "Federal Government",
          "Provincial Government",
          "Local Government (Municipality/Rural Municipality)",
          "Shared responsibility equally among all three"
        ],
        correctOptionIndex: 2,
        explanation: "The Constitution of Nepal, 2072, lists basic health services and sanitation under Schedule 8, which establishes the exclusive powers and responsibilities of Local Government (Local levels).",
        subject: "Health Policy & Constitution of Nepal",
        referenceYear: "2023"
      },
      {
        id: "lok-q2",
        questionText: "Which of the following levels of healthcare service is the primary point of contact under the National Health Policy of Nepal?",
        options: [
          "Primary Health Care Center (PHCC)",
          "Health Post (HP)",
          "District Hospital",
          "Sub-Health Post"
        ],
        correctOptionIndex: 1,
        explanation: "The Health Post (HP) is designed as the primary institutional point of contact for basic curative, preventive, and promotive health services for the community in Nepal.",
        subject: "Health Administration",
        referenceYear: "2023"
      },
      {
        id: "lok-q3",
        questionText: "What is the target vaccination coverage (%) for child immunization under Nepal's Multi-Year Plan?",
        options: [
          "85%",
          "90%",
          "95%",
          "100%"
        ],
        correctOptionIndex: 2,
        explanation: "The national strategic target for infant and child immunizations is set at 95% or higher coverage at both national and district levels to ensure robust herd immunity.",
        subject: "Public Health Programs",
        referenceYear: "2023"
      }
    ]
  },
  {
    id: "loksewa-mock-1",
    title: "Loksewa Medical General Mock Booster",
    examType: "loksewa",
    type: "mock-test",
    yearOrDate: "Mock 2026",
    isFree: true,
    price: 0,
    durationMinutes: 40,
    province: "central",
    questions: [
      {
        id: "lok-q4",
        questionText: "Which index is primarily used by the Government of Nepal to measure poverty and assess eligibility for targeted health subsidies?",
        options: [
          "Gini Coefficient",
          "Human Development Index (HDI)",
          "Multidimensional Poverty Index (MPI)",
          "Physical Quality of Life Index (PQLI)"
        ],
        correctOptionIndex: 2,
        explanation: "Nepal utilizes the Multidimensional Poverty Index (MPI) to assess deprivations in health, education, and standard of living, which guides free healthcare policies and targeted poor-citizen subsidies.",
        subject: "Nepal Health Policy & Economics"
      }
    ]
  },
  {
    id: "loksewa-koshi-1",
    title: "Koshi Province Loksewa Past Paper (2024)",
    examType: "loksewa",
    type: "past-year",
    yearOrDate: "2024-03-12",
    isFree: true,
    price: 0,
    durationMinutes: 45,
    province: "koshi",
    questions: [
      {
        id: "koshi-q1",
        questionText: "Which major endemic disease control program has Koshi Province health ministries historically prioritized in high-risk river valley clusters?",
        options: [
          "Lymphatic Filariasis",
          "Dengue Control",
          "Kala-azar Surveillance",
          "Waterborne Cholera Mitigation"
        ],
        correctOptionIndex: 2,
        explanation: "Koshi province's lower river valleys have been historical focal points for Kala-azar (Visceral Leishmaniasis) control programs and vector surveillance.",
        subject: "Provincial Health Programs"
      }
    ]
  },
  {
    id: "loksewa-bagmati-1",
    title: "Bagmati Province Medical Officer MCQ Booster",
    examType: "loksewa",
    type: "mock-test",
    yearOrDate: "Mock 2026",
    isFree: false,
    price: 25,
    durationMinutes: 50,
    province: "bagmati",
    questions: [
      {
        id: "bagmati-q1",
        questionText: "Under Bagmati Province health directives, which central health facility serves as the provincial apex referral hospital for tertiary pediatric care?",
        options: [
          "Kanti Children's Hospital",
          "Hetauda Hospital",
          "Patna Apex Post",
          "Bhaktapur District Clinic"
        ],
        correctOptionIndex: 0,
        explanation: "Hetauda is the provincial capital, but Kanti Children's Hospital in Kathmandu (Bagmati Province) operates as the national and apex provincial referral center for specialized pediatric care.",
        subject: "Bagmati Health System"
      }
    ]
  },
  {
    id: "loksewa-gandaki-1",
    title: "Gandaki Province Medical Officer Past Exam",
    examType: "loksewa",
    type: "past-year",
    yearOrDate: "2023-07-15",
    isFree: false,
    price: 20,
    durationMinutes: 30,
    province: "gandaki",
    questions: [
      {
        id: "gandaki-q1",
        questionText: "Which geography-related healthcare challenge is Gandaki Province particularly focused on under its maternal health incentive travel subsidies?",
        options: [
          "Remote altitude and mountain transport barriers",
          "Terai flooding blockages",
          "Urban clinic congestion",
          "Industrial pollution illnesses"
        ],
        correctOptionIndex: 0,
        explanation: "Gandaki's highly mountainous terrain means altitude and terrain barriers are primary maternal health delivery challenges, prioritized with emergency air-lifting schemes.",
        subject: "Provincial Maternal Health Care"
      }
    ]
  },
  {
    id: "loksewa-lumbini-1",
    title: "Lumbini Province Healthcare Officer Booster",
    examType: "loksewa",
    type: "mock-test",
    yearOrDate: "Mock 2026",
    isFree: true,
    price: 0,
    durationMinutes: 45,
    province: "lumbini",
    questions: [
      {
        id: "lumbini-q1",
        questionText: "Which district in Lumbini Province has historically had high-yield priority programs for sickle cell anemia screening and management?",
        options: [
          "Banke and Bardiya",
          "Rupandehi",
          "Palpa",
          "Gulmi"
        ],
        correctOptionIndex: 0,
        explanation: "Banke and Bardiya districts in Lumbini have high populations of Tharu communities, who have a genetic predisposition to Sickle Cell Anemia, making these districts focal points for provincial screening programs.",
        subject: "Lumbini Clinical Programs"
      }
    ]
  }
];
