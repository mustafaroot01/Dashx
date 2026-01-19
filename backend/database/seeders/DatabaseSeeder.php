<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        // 1. Study Types
        $studyTypes = ['صباحي', 'مسائي'];
        foreach ($studyTypes as $type) {
            \App\Models\StudyType::firstOrCreate(['name' => $type]);
        }

        // 2. Stages (Match existing STG codes)
        $stages = [
            ['name' => 'المرحلة الاولى', 'code' => 'STG1'],
            ['name' => 'المرحلة الثانية', 'code' => 'STG2'],
            ['name' => 'المرحلة الثالثة', 'code' => 'STG3'],
            ['name' => 'المرحلة الرابعة', 'code' => 'STG4'],
        ];
        foreach ($stages as $stage) {
            \App\Models\Stage::firstOrCreate(
                ['code' => $stage['code']],
                ['name' => $stage['name']]
            );
        }

        // 3. Groups
        $groups = ['A', 'B', 'C', 'D'];
        foreach ($groups as $symbol) {
            \App\Models\Group::firstOrCreate(
                ['symbol' => $symbol],
                []
            );
        }

        // 4. Create 100 dummy students
        \App\Models\Student::factory(100)->create();
    }
}
