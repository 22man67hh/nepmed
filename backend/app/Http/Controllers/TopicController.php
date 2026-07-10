<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\Request;

class TopicController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'status' => true,
            'topics' => Topic::all()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|exists:subjects,uuid',
            'name' => 'required|string|max:255',
            'weight' => 'nullable|numeric|min:0|max:100',
            'icon' => 'nullable|string'
        ]);

        $topic = Topic::create($data);

        return response()->json([
            'status' => true,
            'message' => 'Topic created successfully',
            'topic' => $topic
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $topic = Topic::findOrFail($id);
        return response()->json([
            'status' => true,
            'topic' => $topic
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $topic = Topic::findOrFail($id);

        $data = $request->validate([
            'subject_id' => 'required|exists:subjects,uuid',
            'name' => 'required|string|max:255',
            'weight' => 'nullable|numeric|min:0|max:100',
            'icon' => 'nullable|string'
        ]);

        $topic->update($data);

        return response()->json([
            'status' => true,
            'message' => 'Topic updated successfully',
            'topic' => $topic
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $topic = Topic::findOrFail($id);
        $topic->delete();

        return response()->json([
            'status' => true,
            'message' => 'Topic deleted successfully'
        ]);
    }

    /**
     * Synchronize multiple topics for a given subject.
     */
    public function bulkSync(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|exists:subjects,uuid',
            'topics' => 'present|array',
            'topics.*.id' => 'nullable|integer|exists:topics,id',
            'topics.*.name' => 'required|string|max:255',
            'topics.*.weight' => 'nullable|numeric|min:0|max:100',
            'topics.*.icon' => 'nullable|string'
        ]);

        $subjectId = $data['subject_id'];
        $incomingTopics = $data['topics'];

        $existingTopicIds = Topic::where('subject_id', $subjectId)->pluck('id')->toArray();
        $processedIds = [];

        foreach ($incomingTopics as $incoming) {
            if (!empty($incoming['id'])) {
                $topic = Topic::findOrFail($incoming['id']);
                $topic->update([
                    'name' => $incoming['name'],
                    'weight' => $incoming['weight'] ?? 0,
                    'icon' => $incoming['icon'] ?? 'tag'
                ]);
                $processedIds[] = $incoming['id'];
            } else {
                $topic = Topic::create([
                    'subject_id' => $subjectId,
                    'name' => $incoming['name'],
                    'weight' => $incoming['weight'] ?? 0,
                    'icon' => $incoming['icon'] ?? 'tag'
                ]);
                $processedIds[] = $topic->id;
            }
        }

        $toDeleteIds = array_diff($existingTopicIds, $processedIds);
        if (!empty($toDeleteIds)) {
            Topic::whereIn('id', $toDeleteIds)->delete();
        }

        return response()->json([
            'status' => true,
            'message' => 'Topics synchronized successfully',
            'topics' => Topic::where('subject_id', $subjectId)->get()
        ]);
    }
}

