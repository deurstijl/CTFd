//--------------------------------------------------------------------
// ./setup.js  – Bootstrap 5, no jQuery
//----------------------------------------------------------------------
// If you bundle with Webpack/Vite/Rollup just import Bootstrap’s ESM build
import "./main";
import "bootstrap/js/dist/tab";
import { Tab } from 'bootstrap';
import dayjs   from 'dayjs';
import CTFd    from '../CTFd';

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function makeQS(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// Re-usable “check the file-size” guard
function sizeGuard(input, maxBytes, msg) {
  input.addEventListener('change', () => {
    if (input.files?.[0]?.size > maxBytes && !confirm(msg)) {
      input.value = '';
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// Tabs
// ────────────────────────────────────────────────────────────────────
function switchTab(ev) {
  ev.preventDefault();

  const pane = ev.target.closest('[role=tabpanel]');
  if (!pane) return;

  const invalid = $$('input,textarea', pane).some(el => {
    const ok = el.checkValidity();
    el.classList.toggle('input-filled-valid',  ok);
    el.classList.toggle('input-filled-invalid', !ok);
    return !ok;
  });

  if (invalid) return;

  const href = ev.target.dataset.href;
  const trigger = document.querySelector(`.nav a[href="${href}"]`);
  if (trigger) new Tab(trigger).show();
}

// ────────────────────────────────────────────────────────────────────
// Date/time previews
// ────────────────────────────────────────────────────────────────────
function buildDateTimeHandler(kind) {
  return () => {
    const d = $(`#${kind}-date`).value;
    const t = $(`#${kind}-time`).value;
    const unix = dayjs(`${d} ${t}`, 'YYYY-MM-DD HH:mm').unix();
    $(`#${kind}-preview`).value = Number.isNaN(unix) ? '' : unix;
  };
}

// ────────────────────────────────────────────────────────────────────
// Major League Cyber integration
// ────────────────────────────────────────────────────────────────────
function mlcSetup() {
  const params = {
    name:        $('#ctf_name').value,
    type:        'jeopardy',
    description: $('#ctf_description').value,
    user_mode:   $('#user_mode').value,
    event_url:   `${location.origin}${CTFd.config.urlRoot}`,
    redirect_url:`${location.origin}${CTFd.config.urlRoot}/redirect`,
    integration_setup_url:
      `${location.origin}${CTFd.config.urlRoot}/setup/integrations`,
    start: $('#start-preview').value,
    end:   $('#end-preview').value,
    platform: 'CTFd',
    state:    window.STATE
  };

  window.open(
    `https://www.majorleaguecyber.org/events/new?${makeQS(params)}`,
    '_blank'
  );
}

// ────────────────────────────────────────────────────────────────────
// Newsletter signup – JSONP via a thrown-away <script> tag
// ────────────────────────────────────────────────────────────────────
function subscribeNewsletter(email) {
  const cbName = `jsonp_cb_${Date.now()}`;
  window[cbName] = () => { delete window[cbName]; };
  const s = document.createElement('script');
  s.src = `https://newsletters.ctfd.io/lists/ot889gr1sa0e1/subscribe/post-json` +
          `?c=${cbName}&email=${encodeURIComponent(email)}` +
          `&b_38e27f7d496889133d2214208_d7c3ed71f9=`;
  document.body.appendChild(s);
}

// ────────────────────────────────────────────────────────────────────
// DOM ready
// ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // “Next” buttons inside the wizard
  $$('.tab-next').forEach(btn => btn.addEventListener('click', switchTab));

  // Allow <Enter> on inputs to jump to their tab’s next button
  $$('input').forEach(inp =>
    inp.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inp.closest('.tab-pane')?.querySelector('button[data-href]')?.click();
      }
    })
  );

  // Date / time pickers → preview UNIX time
  ['start', 'end'].forEach(kind =>
    ['date', 'time'].forEach(f =>
      $(`#${kind}-${f}`).addEventListener('change', buildDateTimeHandler(kind))
    )
  );

  // CTF colour picker
  $('#config-color-picker').addEventListener('input', e => {
    $('#config-color-input').value = e.target.value;
  });
  $('#config-color-reset').addEventListener('click', () => {
    $('#config-color-picker').value = '';
    $('#config-color-input').value = '';
  });

  // Image size guards
  sizeGuard(
    $('#ctf_logo'),
    128_000,
    'This image file is larger than 128 KB which may result in increased load times. Are you sure you’d like to use this logo?'
  );
  sizeGuard(
    $('#ctf_banner'),
    512_000,
    'This image file is larger than 512 KB which may result in increased load times. Are you sure you’d like to use this icon?'
  );
  sizeGuard(
    $('#ctf_small_icon'),
    32_000,
    'This image file is larger than 32 KB which may result in increased load times. Are you sure you’d like to use this icon?'
  );

  // MLC integration button
  $('#integration-mlc').addEventListener('click', mlcSetup);

  // Listen for “integration completed” broadcast from the pop-up
  window.addEventListener('storage', ev => {
    if (ev.key === 'integrations' && ev.newValue) {
      const integration = JSON.parse(ev.newValue);
      if (integration.name === 'mlc') {
        const btn = $('#integration-mlc');
        btn.textContent = 'Already Configured';
        btn.disabled = true;
        window.focus();
        localStorage.removeItem('integrations');
      }
    }
  });

  // Newsletter checkbox
  $('#setup-form').addEventListener('submit', ev => {
    if ($('#newsletter-checkbox').checked) {
      const email = ev.target.querySelector('input[name="email"]').value;
      subscribeNewsletter(email);
    }
  });
});
