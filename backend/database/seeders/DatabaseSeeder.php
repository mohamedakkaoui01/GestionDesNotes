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
            'Seconde Technologique',
            'Première S',
            'Première ES',
            'Première L',
            'Première STI2D',
            'Première STMG',
            'Terminale S',
            'Terminale ES',
            'Terminale L',
            'Terminale STI2D',
            'Terminale STMG'
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
            'Physique-Chimie',
            'Sciences de la Vie et de la Terre',
            'Français',
            'Philosophie',
            'Histoire-Géographie',
            'Anglais',
            'Espagnol',
            'Éducation Physique et Sportive',
            'Sciences Économiques et Sociales',
            'Littérature',
            'Sciences de l\'Ingénieur',
            'Numérique et Sciences Informatiques',
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
            ['Pierre', 'Dupont', ['Mathématiques', 'Physique-Chimie']],
            ['Marie', 'Martin', ['Français', 'Philosophie']],
            ['Jean', 'Durand', ['Histoire-Géographie', 'Enseignement Moral et Civique']],
            ['Sophie', 'Bernard', ['Anglais', 'Espagnol']],
            ['Thomas', 'Petit', ['Sciences de la Vie et de la Terre']],
            ['Camille', 'Robert', ['Sciences Économiques et Sociales']],
            ['Nicolas', 'Richard', ['Éducation Physique et Sportive']],
            ['Laura', 'Durand', ['Sciences de l\'Ingénieur', 'Numérique et Sciences Informatiques']],
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
        $firstNames = ['Lucas', 'Emma', 'Hugo', 'Léa', 'Gabriel', 'Manon', 'Raphaël', 'Chloé', 'Louis', 'Camille'];
        $lastNames = ['Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'Fournier', 'Morel', 'Girard'];

        foreach ($this->classes as $class) {
            $studentCount = $this->faker->numberBetween(15, 30);
            
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
        $gradingPeriods = ['CC1', 'CC2', 'CC3', 'Exam final'];
        $evaluationTypes = ['Devoir', 'Contrôle', 'Examen', 'Projet'];
        
        foreach ($this->students as $student) {
            // For every subject, find the teacher assigned to the student's class
            foreach ($this->subjects as $subjectIndex => $subject) {
                $classId = $student->class_id;
                // Find the teacher assigned to this subject/class
                $teacher = $this->teachers[$subjectIndex % count($this->teachers)];
                // Create a grade for each grading period
                foreach ($gradingPeriods as $period) {
                    try {
                        Grade::create([
                            'student_id' => $student->id,
                            'teacher_id' => $teacher->id,
                            'subject_id' => $subject->id,
                            'academic_year_id' => $this->academicYears[0]->id,
                            'grade' => round($this->faker->randomFloat(2, 0, 20), 2),
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