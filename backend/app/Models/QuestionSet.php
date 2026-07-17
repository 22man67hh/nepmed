<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionSet extends Model
{
    protected $guarded = [];


    public function questions()
    {
        return $this->belongsToMany(Question::class, 'question_set_questions')
                    ->withPivot('sort_order', 'source_refernce')
                    ->withTimestamps();
    }

    public function scopeFilter($query, array $filters)
{
    $query->when($filters['search'] ?? null, function ($query, $search) {
        $query->where('name', 'like', '%' . $search . '%');
    })
    ->when($filters['exam_id'] ?? null, function ($query, $examId) {
        $query->where('exam_id', $examId);
    })
    ->when($filters['isFree'] ?? null, function ($query, $isFree) {
        $query->where('is_free', (bool)$isFree);
    });

    return $query;
}
}
