(async function () {
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

  const calendarGroups = {};
  const seenNames = new Set();

  function collectVisible() {
    for (const checkbox of document.querySelectorAll('input[type=checkbox]')) {
      const color = checkbox.parentElement.style.getPropertyValue('--checkbox-color');
      if (color === '') continue;
      const calendar = checkbox.closest(':has([data-text])');
      if (calendar === null) continue;
      const calendarName = calendar.querySelector('[data-text]').getAttribute('data-text');
      if (seenNames.has(calendarName)) continue;
      seenNames.add(calendarName);
      if (calendarGroups[color] === undefined) {
        calendarGroups[color] = [calendarName];
      } else {
        calendarGroups[color].push(calendarName);
      }
    }
  }

  const firstCheckbox = document.querySelector('input[type=checkbox]');
  const container = firstCheckbox ? getScrollableAncestor(firstCheckbox) : document.documentElement;

  const originalScrollTop = container.scrollTop;
  container.scrollTop = 0;
  await new Promise(r => setTimeout(r, 200));

  while (true) {
    collectVisible();
    const before = container.scrollTop;
    container.scrollTop += container.clientHeight;
    await new Promise(r => setTimeout(r, 200));
    if (container.scrollTop <= before) break;
  }

  container.scrollTop = originalScrollTop;

  return { calendarGroups };
})()
