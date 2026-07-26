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
         Schema::create('question_reports', function (Blueprint $table) {
        $table->id();

        // Links to the question and the user who reported it
        $table->foreignId('question_id')->constrained()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();

        // The issue details
        $table->string('issue_type'); // e.g., 'wrong_answer', 'typo'
        $table->text('description')->nullable();

        // Admin tracking
        $table->string('status')->default('pending'); // 'pending', 'resolved', 'dismissed'
        $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();

        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_reports');
    }
};
