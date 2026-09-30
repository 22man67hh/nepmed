<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use Illuminate\Support\Facades\Storage;

class TeamController extends Controller
{
    public function index()
    {
        return response()->json(Team::all());
    }

    private function handleImageUpload(Request $request, array &$validated)
    {
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('teams', 'public');
            $validated['image'] = '/storage/' . $path;
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'designation' => 'nullable|string',
            'type' => 'nullable|string', 
            'image' => 'nullable',
            'hospital' => 'nullable|string',
            'status' => 'nullable|string',
            'specialty' => 'nullable|string',
            'badge' => 'nullable|string',
            'is_founder' => 'boolean',
            'facebook' => 'nullable|string',
            'linkedin' => 'nullable|string',
            'twitter' => 'nullable|string',
            'description' => 'nullable|string'
        ]);

        $this->handleImageUpload($request, $validated);

        $team = Team::create($validated);
        return response()->json($team, 201);
    }

    public function show(Team $team)
    {
        return response()->json($team);
    }

    public function update(Request $request, Team $team)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'designation' => 'nullable|string',
            'type' => 'nullable|string', 
            'image' => 'nullable',
            'hospital' => 'nullable|string',
            'status' => 'nullable|string',
            'specialty' => 'nullable|string',
            'badge' => 'nullable|string',
            'is_founder' => 'boolean',
            'facebook' => 'nullable|string',
            'linkedin' => 'nullable|string',
            'twitter' => 'nullable|string',
            'description' => 'nullable|string'
        ]);

        $this->handleImageUpload($request, $validated);

        $team->update($validated);
        return response()->json($team);
    }

    public function destroy(Team $team)
    {
        $team->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
