<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>قائمة المقررات الدراسية</title>
    <style>
        body {
            font-family: 'dejavu sans', sans-serif;
            text-align: right;
            direction: rtl;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>قائمة المقررات الدراسية</h1>
        <p>تاريخ التصدير: {{ date('Y-m-d') }}</p>
    </div>

    @if($filterInfo)
    <div class="meta-info">
        <p><strong>عوامل التصفية:</strong> {{ $filterInfo }}</p>
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>اسم المادة</th>
                <th>رمز المادة</th>
                <th>المرحلة الدراسية</th>
                <th>النوع</th>
            </tr>
        </thead>
        <tbody>
            @foreach($courses as $index => $course)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $course->name }}</td>
                <td>{{ $course->code }}</td>
                <td>{{ $course->stage ? $course->stage->name : 'غير محدد' }}</td>
                <td>
                    @switch($course->type)
                        @case('theory') نظري @break
                        @case('practical') عملي @break
                        @case('both') نظري وعملي @break
                        @default {{ $course->type }}
                    @endswitch
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
