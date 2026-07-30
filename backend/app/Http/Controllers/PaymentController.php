<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PremiumPackages;
use Illuminate\Support\Facades\DB;
use App\Services\KhaltiService;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function initiateKhalti(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:premium_packages,id',
        ]);

        $user = $request->user();
        $package = PremiumPackages::findOrFail($request->package_id);

        // Calculate end date based on duration
        $endDate = $package->duration ? Carbon::now()->addDays($package->duration) : null;
        $isUnlimited = is_null($package->duration);

        // Create pending user_package record
        $userPackageId = DB::table('user_packages')->insertGetId([
            'user_id' => $user->id,
            'premium_package_id' => $package->id,
            'start_date' => Carbon::now(),
            'end_date' => $endDate,
            'is_active' => false,
            'is_expired' => false,
            'is_unlimited' => $isUnlimited,
            'price' => $package->price,
            'payment_method' => 'khalti',
            'payment_status' => 'pending',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        $khalti = new KhaltiService();
        
        try {
            $paymentData = [
                'amount' => $package->price,
                'order_id' => (string) $userPackageId,
                'slug' => '-' . substr(str_shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 4)
            ];

            $response = $khalti->processPayment($paymentData);

            // Update transaction ID if available (pidx)
            if (isset($response['pidx'])) {
                DB::table('user_packages')
                    ->where('id', $userPackageId)
                    ->update(['transaction_id' => $response['pidx']]);
            }

            return response()->json([
                'status' => true,
                'payment_url' => $response['payment_url']
            ]);

        } catch (\Exception $e) {
            \Log::error("Khalti Init Error: " . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to initiate payment.'
            ], 500);
        }
    }

    public function verifyKhalti(Request $request)
    {
        // Khalti redirects here with pidx
        $pidx = $request->query('pidx');

        if (!$pidx) {
            return redirect(config('app.frontend_url') . '/payment-failed');
        }

        $khalti = new KhaltiService();
        
        try {
            $verifyResponse = $khalti->verify(['pidx' => $pidx]);

            $userPackage = DB::table('user_packages')->where('transaction_id', $pidx)->first();

            if (!$userPackage) {
                return redirect(config('app.frontend_url') . '/payment-failed');
            }

            if (isset($verifyResponse['status']) && $verifyResponse['status'] === 'Completed') {
                // Activate the package
                DB::table('user_packages')->where('id', $userPackage->id)->update([
                    'is_active' => true,
                    'payment_status' => 'completed',
                    'updated_at' => Carbon::now()
                ]);
                return redirect(config('app.frontend_url') . '/payment-success?package=' . $userPackage->premium_package_id);
            }

            // If not completed
            DB::table('user_packages')->where('id', $userPackage->id)->update([
                'payment_status' => 'failed',
                'updated_at' => Carbon::now()
            ]);
            return redirect(config('app.frontend_url') . '/payment-failed');

        } catch (\Exception $e) {
            \Log::error("Khalti Verify Error: " . $e->getMessage());
            return redirect(config('app.frontend_url') . '/payment-failed');
        }
    }
}
