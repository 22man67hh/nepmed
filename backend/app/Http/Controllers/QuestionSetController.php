<?php

namespace App\Http\Controllers;

use App\Models\QuestionSet;
use App\Models\Question;
use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionSetController extends Controller
{



public function index(Request $request)
{
$filters=$request->only(['search','exam_id','isFree']);

    $sets=QuestionSet::filter($filters)->latest()->paginate(10);
    return response()->json([
        'sets'=>$sets,
        'status'=>true
    ]);

}


public function store(Request $request)
{

$data=$request->validate([
    'exam_id'=>'required|exists:exams,id',
    'title'=>'required|string',
    'type'=>'required|in:mock-test,past-year',
    'is_free'=>'nullable|boolean',
    'price'=>'nullable|numeric|min:0',
    'year_or_date'=>'nullable|string',
    'duration_minutes'=>'required|numeric|min:1',
    'correct_marks'=>'nullable|numeric|min:0',
    'incorrect_marks'=>'nullable|numeric|min:0',
    'province'=>'nullable|string'
]);

if($request->is_free==true){
    $data['price']=0;
}
$set=QuestionSet::create($data);

if ($request->has('question_ids')) {
    $syncData = [];
    foreach ($request->input('question_ids') as $index => $qId) {
        $syncData[$qId] = ['sort_order' => $index + 1];
    }
    $set->questions()->sync($syncData);
}

return response()->json([
    'set'=>$set->load('questions'),
    'status'=>true
]);
}

public function importQuestions(Request $request, QuestionSet $questionSet)
{
    $request->validate([
        'questions' => 'required|array|min:1',
        'questions.*.questionText' => 'required|string',
        'questions.*.explanation' => 'required|string',
        'questions.*.subjectName' => 'required|string',
        'questions.*.topicName' => 'required|string',
        'questions.*.options' => 'required|array|min:4',
        'questions.*.options.*.optionText' => 'required|string',
        'questions.*.options.*.isCorrect' => 'required|boolean',
        'questions.*.options.*.optionIndex' => 'required|integer',
        'questions.*.sourceReference' => 'nullable|string',
    ]);

    // Extra integrity validation: ensure each question has exactly one correct option
    foreach ($request->input('questions') as $index => $qData) {
        $correctCount = collect($qData['options'])->where('isCorrect', true)->count();
        if ($correctCount !== 1) {
            return response()->json([
                'message' => "Validation failed: Question at index {$index} must have exactly one correct option. Found {$correctCount}.",
                'errors' => [
                    "questions.{$index}.options" => ["Each question must have exactly one correct option."]
                ]
            ], 422);
        }
    }

    $questionsData = $request->input('questions');
    $importedCount = 0;
    $errors = [];

    // Cache subjects to avoid N+1 queries
    $subjectsCache = Subject::all()->keyBy(function ($subject) {
        return strtolower($subject->name);
    });

    try {
        DB::transaction(function () use ($questionsData, $questionSet, $subjectsCache, &$importedCount, &$errors) {
            // Get the current max sort order for this set to append questions
            $currentMaxSortOrder = DB::table('question_set_questions')
                ->where('question_set_id', $questionSet->id)
                ->max('sort_order') ?? 0;

            foreach ($questionsData as $index => $qData) {
                $rowNum = $index + 1;

                $subjectName = trim($qData['subjectName']);
                $subject = $subjectsCache->get(strtolower($subjectName));
                if (!$subject) {
                    // Try looking up by code
                    $subject = Subject::where('code', $subjectName)->first();
                }

                if (!$subject) {
                    $errors[] = "Row {$rowNum}: Subject '{$subjectName}' not found.";
                    continue;
                }

                $topicName = trim($qData['topicName']);
                $topic = Topic::where('subject_id', $subject->uuid)
                    ->where('name', $topicName)
                    ->first();

                if (!$topic) {
                    $topic = Topic::create([
                        'subject_id' => $subject->uuid,
                        'name' => $topicName,
                    ]);
                }

                $question = Question::create([
                    'subject_id' => $subject->uuid,
                    'topic_id' => $topic->id,
                    'question_text' => trim($qData['questionText']),
                    'explanation' => trim($qData['explanation']),
                ]);

                foreach ($qData['options'] as $optData) {
                    $question->options()->create([
                        'option_text' => $optData['optionText'],
                        'is_correct' => $optData['isCorrect'],
                        'option_index' => $optData['optionIndex'],
                    ]);
                }

                $currentMaxSortOrder++;
                $sourceRef = $qData['sourceReference'] ?? null;

                $questionSet->questions()->attach($question->id, [
                    'sort_order' => $currentMaxSortOrder,
                    'source_refernce' => $sourceRef,
                ]);

                $importedCount++;
            }

            if (!empty($errors)) {
                throw new \Exception("Validation errors occurred during import.");
            }
        });
    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => 'Import failed due to errors.',
            'errors' => $errors
        ], 422);
    }

    return response()->json([
        'status' => true,
        'message' => "Successfully imported {$importedCount} questions to the question set."
    ]);
}

public function show(QuestionSet $questionSet)
{
    $questionSet->load([
        'questions' => function ($query) {
            $query->orderBy('question_set_questions.sort_order');
        },
        'questions.options',
        'questions.subject',
        'questions.topic'
    ]);

    return response()->json([
        'set' => $questionSet,
        'status' => true
    ]);
}

public function update(Request $request, QuestionSet $questionSet)
{
    $data = $request->validate([
        'exam_id'           => 'sometimes|required|exists:exams,id',
        'title'             => 'sometimes|required|string',
        'type'              => 'sometimes|required|in:mock-test,past-year',
        'is_free'           => 'nullable|boolean',
        'price'             => 'nullable|numeric|min:0',
        'year_or_date'      => 'nullable|string',
        'duration_minutes'  => 'nullable|numeric|min:1',
        'correct_marks'     => 'nullable|numeric|min:0',
        'incorrect_marks'   => 'nullable|numeric|min:0',
        'province'          => 'nullable|string'
    ]);

    if (isset($data['is_free']) && $data['is_free'] == true) {
        $data['price'] = 0;
    }

    $questionSet->update($data);

    if ($request->has('question_ids')) {
        $syncData = [];
        foreach ($request->input('question_ids') as $index => $qId) {
            $syncData[$qId] = ['sort_order' => $index + 1];
        }
        $questionSet->questions()->sync($syncData);
    }

    return response()->json([
        'set'    => $questionSet->fresh()->load('questions'),
        'status' => true
    ]);
}

public function destroy(QuestionSet $questionSet)
{
    // Detach all questions from the pivot table first
    $questionSet->questions()->detach();
    $questionSet->delete();

    return response()->json([
        'status'  => true,
        'message' => 'Question set deleted successfully.'
    ]);
}
}
