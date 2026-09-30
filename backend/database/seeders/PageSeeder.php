<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'title' => 'Landing Page Config',
                'slug' => 'landing-page',
                'content' => json_encode([
                    'brandName' => 'PrepZaaNepal',
                    'heroTitle' => 'Master Your Exams with PrepZaaNepal',
                    'heroDescription' => "Nepal's premier learning platform for competitive entrance, licensing, and public service examinations. Access high-yield question banks, detailed explanations, and performance tracking.",
                    'featuresTitle' => 'Engineered for Competitive Exam Mastery',
                    'featuresSubtitle' => 'Everything you need to turn high-yield syllabus knowledge into rapid multiple-choice precision across Medical, Engineering, Nursing, and Loksewa streams.',
                    'featuresList' => [
                        [
                            'title' => 'Real Board & Entrance Simulator',
                            'desc' => 'Custom countdown timers, official negative marking, and section-by-section breakdown matching official MEC, IOE, NMCLE, and Loksewa patterns.',
                            'iconName' => 'clock',
                            'badge' => 'Simulation'
                        ],
                        [
                            'title' => 'Smart AI Explanations & Tutor',
                            'desc' => 'Instantly ask our AI Tutor for option rationales, high-yield clinical & engineering pearls, mnemonic generators, and key formulas.',
                            'iconName' => 'brain',
                            'badge' => 'AI Powered'
                        ],
                        [
                            'title' => 'High-Yield Curriculum Notes',
                            'desc' => 'Structured, hierarchical textbook notes covering entire syllabus subjects with flowcharts, comparative tables, and core concepts.',
                            'iconName' => 'book',
                            'badge' => 'Curriculum'
                        ],
                        [
                            'title' => 'Flashcards & Spaced Repetition',
                            'desc' => 'Convert tricky questions and key formulas into flashcards with one click. Master difficult memory-heavy facts easily.',
                            'iconName' => 'zap',
                            'badge' => 'Revision'
                        ],
                        [
                            'title' => 'Deep Percentile & Weakness Analytics',
                            'desc' => 'Identify your lowest scoring subjects and topics automatically. Track your speed per question and historical test improvement trajectories.',
                            'iconName' => 'chart',
                            'badge' => 'Analytics'
                        ],
                        [
                            'title' => 'Discussion Forum & Verified Mentors',
                            'desc' => 'Discuss disputed questions with peers and verified faculty. Read expert consensus and verified solutions under every question.',
                            'iconName' => 'users',
                            'badge' => 'Community'
                        ]
                    ]
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Global Dashboard Config',
                'slug' => 'user-dashboard',
                'content' => json_encode([
                    'supportConfig' => [
                        'officeText' => 'Kathmandu, Nepal',
                        'emailText' => 'info@prepzaanepal.com',
                        'phoneText' => '9863224162'
                    ],
                    'aboutUsLabels' => [
                        'heroTitle' => 'About PrepzaNepal Editorial Board',
                        'heroDescription' => "PrepzaNepal is Nepal's premier full-stack interactive medical education engine. We are dedicated to providing high-yield multiple choice test questions, detailed clinical rationales, and memory mnemonics meticulously aligned with the standards of the Medical Education Commission (MEC) and the Nepal Medical Council (NMC) licensing examinations."
                    ]
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        foreach ($pages as $page) {
            DB::table('pages')->updateOrInsert(
                ['slug' => $page['slug']],
                $page
            );
        }
    }
}
