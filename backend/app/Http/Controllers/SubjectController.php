<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
    public function store(Request $request)
    {
    $data=    $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:subjects,code',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'exam_id' => 'nullable|exists:exams,id',
            'weight' => 'nullable|numeric|min:0|max:1000',
        ]);
$data['slug'] = \Str::slug($data['name']);
$subject = \App\Models\Subject::create($data);

        return response()->json([
            'message' => 'Subject created successfully',
            'subject' => $subject,
            'status'=>true
        ], 201);

    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request,  $id)
    {
        $subject = \App\Models\Subject::findOrFail($id);


      $data=    $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:subjects,code',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'exam_id' => 'nullable|exists:exams,id',
            'weight' => 'nullable|numeric|min:0|max:1000',
        ]);
        $subject->update($data);

        return response()->json([
            'message' => 'Subject updated successfully',
            'subject' => $subject,
                        'status'=>true

        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $subject = \App\Models\Subject::findOrFail($id);
        $subject->delete();

        return response()->json([
                        'status'=>true,

            'message' => 'Subject deleted successfully',
        ], 200);
    }
}
