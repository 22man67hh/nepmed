<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Team;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // CORE TEAM
        $coreTeams = [
            [
                'name' => 'Dr. Sunil Subedi',
                'designation' => 'Founder & Chief Editor',
                'badge' => 'Founder',
                'is_founder' => true,
                'hospital' => 'College of Medical Sciences (COMS)/ Shishuwa Hospital',
                'specialty' => '',
                'description' => 'A physician and medical educator dedicated to helping students and healthcare professionals succeed in competitive medical examinations through evidence-based learning resources and innovative educational technology.',
                'email' => 'subedisunil982@gmail.com',
                'linkedin' => 'https://www.linkedin.com/in/sunil-subedi-647153148',
                'twitter' => 'https://x.com/SunilSubedi16',
                'type' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Dr. Suman Subedi',
                'designation' => 'Chief Editor & Consultant Orthopedic Surgeon',
                'badge' => 'Chief Editor',
                'is_founder' => false,
                'hospital' => 'Patan Academy of Health Sciences',
                'specialty' => 'Orthopedic Surgery',
                'description' => 'Experienced orthopedic consultant contributing expert clinical guidance, academic oversight, and quality assurance of educational content.',
                'email' => 'dr.suman@prepzaa.com',
                'type' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Manish Acharya',
                'designation' => 'IT Expert & CTO',
                'badge' => 'IT Expert',
                'is_founder' => false,
                'hospital' => 'PrepZaa Tech',
                'specialty' => 'Platform Architecture, Software Engineering, AI Integration & Digital Innovation',
                'description' => 'Technology specialist responsible for platform architecture, software development, automation, security, and digital innovation.',
                'email' => 'manish@prepzaa.com',
                'type' => 'core',
                'status' => 'active'
            ]
        ];

        foreach ($coreTeams as $team) {
            Team::create($team);
        }

        // CHIEF EDITORS
        $chiefEditors = [
            ['name' => 'Dr. Sunil Subedi (MECEE-PG)', 'designation' => 'Section Editor, Senior Medical Officer', 'hospital' => 'Medical Academic Board'],
            ['name' => 'Dr. Sunil Subedi (MECEE-BL)', 'designation' => 'Section Editor, ECFMG Certified Physician', 'hospital' => 'Kathmandu Valley Medical Mentors'],
            ['name' => 'Dr. Sunil Subedi (NMCLE)', 'designation' => 'Section Editor, MCQ Specialist', 'hospital' => 'National Licensing Review Cell'],
            ['name' => 'Manish Acharya (IOE)', 'designation' => 'Section Editor & IT Expert', 'hospital' => 'Pulchowk Engineering Alum / Tech Faculty'],
            ['name' => 'Dr. Sunil Subedi (Loksewa)', 'designation' => 'Section Editor, Senior Medical Officer', 'hospital' => 'Public Health Service Board'],
            ['name' => 'Dr. Suman Subedi (MDS Dental)', 'designation' => 'Section Editor, Consultant Orthopedics', 'hospital' => 'Dental & Orthopedic Review Board'],
            ['name' => 'Sister Sushmita Rai', 'designation' => 'Section Editor, Nursing Division', 'hospital' => 'Nursing Education Division, IOM'],
            ['name' => 'Sister Pratima Thapa', 'designation' => 'Section Editor, Senior Nursing Reviewer', 'hospital' => 'PAHS / Nursing Licensing Board'],
        ];

        foreach ($chiefEditors as $ce) {
            Team::create([
                'name' => $ce['name'],
                'designation' => $ce['designation'],
                'hospital' => $ce['hospital'],
                'type' => 'chief_editor',
                'status' => 'active'
            ]);
        }

        // SPECIAL THANKS
        $specialThanks = [
            ['name' => 'Dr. Sandesh Devkota', 'designation' => 'MBBS(UCMS)', 'description' => 'For clinical syllabus mapping, case simulation reviews, and question bank verification.'],
            ['name' => 'Dr. Manish Bhandari', 'designation' => 'MBBS(COMS)', 'description' => 'For high-yield clinical pearls, differential diagnosis tables, and explanation reviews.'],
            ['name' => 'Dr. Sonu Adhikari', 'designation' => 'MBBS(CMC)', 'description' => 'For diagnostic algorithms, medical question bank audits, and exam module curation.'],
            ['name' => 'Dr. Subash Subedi', 'designation' => 'MBBS(CMC)', 'description' => 'For clinical pharmacology rationales and system-wise high-yield revisions.'],
            ['name' => 'Binit Lamsal', 'designation' => 'Technical Contributor', 'description' => 'For platform performance optimization, simulation engine architecture, and user workflows.'],
            ['name' => 'Roshan Adhikari', 'designation' => 'Content Contributor', 'description' => 'For comprehensive curriculum structuring and study resource development.'],
            ['name' => 'Aayush Ghimire', 'designation' => 'Content Contributor', 'description' => 'For question bank verification, exam analytics review, and academic coordination.'],
        ];

        foreach ($specialThanks as $st) {
            Team::create([
                'name' => $st['name'],
                'designation' => $st['designation'],
                'description' => $st['description'],
                'type' => 'special_thanks',
                'status' => 'active'
            ]);
        }
    }
}
