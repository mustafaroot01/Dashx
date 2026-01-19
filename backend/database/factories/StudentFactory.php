<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Stage;
use App\Models\Group;
use App\Models\StudyType;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'code' => 'STU' . fake()->unique()->numberBetween(1000, 9999),
            'image_path' => null, // Optional: could put a placeholder path
            'phone_number' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'gender' => fake()->randomElement(['male', 'female']),
            'stage_id' => Stage::inRandomOrder()->first()->id ?? Stage::factory(),
            'group_id' => Group::inRandomOrder()->first()->id ?? Group::factory(),
            'study_type_id' => StudyType::inRandomOrder()->first()->id ?? StudyType::factory(),
        ];
    }
}
