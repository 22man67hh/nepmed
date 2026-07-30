<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements \Illuminate\Contracts\Auth\MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable,HasApiTokens;
    protected $appends = ['daily_bonus_available'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function user_logs(){
        return $this->hasMany(UserLog::class);
    }

public function scopeUser($query,array $filters){
$query->when($filters['search'] ?? null, function ($query, $search) {
    $query->where('name','like','%'.$search.'%')
    ->orWhere('email','like','%'.$search.'%')
    ->orWhere('role','like','%'.$search.'%')
    ->orWhere('point','like','%'.$search.'%');
});

return $query;
}


public function getDailyBonusAvailableAttribute()
{
    return !$this->user_logs()->whereDate('created_at', now()->toDateString())->exists();
}

public function questionAttempts(){
    return $this->hasMany(UserQuestionAttempt::class);
}

public function activePackages()
{
    return $this->belongsToMany(PremiumPackages::class, 'user_packages', 'user_id', 'premium_package_id')
                ->withPivot(['is_active', 'payment_status', 'is_unlimited', 'end_date'])
                ->wherePivot('is_active', true)
                ->wherePivot('payment_status', 'completed')
                ->where(function($query) {
                    $query->where('user_packages.is_unlimited', true)
                          ->orWhere('user_packages.end_date', '>=', now());
                });
}

public function hasAccessToExam($examId)
{
    return $this->activePackages()->whereHas('exams', function($query) use ($examId) {
        $query->where('exam_id', $examId);
    })->exists();
}

public function hasAccessToQuestionSet($questionSetId)
{
    return $this->activePackages()->whereHas('questionSets', function($query) use ($questionSetId) {
        $query->where('question_set_id', $questionSetId);
    })->exists();
}
}
