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
        Schema::create('question_tags', function (Blueprint $table) {
            $table->id();
         $table->foreignId('question_id')->constrained()->onDelete('cascade');
            $table->string('tag_name');
            $table->string('reference_year', 10)->nullable();

            $table->foreignId('exam_id')->nullable()->constrained('exams')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_tags');
    }
};
