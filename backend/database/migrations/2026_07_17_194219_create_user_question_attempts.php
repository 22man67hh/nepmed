<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('user_question_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->onDelete('cascade');

       $table->foreignId('question_id')->constrained()->onDelete('cascade');

            $table->boolean('is_correct');
            $table->unsignedTinyInteger('selected_option_index')->nullable();
            $table->unsignedInteger('time_taken_seconds')->nullable();

            $table->timestamps();



            $table->index(['question_id', 'is_correct'], 'idx_question_correctness');

            $table->index(['user_id', 'question_id'], 'idx_user_question_attempts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_question_attempts');
    }
};
