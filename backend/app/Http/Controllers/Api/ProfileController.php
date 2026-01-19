<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class ProfileController extends Controller
{
    /**
     * Update user profile information (Name, Email, Avatar).
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $isLecturer = $user instanceof \App\Models\Lecturer;

        $rules = [
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|max:2048',
        ];

        if ($isLecturer) {
            $rules['username'] = 'required|string|max:255|unique:lecturers,username,' . $user->id;
        } else {
            $rules['username'] = 'required|string|max:255|unique:users,username,' . $user->id;
        }

        $validated = $request->validate($rules);

        if ($request->hasFile('image')) {
            $imageColumn = $isLecturer ? 'image_path' : 'profile_photo_path';
            
            // Delete old image if exists
            if ($user->$imageColumn) {
                Storage::disk('public')->delete($user->$imageColumn);
            }
            $path = $request->file('image')->store('avatars', 'public');
            $user->$imageColumn = $path;
        }

        if ($isLecturer) {
            $user->full_name = $validated['name'];
        } else {
            $user->name = $validated['name'];
        }
        
        $user->username = $validated['username'];
        $user->save();

        \App\Services\ActivityLogger::log('update', 'Updated profile information', $user);

        return response()->json([
            'message' => 'تم تحديث الملف الشخصي بنجاح',
            'user' => $user,
        ]);
    }

    /**
     * Update user password.
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['كلمة المرور الحالية غير صحيحة.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        \App\Services\ActivityLogger::log('update', 'Changed password', $user);

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح',
        ]);
    }
}
