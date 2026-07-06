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
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable();
            $table->foreignId('exam_id')->nullable()->constrained('exams')->onDelete('cascade');
            $table->decimal('weight', 5, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('slug');
            $table->dropForeign(['exam_id']);
            $table->dropColumn('exam_id');
            $table->dropColumn('weight');
        });
    }
};
