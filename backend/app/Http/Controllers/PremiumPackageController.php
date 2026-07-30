<?php

namespace App\Http\Controllers;

use App\Models\PremiumPackages;
use Illuminate\Http\Request;

class PremiumPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search=$request->search;
        $packages = PremiumPackages::with(['exams', 'questionSets'])->when($search, function ($query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        })->get();
        return response()->json($packages);

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
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'required|numeric|min:0',
          'is_active' => 'required|boolean',
          'is_free' => 'required|boolean',
          'is_popular' => 'required|boolean'
        ]);
        $data=$request->except(['exams', 'question_sets', 'questionSets']);
        $package=PremiumPackages::create($data);
        
        if ($request->has('exams')) {
            $package->exams()->sync($request->exams);
        }
        if ($request->has('question_sets')) {
            $package->questionSets()->sync($request->question_sets);
        }

        $package->load(['exams', 'questionSets']);

        return response()->json([
            'status'=>true,
            'message'=>'Package created successfully',
            'data'=>$package
        ]);
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
        $package=PremiumPackages::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'required|numeric|min:0',
          'is_active' => 'required|boolean',
          'is_free' => 'required|boolean',
          'is_popular' => 'required|boolean'
        ]);
        $data=$request->except(['exams', 'question_sets', 'questionSets']);
        $package->update($data);

        if ($request->has('exams')) {
            $package->exams()->sync($request->exams);
        }
        if ($request->has('question_sets')) {
            $package->questionSets()->sync($request->question_sets);
        }

        $package->load(['exams', 'questionSets']);

        return response()->json([
            'status'=>true,
            'message'=>'Package updated successfully',
            'data'=>$package
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $package=PremiumPackages::findOrFail($id);
        $package->delete();
        return response()->json([
            'status'=>true,
            'message'=>'Package deleted successfully',
            'data'=>$package
        ]);
    }
}
