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
        Schema::create('question_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->onDelete('cascade');
              $table->string('title');
            $table->string('type'); // 'past-year' or 'mock-test'
            $table->string('year_or_date')->nullable();
            $table->boolean('is_free')->default(false);
            $table->decimal('price', 10, 2)->default(0.00);
            $table->integer('duration_minutes')->default(60);
            $table->string('province')->nullable();
            $table->decimal('correct_marks', 3, 2)->default(1.00);
            $table->decimal('incorrect_marks', 3, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_sets');
    }
};
