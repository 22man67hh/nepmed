<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_question_set', function (Blueprint $table) {
            $table->foreignId('premium_package_id')->constrained('premium_packages')->onDelete('cascade');
            $table->foreignId('question_set_id')->constrained('question_sets')->onDelete('cascade');
            $table->primary(['premium_package_id', 'question_set_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_question_set');
    }
};
