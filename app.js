/**
 * 중소벤처기업부(MSS) 소개 웹 앱 어플리케이션 스크립트
 * - 순수 바닐라 JS (No Framework, No Build, No CORS issue on file://)
 * - 뉴스 검색, 필터링, 맞춤 정책 시뮬레이터, 다크모드, 카운터 인터랙션
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSurvey(); // [신규 기능] 국민 체감 자가진단 체크리스트 설문
  renderMissions();
  renderTrends();
  renderGlossary();
  renderPortals();
  initNewsSection();
  initPolicyFinder();
  initCounterAnimation();
  initSmoothScroll();
});

/* ==========================================================================
   1. 테마 토글 (라이트 / 다크)
   ========================================================================== */
function initTheme() {
  const themeBtn = document.getElementById("themeToggleBtn");
  if (!themeBtn) return;

  // 로컬스토리지 저장 확인 (로컬 파일 환경에서도 안전하게 try-catch)
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("mss_theme") || "light";
  } catch (e) {
    console.warn("LocalStorage access restricted:", e);
  }

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
  } else {
    document.body.classList.remove("dark-mode");
    themeBtn.textContent = "🌙";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
    try {
      localStorage.setItem("mss_theme", isDark ? "dark" : "light");
    } catch (e) {}
  });
}

/* ==========================================================================
   2. 4대 핵심 업무 렌더링
   ========================================================================== */
function renderMissions() {
  const container = document.getElementById("missionsContainer");
  if (!container || !APP_DATA.missions) return;

  container.innerHTML = APP_DATA.missions.map(m => `
    <article class="mission-card mission-${m.id}">
      <div class="mission-header">
        <div class="mission-icon-box">${m.icon}</div>
        <div>
          <span class="mission-category-badge badge-${m.id}">${m.badge}</span>
          <h3 class="mission-title">${escapeHtml(m.title)}</h3>
        </div>
      </div>
      <p class="mission-summary">${escapeHtml(m.summary)}</p>
      <ul class="mission-details-list">
        ${m.details.map(d => `
          <li class="detail-item">
            <div class="detail-item-name">📌 ${escapeHtml(d.name)}</div>
            <div class="detail-item-desc">${escapeHtml(d.desc)}</div>
          </li>
        `).join("")}
      </ul>
      <div class="mission-tags">
        ${m.tags.map(t => `<span class="tag-pill tag-${m.id}">${escapeHtml(t)}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

/* ==========================================================================
   3. 2026 최신 정책 동향 렌더링
   ========================================================================== */
function renderTrends() {
  const container = document.getElementById("trendsContainer");
  if (!container || !APP_DATA.trends) return;

  container.innerHTML = APP_DATA.trends.map(t => `
    <div class="trend-card">
      <div class="trend-meta">
        <span class="trend-tag">${escapeHtml(t.tag)}</span>
        <span class="trend-date">${escapeHtml(t.date)}</span>
      </div>
      <h3 class="trend-title">${escapeHtml(t.title)}</h3>
      <p class="trend-desc">${escapeHtml(t.desc)}</p>
    </div>
  `).join("");
}

/* ==========================================================================
   4. 최신 뉴스 기사 및 보도자료 피드 (검색 & 카테고리 필터) - 요구사항 4
   ========================================================================== */
let currentNewsCategory = "all";
let currentSearchQuery = "";

function initNewsSection() {
  const filterTabsContainer = document.getElementById("newsFilterTabs");
  const searchInput = document.getElementById("newsSearchInput");

  // 필터 탭 클릭 이벤트
  if (filterTabsContainer) {
    filterTabsContainer.addEventListener("click", (e) => {
      const target = e.target.closest(".filter-tab");
      if (!target) return;

      filterTabsContainer.querySelectorAll(".filter-tab").forEach(tab => tab.classList.remove("active"));
      target.classList.add("active");
      currentNewsCategory = target.getAttribute("data-category") || "all";
      renderNewsList();
    });
  }

  // 실시간 검색 이벤트
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      renderNewsList();
    });
  }

  renderNewsList();
}

function renderNewsList() {
  const container = document.getElementById("newsGrid");
  if (!container || !APP_DATA.newsList) return;

  const filtered = APP_DATA.newsList.filter(item => {
    // 카테고리 필터
    const matchCategory = (currentNewsCategory === "all") || (item.category.includes(currentNewsCategory));
    // 검색어 필터
    const matchSearch = !currentSearchQuery || 
      item.title.toLowerCase().includes(currentSearchQuery) || 
      item.summary.toLowerCase().includes(currentSearchQuery) || 
      item.source.toLowerCase().includes(currentSearchQuery);

    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 8px;">🔍 조건에 일치하는 뉴스 기사가 없습니다.</p>
        <span style="font-size: 0.85rem; color: var(--text-light);">다른 검색어나 카테고리를 선택해 보세요.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(news => {
    // 카테고리별 테마 클래스 매핑
    let catClass = "default";
    if (news.category.includes("소상공인")) catClass = "smallbiz";
    else if (news.category.includes("창업") || news.category.includes("벤처")) catClass = "startup";
    else if (news.category.includes("R&D") || news.category.includes("예산")) catClass = "rnd";
    else if (news.category.includes("상생") || news.category.includes("행정") || news.category.includes("공정")) catClass = "coexist";
    else if (news.category.includes("수출") || news.category.includes("글로벌")) catClass = "export";

    return `
      <article class="news-card news-theme-${catClass}">
        <div class="news-meta">
          <span class="news-category-badge badge-${catClass}">${escapeHtml(news.category)}</span>
          <span class="news-date">📅 ${escapeHtml(news.date)}</span>
        </div>
        <h3 class="news-title">
          <a href="${escapeHtml(news.url)}" target="_blank" rel="noopener noreferrer" title="새 창에서 기사 원문 보기">
            ${escapeHtml(news.title)} ↗
          </a>
        </h3>
        <p class="news-summary">${escapeHtml(news.summary)}</p>
        <div class="news-footer">
          <span class="news-source">📰 ${escapeHtml(news.source)}</span>
          <a href="${escapeHtml(news.url)}" target="_blank" rel="noopener noreferrer" class="news-link-btn btn-${catClass}">
            기사 원문 보기 ↗
          </a>
        </div>
      </article>
    `;
  }).join("");
}

/* ==========================================================================
   5. 국민 맞춤 정책 시뮬레이터 (Policy Finder)
   ========================================================================== */
let selectedRole = "startup_prep";
let selectedNeed = "funding";

function initPolicyFinder() {
  const optionsContainers = document.querySelectorAll(".finder-options-grid");
  const resultBox = document.getElementById("finderResultContainer");

  // 옵션 클릭 핸들러
  optionsContainers.forEach(container => {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".finder-option-btn");
      if (!btn) return;

      const group = btn.getAttribute("data-group");
      const key = btn.getAttribute("data-key");

      container.querySelectorAll(".finder-option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      if (group === "role") selectedRole = key;
      if (group === "need") selectedNeed = key;

      updateFinderResult();
    });
  });

  updateFinderResult();
}

function updateFinderResult() {
  const resultContainer = document.getElementById("finderResultContainer");
  if (!resultContainer) return;

  const resultKey = `${selectedRole}_${selectedNeed}`;
  const data = APP_DATA.finderResults[resultKey] || {
    title: "중소기업 통합 맞춤 정책 추천",
    desc: "선택하신 분야에 최적화된 지원사업 공고를 '기업마당' 및 '중소벤처24'에서 실시간으로 확인하실 수 있습니다.",
    portal: "기업마당 (bizinfo.go.kr)",
    url: "https://www.bizinfo.go.kr",
    highlights: ["원스톱 지원", "맞춤형 컨설팅", "정책자금 연계"]
  };

  resultContainer.innerHTML = `
    <div class="finder-result-box">
      <span class="result-badge">✨ 맞춤 추천 지원제도</span>
      <h3 class="result-title">${escapeHtml(data.title)}</h3>
      <p class="result-desc">${escapeHtml(data.desc)}</p>
      
      <div class="result-highlights">
        ${data.highlights.map(h => `<span class="highlight-pill">✓ ${escapeHtml(h)}</span>`).join("")}
      </div>

      <div class="result-action-bar">
        <span class="portal-notice">신청 및 상세정보: <strong>${escapeHtml(data.portal)}</strong></span>
        <a href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 9px 18px; font-size: 0.88rem;">
          공식 신청 포털 바로가기 ↗
        </a>
      </div>
    </div>
  `;
}

/* ==========================================================================
   6. 알기 쉬운 정책 용어사전
   ========================================================================== */
function renderGlossary() {
  const container = document.getElementById("glossaryGrid");
  if (!container || !APP_DATA.glossary) return;

  container.innerHTML = APP_DATA.glossary.map(item => `
    <div class="glossary-card">
      <div class="glossary-header">
        <h4 class="glossary-term">
          💡 ${escapeHtml(item.term)}
        </h4>
        <span class="glossary-en">${escapeHtml(item.en)}</span>
      </div>
      <p class="glossary-summary">"${escapeHtml(item.summary)}"</p>
      <p class="glossary-desc">${escapeHtml(item.easyDesc)}</p>
    </div>
  `).join("");
}

/* ==========================================================================
   7. 공식 포털 바로가기
   ========================================================================== */
function renderPortals() {
  const container = document.getElementById("portalsGrid");
  if (!container || !APP_DATA.portals) return;

  container.innerHTML = APP_DATA.portals.map(p => `
    <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="portal-card" title="${escapeHtml(p.name)} 새 창 이동">
      <span class="portal-card-tag">${escapeHtml(p.tag)}</span>
      <h4 class="portal-card-name">${escapeHtml(p.name)} ↗</h4>
      <p class="portal-card-desc">${escapeHtml(p.desc)}</p>
      <span class="portal-card-link">웹사이트 방문하기 →</span>
    </a>
  `).join("");
}

/* ==========================================================================
   8. 통계 숫자 카운터 인터랙션
   ========================================================================== */
function initCounterAnimation() {
  // stats 값들은 텍스트 포함이므로 부드럽게 등장 처리
  const statCards = document.querySelectorAll(".stat-card");
  if (!statCards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.2 });

  statCards.forEach(card => {
    card.style.opacity = "0.7";
    card.style.transform = "translateY(10px)";
    card.style.transition = "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
    observer.observe(card);
  });
}

/* ==========================================================================
   9. 스무스 스크롤 & 활성 메뉴
   ========================================================================== */
function initSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId && targetId !== "#") {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
}

/* ==========================================================================
   10. [신규 기능] 국민 체감 자가진단 체크리스트 설문
   "나는 이 기관으로부터 어떤 도움을 받을 수 있을까?"
   ========================================================================== */
let selectedChecklistIds = new Set();
let currentSurveyCat = "all";

function initSurvey() {
  const container = document.getElementById("checklistContainer");
  const tabsContainer = document.getElementById("surveyCategoryTabs");
  const selectAllBtn = document.getElementById("surveySelectAllBtn");
  const resetBtn = document.getElementById("surveyResetBtn");
  const diagnoseBtn = document.getElementById("surveyDiagnoseBtn");
  const copyBtn = document.getElementById("copyResultBtn");
  const printBtn = document.getElementById("printResultBtn");

  if (!container || !APP_DATA.checklistQuestions) return;

  // 1. 체크리스트 렌더링
  renderChecklist();

  // 2. 카테고리 탭 클릭 이벤트
  if (tabsContainer) {
    tabsContainer.addEventListener("click", (e) => {
      const tab = e.target.closest(".survey-tab");
      if (!tab) return;
      tabsContainer.querySelectorAll(".survey-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentSurveyCat = tab.getAttribute("data-cat") || "all";
      renderChecklist();
    });
  }

  // 3. 체크 항목 클릭 (토글)
  container.addEventListener("click", (e) => {
    const item = e.target.closest(".check-item");
    if (!item) return;
    const id = item.getAttribute("data-id");
    if (selectedChecklistIds.has(id)) {
      selectedChecklistIds.delete(id);
      item.classList.remove("selected");
    } else {
      selectedChecklistIds.add(id);
      item.classList.add("selected");
    }
    updateSurveyCount();
  });

  // 4. 전체 선택 버튼
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      const filtered = getFilteredChecklist();
      filtered.forEach(q => selectedChecklistIds.add(q.id));
      renderChecklist();
      updateSurveyCount();
    });
  }

  // 5. 초기화 버튼
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      selectedChecklistIds.clear();
      renderChecklist();
      updateSurveyCount();
      const wrapper = document.getElementById("surveyResultWrapper");
      if (wrapper) wrapper.style.display = "none";
    });
  }

  // 6. 진단하기 버튼
  if (diagnoseBtn) {
    diagnoseBtn.addEventListener("click", () => {
      if (selectedChecklistIds.size === 0) {
        alert("현재 겪고 계신 고민이나 필요한 도움을 1개 이상 체크해 주세요! 😊");
        return;
      }
      runSurveyDiagnosis();
    });
  }

  // 7. 결과 복사 버튼
  if (copyBtn) {
    copyBtn.addEventListener("click", copySurveyResult);
  }

  // 8. 인쇄 버튼
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

function getFilteredChecklist() {
  if (!APP_DATA.checklistQuestions) return [];
  if (currentSurveyCat === "all") return APP_DATA.checklistQuestions;
  return APP_DATA.checklistQuestions.filter(q => q.category === currentSurveyCat);
}

function renderChecklist() {
  const container = document.getElementById("checklistContainer");
  if (!container) return;

  const questions = getFilteredChecklist();

  container.innerHTML = questions.map(q => {
    const isSelected = selectedChecklistIds.has(q.id);
    return `
      <div class="check-item check-cat-${escapeHtml(q.category)} ${isSelected ? 'selected' : ''}" data-id="${escapeHtml(q.id)}" role="checkbox" aria-checked="${isSelected}">
        <div class="check-box-custom">✓</div>
        <div class="check-content">
          <div class="check-meta">
            <span class="check-cat-tag tag-${escapeHtml(q.category)}">${escapeHtml(q.categoryName)}</span>
          </div>
          <div class="check-question">
            ${escapeHtml(q.icon)} ${escapeHtml(q.question)}
          </div>
        </div>
      </div>
    `;
  }).join("");

  updateSurveyCount();
}

function updateSurveyCount() {
  const badge = document.getElementById("surveySelectedCountBadge");
  if (badge) {
    badge.textContent = `선택된 고민: ${selectedChecklistIds.size}개`;
  }
}

function runSurveyDiagnosis() {
  const resultWrapper = document.getElementById("surveyResultWrapper");
  const reportTitle = document.getElementById("reportTitle");
  const solutionsList = document.getElementById("matchedSolutionsList");

  if (!resultWrapper || !reportTitle || !solutionsList) return;

  // 선택된 항목들의 지원 솔루션 추출
  const matchedQuestions = APP_DATA.checklistQuestions.filter(q => selectedChecklistIds.has(q.id));

  // 중복된 지원사업명 통합
  const uniqueSolutionsMap = new Map();
  matchedQuestions.forEach(q => {
    if (!uniqueSolutionsMap.has(q.targetName)) {
      uniqueSolutionsMap.set(q.targetName, {
        targetName: q.targetName,
        category: q.category,
        categoryName: q.categoryName,
        benefit: q.benefit,
        org: q.org,
        url: q.url,
        call: q.call,
        icon: q.icon,
        relatedQuestions: [q.question]
      });
    } else {
      uniqueSolutionsMap.get(q.targetName).relatedQuestions.push(q.question);
    }
  });

  const uniqueSolutions = Array.from(uniqueSolutionsMap.values());

  reportTitle.textContent = `총 ${uniqueSolutions.length}건의 맞춤 지원 솔루션이 매칭되었습니다!`;

  solutionsList.innerHTML = uniqueSolutions.map((sol, idx) => `
    <article class="solution-card solution-theme-${escapeHtml(sol.category)}">
      <div class="solution-card-header">
        <div class="solution-badge-group">
          <span class="solution-num-badge num-${escapeHtml(sol.category)}">${idx + 1}</span>
          <span class="solution-cat-badge badge-${escapeHtml(sol.category)}">${escapeHtml(sol.categoryName)}</span>
          <h4 class="solution-title" style="margin: 0; font-size: 1.18rem;">${escapeHtml(sol.icon)} ${escapeHtml(sol.targetName)}</h4>
        </div>
        <div class="solution-call-info">
          ☎ 상담 문의: <strong>${escapeHtml(sol.call)}</strong>
        </div>
      </div>

      <div class="solution-benefit-box benefit-theme-${escapeHtml(sol.category)}">
        <div class="benefit-title">🎁 맞춤 지원 혜택 요약</div>
        <div class="benefit-desc">${escapeHtml(sol.benefit)}</div>
      </div>

      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
        <strong>매칭된 고민:</strong> "${escapeHtml(sol.relatedQuestions[0])}"
        ${sol.relatedQuestions.length > 1 ? ` 외 ${sol.relatedQuestions.length - 1}건` : ''}
      </div>

      <div class="solution-footer">
        <span class="solution-org-info">
          주관/수행기관: <strong>${escapeHtml(sol.org)}</strong>
        </span>
        <a href="${escapeHtml(sol.url)}" target="_blank" rel="noopener noreferrer" class="solution-link-btn btn-${escapeHtml(sol.category)}" title="새 창에서 공식 신청 페이지 이동">
          공식 신청/안내 바로가기 ↗
        </a>
      </div>
    </article>
  `).join("");

  resultWrapper.style.display = "block";
  resultWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
}

function copySurveyResult() {
  const matchedQuestions = APP_DATA.checklistQuestions.filter(q => selectedChecklistIds.has(q.id));
  if (matchedQuestions.length === 0) return;

  const lines = [
    `[대한민국 중소벤처기업부] 국민 맞춤 지원 솔루션 자가진단 결과`,
    `진단 일시: ${new Date().toLocaleDateString("ko-KR")}`,
    `선택된 고민 건수: ${selectedChecklistIds.size}건`,
    `----------------------------------------`
  ];

  const seen = new Set();
  let count = 1;
  matchedQuestions.forEach(q => {
    if (!seen.has(q.targetName)) {
      seen.add(q.targetName);
      lines.push(`${count}. ${q.targetName} (${q.categoryName})`);
      lines.push(`   - 혜택: ${q.benefit}`);
      lines.push(`   - 주관: ${q.org} (문의: ${q.call})`);
      lines.push(`   - 링크: ${q.url}`);
      count++;
    }
  });

  lines.push(`----------------------------------------`);
  lines.push(`중소기업통합콜센터 ☎ 1357 | 중소벤처기업부 누리집 www.mss.go.kr`);

  const textToCopy = lines.join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert("📋 맞춤 진단 결과가 클립보드에 복사되었습니다!\n메모장이나 카카오톡 등에 붙여넣어 보관하세요.");
    }).catch(() => {
      fallbackCopyText(textToCopy);
    });
  } else {
    fallbackCopyText(textToCopy);
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    alert("📋 맞춤 진단 결과가 클립보드에 복사되었습니다!");
  } catch (err) {
    alert("복사에 실패했습니다. 브라우저 설정을 확인해 주세요.");
  }
  document.body.removeChild(textarea);
}

/* ==========================================================================
   보조 유틸: HTML Escape (XSS 방지)
   ========================================================================== */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
