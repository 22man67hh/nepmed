<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        $query = Question::with(['options', 'subject', 'topic', 'tags']);

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }

        if ($request->has('topic_id')) {
            $query->where('topic_id', $request->input('topic_id'));
        }

        if ($request->has('search')) {
            $query->where('question_text', 'LIKE', '%' . $request->input('search') . '%');
        }

        $perPage = $request->get('per_page', 20);
        $questions = $query->latest()->paginate($perPage);

        return response()->json([
            'status' => true,
            'questions' => $questions
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function singleStore(Request $request)
    {
        $request->validate([
            'subject_id' => 'nullable|exists:subjects,uuid',
            'subjectName' => 'nullable|string',
            'questionText' => 'required|string',
            'explanation' => 'required|string',
            'topic_id' => 'nullable|exists:topics,id',
            'topicName' => 'nullable|string',
            'options' => 'required|array|min:4',
            'options.*.optionText' => 'required|string',
            'options.*.isCorrect' => 'required|boolean',
            'options.*.optionIndex' => 'required|integer',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
        ]);

        $correctCount = collect($request->input('options'))->where('isCorrect', true)->count();
        if ($correctCount !== 1) {
            return response()->json([
                'message' => "Validation failed: Question options must have exactly one correct option. Found {$correctCount}.",
                'errors' => [
                    "options" => ["Each question must have exactly one correct option."]
                ]
            ], 422);
        }

        $subject = Subject::where('name', $request->input('subjectName'))->first();
        if (!$subject) {
            // return response()->json([
            //     'status' => false,
            //     'message' => "Validation failed: Subject not found.",
            //     'errors' => [
            //         "subject_name" => ["Subject not found."]
            //     ]
            // ], 422);
          $subject =  Subject::create([
                'name' => $request->input('subjectName'),
                'status'=>'active'
            ]);
        }
        $topic = Topic::where('name', $request->input('topicName'))->first();
        if (!$topic) {
            // return response()->json([
            //     'status' => false,
            //     'message' => "Validation failed: Topic not found.",
            //     'errors' => [
            //         "topic_id" => ["Topic not found."]
            //     ]
            // ], 422);
       $topic =     Topic::create([
                'name' => $request->input('topicName'),
                'subject_id' => $subject->uuid,

            ]);
        }

        $question = Question::create([
            'question_text' => $request->input('questionText'),
            'explanation' => $request->input('explanation'),
            'subject_id' => $subject->uuid,
            'topic_id' => $topic->id
        ]);

        foreach ($request->input('options') as $optData) {
            $option = $question->options()->create([
                'option_text' => $optData['optionText'],
                'is_correct' => $optData['isCorrect'],
                'option_index' => $optData['optionIndex'],
            ]);
        }

        if ($request->has('tags') && is_array($request->input('tags'))) {
            foreach ($request->input('tags') as $tagName) {
                $question->tags()->create(['tag_name' => $tagName]);
            }
        }

        $question->load(['options', 'subject', 'topic', 'tags']);

        return response()->json([
            'status' => true,
            'question' => $question,
            'message' => 'Question created successfully.'
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,uuid',
            'questions' => 'required|array|min:1',
            'questions.*.questionText' => 'required|string',
            'questions.*.explanation' => 'required|string',
            'questions.*.topicName' => 'required|string',
            'questions.*.topic_id' => 'nullable|exists:topics,id',
            'questions.*.options' => 'required|array|min:4',
            'questions.*.options.*.optionText' => 'required|string',
            'questions.*.options.*.isCorrect' => 'required|boolean',
            'questions.*.options.*.optionIndex' => 'required|integer',
            'questions.*.tags' => 'nullable|array',
            'questions.*.tags.*' => 'string',
        ]);

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

        return DB::transaction(function () use ($request) {
            $subjectId = $request->input('subject_id');
            $questionsData = $request->input('questions');
            $createdQuestions = [];

            foreach ($questionsData as $qData) {
                $topicId = $qData['topic_id'] ?? null;
                $topicName = $qData['topicName'] ?? null;

                if (!$topicId && $topicName) {
                    $topicObj = Topic::firstOrCreate([
                        'subject_id' => $subjectId,
                        'name' => $topicName,
                    ]);
                    $topicId = $topicObj->id;
                }

                if (!$topicId) {
                    throw new \Exception("A valid topic_id or topicName must be provided for all questions.");
                }

                $question = Question::create([
                    'subject_id' => $subjectId,
                    'topic_id' => $topicId,
                    'question_text' => $qData['questionText'],
                    'explanation' => $qData['explanation'],
                ]);

                foreach ($qData['options'] as $optData) {
                    $question->options()->create([
                        'option_text' => $optData['optionText'],
                        'is_correct' => $optData['isCorrect'],
                        'option_index' => $optData['optionIndex'],
                    ]);
                }

                if (isset($qData['tags']) && is_array($qData['tags'])) {
                    foreach ($qData['tags'] as $tagName) {
                        $question->tags()->create(['tag_name' => $tagName]);
                    }
                }

                $createdQuestions[] = $question->load('options');
            }

            return response()->json([
                'status' => true,
                'message' => count($createdQuestions) . ' questions imported successfully.',
                'questions' => $createdQuestions
            ], 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(Question $question)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Question $question)
    {
        $question->load('options');
        return $question;
    }

    public function update(Request $request, Question $question)
    {
        $request->validate([
            'subject_id' => 'sometimes|required|exists:subjects,uuid',
            'topic_id' => 'sometimes|nullable|exists:topics,id',
            'topic' => 'sometimes|nullable|string',
            'questionText' => 'sometimes|required|string',
            'explanation' => 'sometimes|required|string',
            'options' => 'sometimes|required|array|min:4',
            'options.*.optionText' => 'required|string',
            'options.*.isCorrect' => 'required|boolean',
            'options.*.optionIndex' => 'required|integer',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
        ]);

        if ($request->has('options')) {
            $correctCount = collect($request->input('options'))->where('isCorrect', true)->count();
            if ($correctCount !== 1) {
                return response()->json([
                    'message' => "Validation failed: Question options must have exactly one correct option. Found {$correctCount}.",
                    'errors' => [
                        "options" => ["Each question must have exactly one correct option."]
                    ]
                ], 422);
            }
        }

        return DB::transaction(function () use ($request, $question) {
            $subjectId = $request->input('subject_id') ?? $question->subject_id;
            $topicId = $request->input('topic_id');
            $topicName = $request->input('topic');

            if ($request->has('topic') && !$topicId && $topicName) {
                $topicObj = Topic::firstOrCreate([
                    'subject_id' => $subjectId,
                    'name' => $topicName,
                ]);
                $topicId = $topicObj->id;
            }

            $updateData = [];
            if ($request->has('subject_id')) {
                $updateData['subject_id'] = $request->input('subject_id');
            }
            if ($topicId) {
                $updateData['topic_id'] = $topicId;
            }
            if ($request->has('questionText')) {
                $updateData['question_text'] = $request->input('questionText');
            }
            if ($request->has('explanation')) {
                $updateData['explanation'] = $request->input('explanation');
            }

            if (!empty($updateData)) {
                $question->update($updateData);
            }

            if ($request->has('options')) {
                // Delete existing options
                $question->options()->delete();

                // Create new options
                foreach ($request->input('options') as $optData) {
                    $question->options()->create([
                        'option_text' => $optData['optionText'],
                        'is_correct' => $optData['isCorrect'],
                        'option_index' => $optData['optionIndex'],
                    ]);
                }
            }

            if ($request->has('tags') && is_array($request->input('tags'))) {
                $question->tags()->delete();
                foreach ($request->input('tags') as $tagName) {
                    $question->tags()->create(['tag_name' => $tagName]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Question updated successfully.',
                'question' => $question->load('options')
            ]);
        });
    }

    /**
     *
     * Remove the specified resource from storage.
     */
    public function destroy(Question $question)
    {
        $question->delete();
        return response()->json([
            'status' => true,
            'message' => 'Question deleted successfully.'
        ]);
    }
}
