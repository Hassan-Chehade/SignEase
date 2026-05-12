<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SignController;
use Illuminate\Support\Facades\Route;

// ── Auth (public) ─────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Authenticated ─────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/detect',    [SignController::class, 'detect']);
    Route::get('/history',    [SignController::class, 'history']);
    Route::delete('/history', [SignController::class, 'clearHistory']);

    // ── Admin only ────────────────────────────────────────────────────────
    Route::middleware('can:admin')->prefix('admin')->group(function () {
        Route::get('/stats',                    [AdminController::class, 'stats']);
        Route::get('/users',                    [AdminController::class, 'users']);
        Route::patch('/users/{user}/role',      [AdminController::class, 'updateRole']);
        Route::delete('/users/{user}',          [AdminController::class, 'deleteUser']);
        Route::get('/detections',               [AdminController::class, 'detections']);
    });
});
