const redirect = () => {
    const u4 = document.querySelectorAll('.line.u4 .direction')[1]
    u4.querySelector('.redirect').innerHTML = 'Karlsplatz'
    u4.querySelector('.default').classList.add('strike')
    u4.querySelector('.alternatives').innerHTML = 'danach bis <b>Hütteldorf</b> in <b>16 Minuten</b>'
}

const shutdown = () => {
    const u6 = document.querySelectorAll('.line.bim .direction')[0]
    document.querySelector('.line.bim .direction').classList.remove('pulse-white')
    u6.querySelector('.main').innerHTML = '–'
    u6.querySelector('.header').innerHTML = ''
    u6.querySelector('.redirect').innerHTML = 'Betriebsschluss'
    u6.querySelector('.default').classList.add('strike')
    u6.querySelector('.alternatives').innerHTML = 'Erste Abfahrt um <b>05:12 Uhr</b>'
    u6.classList.add('shutdown')
}

const warning = () => {
    const d = document.querySelector('.line.bim')
    d.innerHTML += `
    <div class="warning">
        <p><b>⚠ Störung</b> Nach einer Fahrtbehinderung kommt es auf den Linien D , 71 zu unterschiedlichen Intervallen.</p>
    </div>`;
}

const countdown = () => {
    const u4 = document.querySelector('.line.u4 .direction')
    const timeLeft = u4.querySelector('.time-left')
    const minutes = Number(u4.querySelector('.time-left .main').innerHTML)

    u4.querySelector('.time-left .main').innerHTML = minutes - 1
    timeLeft.classList.remove('three', 'two', 'one')
    switch (minutes) {
        case 11:
            timeLeft.classList.add('three')
            break;
        case 10:
            timeLeft.classList.add('two')
            break;
        case 9:
            timeLeft.classList.add('one')
            break;
        case 8:
            u4.querySelector('.time-left .main').innerHTML = 11
            break;
    
        default:
            break;
    }
}


redirect()
shutdown()
warning()