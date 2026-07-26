<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasUuids;

    protected $primaryKey = 'uuid';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $guarded = [];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }
    public function topics()
    {
        return $this->hasMany(Topic::class, 'subject_id', 'uuid');
    }
    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}
