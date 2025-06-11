<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\AcademicYear;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Grade;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    private $faker;
    private $academicYears = [];
    private $classes = [];
    private $subjects = [];
    private $teachers = [];
    private $students = [];

    public function __construct()
    {
        $this->faker = Faker::create('fr_FR');
    }

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->createAcademicYears();
        $this->createAdminUser();
        $this->createClasses();
        $this->createSubjects();
        $this->createTeachers();
        $this->createStudents();
        $this->assignSubjectsToTeachers();
        $this->createGrades();
    }

    private function createAcademicYears()
    {
        $this->academicYears[] = AcademicYear::create(['label' => '2024-2025']);
    }

    private function createAdminUser()
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
    }

    private function createClasses()
    {
        $classNames = [
            'Seconde Générale',
            'Première S',
            'Terminale ES'
        ];

        foreach ($classNames as $className) {
            $this->classes[] = SchoolClass::create([
                'name' => $className
            ]);
        }
    }

    private function createSubjects()
    {
        $subjectNames = [
            'Mathématiques',
            'Français',
            'Anglais',
            'Histoire-Géographie',
            'Sciences Économiques et Sociales'
        ];

        foreach ($subjectNames as $name) {
            $this->subjects[] = Subject::create([
                'name' => $name
            ]);
        }
    }

    private function createTeachers()
    {
        $teacherData = [
            ['Pierre', 'Dupont', ['Mathématiques']],
            ['Marie', 'Martin', ['Français']],
            ['Jean', 'Durand', ['Histoire-Géographie']],
            ['Sophie', 'Bernard', ['Anglais']],
            ['Camille', 'Robert', ['Sciences Économiques et Sociales']],
        ];

        foreach ($teacherData as $index => $data) {
            $user = User::create([
                'name' => "$data[0] $data[1]",
                'email' => strtolower("$data[0].$data[1]@example.com"),
                'password' => Hash::make('password'),
                'role' => 'enseignant',
            ]);

            $this->teachers[] = Teacher::create(['user_id' => $user->id]);
        }
    }

    private function createStudents()
    {
        $firstNames = ['Lucas', 'Emma', 'Hugo', 'Léa', 'Gabriel'];
        $lastNames = ['Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre'];

        foreach ($this->classes as $class) {
            $studentCount = 5; // Fixed number of students per class
            
            for ($i = 0; $i < $studentCount; $i++) {
                $firstName = $this->faker->randomElement($firstNames);
                $lastName = $this->faker->randomElement($lastNames);
                
                // Create a temporary user to get the next ID
                $latestUser = User::latest('id')->first();
                $nextId = $latestUser ? $latestUser->id + 1 : 1;
                
                $user = User::create([
                    'name' => "$firstName $lastName",
                    'email' => strtolower("$firstName.$lastName" . $nextId . '@example.com'),
                    'password' => Hash::make('password'),
                    'role' => 'étudiant',
                ]);

                $this->students[] = Student::create([
                    'user_id' => $user->id,
                    'class_id' => $class->id
                ]);
            }
        }
    }

    private function assignSubjectsToTeachers()
    {
        // Assign every subject to every class, using teachers in round-robin
        $teacherCount = count($this->teachers);
        foreach ($this->subjects as $subjectIndex => $subject) {
            foreach ($this->classes as $class) {
                $teacher = $this->teachers[$subjectIndex % $teacherCount];
                // Attach subject to teacher/class if not already assigned
                $alreadyAssigned = \DB::table('teacher_subject')
                    ->where('subject_id', $subject->id)
                    ->where('class_id', $class->id)
                    ->exists();
                if (!$alreadyAssigned) {
                    try {
                        $teacher->subjects()->attach($subject->id, [
                            'class_id' => $class->id
                        ]);
                    } catch (\Exception $e) {
                        continue;
                    }
                }
            }
        }
    }

    private function isSubjectSuitableForClass($subject, $class)
    {
        $subjectName = strtolower($subject->name);
        $className = strtolower($class->name);

        // General subjects for all classes
        $generalSubjects = [
            'français', 'anglais', 'histoire', 'eps', 'éducation physique', 'sportive',
            'anglais', 'espagnol', 'allemand', 'italien', 'langue', 'philosophie'
        ];

        // Check general subjects
        foreach ($generalSubjects as $generalSubject) {
            if (str_contains($subjectName, $generalSubject)) {
                return true;
            }
        }

        // Check specific class types
        if (str_contains($className, 's') && (str_contains($subjectName, 'math') || 
            str_contains($subjectName, 'physique') || 
            str_contains($subjectName, 'svt') || 
            str_contains($subjectName, 'sciences de la vie'))) {
            return true;
        }

        if ((str_contains($className, 'es') || str_contains($className, 'économique')) && 
            (str_contains($subjectName, 'sciences économiques') || 
             str_contains($subjectName, 'ses') ||
             str_contains($subjectName, 'math'))) {
            return true;
        }

        if (str_contains($className, 'l') && 
            (str_contains($subjectName, 'littérature') || 
             str_contains($subjectName, 'philo') ||
             str_contains($subjectName, 'langue'))) {
            return true;
        }

        if ((str_contains($className, 'sti') || str_contains($className, 'technologique')) && 
            (str_contains($subjectName, 'ingénieur') || 
             str_contains($subjectName, 'informatique') ||
             str_contains($subjectName, 'technologique') ||
             str_contains($subjectName, 'sciences de l\'ingénieur'))) {
            return true;
        }

        if (str_contains($className, 'stmg') && 
            (str_contains($subjectName, 'gestion') || 
             str_contains($subjectName, 'management') ||
             str_contains($subjectName, 'droit') ||
             str_contains($subjectName, 'économie'))) {
            return true;
        }

        return false;
    }

    private function createGrades()
    {
        $gradingPeriods = ['CC1', 'CC2', 'Exam final']; // Reduced number of grading periods
        
        foreach ($this->students as $student) {
            foreach ($this->subjects as $subjectIndex => $subject) {
                $classId = $student->class_id;
                $teacher = $this->teachers[$subjectIndex % count($this->teachers)];
                
                foreach ($gradingPeriods as $period) {
                    try {
                        // Generate grade between 0 and 20 with exactly 2 decimal places
                        $grade = number_format($this->faker->randomFloat(2, 0, 20), 2, '.', '');
                        
                        Grade::create([
                            'student_id' => $student->id,
                            'teacher_id' => $teacher->id,
                            'subject_id' => $subject->id,
                            'academic_year_id' => $this->academicYears[0]->id,
                            'grade' => $grade,
                            'grading_period' => $period,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } catch (\Exception $e) {
                        continue;
                    }
                }
            }
        }
    }
}