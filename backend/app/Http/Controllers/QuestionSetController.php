<?php

namespace App\Http\Controllers;

use App\Models\QuestionSet;
use Illuminate\Http\Request;

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
return response()->json([
    'set'=>$set,
    'status'=>true
]);
}}
