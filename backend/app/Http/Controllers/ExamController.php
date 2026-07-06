<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use Illuminate\Http\Request;

class ExamController extends Controller
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
     $data=   $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);
        $data['slug'] = \Str::slug($data['name']);
        $exam = \App\Models\Exam::create($data);
        return response()->json([
            'message' => 'Exam created successfully',
            'exam' => $exam,
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


$exam=Exam::findOrFail($id);

$data=    $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);
        $data['slug'] = \Str::slug($data['name']);
        $exam->update($data);

        return response()->json([
            'message' => 'Exam updated successfully',
            'exam' => $exam,
            'status'=>true
        ], 200);

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy( $id)
    {
    $exam=Exam::findOrFail($id);
    $exam->delete();
    return response()->json([
        'message' => 'Exam deleted successfully',
        'status'=>true
    ], 200);


    }
}
