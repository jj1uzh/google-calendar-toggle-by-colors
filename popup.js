if (chrome) {
	browser = chrome
}

function toggle(targetColor, turnOn) {
	const checkboxes = document.querySelectorAll('input[type=checkbox]')
	for (const checkbox of checkboxes) {
    const color = checkbox.parentElement.style.getPropertyValue('--checkbox-color');
		if (targetColor === color && checkbox.checked !== turnOn) {
			checkbox.click()
		}
	}
}

function render(calendarGroups, tabId) {
	const tbody = document.querySelector('tbody#groups')
	for (const [color, calendarNames] of Object.entries(calendarGroups)) {
		const tr = document.createElement('tr')
		tbody.appendChild(tr)
		const colorTD = document.createElement('td')
		colorTD.textContent = calendarNames.join(',')
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
	}
}

function renderError(msg) {
	document.querySelector('#error').textContent = msg
}

async function main () {
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