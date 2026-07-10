<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [App\Http\Controllers\LoginController::class, 'login']);
Route::post('/logout', [App\Http\Controllers\LoginController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/register', [App\Http\Controllers\LoginController::class, 'register']);
Route::get('/me', [App\Http\Controllers\LoginController::class, 'me'])->middleware('auth:sanctum');
Route::post('/verify-otp', [App\Http\Controllers\LoginController::class, 'verifyOtp']);
Route::post('/resend-otp', [App\Http\Controllers\LoginController::class, 'resendOtp']);
Route::post('/callback/google', [App\Http\Controllers\LoginController::class, 'handleGoogleCallback']);
Route::apiResource('subjects', App\Http\Controllers\SubjectController::class);
Route::apiResource('exams', App\Http\Controllers\ExamController::class);
Route::post('/topics/bulk', [App\Http\Controllers\TopicController::class, 'bulkSync']);
Route::apiResource('topics', App\Http\Controllers\TopicController::class);

