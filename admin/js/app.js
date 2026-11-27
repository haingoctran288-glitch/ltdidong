// UniStudent Admin Dashboard - JavaScript Controller

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCharts();
  initQRCode();
  initAttendanceManager();
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
// 3. Dynamic QR Code Generator (5s Auto-Refresh) & Fixed Attendance Table
// =========================================================================
const QR_INTERVAL_SECONDS = 5;
let qrCountdownInterval = null;
let qrCodeInstance = null;
let currentRemainingTime = QR_INTERVAL_SECONDS;
let isQrSessionActive = true;

function initQRCode() {
  const qrTarget = document.getElementById('qrcode-display');
  const timerDisplay = document.getElementById('qr-countdown-text');
  const progressBar = document.getElementById('qr-progress-bar');
  const btnRefreshQR = document.getElementById('btn-refresh-qr');
  const btnToggleSession = document.getElementById('btn-toggle-qr-session');
  const sessionStatusText = document.getElementById('qr-session-status-text');
  const pulseDot = document.getElementById('qr-pulse-dot');

  if (!qrTarget) return;

  function renderTimerUI() {
    if (timerDisplay) {
      timerDisplay.innerText = isQrSessionActive ? `${currentRemainingTime}s` : 'Đã dừng';
    }
    if (progressBar) {
      const percent = isQrSessionActive ? (currentRemainingTime / QR_INTERVAL_SECONDS) * 100 : 0;
      progressBar.style.width = `${percent}%`;
      if (percent <= 25) {
        progressBar.className = 'progress-bar bg-danger';
      } else if (percent <= 60) {
        progressBar.className = 'progress-bar bg-warning';
      } else {
        progressBar.className = 'progress-bar bg-success';
      }
    }
  }

  function generateNewQR() {
    const timestamp = Date.now();
    const token = 'ATTEND_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_' + timestamp;
    const courseParam = encodeURIComponent(typeof currentAttCourse !== 'undefined' ? currentAttCourse : '');
    const dateParam = encodeURIComponent(typeof currentAttendanceDateIso !== 'undefined' ? currentAttendanceDateIso : '');

    qrTarget.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
      qrCodeInstance = new QRCode(qrTarget, {
        text: `unistudent://checkin?course=${courseParam}&date=${dateParam}&code=${token}`,
        width: 190,
        height: 190,
        colorDark: '#1e1b4b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }

    isQrSessionActive = true;
    currentRemainingTime = QR_INTERVAL_SECONDS;
    updateSessionUIState();
    renderTimerUI();
    startCountdown();
  }

  window.regenerateAttendanceQR = generateNewQR;

  function updateSessionUIState() {
    if (sessionStatusText) {
      sessionStatusText.innerText = isQrSessionActive ? 'ĐANG PHÁT MÃ ĐIỂM DANH TRỰC TIẾP' : 'PHIÊN ĐIỂM DANH ĐÃ TẠM DỪNG';
    }
    if (pulseDot) {
      pulseDot.style.backgroundColor = isQrSessionActive ? '#22c55e' : '#ef4444';
    }
    if (btnToggleSession) {
      btnToggleSession.innerHTML = isQrSessionActive
        ? '<i class="bi bi-stop-circle me-1"></i> Kết thúc phiên'
        : '<i class="bi bi-play-circle me-1"></i> Bắt đầu lại';
    }
  }

  function startCountdown() {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = setInterval(() => {
      if (!isQrSessionActive) return;

      currentRemainingTime--;
      if (currentRemainingTime <= 0) {
        generateNewQR();
        return;
      }
      renderTimerUI();
    }, 1000);
  }

  if (btnRefreshQR) {
    btnRefreshQR.addEventListener('click', () => {
      generateNewQR();
      showToast('Đã đổi mã QR mới và đặt lại bộ đếm 5s!');
    });
  }

  if (btnToggleSession) {
    btnToggleSession.addEventListener('click', () => {
      if (isQrSessionActive) {
        isQrSessionActive = false;
        clearInterval(qrCountdownInterval);
        updateSessionUIState();
        renderTimerUI();
        showToast('Đã kết thúc phiên điểm danh!');
      } else {
        generateNewQR();
        showToast('Đã mở lại phiên điểm danh trực tiếp!');
      }
    });
  }

  generateNewQR();
}

// Mốc ngày hiện tại giả lập: 25/11/2026
const SIMULATED_TODAY_ISO = '2026-11-25';

function getSessionTimeStatus(isoDate) {
  if (isoDate < SIMULATED_TODAY_ISO) return 'past';      // Đã diễn ra
  if (isoDate === SIMULATED_TODAY_ISO) return 'ongoing'; // Đang diễn ra (Hôm nay)
  return 'future';                                       // Chưa diễn ra (Tương lai)
}

function formatShortDayMonth(isoDate) {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

// Sinh động danh sách các buổi học hợp lệ từ dữ liệu Lịch học & Lịch thi (schedulesData)
function getValidAttendanceSessions(courseName) {
  if (typeof schedulesData === 'undefined') return [];

  const canceledSet = new Set();
  const sessionMap = new Map();

  // 1. Thu thập các ngày bị hủy (cả đơn lẻ lẫn từng ngày hủy của lịch định kỳ)
  schedulesData.forEach(s => {
    if (s.course !== courseName) return;
    if (s.type === 'canceled' && s.dateStr) {
      canceledSet.add(s.dateStr);
    }
    if (Array.isArray(s.canceledDates)) {
      s.canceledDates.forEach(d => canceledSet.add(d));
    }
  });

  // 2. Sinh các buổi từ Lịch học định kỳ và Lịch học bù
  schedulesData.forEach(s => {
    if (s.course !== courseName) return;

    if (s.type === 'regular_class') {
      let startD = new Date(2026, 10, 16);
      let endD = new Date(2026, 11, 20); // Hiển thị tối đa đến giữa tháng 12 để gọn bảng
      if (s.dateRange) {
        const delim = s.dateRange.includes('đến') ? 'đến' : ' - ';
        const parts = s.dateRange.split(delim).map(p => p.trim());
        if (parts.length === 2) {
          const pStart = parseVNDateToObj(parts[0]);
          const pEnd = parseVNDateToObj(parts[1]);
          if (pStart) startD = pStart;
          if (pEnd) {
            const capD = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + 35);
            endD = pEnd < capD ? pEnd : capD;
          }
        }
      }

      let cursor = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate());
      while (cursor <= endD) {
        const iso = toISODate(cursor);
        if (getDayKeyFromDate(cursor) === s.dayKey && !canceledSet.has(iso)) {
          if (!sessionMap.has(iso)) {
            sessionMap.set(iso, {
              iso,
              label: formatShortDayMonth(iso),
              isMakeup: false,
              status: getSessionTimeStatus(iso)
            });
          }
        }
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      }
    } else if (s.type === 'makeup_class' && s.dateStr && !canceledSet.has(s.dateStr)) {
      sessionMap.set(s.dateStr, {
        iso: s.dateStr,
        label: formatShortDayMonth(s.dateStr),
        isMakeup: true,
        status: getSessionTimeStatus(s.dateStr)
      });
    }
  });

  return Array.from(sessionMap.values()).sort((a, b) => a.iso.localeCompare(b.iso));
}

// Mock Data: Danh sách 100 sinh viên cố định
function generateMockAttendanceStudents(count = 100) {
  const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
  const dem = ['Văn', 'Thị', 'Hoàng', 'Minh', 'Ngọc', 'Quang', 'Thu', 'Thanh', 'Anh', 'Đức', 'Bảo', 'Gia'];
  const ten = ['An', 'Bích', 'Cường', 'Đức', 'Hân', 'Huy', 'Lan', 'Tùng', 'Hải', 'Linh', 'Khánh', 'Trang', 'Nam', 'Vy', 'Phúc', 'Nhi'];
  const classes = ['D21-CNTT01', 'D21-CNTT02', 'D21-CNTT03'];

  const list = [];
  for (let i = 1; i <= count; i++) {
    const mssv = `2105${String(100 + i).padStart(4, '0')}`;
    const fullName = `${ho[(i * 3) % ho.length]} ${dem[(i * 5) % dem.length]} ${ten[(i * 7) % ten.length]}`;
    const day = String(((i * 3) % 28) + 1).padStart(2, '0');
    const month = String(((i * 2) % 12) + 1).padStart(2, '0');
    const dob = `${day}/${month}/2003`;
    const className = classes[(i - 1) % classes.length];

    list.push({
      stt: i,
      mssv,
      name: fullName,
      dob,
      className,
      records: {}
    });
  }
  return list;
}

const attendanceStudents = generateMockAttendanceStudents(100);

function getStudentAttendanceStatus(student, isoDate) {
  if (Object.prototype.hasOwnProperty.call(student.records, isoDate)) {
    return student.records[isoDate];
  }
  // Tạo trạng thái mặc định ổn định cho các buổi đã/đang diễn ra (~15% vắng)
  const dayNum = parseInt(isoDate.split('-')[2] || '1', 10);
  const seed = (student.stt * 13 + dayNum * 7) % 19;
  const val = seed !== 0 && seed !== 11 && !(student.stt % 9 === 0 && dayNum % 2 === 1);
  student.records[isoDate] = val;
  return val;
}

let currentAttCourse = 'Thực hành lập trình di động';
let currentAttendanceMode = 'daily'; // 'daily' | 'summary'
let currentAttendanceDateIso = SIMULATED_TODAY_ISO;
let currentAttSearch = '';
let currentAttClass = 'all';
let currentAttPageSize = 20; // 20 | 50 | 'all'
let currentAttPage = 1;
let isAttExpanded = false;

function updateQRCardContext(shouldRegenerate = false) {
  const titleEl = document.getElementById('qr-course-title');
  const metaEl = document.getElementById('qr-course-meta');
  const dateBadgeEl = document.getElementById('qr-course-date-badge');

  let matchedSchedule = null;
  if (typeof schedulesData !== 'undefined') {
    matchedSchedule = schedulesData.find(s =>
      s.course === currentAttCourse && s.dateStr === currentAttendanceDateIso && s.type !== 'canceled'
    ) || schedulesData.find(s =>
      s.course === currentAttCourse && (s.type === 'regular_class' || s.type === 'makeup_class')
    );
  }

  if (titleEl) {
    titleEl.innerText = currentAttCourse || 'Điểm danh lớp học';
  }
  if (metaEl) {
    if (matchedSchedule) {
      const classText = matchedSchedule.classSection ? ` • Lớp ${matchedSchedule.classSection}` : '';
      metaEl.innerText = `Phòng ${matchedSchedule.room}${classText} • GV: ${matchedSchedule.teacher}`;
    } else {
      metaEl.innerText = 'Chưa có thông tin phòng / giảng viên';
    }
  }
  if (dateBadgeEl) {
    const formattedDate = currentAttendanceDateIso
      ? formatVNStandardDate(currentAttendanceDateIso).replace(/-/g, '/')
      : '25/11/2026';
    dateBadgeEl.innerHTML = `<i class="bi bi-calendar-event me-1"></i>Ngày ${formattedDate}`;
  }

  if (shouldRegenerate && typeof window.regenerateAttendanceQR === 'function') {
    window.regenerateAttendanceQR();
  }
}

window.openAttendanceForCourse = function(courseName, dateIso = '') {
  if (courseName) {
    currentAttCourse = courseName;
  }
  if (dateIso) {
    currentAttendanceDateIso = dateIso;
  }
  const attNav = document.querySelector('.nav-link-custom[data-target="section-attendance"]');
  if (attNav) attNav.click();
  refreshAttendanceCourseOptions();
  renderAttendanceTable();
  updateQRCardContext(true);
};

function refreshAttendanceCourseOptions() {
  const courseSelect = document.getElementById('attCourseSelect');
  if (!courseSelect || typeof schedulesData === 'undefined') return;

  const courses = [...new Set(
    schedulesData
      .filter(s => s.type === 'regular_class' || s.type === 'makeup_class')
      .map(s => s.course)
  )];

  if (!courses.includes(currentAttCourse) && courses.length > 0) {
    currentAttCourse = courses[0];
  }

  courseSelect.innerHTML = courses.map(c => `<option value="${c}" ${c === currentAttCourse ? 'selected' : ''}>${c}</option>`).join('');
}

function initAttendanceManager() {
  const modeBtns = document.querySelectorAll('#attendanceModeNav .nav-btn');
  const dailyToolbar = document.getElementById('attendanceDailyToolbar');
  const courseSelect = document.getElementById('attCourseSelect');
  const searchInput = document.getElementById('attSearchInput');
  const classFilter = document.getElementById('attClassFilter');
  const pageSizeSelect = document.getElementById('attPageSizeSelect');
  const btnExpand = document.getElementById('btnToggleExpandAttendance');
  const qrCol = document.getElementById('attQrColumn');
  const tableCol = document.getElementById('attTableColumn');
  const scrollWrapper = document.querySelector('.att-table-scroll-wrapper');

  if (!document.getElementById('attendanceTable')) return;

  refreshAttendanceCourseOptions();
  if (courseSelect) {
    courseSelect.addEventListener('change', () => {
      currentAttCourse = courseSelect.value;
      currentAttPage = 1;
      renderAttendanceTable();
      updateQRCardContext(true);
    });
  }

  // Populate Class Filter dropdown
  if (classFilter) {
    const uniqueClasses = [...new Set(attendanceStudents.map(s => s.className))].sort();
    classFilter.innerHTML = '<option value="all">Tất cả lớp</option>' +
      uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join('');

    classFilter.addEventListener('change', () => {
      currentAttClass = classFilter.value;
      currentAttPage = 1;
      renderAttendanceTable();
    });
  }

  // Realtime Search by Họ tên or Mã sinh viên
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentAttSearch = searchInput.value.trim().toLowerCase();
      currentAttPage = 1;
      renderAttendanceTable();
    });
  }

  // Page Size Selector (20 / 50 / all)
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', () => {
      const val = pageSizeSelect.value;
      currentAttPageSize = val === 'all' ? 'all' : parseInt(val, 10);
      currentAttPage = 1;
      renderAttendanceTable();
    });
  }

  // Expand / Collapse Table Button (Hide/Show QR Column)
  if (btnExpand && qrCol && tableCol) {
    btnExpand.addEventListener('click', () => {
      isAttExpanded = !isAttExpanded;
      if (isAttExpanded) {
        qrCol.classList.add('d-none');
        tableCol.classList.remove('col-lg-8');
        tableCol.classList.add('col-12');
        if (scrollWrapper) scrollWrapper.classList.add('expanded');
        btnExpand.innerHTML = '<i class="bi bi-fullscreen-exit me-1"></i> Thu gọn';
      } else {
        qrCol.classList.remove('d-none');
        tableCol.classList.remove('col-12');
        tableCol.classList.add('col-lg-8');
        if (scrollWrapper) scrollWrapper.classList.remove('expanded');
        btnExpand.innerHTML = '<i class="bi bi-arrows-fullscreen me-1"></i> Mở rộng bảng';
      }
    });
  }

  // Mode Switcher: Theo từng ngày | Bảng tổng hợp cuối cùng
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAttendanceMode = btn.getAttribute('data-att-mode');

      if (dailyToolbar) {
        if (currentAttendanceMode === 'daily') {
          dailyToolbar.classList.remove('d-none');
        } else {
          dailyToolbar.classList.add('d-none');
        }
      }
      renderAttendanceTable();
    });
  });

  renderAttendanceTable();
}

function renderAttendanceTable(highlightMssv = null) {
  const thead = document.getElementById('attendanceTableHead');
  const tbody = document.getElementById('attendanceTableBody');
  const statsBadge = document.getElementById('attendanceDailyStatsBadge');
  const datePillsContainer = document.getElementById('attendanceDatePills');
  const sessionStateNote = document.getElementById('attSessionStateNote');
  const paginationInfo = document.getElementById('attPaginationInfo');
  const paginationControls = document.getElementById('attPaginationControls');
  if (!thead || !tbody) return;

  // 1. Lấy danh sách các buổi học hợp lệ (đồng bộ từ Lịch học & Lịch thi)
  const sessions = getValidAttendanceSessions(currentAttCourse);
  const completedOrOngoingSessions = sessions.filter(sess => sess.status === 'past' || sess.status === 'ongoing');

  // Đảm bảo ngày đang chọn nằm trong danh sách hợp lệ
  if (!sessions.some(sess => sess.iso === currentAttendanceDateIso)) {
    const fallback = completedOrOngoingSessions[completedOrOngoingSessions.length - 1] || sessions[0];
    currentAttendanceDateIso = fallback ? fallback.iso : '';
  }

  const activeSession = sessions.find(sess => sess.iso === currentAttendanceDateIso) || null;

  // Render Date Pills cho chế độ "Theo từng ngày"
  if (datePillsContainer) {
    if (sessions.length === 0) {
      datePillsContainer.innerHTML = '<span class="small text-muted fst-italic">Chưa có buổi học hợp lệ nào.</span>';
    } else {
      datePillsContainer.innerHTML = sessions.map(sess => {
        const isActive = sess.iso === currentAttendanceDateIso;
        const isFuture = sess.status === 'future';
        let tag = '';
        if (sess.isMakeup) tag = ' (Bù)';
        else if (sess.status === 'ongoing') tag = ' (Hôm nay)';
        else if (isFuture) tag = ' (Chưa tới)';

        return `
          <button type="button" class="att-date-pill ${isFuture ? 'future' : ''} ${isActive ? 'active' : ''}" data-att-iso="${sess.iso}">
            ${sess.label}${tag}
          </button>
        `;
      }).join('');

      datePillsContainer.querySelectorAll('.att-date-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          currentAttendanceDateIso = pill.getAttribute('data-att-iso');
          renderAttendanceTable();
          updateQRCardContext(true);
        });
      });
    }
  }

  // Ghi chú trạng thái buổi đang chọn ở chế độ Theo từng ngày
  if (sessionStateNote) {
    if (!activeSession) {
      sessionStateNote.innerHTML = '';
    } else if (activeSession.status === 'future') {
      sessionStateNote.innerHTML = '<span class="text-warning-emphasis"><i class="bi bi-lock-fill me-1"></i>Buổi học chưa diễn ra — Khóa điểm danh</span>';
    } else if (activeSession.status === 'ongoing') {
      sessionStateNote.innerHTML = '<span class="text-success"><i class="bi bi-broadcast me-1"></i>Đang diễn ra hôm nay — Bấm ô để sửa tay</span>';
    } else {
      sessionStateNote.innerHTML = '<span class="text-secondary"><i class="bi bi-clock-history me-1"></i>Buổi đã diễn ra — Bấm ô để sửa tay</span>';
    }
  }

  const sessionsToShow = currentAttendanceMode === 'daily'
    ? (activeSession ? [activeSession] : [])
    : sessions;

  // 2. Render Table Header (Sticky Header + Sticky Left Columns)
  thead.innerHTML = `
    <tr>
      <th class="text-center att-col-stt">STT</th>
      <th class="att-col-mssv">Mã sinh viên</th>
      <th class="att-col-name">Họ và tên</th>
      <th>Ngày sinh</th>
      <th>Lớp</th>
      ${sessionsToShow.map(sess => {
        const badge = sess.isMakeup ? ' <span class="badge bg-info-subtle text-info" style="font-size:10px;">Bù</span>' : '';
        const futureTag = sess.status === 'future' ? '<div class="text-muted fw-normal" style="font-size:10px;">Chưa tới</div>' : '';
        return `<th class="text-center">${sess.label}${badge}${futureTag}</th>`;
      }).join('')}
      <th class="text-center text-nowrap">Số buổi học / Số buổi vắng</th>
    </tr>
  `;

  // 3. Filter Students (Always keeping fixed STT sort order)
  const filteredStudents = attendanceStudents
    .filter(s => {
      const matchClass = currentAttClass === 'all' || s.className === currentAttClass;
      const matchSearch = !currentAttSearch ||
        s.name.toLowerCase().includes(currentAttSearch) ||
        s.mssv.toLowerCase().includes(currentAttSearch);
      return matchClass && matchSearch;
    })
    .sort((a, b) => a.stt - b.stt);

  const totalFiltered = filteredStudents.length;

  // Thống kê sĩ số buổi đang chọn (nếu buổi tương lai thì chưa điểm danh)
  if (statsBadge) {
    if (!activeSession) {
      statsBadge.innerText = 'Chưa có buổi học';
    } else if (activeSession.status === 'future') {
      statsBadge.innerText = `Ngày ${activeSession.label} • Chưa diễn ra (${totalFiltered} SV)`;
    } else {
      let dailyPresentCount = 0;
      filteredStudents.forEach(s => {
        if (getStudentAttendanceStatus(s, activeSession.iso)) dailyPresentCount++;
      });
      statsBadge.innerText = `Ngày ${activeSession.label} • Có mặt: ${dailyPresentCount} / ${totalFiltered}`;
    }
  }

  // 4. Pagination Slice
  const pageSize = currentAttPageSize === 'all' ? Math.max(totalFiltered, 1) : currentAttPageSize;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (currentAttPage > totalPages) currentAttPage = totalPages;

  const startIdx = (currentAttPage - 1) * pageSize;
  const endIdx = currentAttPageSize === 'all' ? totalFiltered : Math.min(startIdx + pageSize, totalFiltered);
  const pagedStudents = filteredStudents.slice(startIdx, endIdx);

  // 5. Render Rows
  if (pagedStudents.length === 0) {
    const colSpan = 6 + sessionsToShow.length;
    tbody.innerHTML = `
      <tr>
        <td colspan="${colSpan}" class="text-center py-5 text-muted">
          <i class="bi bi-search fs-3 d-block mb-2"></i>
          Không tìm thấy sinh viên nào phù hợp với bộ lọc hiện tại.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pagedStudents.map(s => {
      // Chỉ tính tổng trên các buổi Đã diễn ra & Đang diễn ra (KHÔNG tính buổi hủy & tương lai)
      let presentCount = 0;
      let absentCount = 0;
      completedOrOngoingSessions.forEach(sess => {
        if (getStudentAttendanceStatus(s, sess.iso)) presentCount++;
        else absentCount++;
      });

      const dayCellsHTML = sessionsToShow.map(sess => {
        if (sess.status === 'future') {
          return `
            <td class="att-cell att-cell-future" title="Buổi học ngày ${sess.label} chưa diễn ra (tương lai)">
              <span class="att-future-mark">—</span>
            </td>
          `;
        }
        const isPresent = Boolean(getStudentAttendanceStatus(s, sess.iso));
        return `
          <td class="att-cell" data-mssv="${s.mssv}" data-iso="${sess.iso}" title="Bấm để đổi trạng thái Có mặt / Vắng (${s.name} - ${sess.label})">
            ${isPresent ? '' : '<span class="att-absent-mark">X</span>'}
          </td>
        `;
      }).join('');

      const rowFlashClass = highlightMssv === s.mssv ? 'att-row-flash' : '';

      return `
        <tr class="${rowFlashClass}">
          <td class="text-center fw-bold text-secondary att-col-stt">${s.stt}</td>
          <td class="att-col-mssv"><strong class="text-dark">${s.mssv}</strong></td>
          <td class="fw-semibold text-dark text-nowrap att-col-name">${s.name}</td>
          <td class="text-muted text-nowrap">${s.dob}</td>
          <td><span class="badge bg-light text-dark border">${s.className}</span></td>
          ${dayCellsHTML}
          <td class="text-center fw-bold text-nowrap">
            <span class="text-success">${presentCount}</span>
            <span class="text-muted mx-1">/</span>
            <span class="${absentCount > 0 ? 'text-danger' : 'text-secondary'}">${absentCount}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 6. Render Pagination Info & Controls
  if (paginationInfo) {
    if (totalFiltered === 0) {
      paginationInfo.innerText = 'Hiển thị 0 sinh viên';
    } else {
      paginationInfo.innerText = `Hiển thị ${startIdx + 1}–${endIdx} trên tổng số ${totalFiltered} sinh viên`;
    }
  }

  if (paginationControls) {
    if (currentAttPageSize === 'all' || totalPages <= 1) {
      paginationControls.innerHTML = '';
    } else {
      let pagesHTML = `
        <li class="page-item ${currentAttPage === 1 ? 'disabled' : ''}">
          <button type="button" class="page-link" data-page="${currentAttPage - 1}">Trang trước</button>
        </li>
      `;

      for (let p = 1; p <= totalPages; p++) {
        pagesHTML += `
          <li class="page-item ${p === currentAttPage ? 'active' : ''}">
            <button type="button" class="page-link" data-page="${p}">${p}</button>
          </li>
        `;
      }

      pagesHTML += `
        <li class="page-item ${currentAttPage === totalPages ? 'disabled' : ''}">
          <button type="button" class="page-link" data-page="${currentAttPage + 1}">Trang sau</button>
        </li>
      `;

      paginationControls.innerHTML = pagesHTML;

      paginationControls.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', () => {
          const targetPage = parseInt(link.getAttribute('data-page'), 10);
          if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentAttPage) {
            currentAttPage = targetPage;
            renderAttendanceTable();
          }
        });
      });
    }
  }

  // Đồng bộ thẻ QR bên trái với môn & ngày đang chọn
  updateQRCardContext(false);

  // 7. Click-to-toggle Attendance Status ONLY on past / ongoing cells
  tbody.querySelectorAll('.att-cell[data-iso]').forEach(cell => {
    cell.addEventListener('click', () => {
      const mssv = cell.getAttribute('data-mssv');
      const isoDate = cell.getAttribute('data-iso');
      const student = attendanceStudents.find(st => st.mssv === mssv);
      if (!student || !isoDate) return;

      const curVal = getStudentAttendanceStatus(student, isoDate);
      student.records[isoDate] = !curVal;
      renderAttendanceTable(mssv);
    });
  });
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
  classSections: {
    cntt: ['CNTT-11', 'CNTT-12', 'CNTT-13', 'KTPM-01', 'KTPM-02'],
    kt: ['KT-01', 'KT-02', 'QTKD-05'],
    nn: ['TA-04', 'TA-05', 'NNA-02']
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
    classSection: 'CNTT-11',
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
    classSection: 'CNTT-12',
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
    classSection: 'KTPM-01',
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
    classSection: 'CNTT-11',
    dept: 'Khoa Công Nghệ Thông Tin',
    teacher: 'TS. Nguyễn Văn D',
    teacher2: 'ThS. Nguyễn Văn C',
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
    classSection: 'CT-01',
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

let currentSelectedDate = new Date(2026, 10, 18); // 18/11/2026
let currentSelectedDayKey = 'th4';
let currentSelectedDayLabel = 'Th 4, 18/11';
let currentSelectedYear = 2026;
let currentSelectedMonth = 11;

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDayKeyFromDate(d) {
  const map = { 1: 'th2', 2: 'th3', 3: 'th4', 4: 'th5', 5: 'th6', 6: 'th7', 0: 'cn' };
  return map[d.getDay()] || 'th4';
}

function formatShortDayLabel(d) {
  const shortDays = { 0: 'CN', 1: 'Th 2', 2: 'Th 3', 3: 'Th 4', 4: 'Th 5', 5: 'Th 6', 6: 'Th 7' };
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  return `${shortDays[d.getDay()]}, ${dayNum}/${monthNum}`;
}

function formatFullDayTitle(d) {
  const fullDays = { 0: 'Chủ Nhật', 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7' };
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  return `${fullDays[d.getDay()]}, ngày ${dayNum}/${monthNum}/${d.getFullYear()}`;
}

function parseVNDateToObj(str) {
  if (!str) return null;
  const clean = str.trim().replace(/\//g, '-');
  const parts = clean.split('-');
  if (parts.length !== 3) return null;
  if (parts[0].length === 4) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
}

function syncDateState(newDate) {
  currentSelectedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
  currentSelectedYear = currentSelectedDate.getFullYear();
  currentSelectedMonth = currentSelectedDate.getMonth() + 1;
  currentSelectedDayKey = getDayKeyFromDate(currentSelectedDate);
  currentSelectedDayLabel = formatShortDayLabel(currentSelectedDate);
}

function getSchedulesForDate(dateObj) {
  const iso = toISODate(dateObj);
  const dayKey = getDayKeyFromDate(dateObj);
  const targetTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();

  const results = [];

  schedulesData.forEach(s => {
    if (s.type !== 'regular_class' && s.dateStr && s.dateStr === iso) {
      results.push(s);
      return;
    }

    const isRegular = s.type === 'regular_class' || (s.type === 'canceled' && s.originalType === 'regular_class');
    if (isRegular && s.dayKey === dayKey) {
      let inRange = true;
      if (s.dateRange) {
        const delimiter = s.dateRange.includes('đến') ? 'đến' : ' - ';
        const rangeParts = s.dateRange.split(delimiter).map(p => p.trim());
        if (rangeParts.length === 2) {
          const startD = parseVNDateToObj(rangeParts[0]);
          const endD = parseVNDateToObj(rangeParts[1]);
          if (startD && endD) {
            inRange = targetTime >= startD.getTime() && targetTime <= endD.getTime();
          }
        }
      }
      if (inRange) {
        if (s.type === 'regular_class' && Array.isArray(s.canceledDates) && s.canceledDates.includes(iso)) {
          results.push({
            ...s,
            type: 'canceled',
            originalType: 'regular_class',
            canceledDateIso: iso,
            canceledReason: (s.canceledReasons && s.canceledReasons[iso]) || 'Buổi học đã được thông báo hủy / tạm nghỉ.'
          });
        } else {
          results.push(s);
        }
      }
    }
  });

  return results;
}

// Bảng thời gian tiết học chuẩn HITU (1-5 Sáng, 6-10 Chiều, 11-15 Tối)
const PERIOD_TIME_TABLE = {
  1:  { start: '07:30', end: '08:15', session: 'morning' },
  2:  { start: '08:15', end: '09:00', session: 'morning' },
  3:  { start: '09:00', end: '09:45', session: 'morning' },
  4:  { start: '10:00', end: '10:45', session: 'morning' },
  5:  { start: '10:45', end: '11:30', session: 'morning' },
  6:  { start: '12:30', end: '13:15', session: 'afternoon' },
  7:  { start: '13:15', end: '14:00', session: 'afternoon' },
  8:  { start: '14:15', end: '15:00', session: 'afternoon' },
  9:  { start: '15:00', end: '15:45', session: 'afternoon' },
  10: { start: '15:45', end: '16:30', session: 'afternoon' },
  11: { start: '17:00', end: '17:45', session: 'evening' },
  12: { start: '17:45', end: '18:30', session: 'evening' },
  13: { start: '18:30', end: '19:15', session: 'evening' },
  14: { start: '19:15', end: '20:00', session: 'evening' },
  15: { start: '20:00', end: '20:45', session: 'evening' }
};

function getSessionBoundsForPeriod(pNum) {
  if (pNum >= 1 && pNum <= 5) return { key: 'morning', label: '☀️ Buổi Sáng (Tiết 1 - 5)', min: 1, max: 5 };
  if (pNum >= 6 && pNum <= 10) return { key: 'afternoon', label: '🌤️ Buổi Chiều (Tiết 6 - 10)', min: 6, max: 10 };
  return { key: 'evening', label: '🌙 Buổi Tối (Tiết 11 - 15)', min: 11, max: 15 };
}

function buildAllPeriodOptionsHTML(placeholderText) {
  const groups = [
    { label: '☀️ Buổi Sáng (Tiết 1 - 5)', min: 1, max: 5 },
    { label: '🌤️ Buổi Chiều (Tiết 6 - 10)', min: 6, max: 10 },
    { label: '🌙 Buổi Tối (Tiết 11 - 15)', min: 11, max: 15 }
  ];
  let html = `<option value="" selected disabled>${placeholderText}</option>`;
  groups.forEach(g => {
    html += `<optgroup label="${g.label}">`;
    for (let p = g.min; p <= g.max; p++) {
      const t = PERIOD_TIME_TABLE[p];
      html += `<option value="${p}">Tiết ${p} (${t.start} - ${t.end})</option>`;
    }
    html += `</optgroup>`;
  });
  return html;
}

function buildToPeriodOptionsHTML(fromP, placeholderText = '-- Đến tiết --') {
  const groups = [
    { label: '☀️ Buổi Sáng (Tiết 1 - 5)', min: 1, max: 5 },
    { label: '🌤️ Buổi Chiều (Tiết 6 - 10)', min: 6, max: 10 },
    { label: '🌙 Buổi Tối (Tiết 11 - 15)', min: 11, max: 15 }
  ];
  let html = `<option value="" selected disabled>${placeholderText}</option>`;
  groups.forEach(g => {
    if (fromP <= g.max) {
      const startP = Math.max(fromP, g.min);
      html += `<optgroup label="${g.label}">`;
      for (let p = startP; p <= g.max; p++) {
        const t = PERIOD_TIME_TABLE[p];
        html += `<option value="${p}">Tiết ${p} (${t.start} - ${t.end})</option>`;
      }
      html += `</optgroup>`;
    }
  });
  return html;
}

// Tự động tách khoảng tiết thành từng ca theo buổi (Sáng 1-5, Chiều 6-10, Tối 11-15)
function splitPeriodsBySession(fromP, toP) {
  const fromNum = parseInt(fromP, 10);
  const toNum = parseInt(toP, 10);
  if (isNaN(fromNum) || isNaN(toNum) || toNum < fromNum) return [];

  const sessions = [
    { key: 'morning', name: 'Sáng', min: 1, max: 5 },
    { key: 'afternoon', name: 'Chiều', min: 6, max: 10 },
    { key: 'evening', name: 'Tối', min: 11, max: 15 }
  ];

  const segments = [];
  sessions.forEach(sess => {
    const startP = Math.max(fromNum, sess.min);
    const endP = Math.min(toNum, sess.max);
    if (startP <= endP) {
      segments.push({
        sessionName: sess.name,
        fromPeriod: startP,
        toPeriod: endP,
        periods: `${startP} - ${endP}`,
        timeRange: `${PERIOD_TIME_TABLE[startP].start} - ${PERIOD_TIME_TABLE[endP].end}`
      });
    }
  });
  return segments;
}

// Period calculation helper
function calculatePeriodTime(fromP, toP) {
  const fromNum = parseInt(fromP, 10);
  const toNum = parseInt(toP, 10);
  const start = PERIOD_TIME_TABLE[fromNum] ? PERIOD_TIME_TABLE[fromNum].start : '07:30';
  const end = PERIOD_TIME_TABLE[toNum] ? PERIOD_TIME_TABLE[toNum].end : '11:30';
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
  const selectedIso = toISODate(currentSelectedDate);
  const selectedFormattedDate = `${String(currentSelectedDate.getDate()).padStart(2, '0')}/${String(currentSelectedDate.getMonth() + 1).padStart(2, '0')}/${currentSelectedDate.getFullYear()}`;

  // Sync top Month-Year label & picker active state
  const currentMonthYearLabel = document.getElementById('currentMonthYearLabel');
  if (currentMonthYearLabel) {
    currentMonthYearLabel.innerText = `tháng ${currentSelectedMonth}, ${currentSelectedYear}`;
  }
  const pickerYearDisplay = document.getElementById('pickerYearDisplay');
  if (pickerYearDisplay) {
    pickerYearDisplay.innerText = currentSelectedYear;
  }
  document.querySelectorAll('.month-btn-item').forEach(btn => {
    const m = parseInt(btn.getAttribute('data-month'), 10);
    btn.classList.toggle('active', m === currentSelectedMonth);
  });

  // A. Update Week Day Strip (Monday -> Sunday of currentSelectedDate's week)
  const dayOfWeek = currentSelectedDate.getDay(); // 0 (CN) .. 6 (Th 7)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDate = new Date(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth(), currentSelectedDate.getDate() + diffToMonday);
  const weekDayItems = document.querySelectorAll('.week-day-strip .week-day-item');
  const dayShortNames = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'];

  weekDayItems.forEach((dayItem, idx) => {
    const cellDate = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + idx);
    const cellIso = toISODate(cellDate);
    const cellKey = getDayKeyFromDate(cellDate);
    const cellLabel = formatShortDayLabel(cellDate);

    dayItem.setAttribute('data-day-key', cellKey);
    dayItem.setAttribute('data-day-label', cellLabel);
    dayItem.setAttribute('data-date-iso', cellIso);

    const nameEl = dayItem.querySelector('.day-name');
    const numEl = dayItem.querySelector('.day-number');
    if (nameEl) nameEl.innerText = dayShortNames[idx];
    if (numEl) numEl.innerText = cellDate.getDate();

    dayItem.classList.toggle('active', cellIso === selectedIso);
    dayItem.classList.remove('has-schedule-class', 'has-schedule-exam', 'has-schedule-canceled');

    const daySchedules = getSchedulesForDate(cellDate);
    if (daySchedules.length > 0) {
      if (daySchedules.some(s => s.type === 'canceled')) {
        dayItem.classList.add('has-schedule-canceled');
      } else if (daySchedules.some(s => s.type === 'exam')) {
        dayItem.classList.add('has-schedule-exam');
      } else {
        dayItem.classList.add('has-schedule-class');
      }
    }
  });

  // Empty state HTML helper
  const emptyDayHTML = `
    <div class="text-center py-5 bg-light rounded-3 border">
      <i class="bi bi-calendar-x text-muted fs-1 mb-2 d-block"></i>
      <h6 class="text-secondary fw-bold">Không có lịch học hoặc lịch thi trong ngày ${selectedFormattedDate}</h6>
      <small class="text-muted">Sinh viên được nghỉ hoặc không có ca học / thi nào được xếp vào ngày này.</small>
    </div>
  `;

  const activeDaySchedules = getSchedulesForDate(currentSelectedDate);
  const cardsHTML = activeDaySchedules.length === 0
    ? emptyDayHTML
    : activeDaySchedules.map(s => renderScheduleCardHTML(s)).join('');

  // B. Render Week Cards for Active Day
  const weekCardsContainer = document.getElementById('weekCardsContainer');
  const weekTimelineBadge = document.getElementById('weekTimelineBadge');
  if (weekTimelineBadge) weekTimelineBadge.innerText = currentSelectedDayLabel;
  if (weekCardsContainer) weekCardsContainer.innerHTML = cardsHTML;

  // C. Render Day View Cards
  const dayCardsContainer = document.getElementById('dayCardsContainer');
  const dayTimelineBadge = document.getElementById('dayTimelineBadge');
  const dayViewTitleDate = document.getElementById('dayViewTitleDate');
  const dayViewCountSubtitle = document.getElementById('dayViewCountSubtitle');

  if (dayTimelineBadge) dayTimelineBadge.innerText = currentSelectedDayLabel;
  if (dayViewTitleDate) dayViewTitleDate.innerText = formatFullDayTitle(currentSelectedDate);
  if (dayViewCountSubtitle) dayViewCountSubtitle.innerText = `Tổng cộng ${activeDaySchedules.length} ca học / thi`;
  if (dayCardsContainer) dayCardsContainer.innerHTML = cardsHTML;

  // D. Render Month Calendar Grid & Selected Day Cards
  renderMonthCalendar(cardsHTML);
}

function renderScheduleCardHTML(s) {
  if (s.type === 'exam') {
    return `
      <div class="schedule-item-card type-exam">
        <div class="schedule-card-inner">
          <div class="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
            <span class="badge-schedule-exam"><i class="bi bi-circle-fill"></i> Lịch thi</span>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-schedule-cancel px-2 py-1" title="Báo hủy lịch thi" onclick="cancelSchedule('${s.id}')"><i class="bi bi-calendar-x me-1"></i>Hủy lịch</button>
              <button class="btn btn-sm btn-light text-secondary p-1 px-2" title="Chỉnh sửa" onclick="editSchedule('${s.id}')"><i class="bi bi-pencil"></i></button>
              <span class="vr text-muted opacity-25"></span>
              <button class="btn btn-sm btn-light text-danger p-1 px-2" title="Xóa vĩnh viễn" onclick="deleteSchedule('${s.id}')"><i class="bi bi-trash"></i></button>
              <i class="bi bi-calendar3 text-muted fs-5 ms-1"></i>
            </div>
          </div>
          <h5 class="schedule-course-title">${s.course}</h5>
          <div class="row g-2">
            <div class="col-md-6">
              <div class="schedule-info-row"><span class="schedule-info-label">Giờ thi:</span><span class="schedule-info-val text-primary fw-bold">${s.timeRange}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Thời gian thi:</span><span class="schedule-info-val">${s.examDuration || '90 phút'}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Hình thức thi:</span><span class="schedule-info-val">${s.examFormat || 'Tự luận'}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Lớp học phần:</span><span class="schedule-info-val"><span class="badge bg-primary-subtle text-primary border border-primary-subtle">${s.classSection || 'CNTT-11'}</span></span></div>
            </div>
            <div class="col-md-6">
              <div class="schedule-info-row"><span class="schedule-info-label">Phòng thi:</span><span class="schedule-info-val text-primary"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${s.room}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Giám thị 1:</span><span class="schedule-info-val">${s.teacher}</span></div>
              <div class="schedule-info-row"><span class="schedule-info-label">Giám thị 2:</span><span class="schedule-info-val">${s.teacher2 || 'Chưa phân công'}</span></div>
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
          <div class="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge-schedule-canceled"><i class="bi bi-x-circle-fill"></i> Lịch bị hủy (Nghỉ)</span>
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle">Thông báo khẩn</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-schedule-restore px-2 py-1" title="Khôi phục lại lịch này" onclick="restoreSchedule('${s.id}', '${s.canceledDateIso || ''}')"><i class="bi bi-arrow-counterclockwise me-1"></i>Khôi phục</button>
              <span class="vr text-muted opacity-25"></span>
              <button class="btn btn-sm btn-light text-danger p-1 px-2" title="Xóa vĩnh viễn" onclick="deleteSchedule('${s.id}')"><i class="bi bi-trash"></i></button>
            </div>
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

  // Regular Class or Makeup Class
  const isMakeup = s.type === 'makeup_class';
  const badgeHTML = isMakeup
    ? '<span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fw-bold"><i class="bi bi-arrow-repeat me-1"></i>Lịch học bù</span>'
    : '<span class="badge-schedule-class"><i class="bi bi-circle-fill"></i> Lịch học</span>';
  const safeCourse = (s.course || '').replace(/'/g, "\\'");

  return `
    <div class="schedule-item-card type-class">
      <div class="schedule-card-inner">
        <div class="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
          ${badgeHTML}
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-light text-primary p-1 px-2" title="Điểm danh QR" onclick="openAttendanceForCourse('${safeCourse}', '${toISODate(currentSelectedDate)}')"><i class="bi bi-qr-code-scan me-1"></i> Điểm danh</button>
            <button class="btn btn-sm btn-schedule-cancel px-2 py-1" title="Báo hủy lịch (Tạm nghỉ)" onclick="cancelSchedule('${s.id}')"><i class="bi bi-calendar-x me-1"></i>Hủy lịch</button>
            <button class="btn btn-sm btn-light text-secondary p-1 px-2" title="Chỉnh sửa" onclick="editSchedule('${s.id}')"><i class="bi bi-pencil"></i></button>
            <span class="vr text-muted opacity-25"></span>
            <button class="btn btn-sm btn-light text-danger p-1 px-2" title="Xóa vĩnh viễn" onclick="deleteSchedule('${s.id}')"><i class="bi bi-trash"></i></button>
            <i class="bi bi-calendar3 text-muted fs-5 ms-1"></i>
          </div>
        </div>

        <h5 class="schedule-course-title">${s.course}</h5>

        <div class="row g-2">
          <div class="col-md-6">
            <div class="schedule-info-row"><span class="schedule-info-label">Tiết:</span><span class="schedule-info-val">${s.periods}</span></div>
            <div class="schedule-info-row"><span class="schedule-info-label">Giờ:</span><span class="schedule-info-val">${s.timeRange}</span></div>
            <div class="schedule-info-row"><span class="schedule-info-label">Lớp học phần:</span><span class="schedule-info-val"><span class="badge bg-light text-dark border">${s.classSection || 'CNTT-11'}</span></span></div>
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

function renderMonthCalendar(selectedDayCardsHTML) {
  const monthHeader = document.getElementById('monthGridHeaderTitle');
  if (monthHeader) {
    monthHeader.innerHTML = `<i class="bi bi-calendar-month text-primary me-2"></i>Tháng ${currentSelectedMonth}, ${currentSelectedYear}`;
  }

  const monthTimelineBadge = document.getElementById('monthTimelineBadge');
  if (monthTimelineBadge) {
    monthTimelineBadge.innerText = currentSelectedDayLabel;
  }

  const monthCardsContainer = document.getElementById('monthCardsContainer');
  if (monthCardsContainer && selectedDayCardsHTML !== undefined) {
    monthCardsContainer.innerHTML = selectedDayCardsHTML;
  }

  const tbody = document.getElementById('monthCalendarBody');
  if (!tbody) return;

  const year = currentSelectedYear;
  const monthIdx = currentSelectedMonth - 1; // 0-indexed
  const firstDay = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  // Monday = 0, Tuesday = 1, ..., Sunday = 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const selectedIso = toISODate(currentSelectedDate);

  let html = '';
  let currentDay = 1;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    if (i % 7 === 0) html += '<tr>';

    if (i < startOffset || currentDay > daysInMonth) {
      html += '<td></td>';
    } else {
      const cellDate = new Date(year, monthIdx, currentDay);
      const cellIso = toISODate(cellDate);
      const dayOfWeekIdx = i % 7; // 5 = Th 7, 6 = CN
      const isWeekend = dayOfWeekIdx >= 5;
      const isActive = cellIso === selectedIso;

      const daySchedules = getSchedulesForDate(cellDate);
      let dotClass = '';
      if (daySchedules.length > 0) {
        if (daySchedules.some(s => s.type === 'canceled')) dotClass = 'dot-canceled';
        else if (daySchedules.some(s => s.type === 'exam')) dotClass = 'dot-exam';
        else dotClass = 'dot-class';
      }

      const classes = [
        'month-day-cell',
        isWeekend ? 'text-danger' : '',
        isActive ? 'active-day' : '',
        dotClass
      ].filter(Boolean).join(' ');

      html += `<td><div class="${classes}" data-date-iso="${cellIso}">${currentDay}</div></td>`;
      currentDay++;
    }

    if (i % 7 === 6) html += '</tr>';
  }

  tbody.innerHTML = html;

  // Bind click events for each day cell
  tbody.querySelectorAll('.month-day-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const iso = cell.getAttribute('data-date-iso');
      if (!iso) return;
      const parts = iso.split('-');
      const clickedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      syncDateState(clickedDate);
      renderScheduleUI();
    });
  });
}

// SweetAlert2 Bootstrap Mixin Helper
function getSwalBootstrap() {
  return Swal.mixin({
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: false
  });
}

// Global cancel schedule function (Báo hủy / Tạm nghỉ)
window.cancelSchedule = function (id) {
  const item = schedulesData.find(s => s.id === id);
  if (!item) return;

  const activeIso = toISODate(currentSelectedDate);
  const activeDateFormatted = formatShortDayMonth(activeIso);
  const isRegular = item.type === 'regular_class';

  const swalWithBootstrapButtons = getSwalBootstrap();
  swalWithBootstrapButtons.fire({
    title: "Xác nhận hủy lịch?",
    text: isRegular
      ? `Buổi học "${item.course}" ngày ${activeDateFormatted} (${item.room}) sẽ bị hủy và tự động loại khỏi bảng điểm danh!`
      : `Lịch "${item.course}" (${item.room}) sẽ chuyển sang trạng thái Đã hủy (gạch đỏ)!`,
    icon: "warning",
    input: "text",
    inputLabel: "Lý do hủy lịch (không bắt buộc)",
    inputPlaceholder: "VD: Giảng viên bận công tác, lớp nghỉ...",
    showCancelButton: true,
    confirmButtonText: "Đồng ý, hủy lịch!",
    cancelButtonText: "Không, giữ lại!",
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      const reason = (result.value && result.value.trim())
        ? result.value.trim()
        : 'Lịch đã được ban quản trị thông báo tạm nghỉ / hủy.';

      if (isRegular) {
        if (!Array.isArray(item.canceledDates)) item.canceledDates = [];
        if (!item.canceledReasons) item.canceledReasons = {};
        if (!item.canceledDates.includes(activeIso)) {
          item.canceledDates.push(activeIso);
        }
        item.canceledReasons[activeIso] = reason;
      } else {
        item.originalType = item.type;
        item.type = 'canceled';
        item.status = 'Tạm nghỉ (Đã hủy)';
        item.canceledReason = reason;
      }

      renderScheduleUI();
      refreshAttendanceCourseOptions();
      renderAttendanceTable();

      swalWithBootstrapButtons.fire({
        title: "Đã hủy lịch!",
        text: isRegular
          ? `Buổi học ngày ${activeDateFormatted} đã bị hủy và tự động gỡ khỏi bảng điểm danh.`
          : `Lịch "${item.course}" đã chuyển sang trạng thái bị hủy.`,
        icon: "success"
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      swalWithBootstrapButtons.fire({
        title: "Đã giữ nguyên",
        text: `Lịch "${item.course}" vẫn hoạt động bình thường :)`,
        icon: "error"
      });
    }
  });
};

// Global restore schedule function (Khôi phục lịch đã hủy)
window.restoreSchedule = function (id, canceledDateIso = '') {
  const item = schedulesData.find(s => s.id === id);
  if (!item) return;

  const swalWithBootstrapButtons = getSwalBootstrap();
  swalWithBootstrapButtons.fire({
    title: "Khôi phục lịch này?",
    text: `Bạn muốn mở lại lịch "${item.course}" (${item.room})?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Đồng ý, khôi phục!",
    cancelButtonText: "Không, giữ hủy!",
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      if (canceledDateIso && Array.isArray(item.canceledDates)) {
        item.canceledDates = item.canceledDates.filter(d => d !== canceledDateIso);
        if (item.canceledReasons) delete item.canceledReasons[canceledDateIso];
      } else {
        item.type = item.originalType || 'regular_class';
        item.status = item.type === 'exam' ? 'Sắp thi' : 'Sắp diễn ra';
        delete item.canceledReason;
      }

      renderScheduleUI();
      refreshAttendanceCourseOptions();
      renderAttendanceTable();

      swalWithBootstrapButtons.fire({
        title: "Đã khôi phục!",
        text: `Lịch "${item.course}" đã hoạt động trở lại và đồng bộ với bảng điểm danh.`,
        icon: "success"
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      swalWithBootstrapButtons.fire({
        title: "Đã giữ nguyên",
        text: "Lịch vẫn giữ nguyên trạng thái tạm nghỉ.",
        icon: "error"
      });
    }
  });
};

// Global edit schedule -> Opens modal pre-filled with existing schedule data
window.editSchedule = function (id) {
  if (typeof window.openEditScheduleModal === 'function') {
    window.openEditScheduleModal(id);
  }
};

// Global delete function (Xóa vĩnh viễn)
window.deleteSchedule = function (id) {
  const item = schedulesData.find(s => s.id === id);
  const courseName = item ? item.course : 'mục lịch này';

  const swalWithBootstrapButtons = getSwalBootstrap();
  swalWithBootstrapButtons.fire({
    title: "Bạn chắc chắn muốn xóa?",
    text: `Bạn sẽ không thể hoàn tác sau khi xóa vĩnh viễn "${courseName}"!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Có, xóa luôn!",
    cancelButtonText: "Không, hủy bỏ!",
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      schedulesData = schedulesData.filter(s => s.id !== id);
      renderScheduleUI();
      refreshAttendanceCourseOptions();
      renderAttendanceTable();

      swalWithBootstrapButtons.fire({
        title: "Đã xóa!",
        text: `Mục lịch "${courseName}" đã bị xóa khỏi danh sách.`,
        icon: "success"
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      swalWithBootstrapButtons.fire({
        title: "Đã hủy thao tác",
        text: `Lịch "${courseName}" của bạn vẫn an toàn :)`,
        icon: "error"
      });
    }
  });
};

// =========================================================================
// 7. INITIALIZE SCHEDULE VIEWS (Segmented Tabs & Month-Year Picker)
// =========================================================================

function initScheduleViews() {
  // A. Segmented Switcher [ Ngày | Tuần | Tháng ]
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
        renderScheduleUI();
      });
    });
  }

  // B. Month-Year Picker Popup Logic
  const pickerBtn = document.getElementById('monthYearPickerBtn');
  const pickerPopup = document.getElementById('monthYearPickerPopup');
  const pickerYearDisplay = document.getElementById('pickerYearDisplay');
  const prevYearBtn = document.getElementById('prevYearBtn');
  const nextYearBtn = document.getElementById('nextYearBtn');
  const monthBtns = document.querySelectorAll('.month-btn-item');

  function applyMonthYearChange(newYear, newMonth) {
    const maxDay = new Date(newYear, newMonth, 0).getDate();
    const clampedDay = Math.min(currentSelectedDate.getDate(), maxDay);
    syncDateState(new Date(newYear, newMonth - 1, clampedDay));
    renderScheduleUI();
  }

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
        applyMonthYearChange(currentSelectedYear - 1, currentSelectedMonth);
      });

      nextYearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyMonthYearChange(currentSelectedYear + 1, currentSelectedMonth);
      });
    }

    monthBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chosenMonth = parseInt(btn.getAttribute('data-month'), 10);
        applyMonthYearChange(currentSelectedYear, chosenMonth);
        pickerPopup.classList.remove('show');
      });
    });
  }

  // C. Week Day Strip click handler
  const weekItems = document.querySelectorAll('.week-day-item');
  weekItems.forEach(item => {
    item.addEventListener('click', () => {
      const iso = item.getAttribute('data-date-iso');
      if (iso) {
        const parts = iso.split('-');
        syncDateState(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      }
      renderScheduleUI();
    });
  });

  // D. Day View Prev / Next Day buttons
  const prevDayBtn = document.getElementById('prevDayBtn');
  const nextDayBtn = document.getElementById('nextDayBtn');
  if (prevDayBtn) {
    prevDayBtn.addEventListener('click', () => {
      const prev = new Date(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth(), currentSelectedDate.getDate() - 1);
      syncDateState(prev);
      renderScheduleUI();
    });
  }
  if (nextDayBtn) {
    nextDayBtn.addEventListener('click', () => {
      const next = new Date(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth(), currentSelectedDate.getDate() + 1);
      syncDateState(next);
      renderScheduleUI();
    });
  }

  // Initial render
  renderScheduleUI();
}

// =========================================================================
// 8. ADD SCHEDULE MODAL: V2 (Không Lớp học phần, Bỏ Học bù, Nhập giờ -> Phút 12h30)
// =========================================================================

function initAddScheduleModal() {
  const modalEl = document.getElementById('addScheduleModal');
  const modalTitleEl = document.getElementById('addScheduleModalLabel');
  const form = document.getElementById('formAddSchedule');
  const typeSelector = document.getElementById('scheduleTypeSelector');
  const typeBtns = document.querySelectorAll('.schedule-type-btn');
  const deptSelect = document.getElementById('modalSelectDept');
  const courseSelect = document.getElementById('modalSelectCourse');
  const teacherClassGrid = document.getElementById('teacherClassGrid');
  const teacherSelect = document.getElementById('modalSelectTeacher');
  const teacherLabel = document.getElementById('modalLabelTeacher');
  const proctor2ColWrapper = document.getElementById('proctor2ColWrapper');
  const teacher2Select = document.getElementById('modalSelectTeacher2');
  const classSectionSelect = document.getElementById('modalSelectClassSection');
  const buildingSelect = document.getElementById('modalSelectBuilding');
  const roomSelect = document.getElementById('modalSelectRoom');

  const timeGroupEmptyHint = document.getElementById('timeGroupEmptyHint');
  const timeGroupRegular = document.getElementById('timeGroupRegular');
  const timeGroupSpecific = document.getElementById('timeGroupSpecific');
  const examOnlyFields = document.querySelectorAll('.exam-only-field');

  const regularDaySelect = document.getElementById('modalRegularDay');
  const regularFromPeriod = document.getElementById('modalRegularFromPeriod');
  const regularToPeriod = document.getElementById('modalRegularToPeriod');
  const regularTimeDisplay = document.getElementById('modalRegularTimeDisplay');
  const regularSplitNote = document.getElementById('regularSplitNote');
  const regularStartDate = document.getElementById('modalRegularStartDate');
  const regularEndDate = document.getElementById('modalRegularEndDate');

  const specificDate = document.getElementById('modalSpecificDate');
  const labelSpecificDate = document.getElementById('labelSpecificDate');
  const groupExamTime = document.getElementById('groupExamTime');
  const groupMakeupTimeDisplayWrap = document.getElementById('groupMakeupTimeDisplayWrap');
  const groupMakeupTime = document.getElementById('groupMakeupTime');
  const makeupFromPeriod = document.getElementById('modalMakeupFromPeriod');
  const makeupToPeriod = document.getElementById('modalMakeupToPeriod');
  const makeupTimeDisplay = document.getElementById('modalMakeupTimeDisplay');
  const makeupSplitNote = document.getElementById('makeupSplitNote');
  const hourInput = document.getElementById('examHourInput');
  const minuteInput = document.getElementById('examMinuteInput');
  const previewBadge = document.getElementById('examTimeBadgePreview');

  const alertBox = document.getElementById('modalConflictAlert');
  const alertMsg = document.getElementById('modalConflictMessage');
  const alertIcon = document.getElementById('modalConflictIcon');
  const submitBtn = document.getElementById('btnSubmitAddSchedule');

  let currentScheduleType = null; // Bắt đầu chưa chọn loại lịch nào
  let editingScheduleId = null;
  let isOpeningForEdit = false;

  if (!deptSelect || !courseSelect) return;

  // Helper: Xóa lỗi của một trường
  function clearFieldError(inputEl, errorId) {
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
    }
    const errEl = document.getElementById(errorId);
    if (errEl) {
      errEl.classList.add('d-none');
    }
  }

  // Helper: Hiển thị lỗi của một trường
  function setFieldError(inputEl, errorId, msg) {
    if (inputEl) {
      inputEl.classList.add('is-invalid');
    }
    const errEl = document.getElementById(errorId);
    if (errEl) {
      if (msg) errEl.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i> ${msg}`;
      errEl.classList.remove('d-none');
    }
    return inputEl;
  }

  function applyScheduleTypeUI(type) {
    currentScheduleType = type;
    typeBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-type') === type);
    });
    clearFieldError(typeSelector, 'errorScheduleType');
    if (timeGroupEmptyHint) timeGroupEmptyHint.classList.add('d-none');

    if (type === 'exam') {
      if (teacherClassGrid) teacherClassGrid.classList.add('exam-mode');
      if (proctor2ColWrapper) proctor2ColWrapper.classList.remove('d-none');
      teacherLabel.innerHTML = '<i class="bi bi-shield-check me-1 text-success"></i> Cán bộ coi thi / Giám thị 1 <span class="text-danger">*</span>';
      examOnlyFields.forEach(el => el.classList.remove('d-none'));
      timeGroupRegular.classList.add('d-none');
      timeGroupSpecific.classList.remove('d-none');
      if (groupExamTime) groupExamTime.classList.remove('d-none');
      if (groupMakeupTimeDisplayWrap) groupMakeupTimeDisplayWrap.classList.add('d-none');
      if (groupMakeupTime) groupMakeupTime.classList.add('d-none');
      if (labelSpecificDate) labelSpecificDate.innerHTML = 'Ngày diễn ra thi <span class="text-danger">*</span>';
    } else if (type === 'makeup_class') {
      if (teacherClassGrid) teacherClassGrid.classList.remove('exam-mode');
      if (proctor2ColWrapper) proctor2ColWrapper.classList.add('d-none');
      clearFieldError(teacher2Select, 'errorTeacher2');
      teacherLabel.innerHTML = 'Giảng viên dạy bù <span class="text-danger">*</span>';
      examOnlyFields.forEach(el => el.classList.add('d-none'));
      timeGroupRegular.classList.add('d-none');
      timeGroupSpecific.classList.remove('d-none');
      if (groupExamTime) groupExamTime.classList.add('d-none');
      if (groupMakeupTimeDisplayWrap) groupMakeupTimeDisplayWrap.classList.remove('d-none');
      if (groupMakeupTime) groupMakeupTime.classList.remove('d-none');
      if (labelSpecificDate) labelSpecificDate.innerHTML = 'Ngày học bù <span class="text-danger">*</span>';
    } else {
      if (teacherClassGrid) teacherClassGrid.classList.remove('exam-mode');
      if (proctor2ColWrapper) proctor2ColWrapper.classList.add('d-none');
      clearFieldError(teacher2Select, 'errorTeacher2');
      teacherLabel.innerHTML = 'Giảng viên phụ trách <span class="text-danger">*</span>';
      examOnlyFields.forEach(el => el.classList.add('d-none'));
      timeGroupRegular.classList.remove('d-none');
      timeGroupSpecific.classList.add('d-none');
    }

    // Cập nhật placeholder cho teacherSelect nếu đã chọn khoa mà chưa chọn người
    if (deptSelect.value) {
      const deptId = deptSelect.value;
      const teachers = MOCK_DATA.teachers[deptId] || [];
      const curVal1 = teacherSelect.value;
      const t1Placeholder = type === 'exam' ? '-- Chọn Giám thị 1 --' : '-- Chọn Giảng viên --';
      teacherSelect.innerHTML = `<option value="" ${!curVal1 ? 'selected' : ''} disabled>${t1Placeholder}</option>` +
        teachers.map(t => `<option value="${t}" ${t === curVal1 ? 'selected' : ''}>${t}</option>`).join('');
      if (curVal1) teacherSelect.value = curVal1;

      if (teacher2Select) {
        const curVal2 = teacher2Select.value;
        teacher2Select.innerHTML = `<option value="" ${!curVal2 ? 'selected' : ''} disabled>-- Chọn Giám thị 2 --</option>` +
          teachers.map(t => `<option value="${t}" ${t === curVal2 ? 'selected' : ''}>${t}</option>`).join('');
        if (curVal2) teacher2Select.value = curVal2;
      }
    }
  }

  function populateDeptChildren(deptId, prefill = {}) {
    if (!deptId) {
      courseSelect.disabled = true;
      courseSelect.innerHTML = '<option value="" selected disabled>-- Vui lòng chọn Khoa trước --</option>';
      courseSelect.value = '';

      teacherSelect.disabled = true;
      teacherSelect.innerHTML = '<option value="" selected disabled>-- Vui lòng chọn Khoa trước --</option>';
      teacherSelect.value = '';

      if (teacher2Select) {
        teacher2Select.disabled = true;
        teacher2Select.innerHTML = '<option value="" selected disabled>-- Vui lòng chọn Khoa trước --</option>';
        teacher2Select.value = '';
      }

      if (classSectionSelect) {
        classSectionSelect.disabled = true;
        classSectionSelect.innerHTML = '<option value="" selected disabled>-- Vui lòng chọn Khoa trước --</option>';
        classSectionSelect.value = '';
      }
      return;
    }

    const courses = MOCK_DATA.courses[deptId] || [];
    const teachers = MOCK_DATA.teachers[deptId] || [];
    const sections = (MOCK_DATA.classSections && MOCK_DATA.classSections[deptId]) || ['CNTT-11', 'CNTT-12'];

    courseSelect.disabled = false;
    courseSelect.innerHTML = '<option value="" selected disabled>-- Chọn Môn học --</option>' +
      courses.map(c => `<option value="${c}">${c}</option>`).join('');
    courseSelect.value = prefill.course || '';
    clearFieldError(courseSelect, 'errorCourse');

    teacherSelect.disabled = false;
    const t1Placeholder = currentScheduleType === 'exam' ? '-- Chọn Giám thị 1 --' : '-- Chọn Giảng viên --';
    teacherSelect.innerHTML = `<option value="" selected disabled>${t1Placeholder}</option>` +
      teachers.map(t => `<option value="${t}">${t}</option>`).join('');
    teacherSelect.value = prefill.teacher || '';
    clearFieldError(teacherSelect, 'errorTeacher');

    if (teacher2Select) {
      teacher2Select.disabled = false;
      teacher2Select.innerHTML = '<option value="" selected disabled>-- Chọn Giám thị 2 --</option>' +
        teachers.map(t => `<option value="${t}">${t}</option>`).join('');
      teacher2Select.value = prefill.teacher2 || '';
      clearFieldError(teacher2Select, 'errorTeacher2');
    }

    if (classSectionSelect) {
      classSectionSelect.disabled = false;
      classSectionSelect.innerHTML = '<option value="" selected disabled>-- Chọn Lớp học phần --</option>' +
        sections.map(sec => `<option value="${sec}">${sec}</option>`).join('');
      classSectionSelect.value = prefill.classSection || '';
      clearFieldError(classSectionSelect, 'errorClassSection');
    }
  }

  function populateBuildingRooms(buildingId, prefillRoom = '') {
    if (!buildingId) {
      roomSelect.disabled = true;
      roomSelect.innerHTML = '<option value="" selected disabled>-- Vui lòng chọn Tòa nhà trước --</option>';
      roomSelect.value = '';
      return;
    }
    const rooms = MOCK_DATA.rooms[buildingId] || [];
    roomSelect.disabled = false;
    roomSelect.innerHTML = '<option value="" selected disabled>-- Chọn Phòng --</option>' +
      rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    roomSelect.value = prefillRoom || '';
    clearFieldError(roomSelect, 'errorRoom');
  }

  // 1. Reset Modal State về Trắng hoàn toàn (Thêm mới)
  function resetModalState() {
    editingScheduleId = null;
    if (modalTitleEl) modalTitleEl.innerText = 'Thêm Lịch Học / Lịch Thi';

    // A. Xóa toàn bộ trạng thái lỗi
    document.querySelectorAll('#formAddSchedule .is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('#formAddSchedule .field-error-msg').forEach(el => el.classList.add('d-none'));

    // B. Reset Loại lịch: Không chọn sẵn nút nào
    currentScheduleType = null;
    typeBtns.forEach(b => b.classList.remove('active'));
    if (teacherClassGrid) teacherClassGrid.classList.remove('exam-mode');
    if (proctor2ColWrapper) proctor2ColWrapper.classList.add('d-none');
    if (timeGroupEmptyHint) timeGroupEmptyHint.classList.remove('d-none');
    if (timeGroupRegular) timeGroupRegular.classList.add('d-none');
    if (timeGroupSpecific) timeGroupSpecific.classList.add('d-none');
    examOnlyFields.forEach(el => el.classList.add('d-none'));
    if (teacherLabel) teacherLabel.innerHTML = 'Giảng viên phụ trách <span class="text-danger">*</span>';

    // C. Reset Khoa, Môn học, Giảng viên, Giám thị 2, Lớp học phần (Disabled chờ chọn Khoa)
    deptSelect.innerHTML = '<option value="" selected disabled>-- Chọn Khoa / Viện --</option>' +
      MOCK_DATA.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    deptSelect.value = '';
    populateDeptChildren('');

    // D. Reset Tòa nhà & Phòng (Disabled chờ chọn Tòa nhà)
    buildingSelect.innerHTML = '<option value="" selected disabled>-- Chọn Tòa nhà --</option>' +
      MOCK_DATA.buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    buildingSelect.value = '';
    populateBuildingRooms('');

    // E. Reset Thời gian lịch học
    if (regularDaySelect) regularDaySelect.value = '';

    if (regularFromPeriod) {
      regularFromPeriod.innerHTML = buildAllPeriodOptionsHTML('-- Từ tiết --');
      regularFromPeriod.value = '';
    }

    if (regularToPeriod) {
      regularToPeriod.innerHTML = '<option value="" selected disabled>-- Chọn Từ tiết trước --</option>';
      regularToPeriod.value = '';
      regularToPeriod.disabled = true;
    }

    if (regularTimeDisplay) regularTimeDisplay.value = '-- : --';
    setRegularDateISO(regularStartDate, '');
    setRegularDateISO(regularEndDate, '');
    syncWeekdayDateInputsState();
    const pStart = document.getElementById('popupRegularStartDate');
    const pEnd = document.getElementById('popupRegularEndDate');
    if (pStart) pStart.classList.remove('show');
    if (pEnd) pEnd.classList.remove('show');

    // F. Reset Thời gian lịch thi & học bù
    if (specificDate) specificDate.value = '';
    if (makeupFromPeriod) {
      makeupFromPeriod.innerHTML = buildAllPeriodOptionsHTML('-- Từ tiết --');
      makeupFromPeriod.value = '';
    }
    if (makeupToPeriod) {
      makeupToPeriod.innerHTML = '<option value="" selected disabled>-- Chọn Từ tiết trước --</option>';
      makeupToPeriod.value = '';
      makeupToPeriod.disabled = true;
    }
    if (makeupTimeDisplay) makeupTimeDisplay.value = '-- : --';
    if (makeupSplitNote) {
      makeupSplitNote.innerText = '';
      makeupSplitNote.classList.add('d-none');
    }
    if (hourInput) hourInput.value = '';
    if (minuteInput) minuteInput.value = '';
    if (previewBadge) previewBadge.innerText = '--h--';

    // G. Reset Hộp cảnh báo trùng lịch: Ẩn đi hoàn toàn
    if (alertBox) alertBox.classList.add('d-none');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Thêm Lịch Mới';
      submitBtn.className = 'btn btn-primary-custom px-4 fw-bold shadow-sm';
    }
  }

  // Mở modal ở chế độ Chỉnh sửa & tự động đổ dữ liệu cũ
  window.openEditScheduleModal = function(id) {
    const item = schedulesData.find(s => s.id === id);
    if (!item || !modalEl) return;

    isOpeningForEdit = true;
    resetModalState();
    editingScheduleId = id;
    if (modalTitleEl) modalTitleEl.innerText = 'Chỉnh Sửa Lịch Học / Lịch Thi';

    const editType = item.type === 'canceled' ? (item.originalType || 'regular_class') : item.type;
    applyScheduleTypeUI(editType);

    // Tìm Khoa phù hợp theo tên khoa hoặc tên môn
    let matchedDept = MOCK_DATA.departments.find(d => d.name === item.dept);
    if (!matchedDept) {
      matchedDept = MOCK_DATA.departments.find(d => (MOCK_DATA.courses[d.id] || []).includes(item.course)) || MOCK_DATA.departments[0];
    }
    const deptId = matchedDept ? matchedDept.id : 'cntt';
    deptSelect.value = deptId;

    // Đảm bảo giá trị hiện tại luôn có trong dropdown khi sửa
    if (item.course && !(MOCK_DATA.courses[deptId] || []).includes(item.course)) {
      MOCK_DATA.courses[deptId] = [item.course, ...(MOCK_DATA.courses[deptId] || [])];
    }
    if (item.teacher && !(MOCK_DATA.teachers[deptId] || []).includes(item.teacher)) {
      MOCK_DATA.teachers[deptId] = [item.teacher, ...(MOCK_DATA.teachers[deptId] || [])];
    }
    if (item.teacher2 && !(MOCK_DATA.teachers[deptId] || []).includes(item.teacher2)) {
      MOCK_DATA.teachers[deptId] = [item.teacher2, ...(MOCK_DATA.teachers[deptId] || [])];
    }
    if (item.classSection && !(MOCK_DATA.classSections[deptId] || []).includes(item.classSection)) {
      MOCK_DATA.classSections[deptId] = [item.classSection, ...(MOCK_DATA.classSections[deptId] || [])];
    }

    populateDeptChildren(deptId, {
      course: item.course,
      teacher: item.teacher,
      teacher2: item.teacher2 || '',
      classSection: item.classSection || ''
    });

    // Tìm Tòa nhà & Phòng
    const matchedBld = MOCK_DATA.buildings.find(b => b.name === item.building) || MOCK_DATA.buildings[0];
    const bldId = matchedBld ? matchedBld.id : 'toa_a';
    buildingSelect.value = bldId;
    populateBuildingRooms(bldId, item.room);

    // Đổ thời gian
    if (editType === 'regular_class') {
      if (regularDaySelect && item.dayLabel) regularDaySelect.value = item.dayLabel;
      syncWeekdayDateInputsState();
      const pMatch = (item.periods || '').match(/(\d+)\s*-\s*(\d+)/);
      if (pMatch) {
        const fromP = parseInt(pMatch[1], 10);
        const toP = parseInt(pMatch[2], 10);
        regularFromPeriod.value = String(fromP);
        regularToPeriod.disabled = false;
        regularToPeriod.innerHTML = buildToPeriodOptionsHTML(fromP, '-- Đến tiết --');
        regularToPeriod.value = String(toP);
        regularTimeDisplay.value = calculatePeriodTime(fromP, toP);
      }
      if (item.dateRange) {
        const delim = item.dateRange.includes('đến') ? 'đến' : ' - ';
        const dParts = item.dateRange.split(delim).map(x => x.trim());
        if (dParts.length === 2) {
          const sObj = parseVNDateToObj(dParts[0]);
          const eObj = parseVNDateToObj(dParts[1]);
          if (sObj) setRegularDateISO(regularStartDate, toISODate(sObj));
          if (eObj) setRegularDateISO(regularEndDate, toISODate(eObj));
        }
      }
    } else if (editType === 'makeup_class') {
      if (specificDate) specificDate.value = item.dateStr || '';
      const pMatch = (item.periods || '').match(/(\d+)\s*-\s*(\d+)/);
      if (pMatch && makeupFromPeriod && makeupToPeriod) {
        const fromP = parseInt(pMatch[1], 10);
        const toP = parseInt(pMatch[2], 10);
        makeupFromPeriod.value = String(fromP);
        makeupToPeriod.disabled = false;
        makeupToPeriod.innerHTML = buildToPeriodOptionsHTML(fromP, '-- Đến tiết --');
        makeupToPeriod.value = String(toP);
        if (makeupTimeDisplay) makeupTimeDisplay.value = calculatePeriodTime(fromP, toP);
      }
    } else if (editType === 'exam') {
      if (specificDate) specificDate.value = item.dateStr || '';
      const tMatch = (item.timeRange || '').match(/(\d{1,2})[hHg:](\d{1,2})/);
      if (tMatch && hourInput && minuteInput) {
        hourInput.value = tMatch[1].padStart(2, '0');
        minuteInput.value = tMatch[2].padStart(2, '0');
        previewBadge.innerText = `${hourInput.value}h${minuteInput.value}`;
      }
      const fmtEl = document.getElementById('modalExamFormat');
      const durEl = document.getElementById('modalExamDuration');
      const grpEl = document.getElementById('modalExamGroup');
      if (fmtEl && item.examFormat) fmtEl.value = item.examFormat;
      if (durEl && item.examDuration) durEl.value = item.examDuration;
      if (grpEl && item.examGroup) grpEl.value = item.examGroup;
    }

    if (submitBtn) {
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Lưu Thay Đổi';
      submitBtn.className = 'btn btn-primary-custom px-4 fw-bold shadow-sm';
    }

    triggerConflictCheck();

    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  };

  // Lắng nghe sự kiện modal mở (Bootstrap show.bs.modal)
  if (modalEl) {
    modalEl.addEventListener('show.bs.modal', () => {
      if (isOpeningForEdit) {
        isOpeningForEdit = false;
        return;
      }
      resetModalState();
    });
  }

  // 2. Chuyển đổi Loại lịch (Người dùng click chủ động)
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      applyScheduleTypeUI(btn.getAttribute('data-type'));
      triggerConflictCheck();
    });
  });

  // 3. Thao tác tuần tự: Khoa -> Môn học, Giảng viên, Giám thị 2 & Lớp học phần
  deptSelect.addEventListener('change', () => {
    clearFieldError(deptSelect, 'errorDept');
    populateDeptChildren(deptSelect.value);
    triggerConflictCheck();
  });

  courseSelect.addEventListener('change', () => {
    clearFieldError(courseSelect, 'errorCourse');
    const courseName = courseSelect.value;
    // Gợi ý giảng viên phụ trách nếu có và chưa chọn
    const defaultTeacher = MOCK_DATA.defaultTeachers[courseName];
    if (defaultTeacher && (!teacherSelect.value || teacherSelect.value === '')) {
      for (let i = 0; i < teacherSelect.options.length; i++) {
        if (teacherSelect.options[i].value === defaultTeacher) {
          teacherSelect.value = defaultTeacher;
          clearFieldError(teacherSelect, 'errorTeacher');
          break;
        }
      }
    }
    triggerConflictCheck();
  });

  teacherSelect.addEventListener('change', () => {
    clearFieldError(teacherSelect, 'errorTeacher');
    if (currentScheduleType === 'exam' && teacher2Select && teacher2Select.value && teacherSelect.value !== teacher2Select.value) {
      clearFieldError(teacher2Select, 'errorTeacher2');
    }
    triggerConflictCheck();
  });

  if (teacher2Select) {
    teacher2Select.addEventListener('change', () => {
      if (currentScheduleType === 'exam' && teacherSelect.value && teacher2Select.value === teacherSelect.value) {
        setFieldError(teacher2Select, 'errorTeacher2', 'Giám thị 2 không được trùng với Giám thị 1');
      } else {
        clearFieldError(teacher2Select, 'errorTeacher2');
      }
      triggerConflictCheck();
    });
  }

  if (classSectionSelect) {
    classSectionSelect.addEventListener('change', () => {
      clearFieldError(classSectionSelect, 'errorClassSection');
    });
  }

  // 4. Thao tác tuần tự: Tòa nhà -> Phòng
  buildingSelect.addEventListener('change', () => {
    clearFieldError(buildingSelect, 'errorBuilding');
    populateBuildingRooms(buildingSelect.value);
    triggerConflictCheck();
  });

  roomSelect.addEventListener('change', () => {
    clearFieldError(roomSelect, 'errorRoom');
    triggerConflictCheck();
  });

  // 5. Thao tác tuần tự thời gian: Thứ -> Từ ngày / Đến ngày (Khóa đúng thứ), Từ tiết -> Đến tiết
  function getTargetJsDayFromLabel(dayLabel) {
    const map = { 'Chủ Nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6 };
    return Object.prototype.hasOwnProperty.call(map, dayLabel) ? map[dayLabel] : null;
  }

  function getRegularDateISO(inputEl) {
    return (inputEl && inputEl.dataset && inputEl.dataset.iso) ? inputEl.dataset.iso : '';
  }

  function setRegularDateISO(inputEl, iso) {
    if (!inputEl) return;
    inputEl.dataset.iso = iso || '';
    inputEl.value = iso ? formatVNStandardDate(iso).replace(/-/g, '/') : '';
  }

  function syncWeekdayDateInputsState() {
    const dayLabel = regularDaySelect ? regularDaySelect.value : '';
    const targetJsDay = getTargetJsDayFromLabel(dayLabel);

    [regularStartDate, regularEndDate].forEach(inp => {
      if (!inp) return;
      if (targetJsDay === null) {
        inp.disabled = true;
        inp.placeholder = '-- Chọn Thứ trước --';
        setRegularDateISO(inp, '');
      } else {
        inp.disabled = false;
        inp.placeholder = `Chọn ngày (${dayLabel})...`;
        const curIso = getRegularDateISO(inp);
        if (curIso) {
          const p = curIso.split('-');
          const d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
          if (d.getDay() !== targetJsDay) {
            setRegularDateISO(inp, '');
          }
        }
      }
    });
  }

  function setupWeekdayDatePicker(inputEl, popupEl, errorId, isEndDate) {
    if (!inputEl || !popupEl) return;
    let viewYear = 2026;
    let viewMonth = 10; // 0-indexed (10 = Tháng 11)

    function renderPopup() {
      const dayLabel = regularDaySelect ? regularDaySelect.value : '';
      const targetJsDay = getTargetJsDayFromLabel(dayLabel);
      if (targetJsDay === null) {
        popupEl.classList.remove('show');
        return;
      }

      const selectedIso = getRegularDateISO(inputEl);
      const minIso = isEndDate ? getRegularDateISO(regularStartDate) : '';
      const firstDay = new Date(viewYear, viewMonth, 1);
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0..Sun=6
      const dowLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const dowJsMap = [1, 2, 3, 4, 5, 6, 0];

      let html = `
        <div class="wdp-header">
          <button type="button" class="wdp-nav-btn" data-wdp-nav="-1"><i class="bi bi-chevron-left"></i></button>
          <div class="text-center">
            <div class="fw-bold text-dark" style="font-size: 0.88rem;">Tháng ${viewMonth + 1}, ${viewYear}</div>
            <span class="badge bg-primary-subtle text-primary" style="font-size: 0.7rem;">Chỉ chọn ${dayLabel}</span>
          </div>
          <button type="button" class="wdp-nav-btn" data-wdp-nav="1"><i class="bi bi-chevron-right"></i></button>
        </div>
        <div class="wdp-grid">
          ${dowLabels.map((lbl, idx) => `<div class="wdp-dow ${dowJsMap[idx] === targetJsDay ? 'allowed' : ''}">${lbl}</div>`).join('')}
      `;

      for (let i = 0; i < startOffset; i++) {
        html += '<div></div>';
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(viewYear, viewMonth, d);
        const cellIso = toISODate(cellDate);
        const matchesWeekday = cellDate.getDay() === targetJsDay;
        const meetsMin = !minIso || cellIso >= minIso;
        const isEnabled = matchesWeekday && meetsMin;
        const isSelected = cellIso === selectedIso;

        html += `<button type="button" class="wdp-day ${isSelected ? 'selected' : ''}" data-wdp-iso="${cellIso}" ${isEnabled ? '' : 'disabled'}>${d}</button>`;
      }

      html += '</div>';
      popupEl.innerHTML = html;

      popupEl.querySelectorAll('.wdp-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const delta = parseInt(btn.getAttribute('data-wdp-nav'), 10);
          const nextD = new Date(viewYear, viewMonth + delta, 1);
          viewYear = nextD.getFullYear();
          viewMonth = nextD.getMonth();
          renderPopup();
        });
      });

      popupEl.querySelectorAll('.wdp-day:not(:disabled)').forEach(dayBtn => {
        dayBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const chosenIso = dayBtn.getAttribute('data-wdp-iso');
          setRegularDateISO(inputEl, chosenIso);
          clearFieldError(inputEl, errorId);
          popupEl.classList.remove('show');

          if (!isEndDate) {
            const endIso = getRegularDateISO(regularEndDate);
            if (endIso && endIso < chosenIso) {
              setRegularDateISO(regularEndDate, '');
            }
          } else {
            const startIso = getRegularDateISO(regularStartDate);
            if (startIso && chosenIso < startIso) {
              setFieldError(regularEndDate, 'errorRegularEnd', 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
            } else {
              clearFieldError(regularEndDate, 'errorRegularEnd');
            }
          }
        });
      });
    }

    inputEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (inputEl.disabled) return;

      document.querySelectorAll('.weekday-datepicker-popup').forEach(p => {
        if (p !== popupEl) p.classList.remove('show');
      });

      const curIso = getRegularDateISO(inputEl) || (isEndDate ? getRegularDateISO(regularStartDate) : '');
      if (curIso) {
        const p = curIso.split('-');
        viewYear = parseInt(p[0], 10);
        viewMonth = parseInt(p[1], 10) - 1;
      } else {
        viewYear = 2026;
        viewMonth = 10;
      }

      renderPopup();
      popupEl.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!popupEl.contains(e.target) && e.target !== inputEl) {
        popupEl.classList.remove('show');
      }
    });
  }

  setupWeekdayDatePicker(regularStartDate, document.getElementById('popupRegularStartDate'), 'errorRegularStart', false);
  setupWeekdayDatePicker(regularEndDate, document.getElementById('popupRegularEndDate'), 'errorRegularEnd', true);

  regularDaySelect.addEventListener('change', () => {
    clearFieldError(regularDaySelect, 'errorRegularDay');
    syncWeekdayDateInputsState();
    triggerConflictCheck();
  });

  function updatePeriodSelectionPreview(fromSelect, toSelect, timeInput) {
    const fromVal = parseInt(fromSelect ? fromSelect.value : '', 10);
    const toVal = parseInt(toSelect ? toSelect.value : '', 10);

    if (!isNaN(fromVal) && !isNaN(toVal) && toVal >= fromVal) {
      const segments = splitPeriodsBySession(fromVal, toVal);
      if (segments.length <= 1) {
        if (timeInput) timeInput.value = calculatePeriodTime(fromVal, toVal);
      } else {
        if (timeInput) timeInput.value = segments.map(s => `${s.periods} (${s.timeRange})`).join(' | ');
      }
    } else {
      if (timeInput) timeInput.value = '-- : --';
    }
  }

  regularFromPeriod.addEventListener('change', () => {
    clearFieldError(regularFromPeriod, 'errorRegularFrom');
    const fromVal = parseInt(regularFromPeriod.value, 10);

    if (isNaN(fromVal)) {
      regularToPeriod.disabled = true;
      regularToPeriod.innerHTML = '<option value="" selected disabled>-- Chọn Từ tiết trước --</option>';
      regularToPeriod.value = '';
    } else {
      regularToPeriod.disabled = false;
      regularToPeriod.innerHTML = buildToPeriodOptionsHTML(fromVal, '-- Đến tiết --');
      regularToPeriod.value = '';
      clearFieldError(regularToPeriod, 'errorRegularTo');
    }

    updatePeriodSelectionPreview(regularFromPeriod, regularToPeriod, regularTimeDisplay);
    triggerConflictCheck();
  });

  regularToPeriod.addEventListener('change', () => {
    clearFieldError(regularToPeriod, 'errorRegularTo');
    updatePeriodSelectionPreview(regularFromPeriod, regularToPeriod, regularTimeDisplay);
    triggerConflictCheck();
  });

  // 6. Nhập giờ thi (Lịch thi) & Từ tiết -> Đến tiết (Lịch học bù)
  specificDate.addEventListener('change', () => {
    clearFieldError(specificDate, 'errorSpecificDate');
    triggerConflictCheck();
  });

  if (makeupFromPeriod && makeupToPeriod) {
    makeupFromPeriod.addEventListener('change', () => {
      clearFieldError(makeupFromPeriod, 'errorMakeupFrom');
      const fromVal = parseInt(makeupFromPeriod.value, 10);

      if (isNaN(fromVal)) {
        makeupToPeriod.disabled = true;
        makeupToPeriod.innerHTML = '<option value="" selected disabled>-- Chọn Từ tiết trước --</option>';
        makeupToPeriod.value = '';
      } else {
        makeupToPeriod.disabled = false;
        makeupToPeriod.innerHTML = buildToPeriodOptionsHTML(fromVal, '-- Đến tiết --');
        makeupToPeriod.value = '';
        clearFieldError(makeupToPeriod, 'errorMakeupTo');
      }

      updatePeriodSelectionPreview(makeupFromPeriod, makeupToPeriod, makeupTimeDisplay);
      triggerConflictCheck();
    });

    makeupToPeriod.addEventListener('change', () => {
      clearFieldError(makeupToPeriod, 'errorMakeupTo');
      updatePeriodSelectionPreview(makeupFromPeriod, makeupToPeriod, makeupTimeDisplay);
      triggerConflictCheck();
    });
  }

  function getFormattedExamTime() {
    if (!hourInput || !minuteInput) return '';
    let h = hourInput.value.replace(/\D/g, '');
    let m = minuteInput.value.replace(/\D/g, '');
    if (h.length === 0 || m.length === 0) return '';
    return `${h.padStart(2, '0')}h${m.padStart(2, '0')}`;
  }

  function updateExamTimeBadge() {
    const formatted = getFormattedExamTime();
    if (formatted) {
      previewBadge.innerText = formatted;
      clearFieldError(document.getElementById('examTimeInputGroup'), 'errorExamTime');
    } else {
      previewBadge.innerText = '--h--';
    }
    triggerConflictCheck();
  }

  if (hourInput && minuteInput) {
    hourInput.addEventListener('input', () => {
      hourInput.value = hourInput.value.replace(/\D/g, '');
      const val = hourInput.value;
      if (parseInt(val, 10) > 23) {
        hourInput.value = '23';
      }
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
      const val = minuteInput.value;
      if (parseInt(val, 10) > 59) {
        minuteInput.value = '59';
      }
      updateExamTimeBadge();
    });

    minuteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && minuteInput.value.length === 0) {
        hourInput.focus();
      }
    });
  }

  // 7. Logic kiểm tra trùng lịch (CHỈ CHẠY KHI ĐÃ ĐỦ THÔNG TIN LIÊN QUAN)
  function triggerConflictCheck() {
    if (!alertBox || !alertMsg || !alertIcon) return;

    if (!currentScheduleType) {
      alertBox.classList.add('d-none');
      return;
    }

    const selectedRoom = roomSelect.value;
    const selectedTeacher = teacherSelect.value;
    const selectedTeacher2 = (currentScheduleType === 'exam' && teacher2Select) ? teacher2Select.value : '';

    // Kiểm tra trùng 2 giám thị trong cùng ca thi
    if (currentScheduleType === 'exam' && selectedTeacher && selectedTeacher2 && selectedTeacher === selectedTeacher2) {
      alertBox.classList.remove('d-none');
      alertBox.className = 'alert alert-warning d-flex align-items-center gap-2 py-2 px-3 mb-0 rounded-3 mt-3 border-warning-subtle';
      alertIcon.className = 'bi bi-exclamation-triangle-fill text-warning fs-5';
      alertMsg.innerHTML = `<strong>⚠️ LƯU Ý GIÁM THỊ:</strong> Giám thị 1 và Giám thị 2 đang chọn trùng cùng 1 người ([${selectedTeacher}]). Vui lòng chọn 2 giám thị khác nhau.`;
      return;
    }

    if (!selectedRoom && !selectedTeacher) {
      alertBox.classList.add('d-none');
      return;
    }

    let targetDayKey = null;

    if (currentScheduleType === 'regular_class') {
      if (!regularDaySelect.value || !regularFromPeriod.value || !regularToPeriod.value) {
        alertBox.classList.add('d-none');
        return;
      }
      targetDayKey = convertDayNameToKey(regularDaySelect.value);
    } else if (currentScheduleType === 'makeup_class') {
      if (!specificDate.value || !makeupFromPeriod || !makeupFromPeriod.value || !makeupToPeriod || !makeupToPeriod.value) {
        alertBox.classList.add('d-none');
        return;
      }
      targetDayKey = convertDateToDayKey(specificDate.value);
    } else {
      if (!specificDate.value || !hourInput.value || !minuteInput.value) {
        alertBox.classList.add('d-none');
        return;
      }
      targetDayKey = convertDateToDayKey(specificDate.value);
    }

    alertBox.classList.remove('d-none');
    const conflicts = [];

    schedulesData.forEach(s => {
      if (editingScheduleId && s.id === editingScheduleId) return;
      if (s.dayKey === targetDayKey && s.type !== 'canceled') {
        if (selectedRoom && s.room === selectedRoom) {
          conflicts.push(`Phòng [${s.room}] đã có lịch "${s.course}" vào khung giờ ${s.timeRange}`);
        }
        if (selectedTeacher && (s.teacher === selectedTeacher || s.teacher2 === selectedTeacher)) {
          conflicts.push(`Cán bộ [${selectedTeacher}] đã có lịch "${s.course}"`);
        }
        if (selectedTeacher2 && (s.teacher === selectedTeacher2 || s.teacher2 === selectedTeacher2)) {
          conflicts.push(`Giám thị 2 [${selectedTeacher2}] đã có lịch "${s.course}"`);
        }
      }
    });

    if (conflicts.length > 0) {
      alertBox.className = 'alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-0 rounded-3 mt-3 border-danger-subtle';
      alertIcon.className = 'bi bi-exclamation-triangle-fill text-danger fs-5';
      alertMsg.innerHTML = `<strong>⚠️ CẢNH BÁO TRÙNG LỊCH:</strong> ${conflicts.join(' & ')}! Vui lòng chọn phòng học khác hoặc đổi ngày/ca.`;
      if (submitBtn) {
        submitBtn.innerHTML = editingScheduleId
          ? '<i class="bi bi-exclamation-octagon me-1"></i> Vẫn Lưu (Bị Trùng)'
          : '<i class="bi bi-exclamation-octagon me-1"></i> Vẫn Thêm (Bị Trùng)';
        submitBtn.className = 'btn btn-warning px-4 fw-bold shadow-sm text-dark';
      }
    } else {
      alertBox.className = 'alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-0 rounded-3 mt-3 border-success-subtle';
      alertIcon.className = 'bi bi-check-circle-fill text-success fs-5';
      const roomText = selectedRoom ? `Phòng [${selectedRoom}]` : 'Phòng học';
      const teacherText = selectedTeacher ? selectedTeacher : 'Giảng viên';
      alertMsg.innerHTML = `<strong>✅ Trạng thái hợp lệ:</strong> ${roomText} và ${teacherText} đều trống trong khung giờ này!`;
      if (submitBtn) {
        submitBtn.innerHTML = editingScheduleId
          ? '<i class="bi bi-check-circle me-1"></i> Lưu Thay Đổi'
          : '<i class="bi bi-plus-circle me-1"></i> Thêm Lịch Mới';
        submitBtn.className = 'btn btn-primary-custom px-4 fw-bold shadow-sm';
      }
    }
  }

  // 8. Validation toàn diện & Submit Form (Thêm mới + Chỉnh sửa)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const invalidEls = [];

      // 1. Kiểm tra loại lịch
      if (!currentScheduleType) {
        invalidEls.push(setFieldError(typeSelector, 'errorScheduleType', 'Vui lòng bấm chọn loại lịch đào tạo'));
      }

      // 2. Kiểm tra Khoa
      if (!deptSelect.value) {
        invalidEls.push(setFieldError(deptSelect, 'errorDept', 'Vui lòng chọn Khoa / Viện đào tạo'));
      }

      // 3. Kiểm tra Môn học
      if (!courseSelect.value) {
        invalidEls.push(setFieldError(courseSelect, 'errorCourse', 'Vui lòng chọn Môn học'));
      }

      // 4. Kiểm tra Giảng viên / Giám thị 1
      if (!teacherSelect.value) {
        const msg = currentScheduleType === 'exam' ? 'Vui lòng chọn Giám thị 1' : 'Vui lòng chọn Giảng viên phụ trách';
        invalidEls.push(setFieldError(teacherSelect, 'errorTeacher', msg));
      }

      // 4b. Nếu là Lịch thi -> Bắt buộc Giám thị 2 & không được trùng Giám thị 1
      if (currentScheduleType === 'exam' && teacher2Select) {
        if (!teacher2Select.value) {
          invalidEls.push(setFieldError(teacher2Select, 'errorTeacher2', 'Vui lòng chọn Giám thị 2'));
        } else if (teacherSelect.value && teacher2Select.value === teacherSelect.value) {
          invalidEls.push(setFieldError(teacher2Select, 'errorTeacher2', 'Giám thị 2 không được trùng với Giám thị 1'));
        }
      }

      // 4c. Kiểm tra Lớp học phần (bắt buộc cho cả 3 loại lịch)
      if (classSectionSelect && !classSectionSelect.value) {
        invalidEls.push(setFieldError(classSectionSelect, 'errorClassSection', 'Vui lòng chọn Lớp học phần'));
      }

      // 5. Kiểm tra Tòa nhà
      if (!buildingSelect.value) {
        invalidEls.push(setFieldError(buildingSelect, 'errorBuilding', 'Vui lòng chọn Tòa nhà'));
      }

      // 6. Kiểm tra Phòng
      if (!roomSelect.value) {
        invalidEls.push(setFieldError(roomSelect, 'errorRoom', 'Vui lòng chọn Phòng học / Phòng thi'));
      }

      // 7. Kiểm tra thời gian
      if (currentScheduleType === 'regular_class') {
        if (!regularDaySelect.value) {
          invalidEls.push(setFieldError(regularDaySelect, 'errorRegularDay', 'Vui lòng chọn Thứ trong tuần'));
        }
        if (!regularFromPeriod.value) {
          invalidEls.push(setFieldError(regularFromPeriod, 'errorRegularFrom', 'Vui lòng chọn Từ tiết'));
        }
        if (!regularToPeriod.value) {
          invalidEls.push(setFieldError(regularToPeriod, 'errorRegularTo', 'Vui lòng chọn Đến tiết'));
        }
        const startIsoVal = getRegularDateISO(regularStartDate);
        const endIsoVal = getRegularDateISO(regularEndDate);
        if (!startIsoVal) {
          invalidEls.push(setFieldError(regularStartDate, 'errorRegularStart', 'Vui lòng chọn ngày bắt đầu'));
        }
        if (!endIsoVal) {
          invalidEls.push(setFieldError(regularEndDate, 'errorRegularEnd', 'Vui lòng chọn ngày kết thúc'));
        } else if (startIsoVal && endIsoVal < startIsoVal) {
          invalidEls.push(setFieldError(regularEndDate, 'errorRegularEnd', 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'));
        }
      } else if (currentScheduleType === 'makeup_class') {
        if (!specificDate.value) {
          invalidEls.push(setFieldError(specificDate, 'errorSpecificDate', 'Vui lòng chọn Ngày học bù'));
        }
        if (makeupFromPeriod && !makeupFromPeriod.value) {
          invalidEls.push(setFieldError(makeupFromPeriod, 'errorMakeupFrom', 'Vui lòng chọn Từ tiết'));
        }
        if (makeupToPeriod && !makeupToPeriod.value) {
          invalidEls.push(setFieldError(makeupToPeriod, 'errorMakeupTo', 'Vui lòng chọn Đến tiết'));
        }
      } else if (currentScheduleType === 'exam') {
        if (!specificDate.value) {
          invalidEls.push(setFieldError(specificDate, 'errorSpecificDate', 'Vui lòng chọn Ngày diễn ra thi'));
        }
        const examTimeVal = getFormattedExamTime();
        if (!examTimeVal || !hourInput.value || !minuteInput.value) {
          invalidEls.push(setFieldError(document.getElementById('examTimeInputGroup'), 'errorExamTime', 'Vui lòng nhập giờ thi hợp lệ (vd: 12h30)'));
        }
      }

      // Nếu có lỗi -> cuộn modal tới ô lỗi đầu tiên và chặn lưu
      if (invalidEls.length > 0) {
        const firstErr = invalidEls[0];
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof firstErr.focus === 'function') {
            firstErr.focus();
          }
        }
        return false;
      }

      let targetDayKey = 'th4';
      let targetDayLabel = 'Thứ 4';
      let targetDateStr = '';
      let targetDateRange = '';
      let periodSegments = [];

      if (currentScheduleType === 'regular_class') {
        targetDayKey = convertDayNameToKey(regularDaySelect.value);
        targetDayLabel = regularDaySelect.value;
        const startFormatted = formatVNStandardDate(getRegularDateISO(regularStartDate));
        const endFormatted = formatVNStandardDate(getRegularDateISO(regularEndDate));
        targetDateRange = (startFormatted && endFormatted) ? `${startFormatted} đến ${endFormatted}` : '';
        periodSegments = splitPeriodsBySession(regularFromPeriod.value, regularToPeriod.value);
      } else if (currentScheduleType === 'makeup_class') {
        targetDateStr = specificDate.value;
        targetDayKey = convertDateToDayKey(targetDateStr);
        targetDayLabel = convertDayKeyToLabel(targetDayKey);
        periodSegments = splitPeriodsBySession(makeupFromPeriod.value, makeupToPeriod.value);
      } else {
        targetDateStr = specificDate.value;
        targetDayKey = convertDateToDayKey(targetDateStr);
        targetDayLabel = convertDayKeyToLabel(targetDayKey);
        periodSegments = [{ periods: 'Ca thi', timeRange: getFormattedExamTime() }];
      }

      const basePayload = {
        type: currentScheduleType,
        course: courseSelect.value,
        classSection: classSectionSelect ? classSectionSelect.value : '',
        dept: deptSelect.options[deptSelect.selectedIndex].text,
        teacher: teacherSelect.value,
        teacher2: (currentScheduleType === 'exam' && teacher2Select) ? teacher2Select.value : '',
        room: roomSelect.value,
        building: buildingSelect.options[buildingSelect.selectedIndex].text,
        dayKey: targetDayKey,
        dayLabel: targetDayLabel,
        dateStr: targetDateStr,
        dateRange: targetDateRange,
        examFormat: document.getElementById('modalExamFormat') ? document.getElementById('modalExamFormat').value : '',
        examDuration: document.getElementById('modalExamDuration') ? document.getElementById('modalExamDuration').value : '',
        examGroup: document.getElementById('modalExamGroup') ? document.getElementById('modalExamGroup').value : '',
        status: currentScheduleType === 'exam' ? 'Sắp thi' : 'Sắp diễn ra'
      };

      const builtRecords = periodSegments.map((seg, idx) => ({
        ...basePayload,
        periods: seg.periods,
        timeRange: seg.timeRange,
        _segIdx: idx
      }));

      const wasEditing = Boolean(editingScheduleId);
      if (wasEditing) {
        const idx = schedulesData.findIndex(s => s.id === editingScheduleId);
        if (idx !== -1 && builtRecords.length > 0) {
          const firstRec = { ...builtRecords[0] };
          delete firstRec._segIdx;
          schedulesData[idx] = { ...schedulesData[idx], ...firstRec };
          // Nếu khi sửa chọn xuyên buổi -> chèn thêm các ca còn lại
          for (let i = builtRecords.length - 1; i >= 1; i--) {
            const extra = { ...builtRecords[i] };
            delete extra._segIdx;
            schedulesData.splice(idx + 1, 0, { id: 'SCH_' + (Date.now() + i), ...extra });
          }
        }
      } else {
        for (let i = builtRecords.length - 1; i >= 0; i--) {
          const rec = { ...builtRecords[i] };
          delete rec._segIdx;
          schedulesData.unshift({
            id: 'SCH_' + (Date.now() + i),
            ...rec
          });
        }
      }

      // Chuyển view ngày sang ngày có lịch mới/đã sửa để xem trực quan
      if (targetDateStr) {
        const p = targetDateStr.split('-');
        syncDateState(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
      } else if (getRegularDateISO(regularStartDate)) {
        const p = getRegularDateISO(regularStartDate).split('-');
        let d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        for (let i = 0; i < 7; i++) {
          if (getDayKeyFromDate(d) === targetDayKey) break;
          d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        }
        syncDateState(d);
      }

      // Render lại giao diện Lịch học & đồng bộ ngay Bảng Điểm Danh
      renderScheduleUI();
      refreshAttendanceCourseOptions();
      renderAttendanceTable();

      // Đóng modal
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) {
        bsModal.hide();
      }

      const typeLabel = currentScheduleType === 'exam' ? 'Lịch thi' : (currentScheduleType === 'makeup_class' ? 'Lịch học bù' : 'Lịch học');
      const splitInfo = builtRecords.length > 1
        ? ` (Đã tự động tách thành ${builtRecords.length} ca: ${builtRecords.map(r => `Tiết ${r.periods}`).join(' & ')})`
        : '';
      getSwalBootstrap().fire({
        title: wasEditing ? `Đã cập nhật ${typeLabel}!` : `Đã thêm ${typeLabel}!`,
        text: `${basePayload.course} (${basePayload.classSection} • ${basePayload.room})${splitInfo} đã được lưu thành công.`,
        icon: "success",
        confirmButtonText: "Hoàn tất"
      });
    });
  }

  // Khởi tạo ban đầu ở trạng thái trắng
  resetModalState();
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
