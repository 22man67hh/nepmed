<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_exam', function (Blueprint $table) {
            $table->foreignId('premium_package_id')->constrained('premium_packages')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->primary(['premium_package_id', 'exam_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_exam');
    }
};
