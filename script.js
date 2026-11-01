// =========================================
// 0. 다크 모드 전환 (화면이 늦게 바뀌지 않도록 가장 먼저 실행)
// =========================================
const THEME_KEY = "theme"; // localStorage에 저장할 때 쓰는 이름표
const themeToggle = document.querySelector(".theme-toggle");

// 모드를 실제로 적용하는 함수: <html data-theme="dark|light">로 바꾸면
// style.css의 :root[data-theme="dark"]가 색 변수 값을 바꿔 줌
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const isDark = theme === "dark";
  // 버튼에는 "누르면 바뀔 모드"의 아이콘을 보여 줌
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
}

// 처음 열 때: 저장된 선택이 있으면 그것을, 없으면 컴퓨터(운영체제) 설정을 따름
const savedTheme = localStorage.getItem(THEME_KEY);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

// 버튼을 누르면 반대 모드로 바꾸고, 선택을 localStorage에 저장 (새로고침해도 유지)
themeToggle.addEventListener("click", function () {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

// =========================================
// 1. 모바일 햄버거 메뉴 열기/닫기
// =========================================
const menuToggle = document.querySelector(".menu-toggle"); // ☰ 버튼
const nav = document.querySelector(".nav");                // 메뉴 링크 묶음

menuToggle.addEventListener("click", function () {
  // is-open 클래스를 붙였다 뗐다 함 (CSS가 이 클래스를 보고 메뉴를 보여 줌)
  const isOpen = nav.classList.toggle("is-open");
  // 화면 읽기 프로그램을 위해 열림 상태도 알려 줌
  menuToggle.setAttribute("aria-expanded", isOpen);
});

// 메뉴 링크를 누르면 메뉴를 닫음 (부드러운 스크롤은 CSS의 scroll-behavior가 담당)
nav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", false);
  });
});

// =========================================
// 2. 스크롤 등장 효과 + 기술 막대 그래프
//    - 각 섹션이 화면에 들어오면 내용이 아래에서 위로 부드럽게 나타남
//    - 기술 섹션이 나타날 때 막대가 0%에서 목표값까지 하나씩 차례로 채워짐
//    - scroll 이벤트 대신 IntersectionObserver 사용
//      (스크롤할 때마다 계산하지 않고, 브라우저가 "화면에 들어왔다"고 알려 줄 때만 실행 → 가벼움)
// =========================================
const skills = document.querySelectorAll(".skill");   // 기술 하나하나

const GROW_TIME = 1000;   // 막대 하나가 다 자라는 데 걸리는 시간 (style.css의 transition 1s와 맞춤)
const STEP_DELAY = 400;   // 다음 막대가 출발하기까지 기다리는 시간
const SKILL_START_DELAY = 300; // 섹션이 떠오르기 시작한 뒤 막대가 출발하기까지 기다리는 시간

// 퍼센트 숫자를 0부터 목표값까지 막대와 같은 속도로 올려 주는 함수
function countUp(label, target) {
  const startTime = performance.now(); // 시작 시각 기록

  function update(now) {
    // 지금까지 흐른 시간의 비율 (0 → 1)
    const progress = Math.min((now - startTime) / GROW_TIME, 1);
    label.textContent = Math.round(target * progress) + "%";
    // 아직 끝나지 않았으면 다음 화면 그릴 때 또 실행
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// 처음에는 숫자를 0%로 보여 줌 (막대도 0에서 시작하니까)
skills.forEach(function (skill) {
  skill.querySelector(".skill-head span:last-child").textContent = "0%";
});

// 기술 막대를 위에서부터 하나씩 0% → 목표값으로 채우는 함수
function growSkills() {
  skills.forEach(function (skill, index) {
    const fill = skill.querySelector(".skill-fill");
    const label = skill.querySelector(".skill-head span:last-child");
    const level = Number(fill.dataset.level); // HTML의 data-level 값 (예: 80)

    // index번째 막대는 (index × STEP_DELAY)만큼 기다렸다가 출발 → 순서대로 자라남
    setTimeout(function () {
      fill.style.width = level + "%";
      countUp(label, level);
    }, SKILL_START_DELAY + index * STEP_DELAY);
  });
}

// 인사말을 뺀 나머지 섹션들 (소개, 기술, 프로젝트, 연락처)
const sections = document.querySelectorAll(".section");

// 각 섹션의 내용(.container)에 reveal 클래스를 붙여 처음엔 숨겨 둠
// (JavaScript가 꺼져 있으면 이 줄이 실행되지 않으므로 내용이 그냥 보임 → 안전)
sections.forEach(function (section) {
  section.querySelector(".container").classList.add("reveal");
});

// IntersectionObserver: 요소가 화면에 들어왔는지 지켜보는 도구
// threshold 0.15 = 섹션이 15% 이상 보이면 실행
// rootMargin의 -10% = 화면 맨 아래 10%는 "아직 안 들어옴"으로 쳐서 조금 더 올라왔을 때 시작
const revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (!entry.isIntersecting) return;

    // is-visible 클래스를 붙이면 CSS가 내용을 아래 → 위로 떠오르게 함
    entry.target.querySelector(".container").classList.add("is-visible");

    // 기술 섹션이면 막대 그래프도 시작
    if (entry.target.id === "skills") {
      growSkills();
    }

    // 한 번 나타났으면 더 지켜볼 필요 없음 (위로 스크롤해도 다시 숨지 않음)
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

sections.forEach(function (section) {
  revealObserver.observe(section);
});

// =========================================
// 3. 인사말 한 줄 소개: 타이핑 효과
// =========================================
const typingText = document.querySelector(".typing-text");

// 번갈아 보여 줄 문장들 (여기에 문장을 추가·수정하면 됨)
const sentences = [
  "컴퓨터공학과 26학번",
  "웹 개발을 공부하는 중",
  "Claude Code와 함께 코딩해요"
];

const TYPE_SPEED = 120;   // 한 글자 칠 때 걸리는 시간 (밀리초, 1000 = 1초)
const DELETE_SPEED = 60;  // 한 글자 지울 때 걸리는 시간
const HOLD_TIME = 1500;   // 문장을 다 친 뒤 멈춰 보여 주는 시간

let sentenceIndex = 0;    // 지금 몇 번째 문장인지
let charCount = 0;        // 지금 화면에 몇 글자 보이는지
let isDeleting = false;   // 지금 지우는 중인지

function typeLoop() {
  const current = sentences[sentenceIndex];

  // 글자 수를 하나 늘리거나(타이핑) 줄임(지우기)
  if (isDeleting) {
    charCount--;
  } else {
    charCount++;
  }

  // 문장의 앞에서부터 charCount 글자만 잘라서 보여 줌
  typingText.textContent = current.slice(0, charCount);

  let delay = isDeleting ? DELETE_SPEED : TYPE_SPEED;

  if (!isDeleting && charCount === current.length) {
    // 문장을 다 쳤으면 잠깐 멈춘 뒤 지우기 시작
    isDeleting = true;
    delay = HOLD_TIME;
  } else if (isDeleting && charCount === 0) {
    // 다 지웠으면 다음 문장으로 (마지막 문장 다음엔 처음으로)
    isDeleting = false;
    sentenceIndex = (sentenceIndex + 1) % sentences.length;
    delay = 400;
  }

  // delay 밀리초 뒤에 이 함수를 다시 실행 → 계속 반복
  setTimeout(typeLoop, delay);
}

typeLoop();

// =========================================
// 4. 푸터의 연도를 올해로 자동 표시
// =========================================
document.getElementById("year").textContent = new Date().getFullYear();
