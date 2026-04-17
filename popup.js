if (chrome) {
  browser = chrome
}

async function toggle(targetColor, turnOn) {
  function getScrollableAncestor(el) {
    while (el && el !== document.documentElement) {
      const style = window.getComputedStyle(el);
      const overflow = style.overflowY;
      if ((overflow === 'scroll' || overflow === 'auto') && el.scrollHeight > el.clientHeight) {
        return el;
      }
      el = el.parentElement;
    }
    return document.documentElement;
  }

  const toggledNames = new Set();

  function toggleVisible() {
    for (const checkbox of document.querySelectorAll('input[type=checkbox]')) {
      const color = checkbox.parentElement.style.getPropertyValue('--checkbox-color');
      if (color !== targetColor) continue;
      const calendar = checkbox.closest(':has([data-text])');
      if (!calendar) continue;
      const name = calendar.querySelector('[data-text]')?.getAttribute('data-text');
      if (!name || toggledNames.has(name)) continue;
      toggledNames.add(name);
      if (checkbox.checked !== turnOn) {
        checkbox.click();
      }
    }
  }

  const firstCheckbox = document.querySelector('input[type=checkbox]');
  const container = firstCheckbox ? getScrollableAncestor(firstCheckbox) : document.documentElement;

  const originalScrollTop = container.scrollTop;
  container.scrollTop = 0;
  await new Promise(r => setTimeout(r, 200));

  while (true) {
    toggleVisible();
    const before = container.scrollTop;
    container.scrollTop += container.clientHeight;
    await new Promise(r => setTimeout(r, 200));
    if (container.scrollTop <= before) break;
  }

  container.scrollTop = originalScrollTop;
}

function render(calendarGroups, tabId) {
  const tbody = document.querySelector('tbody#groups')
  for (const [color, calendarNames] of Object.entries(calendarGroups)) {
    const tr = document.createElement('tr')
    tbody.appendChild(tr)
    const colorTD = document.createElement('td')
    colorTD.innerHTML = calendarNames.map(n => document.createTextNode(n).textContent).join('<br>')
    colorTD.style.setProperty('border', `3px solid ${color}`)
    tr.appendChild(colorTD)
    const toggleOnButtonTD = document.createElement('td')
    tr.appendChild(toggleOnButtonTD)
    const toggleOnButton = document.createElement('button')
    toggleOnButton.textContent = 'Show'
    toggleOnButtonTD.appendChild(toggleOnButton)
    toggleOnButton.addEventListener('click', () => {
      (async function () {
        await browser.scripting.executeScript({ func: toggle, args: [color, true], target: { tabId } })
      })()
    })
    const toggleOffButtonTd = document.createElement('td')
    tr.appendChild(toggleOffButtonTd)
    const toggleOffButton = document.createElement('button')
    toggleOffButtonTd.appendChild(toggleOffButton)
    toggleOffButton.textContent = 'Hide'
    toggleOffButton.addEventListener('click', () => {
      (async function () {
        await browser.scripting.executeScript({ func: toggle, args: [color, false], target: { tabId } })
      })()
    })
    const showDayButtonTD = document.createElement('td')
    tr.appendChild(showDayButtonTD)
    const showDayButton = document.createElement('button')
    showDayButton.textContent = 'show(d)'
    showDayButtonTD.appendChild(showDayButton)
    showDayButton.addEventListener('click', () => {
      (async function () {
        await browser.scripting.executeScript({ func: toggle, args: [color, true], target: { tabId } })
        await browser.scripting.executeScript({ func: async () => { document.querySelector('[data-active-view]').querySelector('button').click(); await new Promise(r => setTimeout(r, 200)); document.querySelector('[data-viewkey="day"]').click() }, target: { tabId } })
      })()
    })
    const hideWeekButtonTD = document.createElement('td')
    tr.appendChild(hideWeekButtonTD)
    const hideWeekButton = document.createElement('button')
    hideWeekButton.textContent = 'hide(w)'
    hideWeekButtonTD.appendChild(hideWeekButton)
    hideWeekButton.addEventListener('click', () => {
      (async function () {
        await browser.scripting.executeScript({ func: toggle, args: [color, false], target: { tabId } })
        await browser.scripting.executeScript({ func: async () => { document.querySelector('[data-active-view]').querySelector('button').click(); await new Promise(r => setTimeout(r, 200)); document.querySelector('[data-viewkey="week"]').click() }, target: { tabId } })
      })()
    })
  }
}

function renderError(msg) {
  document.querySelector('#error').textContent = msg
}

async function main() {
  const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0]
  if (!(tab && tab.url && tab.url.startsWith('https://calendar.google.com/'))) {
    renderError('Not a Google Calendar tab. Bye.')
    return
  }
  const injectionResult = await browser.scripting.executeScript({ files: ['/content_script.js'], target: { tabId: tab.id } })
  console.debug(injectionResult)
  const data = injectionResult[0].result
  if (!data || !data.calendarGroups) {
    renderError('Something wrong. Bye.')
    return
  }
  render(data.calendarGroups, tab.id)
}

main().catch(unhandledError => {
  console.error('google-calendar-toggle-by-color: error', unhandledError)
})
