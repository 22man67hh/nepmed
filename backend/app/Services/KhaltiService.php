<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class KhaltiService
{
    public function processPayment(array $paymentData): array
    {
        $url = config('services.khalti.base_url') . 'epayment/initiate/';

        \Log::info("Requesting Khalti URL: " . $url);

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \Exception("Invalid Khalti Base URL. Check your .env file.");
        }

        $response = Http::withHeaders([
            'Authorization' => 'Key ' . config('services.khalti.secret_key'),
        ])->post($url, [
            'return_url' => route('payment.callback', ['gateway' => 'khalti']),
            'website_url' => config('app.url'),
            'amount' => (int)($paymentData['amount'] * 100), // Convert to Paisa
            'purchase_order_id' => $paymentData['order_id'],
            'purchase_order_name' => "package #" . $paymentData['order_id'] . $paymentData['slug'],
        ]);
        \Log::info("Khalti Response: " . $response->body());
        $data = $response->json();

        return [
            'gateway' => 'khalti',
            'method' => 'GET',
            'payment_url' => $data['payment_url'] ?? null,
            'pidx' => $data['pidx'] ?? null,

        ];
    }

    public function verify(array $requestData): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Key ' . config('services.khalti.secret_key')
        ])->post(config('services.khalti.base_url') . 'epayment/lookup/', [
            'pidx' => $requestData['pidx']
        ]);

        return $response->json();
    }
}
