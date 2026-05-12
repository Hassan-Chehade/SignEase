<?php

namespace App\Http\Controllers;

use App\Models\Detection;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users(): JsonResponse
    {
        $users = User::withCount('detections')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($u) => [
                'id'               => $u->id,
                'name'             => $u->name,
                'email'            => $u->email,
                'role'             => $u->role,
                'detections_count' => $u->detections_count,
                'created_at'       => $u->created_at,
            ]);

        return response()->json($users);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['role' => 'required|in:admin,user']);

        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot change your own role'], 422);
        }

        $user->update(['role' => $data['role']]);
        return response()->json(['message' => 'Role updated', 'role' => $user->role]);
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete your own account'], 422);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function detections(Request $request): JsonResponse
    {
        $detections = Detection::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json($detections);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total_users'      => User::count(),
            'total_detections' => Detection::count(),
            'admins'           => User::where('role', 'admin')->count(),
            'detections_today' => Detection::whereDate('created_at', today())->count(),
        ]);
    }
}
