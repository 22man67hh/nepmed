<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserQuestionAttempt extends Model
{
    protected $table = 'user_question_attempts';
    protected $guarded = [];
    public function user(){
        return $this->belongsTo(User::class);
    }
    public function question(){
        return $this->belongsTo(Question::class);
    }
    public function questionSet(){
        return $this->belongsTo(QuestionSet::class);
    }
}
