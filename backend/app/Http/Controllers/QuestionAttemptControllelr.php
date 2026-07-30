<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\UserQuestionAttempt;
use Illuminate\Http\Request;

class QuestionAttemptControllelr extends Controller
{
    public function userQuestionAttempt(Request $request)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'question_set_id' => 'nullable|exists:question_sets,id',
            'selected_option_index' => 'required|integer|min:0|max:4',
            'time_taken_seconds' => 'nullable|integer|min:0',
        ]);

        $user = $request->user();
        $questionId = $request->question_id;
        $questionSetId = $request->question_set_id;
        $userOptionIndex = (int) $request->selected_option_index;

        $question = Question::with('options')->findOrFail($questionId);

        $correctOption = $question->options->firstWhere('is_correct', true);

        if (!$correctOption) {
            return response()->json(['error' => 'Question has no correct option defined'], 400);
        }

        $correctOptionIndex = (int) $correctOption->option_index;

        $isCorrect = ($userOptionIndex === $correctOptionIndex);

        $attempt = $user->questionAttempts()->create([
            'question_id' => $questionId,
            'question_set_id' => $questionSetId,
            'user_id' => $user->id,
            'is_correct' => $isCorrect,
            'selected_option_index' => $userOptionIndex,
            'time_taken_seconds' => $request->time_taken_seconds,
        ]);

        $question->increment('total_attempts');
        if ($isCorrect) {
            $question->increment('correct_attempts');
        }

        return response()->json([
            'status' => true,
            'message' => 'Attempt recorded',
            'is_correct' => $isCorrect,
            'correct_option_index' => $correctOptionIndex,
            'attempt' => $attempt
        ]);
    }


    public function leaderboard(Request $request)
    {
        $setId = $request->query('question_set_id');

        $query = UserQuestionAttempt::query()
            ->join('users', 'user_question_attempts.user_id', '=', 'users.id')
            ->selectRaw('users.id, users.name, users.email,
                         COUNT(user_question_attempts.id) as total_attempted,
                         SUM(CASE WHEN user_question_attempts.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers')
            ->groupBy('users.id', 'users.name', 'users.email')
            ->having('total_attempted', '>=', 10)
            ;

        if ($setId) {
            $query->where('user_question_attempts.question_set_id', $setId);

        }


        $leaderboard = $query->orderBy('correct_answers', 'desc')
                             ->orderBy('total_attempted', 'asc')
                             ->limit(100)
                             ->get();

        return response()->json([
            'status' => true,
            'data' => $leaderboard
        ]);
    }

    public function myHistory(Request $request)
    {
        $userId = $request->user()->id;

        $setHistory = clone UserQuestionAttempt::where('user_id', $userId)
            ->whereNotNull('question_set_id')
            ->selectRaw('
                question_set_id as setId,
                MAX(created_at) as completedAt,
                SUM(time_taken_seconds) as timeSpentSeconds,
                COUNT(id) as totalQuestions,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correctAnswersCount,
                SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrectAnswersCount
            ')
            ->groupBy('question_set_id')
            ->orderBy('completedAt', 'desc')
            ->get();

        foreach ($setHistory as $h) {
            $h->leftAnswersCount = 0;
            $h->score = $h->correctAnswersCount * 1 - $h->incorrectAnswersCount * 0.25;
            $h->mode = 'timed';
            $h->setId = (string) $h->setId;
        }

        $subjectHistory = clone UserQuestionAttempt::where('user_id', $userId)
            ->whereNull('question_set_id')
            ->selectRaw('
                DATE(created_at) as practice_date,
                MAX(created_at) as completedAt,
                SUM(time_taken_seconds) as timeSpentSeconds,
                COUNT(id) as totalQuestions,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correctAnswersCount,
                SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrectAnswersCount
            ')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('completedAt', 'desc')
            ->get();

        foreach ($subjectHistory as $h) {
            $h->leftAnswersCount = 0;
            $h->score = $h->correctAnswersCount * 1 - $h->incorrectAnswersCount * 0.25;
            $h->mode = 'tutor'; // usually subject practice is tutor mode
            $h->setId = 'subject-practice-' . $h->practice_date;
            unset($h->practice_date);
        }

        $history = $setHistory->concat($subjectHistory)->sortByDesc('completedAt')->values();

        return response()->json([
            'status' => true,
            'data' => $history
        ]);
    }

}
