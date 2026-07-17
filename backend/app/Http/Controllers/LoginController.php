<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Facades\Socialite;

class LoginController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }


    public function login(Request $request)
    {

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            if ($user->role != 'user') {
                return response()->json([
                    'message' => 'You are not a user',
                    'status' => false
                ], 401);
            }
            $token = $user->createToken('auth_token')->plainTextToken;
            $this->setUserLog($user);

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $user,
                'status' => true

            ]);
        }
        return response()->json([
            'message' => 'Invalid credentials',
            'status' => false
        ], 401);
    }


    private function setUserLog($user)
    {
        $user->user_logs()->create([
            'description' => 'Login successful',
            'user_id' => $user->id,
            'logged_at' => now(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'device' => request()->header('User-Agent'),


        ]);
    }

    public function isDailyBonusAvailable(Request $request){
        $user = $request->user();
        $isAvailable = $user->daily_bonus_available;

        return response()->json([
            'isAvailable' => $isAvailable,
            'todayP'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'message' => 'Logout successful',
            'status' => true
        ]);
    }


    public function adminLogin(Request $request)
    {

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            if ($user->role != 'admin') {
                return response()->json([
                    'message' => 'You are not an admin',
                    'status' => false
                ], 401);
            }
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $user,
                'status' => true

            ]);
        }
        return response()->json([
            'message' => 'Invalid credentials',
            'status' => false
        ], 401);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
            'status' => true
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => 'user',
        ]);
        if ($user) {
            $otp = $this->sendOtp($user);
        }

        return response()->json([
            'message' => 'User registered successfully please check your email for OTP',
            'user' => $user,
            'status' => true,
            'simulatedOtp' => config('app.debug') ? $otp : null
        ]);
    }

    private function sendOtp($user)
    {

        $email = $user->email;
        $otp = rand(100000, 999999); // Generate a random 6-digit OTP
        // Store the OTP in the database or cache for later verification
        $otpKey = 'otp_' . $user->id;
        Cache::put($otpKey, $otp, now()->addMinutes(5));

        Mail::to($email)->send(new \App\Mail\OtpMail($otp));

        return $otp;
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'User not found',
                'status' => false
            ], 404);
        }

        $otp = $this->sendOtp($user);

        return response()->json([
            'message' => 'OTP resent successfully',
            'status' => true,
            'simulatedOtp' => config('app.debug') ? $otp : null
        ]);
    }


    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'User not found',
                'status' => false
            ], 404);
        }
        $otpKey = 'otp_' . $user->id;
        $cachedOtp = Cache::get($otpKey);
        if ($cachedOtp && $cachedOtp == $request->otp) {
            $user->markEmailAsVerified();
            Cache::forget($otpKey);

            return response()->json([
                'message' => 'OTP verified successfully',
                'status' => true
            ]);
        }

        return response()->json([
            'message' => 'Invalid OTP',
            'status' => false
        ], 400);
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
        //
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
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function handleGoogleCallback(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $googleUser = Socialite::driver('google')->stateless()->userFromToken($request->token);
            $user = User::updateOrCreate([
                'email' => $googleUser->getEmail(),
            ], [
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId(),
                'email_verified_at' => now(),
                'role' => 'user',
                'status' => 'active',

            ]);

            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $user,
                'status' => true
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error verifying Google token: ' . $e->getMessage(),
                'status' => false
            ], 500);
        }
    }
}
