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
        Schema::table('teams', function (Blueprint $table) {
             $table->string('type')->default('core'); // 'core', 'chief_editor', 'special_thanks'
            $table->string('hospital')->nullable();
            $table->string('specialty')->nullable();
            $table->string('badge')->nullable();
            $table->boolean('is_founder')->default(false);
            $table->string('facebook')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('twitter')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['type', 'hospital', 'specialty', 'badge', 'is_founder', 'facebook', 'linkedin', 'twitter']);
        });
    }
};
