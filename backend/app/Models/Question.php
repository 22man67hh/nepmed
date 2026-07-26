<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $guarded = [];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'uuid');
    }

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function options()
    {
        return $this->hasMany(QuestionOption::class);
    }

    public function questionSets()
    {
        return $this->belongsToMany(QuestionSet::class, 'question_set_questions')
                    ->withPivot('sort_order', 'source_refernce')
                    ->withTimestamps();
    }

    public function tags()
    {
        return $this->hasMany(QuestionTag::class);
    }
}
