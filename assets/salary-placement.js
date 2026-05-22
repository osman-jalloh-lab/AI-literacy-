(function () {
  var apiBase = window.SALARY_PLACEMENT_API_BASE || '';
  var state = {
    selectedPosition: null,
    lastResult: null,
    positions: [],
    reference: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function htmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
  }

  function statusClass(status) {
    if (status === 'PASS') return 'status-pass';
    if (status === 'ESCALATE' || status === 'FAIL') return 'status-escalate';
    if (status === 'NEEDS REVIEW') return 'status-review';
    return 'status-info';
  }

  function statusPill(status) {
    return '<span class="status-pill ' + statusClass(status) + '">' + htmlEscape(status || 'INFO') + '</span>';
  }

  async function api(path, options) {
    var response = await fetch(apiBase + path, options);
    if (!response.ok) throw new Error('API request failed: ' + response.status);
    return response.json();
  }

  async function initSalaryPlacement() {
    if (!$('page-salary-placement')) return;

    bindEvents();

    try {
      var health = await api('/api/salary-placement/health');
      $('sp-api-status').className = 'alert success';
      $('sp-api-status').innerHTML = '<div class="alert-icon">OK</div><div><strong>Salary placement backend connected.</strong> Service: ' + htmlEscape(health.service) + '.</div>';
      var positions = await api('/api/salary-placement/positions');
      var reference = await api('/api/salary-placement/reference-tables');
      state.positions = positions.positions || [];
      state.reference = reference;
      renderReferenceTables(reference);
    } catch (error) {
      $('sp-api-status').className = 'alert warn';
      $('sp-api-status').innerHTML = '<div class="alert-icon">!</div><div><strong>Salary placement backend is not connected.</strong> Start the Express server with <code>npm start</code>, then reload this page. This UI intentionally keeps calculation logic in the backend.</div>';
    }
  }

  function bindEvents() {
    $('sp-search-btn')?.addEventListener('click', searchPositions);
    $('sp-clear-btn')?.addEventListener('click', clearSalaryPlacement);
    $('sp-position-query')?.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') searchPositions();
    });
    $('sp-calculate-btn')?.addEventListener('click', runAudit);

    document.querySelectorAll('[data-sp-copy]').forEach(function (button) {
      button.addEventListener('click', function () {
        copyPayload(button.getAttribute('data-sp-copy'), button);
      });
    });

    document.querySelectorAll('[data-sp-sample]').forEach(function (button) {
      button.addEventListener('click', function () {
        loadSample(button.getAttribute('data-sp-sample'));
      });
    });
  }

  async function searchPositions() {
    var query = $('sp-position-query').value.trim();
    var container = $('sp-search-results');
    if (!query) {
      container.innerHTML = '<div class="alert warn"><div class="alert-icon">!</div><div>Cannot process. Missing position title.</div></div>';
      return;
    }

    container.innerHTML = '<div class="tool-note">Searching position mapping...</div>';
    try {
      var data = await api('/api/salary-placement/positions/search?query=' + encodeURIComponent(query));
      renderSearchResults(data.results || [], query);
    } catch (error) {
      container.innerHTML = '<div class="alert danger"><div class="alert-icon">!</div><div>Cannot search positions because the backend is unavailable.</div></div>';
    }
  }

  function renderSearchResults(results, query) {
    var container = $('sp-search-results');
    if (!results.length) {
      state.selectedPosition = null;
      container.innerHTML = '<div class="alert warn"><div class="alert-icon">!</div><div>Needs Review. No exact position match found for <strong>' + htmlEscape(query) + '</strong>.</div></div>';
      renderPositionDetails();
      return;
    }

    container.innerHTML = results.map(function (position, index) {
      return [
        '<div class="sp-result-row">',
        '<div>',
        '<div class="sp-result-title">' + htmlEscape(position.positionTitle) + '</div>',
        '<div class="sp-result-meta">' + htmlEscape(position.revisedPayGrade) + ' | ' + htmlEscape(position.rangeMinToMid) + ' | Match: ' + htmlEscape(position.matchType) + '</div>',
        '</div>',
        '<button class="btn-secondary" type="button" data-sp-select="' + index + '">Select position</button>',
        '</div>'
      ].join('');
    }).join('');

    container.querySelectorAll('[data-sp-select]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.selectedPosition = results[Number(button.getAttribute('data-sp-select'))];
        $('sp-position-query').value = state.selectedPosition.positionTitle;
        renderPositionDetails();
      });
    });
  }

  function renderPositionDetails() {
    var container = $('sp-position-details');
    var position = state.selectedPosition;
    if (!position) {
      container.innerHTML = 'Select a mapped position to see pay grade, min-to-mid range, revised profile, proposed title, and vacancy mapping.';
      return;
    }

    container.innerHTML = [
      '<div class="sp-kpi">',
      kpi('Matched title', position.positionTitle),
      kpi('Revised pay grade', position.revisedPayGrade),
      kpi('Range min to midpoint', position.rangeMinToMid),
      kpi('Revised profile', position.revisedProfile),
      kpi('Proposed title', position.proposedTitle || 'None listed'),
      kpi('Vacancy mapping', position.vacancyMapping || 'None listed'),
      '</div>'
    ].join('');
  }

  function kpi(label, value) {
    return '<div class="sp-kpi-box"><div class="sp-kpi-label">' + htmlEscape(label) + '</div><div class="sp-kpi-value">' + htmlEscape(value) + '</div></div>';
  }

  function readInput() {
    var title = state.selectedPosition?.positionTitle || $('sp-position-query').value.trim();
    return {
      positionTitle: title,
      yearsOfExperience: $('sp-yoe').value === '' ? undefined : Number($('sp-yoe').value),
      exceptionArea: $('sp-exception-area').value,
      oldMidpoint: $('sp-old-midpoint').value === '' ? undefined : Number($('sp-old-midpoint').value),
      notes: $('sp-notes').value,
      proposedTitleApproved: $('sp-proposed-approved').value === 'true',
      reqTextGenerated: true
    };
  }

  async function runAudit() {
    $('sp-result-card').innerHTML = '<div class="tool-note">Running salary placement QA...</div>';
    try {
      var result = await api('/api/salary-placement/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readInput())
      });
      state.lastResult = result;
      if (result.match?.position) {
        state.selectedPosition = result.match.position;
        renderPositionDetails();
      }
      renderAudit(result);
    } catch (error) {
      $('sp-result-card').innerHTML = '<div class="alert danger"><div class="alert-icon">!</div><div>Cannot process. Salary placement backend is unavailable.</div></div>';
    }
  }

  function renderAudit(result) {
    $('sp-decision').innerHTML = '<div style="margin-bottom:.75rem">' + statusPill(result.decision) + '</div>';
    $('sp-result-card').innerHTML = buildResultCard(result);
    $('sp-checklist').innerHTML = buildChecklist(result.checks || []);
    $('sp-req-text').textContent = result.reqText || 'Req text could not be generated.';
    $('sp-exception-result').innerHTML = buildExceptionResult(result);
  }

  function buildResultCard(result) {
    var grade = result.payGrade || {};
    var calc = result.calculation;
    var messages = (result.messages || []).map(function (message) {
      return '<li>' + htmlEscape(message) + '</li>';
    }).join('');

    return [
      '<div class="sp-kpi">',
      kpi('Estimated placement salary', calc ? money(calc.estimatedSalary) : 'Not calculated'),
      kpi('Minimum salary', money(grade.minimumSalary)),
      kpi('Midpoint salary', money(grade.midpointSalary)),
      kpi('Maximum salary', money(grade.maximumSalary)),
      kpi('Increment per YOE', money(grade.incrementPerYOE)),
      kpi('Midpoint cap status', calc ? (calc.midpointCapApplied ? 'Cap applied' : 'No cap needed') : 'Not checked'),
      '</div>',
      '<div class="alert info"><div class="alert-icon">i</div><div><strong>Formula:</strong> ' + htmlEscape(calc?.formula || 'Not calculated') + '<br><strong>Label:</strong> Estimated Placement Salary, not final approved salary.</div></div>',
      '<ul class="sp-step-list">' + (calc?.steps || ['No math available.']).map(function (step) { return '<li>' + htmlEscape(step) + '</li>'; }).join('') + '</ul>',
      '<div class="card-flat"><strong>Messages</strong><ul class="do-list">' + messages + '</ul></div>'
    ].join('');
  }

  function buildChecklist(checks) {
    if (!checks.length) return 'Run the QA audit to populate checklist rows.';
    return [
      '<table class="sp-check-table">',
      '<thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead>',
      '<tbody>',
      checks.map(function (item) {
        return '<tr><td>' + htmlEscape(item.label) + '</td><td>' + statusPill(item.status) + '</td><td>' + htmlEscape(item.detail) + '</td></tr>';
      }).join(''),
      '</tbody></table>'
    ].join('');
  }

  function buildExceptionResult(result) {
    var area = result.input?.exceptionArea || 'No';
    var status = area === 'Student Affairs' || area === 'Basic Needs' || area === 'E3'
      ? 'ESCALATE'
      : area === 'Unsure'
        ? 'NEEDS REVIEW'
        : 'PASS';
    return '<div class="sp-kpi">' + kpi('Exception status', area) + kpi('Escalation status', status) + kpi('QA decision', result.decision) + '</div>';
  }

  function renderReferenceTables(reference) {
    if (!$('sp-reference-tables') || !reference) return;
    var payRows = (reference.payGrades || []).map(function (grade) {
      return '<tr><td>' + htmlEscape(grade.payGrade) + '</td><td>' + money(grade.minimumSalary) + '</td><td>' + money(grade.midpointSalary) + '</td><td>' + money(grade.maximumSalary) + '</td><td>' + money(grade.incrementPerYOE) + '</td></tr>';
    }).join('');
    var positionRows = (reference.positionMapping || []).map(function (position) {
      return '<tr><td>' + htmlEscape(position.positionTitle) + '</td><td>' + htmlEscape(position.revisedPayGrade) + '</td><td>' + htmlEscape(position.rangeMinToMid) + '</td><td>' + htmlEscape(position.revisedProfile) + '</td></tr>';
    }).join('');
    $('sp-reference-tables').innerHTML = [
      '<h3>Pay Grades</h3>',
      '<table class="sp-check-table"><thead><tr><th>Grade</th><th>Minimum</th><th>Midpoint</th><th>Maximum</th><th>Increment / YOE</th></tr></thead><tbody>' + payRows + '</tbody></table>',
      '<h3 style="margin-top:1rem">Position Mapping</h3>',
      '<table class="sp-check-table"><thead><tr><th>Title</th><th>Pay Grade</th><th>Range</th><th>Profile</th></tr></thead><tbody>' + positionRows + '</tbody></table>'
    ].join('');
  }

  function loadSample(kind) {
    var samples = {
      pass: { title: 'Administrative Coordinator', yoe: '4', exceptionArea: 'No', oldMidpoint: '' },
      'missing-yoe': { title: 'Administrative Coordinator', yoe: '', exceptionArea: 'No', oldMidpoint: '' },
      exception: { title: 'Student Affairs Specialist', yoe: '3', exceptionArea: 'Student Affairs', oldMidpoint: '' },
      'old-midpoint': { title: 'Administrative Coordinator', yoe: '3', exceptionArea: 'No', oldMidpoint: '90000' },
      'no-match': { title: 'Made Up Role', yoe: '3', exceptionArea: 'No', oldMidpoint: '' }
    };
    var sample = samples[kind];
    state.selectedPosition = null;
    $('sp-position-query').value = sample.title;
    $('sp-yoe').value = sample.yoe;
    $('sp-exception-area').value = sample.exceptionArea;
    $('sp-old-midpoint').value = sample.oldMidpoint;
    $('sp-notes').value = 'Loaded sample: ' + kind;
    renderPositionDetails();
    runAudit();
  }

  function copyPayload(type, button) {
    var result = state.lastResult;
    var text = '';
    if (type === 'position') {
      var position = state.selectedPosition;
      text = position
        ? [
          'Position Title: ' + position.positionTitle,
          'Revised Pay Grade: ' + position.revisedPayGrade,
          'Range Min to Midpoint: ' + position.rangeMinToMid,
          'Revised Profile: ' + position.revisedProfile,
          'Proposed Title: ' + (position.proposedTitle || 'None listed'),
          'Vacancy Mapping: ' + (position.vacancyMapping || 'None listed')
        ].join('\n')
        : 'No position selected.';
    } else if (type === 'req') {
      text = result?.reqText || $('sp-req-text').textContent;
    } else if (type === 'calculation') {
      text = result?.calculation
        ? [result.calculation.label, result.calculation.formula].concat(result.calculation.steps).join('\n')
        : 'No salary calculation available.';
    } else if (type === 'qa') {
      text = result
        ? ['Decision: ' + result.decision].concat(result.messages || []).concat((result.checks || []).map(function (item) {
          return item.label + ': ' + item.status + ' - ' + item.detail;
        })).join('\n')
        : 'No QA report available.';
    }
    copyText(text, button);
  }

  function copyText(text, button) {
    var done = function () {
      var original = button.textContent;
      button.textContent = 'Copied';
      setTimeout(function () { button.textContent = original; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function clearSalaryPlacement() {
    state.selectedPosition = null;
    state.lastResult = null;
    ['sp-position-query', 'sp-yoe', 'sp-old-midpoint', 'sp-notes'].forEach(function (id) {
      $(id).value = '';
    });
    $('sp-exception-area').value = 'No';
    $('sp-proposed-approved').value = 'false';
    $('sp-search-results').innerHTML = '';
    renderPositionDetails();
    $('sp-decision').innerHTML = '';
    $('sp-result-card').innerHTML = '';
    $('sp-checklist').innerHTML = 'Run the QA audit to populate checklist rows.';
    $('sp-req-text').textContent = 'Select a position and run the QA audit to generate req language.';
    $('sp-exception-result').textContent = 'Run the QA audit to see exception and escalation status.';
  }

  document.addEventListener('DOMContentLoaded', initSalaryPlacement);
})();
