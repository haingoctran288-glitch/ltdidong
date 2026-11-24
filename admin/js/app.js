// UniStudent Admin Dashboard - JavaScript Controller

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCharts();
  initQRCode();
  initFilterAndSearch();
  initScheduleViews();
  initAddScheduleModal();
});

// =========================================================================
// 1. Navigation & Tab Switching
// =========================================================================
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link-custom[data-target]');
  const sections = document.querySelectorAll('.page-section');
  const pageTitle = document.getElementById('current-page-title');

  const titleMap = {
    'section-dashboard': 'Tổng quan hệ thống',
    'section-users': 'Quản lý người dùng & Sinh viên',
    'section-schedules': 'Quản lý Lịch học & Lịch thi',
    'section-attendance': 'Quản lý Điểm danh & Tạo mã QR',
    'section-lost-found': 'Quản lý Tin tìm đồ thất lạc',
    'section-market': 'Quản lý Chợ sinh viên nội bộ'
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(sec => sec.classList.add('d-none'));
      const activeSection = document.getElementById(targetId);
      if (activeSection) {
        activeSection.classList.remove('d-none');
      }

      if (pageTitle && titleMap[targetId]) {
        pageTitle.innerText = titleMap[targetId];
      }

      const sidebar = document.getElementById('sidebar');
      if (window.innerWidth < 992 && sidebar) {
        sidebar.classList.remove('show');
      }
    });
  });

  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
  }
}

// =========================================================================
// 2. Dashboard Analytics Charts (Chart.js)
// =========================================================================
let attendanceChart = null;
let lostFoundChart = null;

function initCharts() {
  const attCanvas = document.getElementById('attendanceWeeklyChart');
  if (attCanvas) {
    const ctx = attCanvas.getContext('2d');
    attendanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
        datasets: [{
          label: 'Tỷ lệ sinh viên có mặt (%)',
          data: [96.5, 94.2, 91.8, 97.0, 93.5, 89.2],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: '#4f46e5',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 80,
            max: 100,
            ticks: { callback: (val) => val + '%' }
          }
        }
      }
    });
  }

  const categoryCanvas = document.getElementById('categoryPieChart');
  if (categoryCanvas) {
    const ctx2 = categoryCanvas.getContext('2d');
    lostFoundChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Ví / Thẻ SV', 'Điện thoại / Laptop', 'Chìa khóa / Xe', 'Đồ cá nhân khác'],
        datasets: [{
          data: [42, 28, 18, 12],
          backgroundColor: ['#4f46e5', '#0ea5e9', '#f59e0b', '#94a3b8'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// =========================================================================
// 3. Dynamic QR Code Generator for Attendance
// =========================================================================
let qrCountdownInterval = null;
let qrCodeInstance = null;
let currentRemainingTime = 30;

function initQRCode() {
  const qrTarget = document.getElementById('qrcode-display');
  const timerDisplay = document.getElementById('qr-countdown-text');
  const progressBar = document.getElementById('qr-progress-bar');
  const btnRefreshQR = document.getElementById('btn-refresh-qr');

  if (!qrTarget) return;

  function generateNewQR() {
    const timestamp = Date.now();
    const token = 'ATTEND_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_' + timestamp;
    
    qrTarget.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
      qrCodeInstance = new QRCode(qrTarget, {
        text: `unistudent://checkin?code=${token}`,
        width: 190,
        height: 190,
        colorDark: '#1e1b4b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }

    currentRemainingTime = 30;
    updateTimer();
  }

  function updateTimer() {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = setInterval(() => {
      currentRemainingTime--;
      if (timerDisplay) {
        timerDisplay.innerText = `${currentRemainingTime}s`;
      }
      if (progressBar) {
        const percent = (currentRemainingTime / 30) * 100;
        progressBar.style.width = `${percent}%`;
        if (percent < 30) {
          progressBar.className = 'progress-bar bg-danger';
        } else if (percent < 60) {
          progressBar.className = 'progress-bar bg-warning';
        } else {
          progressBar.className = 'progress-bar bg-success';
        }
      }

      if (currentRemainingTime <= 0) {
        generateNewQR();
        simulateRealtimeCheckin();
      }
    }, 1000);
  }

  if (btnRefreshQR) {
    btnRefreshQR.addEventListener('click', () => {
      generateNewQR();
      showToast('Đã làm mới mã QR điểm danh!');
    });
  }

  generateNewQR();
}

function simulateRealtimeCheckin() {
  const tableBody = document.getElementById('live-attendance-list');
  if (!tableBody) return;

  const mockStudents = [
    { id: '21050189', name: 'Nguyễn Văn An', class: 'D19-CNTT01', room: 'A2-301' },
    { id: '21050234', name: 'Trần Thị Mai', class: 'D19-CNTT02', room: 'A2-301' },
    { id: '21050302', name: 'Lê Hoàng Nam', class: 'D19-CNTT01', room: 'A2-301' },
    { id: '21050411', name: 'Phạm Minh Đức', class: 'D19-CNTT03', room: 'A2-301' }
  ];

  const randomStudent = mockStudents[Math.floor(Math.random() * mockStudents.length)];
  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const row = document.createElement('tr');
  row.className = 'table-success fade-in-row';
  row.innerHTML = `
    <td><strong>${randomStudent.id}</strong></td>
    <td>
      <div class="d-flex align-items-center gap-2">
        <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:28px;height:28px;font-size:11px;font-weight:700">
          ${randomStudent.name.charAt(0)}
        </div>
        <span>${randomStudent.name}</span>
      </div>
    </td>
    <td>${randomStudent.class}</td>
    <td>${timeString}</td>
    <td><span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle-fill me-1"></i>Hợp lệ (QR)</span></td>
  `;

  tableBody.insertBefore(row, tableBody.firstChild);
  if (tableBody.children.length > 8) {
    tableBody.removeChild(tableBody.lastChild);
  }
}

// =========================================================================
// 4. Interactive Search and Action Filters
// =========================================================================
function initFilterAndSearch() {
  const userSearchInput = document.getElementById('userSearchInput');
  if (userSearchInput) {
    userSearchInput.addEventListener('keyup', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#userTableBody tr');
      rows.forEach(r => {
        const text = r.innerText.toLowerCase();
        r.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

// =========================================================================
// 5. MOCK DATA & CLIENT-SIDE SCHEDULE MANAGEMENT
// =========================================================================

const MOCK_DATA = {
  departments: [
    { id: 'cntt', name: 'Khoa Công Nghệ Thông Tin' },
    { id: 'kt', name: 'Khoa Kinh Tế & Quản Trị' },
    { id: 'nn', name: 'Khoa Ngoại Ngữ' }
  ],
  courses: {
    cntt: [
      'Thực hành lập trình di động',
      'Lập trình Java nâng cao (Spring Boot)',
      'Kiến trúc & Thiết kế Phần mềm',
      'Nhập môn lập trình',
      'Cấu trúc dữ liệu & Giải thuật',
      'Hệ quản trị cơ sở dữ liệu'
    ],
    kt: [
      'Nguyên lý Kế toán',
      'Quản trị Marketing',
      'Kinh tế Vi mô',
      'Tài chính Doanh nghiệp'
    ],
    nn: [
      'Tiếng Anh Chuyên ngành CNTT',
      'Tiếng Anh Giao tiếp 3',
      'Kỹ năng Viết học thuật'
    ]
  },
  teachers: {
    cntt: [
      'Nguyễn Văn A',
      'TS. Nguyễn Văn B',
      'ThS. Nguyễn Văn C',
      'TS. Nguyễn Văn D',
      'TS. Nguyễn Văn E'
    ],
    kt: [
      'ThS. Trần Thị Lan',
      'TS. Lê Hoàng Mai',
      'ThS. Đỗ Văn Hưng'
    ],
    nn: [
      'ThS. Phạm Thùy Linh',
      'Cô Jennifer Wilson',
      'ThS. Vũ Ngọc Bích'
    ]
  },
  defaultTeachers: {
    'Thực hành lập trình di động': 'Nguyễn Văn A',
    'Lập trình Java nâng cao (Spring Boot)': 'TS. Nguyễn Văn B',
    'Kiến trúc & Thiết kế Phần mềm': 'ThS. Nguyễn Văn C',
    'Nhập môn lập trình': 'TS. Nguyễn Văn D',
    'Cấu trúc dữ liệu & Giải thuật': 'TS. Nguyễn Văn E',
    'Hệ quản trị cơ sở dữ liệu': 'TS. Nguyễn Văn B'
  },
  buildings: [
    { id: 'toa_a', name: 'Tòa Khu A' },
    { id: 'toa_b', name: 'Tòa Khu B' },
    { id: 'toa_c', name: 'Tòa Khu C' },
    { id: 'toa_d', name: 'Tòa Khu D' }
  ],
  rooms: {
    toa_a: [
      { name: 'A205' },
      { name: 'A301' },
      { name: 'A305' },
      { name: 'A404' }
    ],
    toa_b: [
      { name: 'B102' },
      { name: 'B203' },
      { name: 'B204' }
    ],
    toa_c: [
      { name: 'C101' },
      { name: 'C102' },
      { name: 'C201' }
    ],
    toa_d: [
      { name: 'D102' },
      { name: 'D207' }
    ]
  }
};

// Main In-Memory Schedules Dataset
let schedulesData = [
  {
    id: 'SCH_001',
    type: 'regular_class',
    course: 'Thực hành lập trình di động',
    dept: 'Khoa Công Nghệ Thông Tin',
    teacher: 'Nguyễn Văn A',
    room: 'D207', building: 'Tòa Khu D',
    dayKey: 'th4',
    dayLabel: 'Thứ 4',
    dateStr: '2026-11-18',
    periods: '6 - 10',
    timeRange: '12:30 - 16:30',
    dateRange: '16-11-2026 đến 15-01-2027',
    status: 'Đang diễn ra'
  },
  {
    id: 'SCH_002',
    type: 'regular_class',
    course: 'Lập trình Java nâng cao (Spring Boot)',
    dept: 'Khoa Công Nghệ Thông Tin',
    teacher: 'TS. Nguyễn Văn B',
    room: 'A205', building: 'Tòa Khu A',
    dayKey: 'th4',
    dayLabel: 'Thứ 4',
    dateStr: '2026-11-18',
    periods: '1 - 4',
    timeRange: '07:30 - 11:30',
    dateRange: '16-11-2026 đến 15-01-2027',
    status: 'Sắp bắt đầu'
  },
  {
    id: 'SCH_003',
    type: 'regular_class',
    course: 'Kiến trúc & Thiết kế Phần mềm',
    dept: 'Khoa Công Nghệ Thông Tin',
    teacher: 'ThS. Nguyễn Văn C',
    room: 'B204', building: 'Tòa Khu B',
    dayKey: 'th3',
    dayLabel: 'Thứ 3',
    dateStr: '2026-11-17',
    periods: '1 - 3',
    timeRange: '07:30 - 09:30',
    dateRange: '16-11-2026 đến 15-01-2027',
    status: 'Đã hoàn thành'
  },
  {
    id: 'SCH_004',
    type: 'exam',
    course: 'Nhập môn lập trình',
    dept: 'Khoa Công Nghệ Thông Tin',
    teacher: 'TS. Nguyễn Văn D (Giám thị)',
    room: 'A404', building: 'Tòa Khu A',
    dayKey: 'th5',
    dayLabel: 'Thứ 5',
    dateStr: '2026-11-19',
    periods: 'Ca thi',
    timeRange: '12h30',
    examFormat: 'Tự luận',
    examDuration: '90 phút',
    examGroup: 'Nhóm 2 (Sĩ số: 39 - 76)',
    status: 'Sắp thi'
  },
  {
    id: 'SCH_005',
    type: 'canceled',
    course: 'Triết học Mác-Lênin',
    dept: 'Khoa Lý Luận Chính Trị',
    teacher: 'TS. Nguyễn Văn E',
    room: 'C102', building: 'Tòa Khu C',
    dayKey: 'th6',
    dayLabel: 'Thứ 6',
    dateStr: '2026-11-20',
    periods: '1 - 4',
    timeRange: '07:30 - 11:30',
    status: 'Tạm nghỉ (bù sau)',
    canceledReason: 'Giảng viên bận lịch công tác đào tạo. Lớp sẽ bố trí lịch học bù vào tuần 48.'
  }
];

let currentSelectedDayKey = 'th4';
let currentSelectedDayLabel = 'Th 4, 18/11';
let currentSelectedYear = 2026;
let currentSelectedMonth = 11;

// Period calculation helper
function calculatePeriodTime(fromP, toP) {
  const fromNum = parseInt(fromP, 10);
  const toNum = parseInt(toP, 10);

  const startMap = {
    1: '07:30', 2: '08:15', 3: '09:00',
    4: '09:45', 5: '10:30', 6: '12:30',
    7: '13:15', 8: '14:00', 9: '14:45',
    10: '15:45', 11: '17:30', 12: '18:15', 13: '19:00'
  };
  const endMap = {
    1: '08:15', 2: '09:00', 3: '09:30',
    4: '10:30', 5: '11:15', 6: '13:15',
    7: '14:00', 8: '14:30', 9: '15:30',
    10: '16:30', 11: '18:15', 12: '19:00', 13: '19:45'
  };

  const start = startMap[fromNum] || '07:30';
  const end = endMap[toNum] || '11:30';
  return `${start} - ${end}`;
}

function convertDayNameToKey(dayName) {
  const map = {
    'Thứ 2': 'th2',
    'Thứ 3': 'th3',
    'Thứ 4': 'th4',
    'Thứ 5': 'th5',
    'Thứ 6': 'th6',
    'Thứ 7': 'th7',
    'Chủ Nhật': 'cn'
  };
  return map[dayName] || 'th4';
}

function convertDateToDayKey(dateStr) {
  if (!dateStr) return 'th4';
  const d = new Date(dateStr);
  const day = d.getDay();
  const map = { 1: 'th2', 2: 'th3', 3: 'th4', 4: 'th5', 5: 'th6', 6: 'th7', 0: 'cn' };
  return map[day] || 'th4';
}

function convertDayKeyToLabel(key) {
  const map = {
    'th2': 'Th 2, 16/11',
    'th3': 'Th 3, 17/11',
    'th4': 'Th 4, 18/11',
    'th5': 'Th 5, 19/11',
    'th6': 'Th 6, 20/11',
    'th7': 'Th 7, 21/11',
    'cn': 'CN, 22/11'
  };
  return map[key] || 'Th 4, 18/11';
}

function formatVNStandardDate(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  // If YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const d = ymd[3].padStart(2, '0');
    const m = ymd[2].padStart(2, '0');
    return `${d}-${m}-${ymd[1]}`;
  }
  // If DD/MM/YYYY or DD-MM-YYYY
  return clean.replace(/\//g, '-');
}

function formatDisplayDateRange(range) {
  if (!range) return '';
  // handles "2026-11-16 - 2026-12-16", "16/11/2026 - 15/01/2027", "16-11-2026 đến 16-12-2026"
  if (range.includes('đến')) {
    const parts = range.split('đến').map(p => p.trim());
    return `${formatVNStandardDate(parts[0])} đến ${formatVNStandardDate(parts[1])}`;
  }
  if (range.includes(' - ')) {
    const parts = range.split(' - ').map(p => p.trim());
    return `${formatVNStandardDate(parts[0])} đến ${formatVNStandardDate(parts[1])}`;
  }
  return range;
}

// =========================================================================
// 6. RENDER SCHEDULES UI (Week, Table, Day, Month)
// =========================================================================

function renderScheduleUI() {
  // A. Update Week Day Strip Indicators (Yellow for class, Green for exam, Red for canceled)
  const weekDayKeys = ['th2', 'th3', 'th4', 'th5', 'th6', 'th7', 'cn'];
  weekDayKeys.forEach(key => {
    const dayItem = document.querySelector(`.week-day-item[data-day-key="${key}"]`);
    if (!dayItem) return;

    dayItem.classList.remove('has-schedule-class', 'has-schedule-exam', 'has-schedule-canceled');

    const daySchedules = schedulesData.filter(s => s.dayKey === key);
    if (daySchedules.length > 0) {
      if (daySchedules.some(s => s.type === 'canceled')) {
        dayItem.classList.add('has-schedule-canceled'); // Gạch đỏ
      } else if (daySchedules.some(s => s.type === 'exam')) {
        dayItem.classList.add('has-schedule-exam'); // Gạch xanh lá
      } else {
        dayItem.classList.add('has-schedule-class'); // Gạch vàng
      }
    }
  });

  // B. Render Week Cards for Active Day
  const weekCardsContainer = document.getElementById('weekCardsContainer');
  const weekTimelineBadge = document.getElementById('weekTimelineBadge');
  if (weekTimelineBadge) {
    weekTimelineBadge.innerText = currentSelectedDayLabel;
  }

  if (weekCardsContainer) {
    const activeSchedules = schedulesData.filter(s => s.dayKey === currentSelectedDayKey);
    if (activeSchedules.length === 0) {
      weekCardsContainer.innerHTML = `
        <div class="text-center py-5 bg-light rounded-3 border">
          <i class="bi bi-cup-hot text-muted fs-1 mb-2 d-block"></i>
          <h6 class="text-secondary fw-bold">Không có lịch học hoặc lịch thi trong ngày này</h6>
          <small class="text-muted">Sinh viên được nghỉ hoặc tham gia hoạt động ngoại khóa tự do.</small>
        </div>
      `;
    } else {
      weekCardsContainer.innerHTML = activeSchedules.map(s => renderScheduleCardHTML(s)).join('');
    }
  }

  // C. Render Table View Rows (Sắp xếp cân đối, không có Lớp học phần)
  const tableBody = document.getElementById('scheduleTableBody');
  if (tableBody) {
    tableBody.innerHTML = schedulesData.map(s => {
      let badgeType = '';
      if (s.type === 'exam') {
        badgeType = '<span class="badge bg-success">Lịch thi</span>';
      } else if (s.type === 'canceled') {
        badgeType = '<span class="badge bg-danger">Lịch hủy</span>';
      } else {
        badgeType = '<span class="badge bg-warning text-dark">Lịch học</span>';
      }

      return `
        <tr>
          <td>${badgeType}</td>
          <td><strong>${s.course}</strong></td>
          <td><span class="badge bg-light text-dark border">${s.dept || 'Khoa CNTT'}</span></td>
          <td><div class="fw-semibold">${s.teacher}</div></td>
          <td><i class="bi bi-geo-alt-fill text-danger me-1"></i>${s.room}</td>
          <td>${s.dayLabel || ''} (${s.timeRange})</td>
          <td><span class="badge bg-success-subtle text-success">${s.status || 'Hoạt động'}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-light text-primary" title="Chỉnh sửa"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-light text-danger" title="Xóa lịch" onclick="deleteSchedule('${s.id}')"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // D. Render Day View Cards
  const dayCardsContainer = document.getElementById('dayCardsContainer');
  const dayTimelineBadge = document.getElementById('dayTimelineBadge');
  const dayViewTitleDate = document.getElementById('dayViewTitleDate');
  const dayViewCountSubtitle = document.getElementById('dayViewCountSubtitle');

  if (dayCardsContainer) {
    const todaySchedules = schedulesData.filter(s => s.dayKey === currentSelectedDayKey);
    if (dayTimelineBadge) dayTimelineBadge.innerText = currentSelectedDayLabel;
    if (dayViewTitleDate) dayViewTitleDate.innerText = currentSelectedDayLabel;
    if (dayViewCountSubtitle) dayViewCountSubtitle.innerText = `Tổng cộng ${todaySchedules.length} ca học / thi`;

    if (todaySchedules.length === 0) {
      dayCardsContainer.innerHTML = `
        <div class="text-center py-5 bg-light rounded-3 border">
          <i class="bi bi-calendar-x text-muted fs-1 mb-2 d-block"></i>
          <h6 class="text-secondary fw-bold">Không có lịch học hoặc lịch thi trong ngày này</h6>
        </div>
      `;
    } else {
      dayCardsContainer.innerHTML = todaySchedules.map(s => renderScheduleCardHTML(s)).join('');
    }
  }

  // E. Update Month View Dots
  updateMonthDots();
}

function renderScheduleCardHTML(s) {
  if (s.type === 'exam') {
    return `
      <div class="schedule-item-card type-exam">
        <div class="schedule-card-inner">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="badge-schedule-exam"><i class="bi bi-circle-fill"></i> Lịch thi</span>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-light text-secondary p-1 px-2" title="Chỉnh sửa"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-light text-danger p-1 px-2" title="Xóa lịch" onclick="deleteSchedule('${s.id}')"><i class="bi bi-trash"></i></button>
              <i class="bi bi-calendar3 text-muted fs-5 ms-1"></i>
            </div>
          </div>
          <h5 class="schedule-course-title">${s.course}</h5>
          <div class="row g-2">
            <div class="col-md-6">
              <div class="schedule-info-row"><span class="schedule-info-label">Giờ thi:</span><span class="schedule-info-val text-primary fw-bold">${s.timeRange}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Thời gian thi:</span><span class="schedule-info-val">${s.examDuration || '90 phút'}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Hình thức thi:</span><span class="schedule-info-val">${s.examFormat || 'Tự luận'}</span></div>
            </div>
            <div class="col-md-6">
              <div class="schedule-info-row"><span class="schedule-info-label">Phòng thi:</span><span class="schedule-info-val text-primary"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${s.room}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Cán bộ coi thi:</span><span class="schedule-info-val">${s.teacher}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Nhóm / Sĩ số:</span><span class="schedule-info-val">${s.examGroup || 'Toàn bộ sinh viên'}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (s.type === 'canceled') {
    return `
      <div class="schedule-item-card type-canceled">
        <div class="schedule-card-inner">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="badge-schedule-canceled"><i class="bi bi-x-circle-fill"></i> Lịch bị hủy (Nghỉ / Bù)</span>
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle">Thông báo khẩn</span>
          </div>
          <h5 class="schedule-course-title text-muted text-decoration-line-through">${s.course}</h5>
          <div class="alert alert-danger py-2 px-3 mb-2 small d-flex align-items-center gap-2">
            <i class="bi bi-exclamation-triangle-fill fs-6"></i>
            <span><strong>Lớp tạm nghỉ:</strong> ${s.canceledReason || 'Giảng viên bận lịch công tác đột xuất.'}</span>
          </div>
          <div class="row g-2 text-muted">
            <div class="col-md-6">
              <div class="schedule-info-row"><span class="schedule-info-label">Tiết dự kiến:</span><span class="schedule-info-val">${s.periods}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Giờ:</span><span class="schedule-info-val">${s.timeRange}</span></div>
            </div>
            <div class="col-md-6">
              <div class="schedule-info-row"><span class="schedule-info-label">Phòng:</span><span class="schedule-info-val">${s.room}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Giảng viên:</span><span class="schedule-info-val">${s.teacher}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Regular Class
  return `
    <div class="schedule-item-card type-class">
      <div class="schedule-card-inner">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="badge-schedule-class"><i class="bi bi-circle-fill"></i> Lịch học</span>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-light text-primary p-1 px-2" title="Điểm danh QR" onclick="document.querySelector('[data-target=\\'section-attendance\\']').click()"><i class="bi bi-qr-code-scan me-1"></i> Điểm danh</button>
            <button class="btn btn-sm btn-light text-secondary p-1 px-2" title="Chỉnh sửa"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-light text-danger p-1 px-2" title="Xóa lịch" onclick="deleteSchedule('${s.id}')"><i class="bi bi-trash"></i></button>
            <i class="bi bi-calendar3 text-muted fs-5 ms-1"></i>
          </div>
        </div>

        <h5 class="schedule-course-title">${s.course}</h5>

        <div class="row g-2">
          <div class="col-md-6">
            <div class="schedule-info-row"><span class="schedule-info-label">Tiết:</span><span class="schedule-info-val">${s.periods}</span></div>
            <div class="schedule-info-row"><span class="schedule-info-label">Giờ:</span><span class="schedule-info-val">${s.timeRange}</span></div>
          </div>
          <div class="col-md-6">
            <div class="schedule-info-row"><span class="schedule-info-label">Phòng:</span><span class="schedule-info-val text-primary"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${s.room}</span></div>
            <div class="schedule-info-row"><span class="schedule-info-label">Giảng viên:</span><span class="schedule-info-val">${s.teacher}</span></div>
            ${s.dateRange ? `<div class="schedule-info-row"><span class="schedule-info-label">Thời gian:</span><span class="schedule-info-val text-dark">${formatDisplayDateRange(s.dateRange)}</span></div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateMonthDots() {
  const monthCells = document.querySelectorAll('.month-day-cell');
  monthCells.forEach(cell => {
    cell.classList.remove('dot-class', 'dot-exam', 'dot-canceled');
  });

  const dateDots = {
    '11': 'dot-exam',
    '12': 'dot-exam',
    '17': 'dot-class',
    '18': 'dot-class',
    '19': 'dot-exam',
    '20': 'dot-canceled'
  };

  schedulesData.forEach(s => {
    if (s.dateStr) {
      const parts = s.dateStr.split('-');
      if (parts.length === 3 && parseInt(parts[1], 10) === currentSelectedMonth) {
        const dayNum = parseInt(parts[2], 10).toString();
        if (s.type === 'canceled') dateDots[dayNum] = 'dot-canceled';
        else if (s.type === 'exam') dateDots[dayNum] = 'dot-exam';
        else dateDots[dayNum] = 'dot-class';
      }
    }
  });

  monthCells.forEach(cell => {
    const txt = cell.innerText.trim();
    if (dateDots[txt]) {
      cell.classList.add(dateDots[txt]);
    }
  });
}

// Global delete function
window.deleteSchedule = function(id) {
  if (confirm('Bạn có chắc chắn muốn xóa mục lịch này không?')) {
    schedulesData = schedulesData.filter(s => s.id !== id);
    renderScheduleUI();
    showToast('Đã xóa mục lịch thành công!');
  }
};

// =========================================================================
// 7. INITIALIZE SCHEDULE VIEWS (Segmented Tabs & Month-Year Picker)
// =========================================================================

function initScheduleViews() {
  // A. Segmented Switcher [ Ngày | Tuần | Tháng | Dạng bảng ]
  const segmentedBtns = document.querySelectorAll('#scheduleSegmentedNav .nav-btn');
  const subviews = document.querySelectorAll('.schedule-subview');

  if (segmentedBtns.length) {
    segmentedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSubviewId = btn.getAttribute('data-subview');
        segmentedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        subviews.forEach(view => view.classList.add('d-none'));
        const activeView = document.getElementById(targetSubviewId);
        if (activeView) {
          activeView.classList.remove('d-none');
        }
      });
    });
  }

  // B. Month-Year Picker Popup Logic
  const pickerBtn = document.getElementById('monthYearPickerBtn');
  const pickerPopup = document.getElementById('monthYearPickerPopup');
  const pickerYearDisplay = document.getElementById('pickerYearDisplay');
  const prevYearBtn = document.getElementById('prevYearBtn');
  const nextYearBtn = document.getElementById('nextYearBtn');
  const currentMonthYearLabel = document.getElementById('currentMonthYearLabel');
  const monthBtns = document.querySelectorAll('.month-btn-item');

  if (pickerBtn && pickerPopup) {
    pickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pickerPopup.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!pickerPopup.contains(e.target) && e.target !== pickerBtn) {
        pickerPopup.classList.remove('show');
      }
    });

    if (prevYearBtn && nextYearBtn && pickerYearDisplay) {
      prevYearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentSelectedYear--;
        pickerYearDisplay.innerText = currentSelectedYear;
        updateMonthYearDisplay();
      });

      nextYearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentSelectedYear++;
        pickerYearDisplay.innerText = currentSelectedYear;
        updateMonthYearDisplay();
      });
    }

    monthBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        monthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSelectedMonth = parseInt(btn.getAttribute('data-month'), 10);
        updateMonthYearDisplay();
        pickerPopup.classList.remove('show');
        showToast(`Đã chọn tháng ${currentSelectedMonth}, năm ${currentSelectedYear}`);
      });
    });
  }

  function updateMonthYearDisplay() {
    if (currentMonthYearLabel) {
      currentMonthYearLabel.innerText = `tháng ${currentSelectedMonth}, ${currentSelectedYear}`;
    }
    const monthHeader = document.getElementById('monthGridHeaderTitle');
    if (monthHeader) {
      monthHeader.innerText = `Tháng ${currentSelectedMonth}, ${currentSelectedYear}`;
    }
  }

  // C. Week Day Strip click handler
  const weekItems = document.querySelectorAll('.week-day-item');
  weekItems.forEach(item => {
    item.addEventListener('click', () => {
      weekItems.forEach(w => w.classList.remove('active'));
      item.classList.add('active');

      currentSelectedDayKey = item.getAttribute('data-day-key');
      currentSelectedDayLabel = item.getAttribute('data-day-label');

      renderScheduleUI();
    });
  });

  // D. Month Day Cell click handler
  const monthCells = document.querySelectorAll('.month-day-cell');
  monthCells.forEach(cell => {
    cell.addEventListener('click', () => {
      monthCells.forEach(c => c.classList.remove('active-day'));
      cell.classList.add('active-day');
      const dateText = cell.getAttribute('data-date');
      if (dateText) {
        showToast('Đã chọn ngày: ' + dateText);
      }
    });
  });

  // Initial render
  renderScheduleUI();
}

// =========================================================================
// 8. ADD SCHEDULE MODAL: V2 (Không Lớp học phần, Bỏ Học bù, Nhập giờ -> Phút 12h30)
// =========================================================================

function initAddScheduleModal() {
  const form = document.getElementById('formAddSchedule');
  const typeBtns = document.querySelectorAll('.schedule-type-btn');
  const deptSelect = document.getElementById('modalSelectDept');
  const courseSelect = document.getElementById('modalSelectCourse');
  const teacherSelect = document.getElementById('modalSelectTeacher');
  const teacherLabel = document.getElementById('modalLabelTeacher');
  const buildingSelect = document.getElementById('modalSelectBuilding');
  const roomSelect = document.getElementById('modalSelectRoom');

  const timeGroupRegular = document.getElementById('timeGroupRegular');
  const timeGroupSpecific = document.getElementById('timeGroupSpecific');
  const examOnlyFields = document.querySelectorAll('.exam-only-field');

  const regularDaySelect = document.getElementById('modalRegularDay');
  const regularFromPeriod = document.getElementById('modalRegularFromPeriod');
  const regularToPeriod = document.getElementById('modalRegularToPeriod');
  const regularTimeDisplay = document.getElementById('modalRegularTimeDisplay');
  const regularStartDate = document.getElementById('modalRegularStartDate');
  const regularEndDate = document.getElementById('modalRegularEndDate');

  const specificDate = document.getElementById('modalSpecificDate');
  const hourInput = document.getElementById('examHourInput');
  const minuteInput = document.getElementById('examMinuteInput');
  const previewBadge = document.getElementById('examTimeBadgePreview');

  let currentScheduleType = 'regular_class'; // 'regular_class' | 'exam'

  if (!deptSelect || !courseSelect) return;

  // 1. Populate Periods 1..12
  if (regularFromPeriod && regularToPeriod) {
    regularFromPeriod.innerHTML = '';
    regularToPeriod.innerHTML = '';
    for (let p = 1; p <= 12; p++) {
      regularFromPeriod.innerHTML += `<option value="${p}" ${p === 1 ? 'selected' : ''}>Tiết ${p}</option>`;
      regularToPeriod.innerHTML += `<option value="${p}" ${p === 4 ? 'selected' : ''}>Tiết ${p}</option>`;
    }
  }

  // 2. Populate Departments
  deptSelect.innerHTML = MOCK_DATA.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

  // 3. Populate Buildings
  buildingSelect.innerHTML = MOCK_DATA.buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

  // 4. Cascading Updates (Khoa -> Môn học & Giảng viên)
  function updateCoursesAndTeachers() {
    const deptId = deptSelect.value || 'cntt';
    const courses = MOCK_DATA.courses[deptId] || [];
    const teachers = MOCK_DATA.teachers[deptId] || [];

    courseSelect.innerHTML = courses.map(c => `<option value="${c}">${c}</option>`).join('');
    teacherSelect.innerHTML = teachers.map(t => `<option value="${t}">${t}</option>`).join('');

    autoSelectTeacherForCourse();
    triggerConflictCheck();
  }

  function autoSelectTeacherForCourse() {
    const courseName = courseSelect.value;
    const defaultTeacher = MOCK_DATA.defaultTeachers[courseName];
    if (defaultTeacher) {
      teacherSelect.value = defaultTeacher;
    }
    triggerConflictCheck();
  }

  function updateRooms() {
    const buildingId = buildingSelect.value || 'toa_a';
    const rooms = MOCK_DATA.rooms[buildingId] || [];

    roomSelect.innerHTML = rooms.map(r => `
      <option value="${r.name}">${r.name}</option>
    `).join('');

    triggerConflictCheck();
  }

  deptSelect.addEventListener('change', updateCoursesAndTeachers);
  courseSelect.addEventListener('change', autoSelectTeacherForCourse);
  buildingSelect.addEventListener('change', updateRooms);
  teacherSelect.addEventListener('change', triggerConflictCheck);
  roomSelect.addEventListener('change', triggerConflictCheck);

  // 5. Schedule Type Switcher (Chỉ 2 nút: Lịch học định kỳ & Lịch thi)
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentScheduleType = btn.getAttribute('data-type');

      if (currentScheduleType === 'exam') {
        // Chế độ Lịch thi
        teacherLabel.innerHTML = '<i class="bi bi-shield-check me-1 text-success"></i> Cán bộ coi thi / Giám thị <span class="text-danger">*</span>';
        examOnlyFields.forEach(el => el.classList.remove('d-none'));
        timeGroupRegular.classList.add('d-none');
        timeGroupSpecific.classList.remove('d-none');

        // Gợi ý phòng thi tiêu chuẩn
        buildingSelect.value = 'toa_a';
        updateRooms();
        roomSelect.value = 'A404';
      } else {
        // Chế độ Lịch học định kỳ
        teacherLabel.innerHTML = 'Giảng viên phụ trách <span class="text-danger">*</span>';
        examOnlyFields.forEach(el => el.classList.add('d-none'));
        timeGroupRegular.classList.remove('d-none');
        timeGroupSpecific.classList.add('d-none');
      }

      triggerConflictCheck();
    });
  });

  // 6. Time Range Calculation & Sync
  function updateRegularTime() {
    let fromP = parseInt(regularFromPeriod.value, 10);
    let toP = parseInt(regularToPeriod.value, 10);
    if (toP < fromP) {
      regularToPeriod.value = fromP;
      toP = fromP;
    }
    regularTimeDisplay.value = calculatePeriodTime(fromP, toP);
    triggerConflictCheck();
  }

  regularFromPeriod.addEventListener('change', updateRegularTime);
  regularToPeriod.addEventListener('change', updateRegularTime);
  regularDaySelect.addEventListener('change', triggerConflictCheck);

  // 7. Exam Time Input Auto-jump (Nhập 12 rồi tự chuyển qua phút 30 -> 12h30)
  function getFormattedExamTime() {
    if (!hourInput || !minuteInput) return '12h30';
    let h = hourInput.value.replace(/\D/g, '');
    let m = minuteInput.value.replace(/\D/g, '');

    if (!h) h = '12';
    if (!m) m = '30';

    h = h.padStart(2, '0');
    m = m.padStart(2, '0');

    return `${h}h${m}`;
  }

  function updateExamTimeBadge() {
    if (!hourInput || !minuteInput || !previewBadge) return;
    const formatted = getFormattedExamTime();
    previewBadge.innerText = formatted;
    triggerConflictCheck();
  }

  if (hourInput && minuteInput) {
    hourInput.addEventListener('input', () => {
      hourInput.value = hourInput.value.replace(/\D/g, '');
      const val = hourInput.value;

      // Nhập đủ 2 số hoặc số >= 3 (như 3, 4... 9) thì tự nhảy sang ô phút
      if (val.length === 2 || (val.length === 1 && parseInt(val, 10) >= 3)) {
        if (val.length === 1) {
          hourInput.value = '0' + val;
        }
        minuteInput.focus();
        minuteInput.select();
      }
      updateExamTimeBadge();
    });

    minuteInput.addEventListener('input', () => {
      minuteInput.value = minuteInput.value.replace(/\D/g, '');
      updateExamTimeBadge();
    });

    minuteInput.addEventListener('keydown', (e) => {
      // Phím Backspace khi ô phút trống thì nhảy lùi về ô giờ
      if (e.key === 'Backspace' && minuteInput.value.length === 0) {
        hourInput.focus();
      }
    });
  }

  if (specificDate) {
    specificDate.addEventListener('change', triggerConflictCheck);
  }

  // 8. Realtime Conflict Checking Logic
  function triggerConflictCheck() {
    const alertBox = document.getElementById('modalConflictAlert');
    const alertMsg = document.getElementById('modalConflictMessage');
    const alertIcon = document.getElementById('modalConflictIcon');
    const submitBtn = document.getElementById('btnSubmitAddSchedule');

    if (!alertBox || !alertMsg) return;

    const selectedRoom = roomSelect.value;
    const selectedTeacher = teacherSelect.value;
    let targetDayKey = 'th4';

    if (currentScheduleType === 'regular_class') {
      targetDayKey = convertDayNameToKey(regularDaySelect.value);
    } else {
      targetDayKey = convertDateToDayKey(specificDate.value);
    }

    const conflicts = [];

    schedulesData.forEach(s => {
      if (s.dayKey === targetDayKey && s.type !== 'canceled') {
        if (s.room === selectedRoom) {
          conflicts.push(`Phòng [${s.room}] đã có lịch "${s.course}" vào khung giờ ${s.timeRange}`);
        }
        if (s.teacher === selectedTeacher) {
          conflicts.push(`Giảng viên [${s.teacher}] đã có lịch dạy môn "${s.course}"`);
        }
      }
    });

    if (conflicts.length > 0) {
      alertBox.className = 'alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-0 rounded-3 mt-3 border-danger-subtle';
      alertIcon.className = 'bi bi-exclamation-triangle-fill text-danger fs-5';
      alertMsg.innerHTML = `<strong>⚠️ CẢNH BÁO TRÙNG LỊCH:</strong> ${conflicts.join(' & ')}! Vui lòng chọn phòng học khác hoặc đổi ngày/ca.`;
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="bi bi-exclamation-octagon me-1"></i> Vẫn Thêm (Bị Trùng)';
        submitBtn.className = 'btn btn-warning px-4 fw-bold shadow-sm text-dark';
      }
    } else {
      alertBox.className = 'alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-0 rounded-3 mt-3 border-success-subtle';
      alertIcon.className = 'bi bi-check-circle-fill text-success fs-5';
      alertMsg.innerHTML = `<strong>✅ Trạng thái hợp lệ:</strong> Phòng [${selectedRoom}] và ${selectedTeacher} đều trống, sẵn sàng xếp lịch!`;
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Thêm Lịch Mới';
        submitBtn.className = 'btn btn-primary-custom px-4 fw-bold shadow-sm';
      }
    }
  }

  // 9. Form Submit Event
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let targetDayKey = 'th4';
      let targetDayLabel = 'Thứ 4';
      let targetPeriods = `${regularFromPeriod.value} - ${regularToPeriod.value}`;
      let targetTimeRange = regularTimeDisplay.value;
      let targetDateStr = '';
      let targetDateRange = '';

      if (currentScheduleType === 'regular_class') {
        targetDayKey = convertDayNameToKey(regularDaySelect.value);
        targetDayLabel = regularDaySelect.value;
        const startFormatted = formatVNStandardDate(regularStartDate.value);
        const endFormatted = formatVNStandardDate(regularEndDate.value);
        targetDateRange = (startFormatted && endFormatted) ? `${startFormatted} đến ${endFormatted}` : '';
      } else {
        targetDateStr = specificDate.value;
        targetDayKey = convertDateToDayKey(targetDateStr);
        targetDayLabel = convertDayKeyToLabel(targetDayKey);
        targetPeriods = 'Ca thi';
        targetTimeRange = getFormattedExamTime(); // e.g. 12h30
      }

      const newSchedule = {
        id: 'SCH_' + Date.now(),
        type: currentScheduleType,
        course: courseSelect.value,
        dept: deptSelect.options[deptSelect.selectedIndex].text,
        teacher: teacherSelect.value,
        room: roomSelect.value,
        building: buildingSelect.options[buildingSelect.selectedIndex].text,
        dayKey: targetDayKey,
        dayLabel: targetDayLabel,
        dateStr: targetDateStr,
        periods: targetPeriods,
        timeRange: targetTimeRange,
        dateRange: targetDateRange,
        examFormat: document.getElementById('modalExamFormat') ? document.getElementById('modalExamFormat').value : '',
        examDuration: document.getElementById('modalExamDuration') ? document.getElementById('modalExamDuration').value : '',
        examGroup: document.getElementById('modalExamGroup') ? document.getElementById('modalExamGroup').value : '',
        status: currentScheduleType === 'exam' ? 'Sắp thi' : 'Sắp diễn ra'
      };

      schedulesData.unshift(newSchedule);

      currentSelectedDayKey = targetDayKey;
      currentSelectedDayLabel = convertDayKeyToLabel(targetDayKey);

      document.querySelectorAll('.week-day-item').forEach(w => {
        if (w.getAttribute('data-day-key') === targetDayKey) {
          w.classList.add('active');
        } else {
          w.classList.remove('active');
        }
      });

      renderScheduleUI();

      const modalEl = document.getElementById('addScheduleModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) {
        bsModal.hide();
      }

      showToast(`Đã thêm thành công: ${newSchedule.course} vào ${newSchedule.dayLabel} (${newSchedule.room})!`);
    });
  }

  // Initial runs
  updateCoursesAndTeachers();
  updateRooms();
  updateRegularTime();
  updateExamTimeBadge();
}

// =========================================================================
// 9. Toast Notification Helper
// =========================================================================
function showToast(message) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-white bg-dark border-0 show shadow-lg';
  toastEl.role = 'alert';
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi bi-check-circle-fill text-success fs-5"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);
  setTimeout(() => {
    toastEl.remove();
  }, 4000);
}
