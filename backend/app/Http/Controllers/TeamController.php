<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;

class TeamController extends Controller
{
    public function index()
    {
        return response()->json(Team::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'role' => 'nullable|string',
            'type' => 'nullable|string', // e.g., 'chief_editor', 'special_thanks'
            'avatarUrl' => 'nullable|string',
            'hospital' => 'nullable|string',
            'enabled' => 'boolean'
        ]);

        $team = Team::create($validated);
        return response()->json($team, 201);
    }

    public function show(Team $team)
    {
        return response()->json($team);
    }

    public function update(Request $request, Team $team)
    {
        $team->update($request->all());
        return response()->json($team);
    }

    public function destroy(Team $team)
    {
        $team->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
