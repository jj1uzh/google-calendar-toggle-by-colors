(function () {
  const checkboxes = document.querySelectorAll('input[type=checkbox]');
  const calendarGroups = {}
  for (const checkbox of checkboxes) {
    const color = checkbox.parentElement.style.getPropertyValue('--checkbox-color');
    if (color === '') {
      continue
    }
    const calendar = checkbox.closest(':has([data-text])')
    if (calendar === null) {
      continue
    }
    const calendarName = calendar.querySelector('[data-text]').getAttribute('data-text')
    if (calendarGroups[color] === undefined) {
      calendarGroups[color] = [calendarName]
    } else {
      calendarGroups[color].push(calendarName)
    }
  }
  return ({ calendarGroups })
})()