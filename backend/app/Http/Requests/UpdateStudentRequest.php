<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('student'); // Get the ID from the route parameter
        
        return [
            'code' => 'required|string|unique:students,code,' . $id,
            'full_name' => 'required|string',
            'stage_id' => 'required|exists:stages,id',
            'study_type_id' => 'required|exists:study_types,id',
            'group_id' => 'required|exists:groups,id',
            'image' => 'nullable|image|max:2048',
            'gender' => 'required|in:male,female',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
        ];
    }
}
