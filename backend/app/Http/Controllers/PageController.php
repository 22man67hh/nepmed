<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\Request;

class PageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $slug = $request->input('slug');
        $pages = [];
        if ($slug) {
            $pages = Page::where('slug', $slug)->first();
        } else {
            $pages = Page::all();
        }

        return response()->json($pages);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'slug' => 'required|string|unique:pages,slug',
            'title' => 'required|string',
            'content' => 'nullable|array',
        ]);

        $page = Page::create($data);
        return response()->json($page);
    }

    /**
     * Store a newly created resource in storage.
     */


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
    public function update(Request $request, string $id)
    {
        $page = Page::findOrFail($id);
        $data = $request->validate([
            'slug' => 'required|string|unique:pages,slug,' . $page->id,
            'title' => 'required|string',
            'content' => 'nullable|array',
        ]);

        $page->update($data);
        return response()->json($page);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $page = Page::findOrFail($id);
        $page->delete();
        return response()->json(['message' => 'Page deleted successfully']);
    }
}
