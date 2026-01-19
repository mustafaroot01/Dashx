<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'type' => 'nullable|string|in:admin,lecturer', // Validate type
        ]);

        $type = $request->input('type', 'admin'); // Default to admin if missing

        if ($type === 'admin') {
            // 1. Try Admin (User) ONLY
            $user = User::where('username', $request->username)->first();

            if ($user && Hash::check($request->password, $user->password)) {
                $token = $user->createToken('auth_token')->plainTextToken;
                return response()->json([
                    'message' => 'تم تسجيل الدخول بنجاح (ادمن)',
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $user,
                    'role' => 'admin'
                ]);
            }
        } elseif ($type === 'lecturer') {
            // 2. Try Lecturer ONLY
            $lecturer = \App\Models\Lecturer::where('username', $request->username)->first();

            if ($lecturer && Hash::check($request->password, $lecturer->password)) {
                $token = $lecturer->createToken('auth_token')->plainTextToken;
                return response()->json([
                    'message' => 'تم تسجيل الدخول بنجاح (تدريسي)',
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $lecturer,
                    'role' => 'lecturer'
                ]);
            }
        }

        // 3. Fail
        throw ValidationException::withMessages([
            'username' => ['بيانات الدخول غير صحيحة.'],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح']);
    }

    public function user(Request $request)
    {
        return $request->user();
    }
}
