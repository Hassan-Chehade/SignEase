<?php

namespace App\Http\Controllers;

use App\Models\Detection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SignController extends Controller
{
    public function detect(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|string',
        ]);

        $pythonUrl = config('services.python.url', 'http://localhost:8001');

        try {
            $response = Http::timeout(15)->post("{$pythonUrl}/detect", [
                'image' => $request->input('image'),
            ]);
        } catch (\Exception $e) {
            Log::error('Python service unreachable: ' . $e->getMessage());
            return response()->json(['error' => 'Vision service unavailable'], 503);
        }

        if ($response->failed()) {
            return response()->json(['error' => 'Vision service error'], 502);
        }

        $data = $response->json();

        if (!empty($data['detected']) && !empty($data['sign'])) {
            Detection::create([
                'sign'       => $data['sign'],
                'confidence' => $data['confidence'] ?? 0,
                'user_id'    => $request->user()?->id,
            ]);
        }

        return response()->json($data);
    }

    public function history(Request $request): JsonResponse
    {
        $history = Detection::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();
        return response()->json($history);
    }

    public function clearHistory(Request $request): JsonResponse
    {
        Detection::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'History cleared']);
    }
}
