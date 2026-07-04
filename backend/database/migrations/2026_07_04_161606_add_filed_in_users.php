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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->string("profile_picture")->nullable();
            $table->string('role')->default('user');
            $table->string('status')->default('active');
            $table->string('last_login')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('device')->nullable();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone');
            $table->dropColumn('address');
            $table->dropColumn('city');
            $table->dropColumn('state');
            $table->dropColumn('country');
            $table->dropColumn("profile_picture");
            $table->dropColumn('role');
            $table->dropColumn('status');
            $table->dropColumn('last_login');
            $table->dropColumn('ip_address');
            $table->dropColumn('device');
            $table->dropColumn('deleted_at');
        });
    }
};
