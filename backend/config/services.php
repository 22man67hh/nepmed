<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],
       'khalti' => [
        'secret_key' => env('KHALTI_KEY'),
        'base_url' => env('KHALTI_BASE_URL', 'https://khalti.com/api/v2/'),
    ],
    'esewa' => [
        'secret_key' => env('ESEWA_KEY'),
        'base_url' => env('ESEWA_BASE_URL', 'https://esewa.com.np/epay/main'),
        'product_code' => env('ESEWA_PRODUCT_CODE', 'GROCERY_APP'),
        'status_url' => env('ESEWA_STATUS_URL', 'https://rc-epay.esewa.com.np/api/epay/transaction/status/'),
    ],

];
