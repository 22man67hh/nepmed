<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [App\Http\Controllers\LoginController::class, 'login']);
Route::post('/admin-login', [App\Http\Controllers\LoginController::class, 'adminLogin']);
Route::post('/logout', [App\Http\Controllers\LoginController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/register', [App\Http\Controllers\LoginController::class, 'register']);
Route::get('/me', [App\Http\Controllers\LoginController::class, 'me'])->middleware('auth:sanctum');
Route::post('/verify-otp', [App\Http\Controllers\LoginController::class, 'verifyOtp']);
Route::post('/resend-otp', [App\Http\Controllers\LoginController::class, 'resendOtp'])->middleware('throttle:5,1');
Route::post('/callback/google', [App\Http\Controllers\LoginController::class, 'handleGoogleCallback']);
Route::apiResource('subjects', App\Http\Controllers\SubjectController::class);
Route::apiResource('exams', App\Http\Controllers\ExamController::class);
Route::post('/topics/bulk', [App\Http\Controllers\TopicController::class, 'bulkSync']);
Route::apiResource('topics', App\Http\Controllers\TopicController::class);
Route::apiResource('questions', App\Http\Controllers\QuestionController::class);
Route::post('/question-import', [App\Http\Controllers\QuestionController::class, 'singleStore']);
Route::post('/question-sets/{questionSet}/import', [App\Http\Controllers\QuestionSetController::class, 'importQuestions']);
Route::apiResource('question-sets', App\Http\Controllers\QuestionSetController::class);
Route::apiResource('premium-packages', App\Http\Controllers\PremiumPackageController::class);
Route::apiResource('teams', App\Http\Controllers\TeamController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/question-attempts', [App\Http\Controllers\QuestionAttemptControllelr::class, 'userQuestionAttempt']);
    Route::get('/my-history', [App\Http\Controllers\QuestionAttemptControllelr::class, 'myHistory']);

    // Initiate payment from frontend
    Route::post('/payment/khalti/initiate', [App\Http\Controllers\PaymentController::class, 'initiateKhalti']);
});

Route::get('/leaderboard', [App\Http\Controllers\QuestionAttemptControllelr::class, 'leaderboard']);

// Khalti redirect callback (no auth middleware because Khalti redirects the user directly here)
Route::get('/payment/callback', [App\Http\Controllers\PaymentController::class, 'verifyKhalti'])->name('payment.callback');
