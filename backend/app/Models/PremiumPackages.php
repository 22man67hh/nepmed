<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PremiumPackages extends Model
{
    protected $table = 'premium_packages';
    protected $guarded = [];

    public function exams()
    {
        return $this->belongsToMany(Exam::class, 'package_exam', 'premium_package_id', 'exam_id');
    }

    public function questionSets()
    {
        return $this->belongsToMany(QuestionSet::class, 'package_question_set', 'premium_package_id', 'question_set_id');
    }
}
