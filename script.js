document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    const futureBookingForm = document.getElementById('futureBookingForm');
    const notifications = document.getElementById('notifications');
    const futureReservations = document.getElementById('futureReservations');
    const sessionRecords = document.getElementById('session-records');
    const matchBookingForm = document.getElementById('matchBookingForm');
    const matchNotifications = document.getElementById('matchNotifications');

    bookingForm?.addEventListener('submit', function(event) {
        event.preventDefault();
        const customerName = document.getElementById('customerName').value;
        const sessionNumber = document.getElementById('sessionNumber').value;
        const rentalTime = parseInt(document.getElementById('rentalTime').value, 10);
        const startTime = new Date();
        let endTime = new Date(startTime.getTime() + rentalTime * 60000);
        const sessionName = `جلسة ${sessionNumber}`;
        const existingSession = document.getElementById(`session-${sessionNumber}`);
        
        if (existingSession) {
            alert(`جلسة ${sessionNumber} مشغولة بالفعل.`);
            return;
        }

        const sessionElement = document.createElement('div');
        sessionElement.className = 'session';
        sessionElement.id = `session-${sessionNumber}`;
        sessionElement.innerHTML = `<h2>${sessionName}</h2><div id="countdown-${sessionNumber}"></div>
                                    <div>اسم الزبون: ${customerName}</div>
                                    <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                    <button class="extend">تمديد الجلسة</button>
                                    <button class="cancel">إلغاء الجلسة</button>`;
        notifications.appendChild(sessionElement);

        saveSessionToLocalStorage(sessionNumber, {
            customerName: customerName,
            startTime: startTime,
            endTime: endTime
        });

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = endTime - now;
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            document.getElementById(`countdown-${sessionNumber}`).innerHTML = `الوقت المتبقي: ${minutes} دقيقة و ${seconds} ثانية`;

            if (distance < 0) {
                clearInterval(countdownInterval);
                document.getElementById(`countdown-${sessionNumber}`).innerHTML = "انتهى الوقت!";
                if ('speechSynthesis' in window) {
                    const message = `جلسة ${sessionNumber} انتهى وقتهم`;
                    const utterance = new SpeechSynthesisUtterance(message);
                    speechSynthesis.speak(utterance);
                } else {
                    alert("خاصية النطق غير مدعومة في هذا المتصفح.");
                }
                alert(`جلسة ${sessionNumber} انتهى وقتهم`);
                setTimeout(() => {
                    notifications.removeChild(sessionElement);
                    const recordElement = document.createElement('div');
                    recordElement.className = 'session';
                    recordElement.innerHTML = `<h2>${sessionName}</h2>
                                               <div>الزبون: ${customerName}</div>
                                               <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                               <div>وقت الانتهاء: ${endTime.toLocaleTimeString()}</div>`;
                    sessionRecords.appendChild(recordElement);
                    removeSessionFromLocalStorage(sessionNumber);
                }, 60000); // إزالة العنصر بعد دقيقة واحدة
            }
        }

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);

        sessionElement.querySelector('.cancel').addEventListener('click', () => {
            clearInterval(countdownInterval);
            notifications.removeChild(sessionElement);
            removeSessionFromLocalStorage(sessionNumber);
        });

        sessionElement.querySelector('.extend').addEventListener('click', () => {
            const additionalTime = parseInt(prompt('أدخل وقت التمديد (بالدقائق):'), 10);
            if (!isNaN(additionalTime) && additionalTime > 0) {
                endTime = new Date(endTime.getTime() + additionalTime * 60000);
                saveSessionToLocalStorage(sessionNumber, {
                    customerName: customerName,
                    startTime: startTime,
                    endTime: endTime
                });
            }
        });
    });

    futureBookingForm?.addEventListener('submit', function(event) {
        event.preventDefault();
        const customerName = document.getElementById('futureCustomerName').value;
        const sessionNumber = document.getElementById('futureSessionNumber').value;
        const rentalTime = parseInt(document.getElementById('futureRentalTime').value, 10);
        const date = document.getElementById('futureDate').value;
        const time = document.getElementById('futureTime').value;
        const startTime = new Date(`${date}T${time}:00`);
        let endTime = new Date(startTime.getTime() + rentalTime * 60000);
        const sessionName = `جلسة ${sessionNumber}`;

        // Check for conflicting reservations
        const futureSessions = JSON.parse(localStorage.getItem('futureSessions')) || {};
        for (const key in futureSessions) {
            if (futureSessions[key].sessionNumber == sessionNumber) {
                const existingStartTime = new Date(futureSessions[key].startTime);
                const existingEndTime = new Date(futureSessions[key].endTime);
                if ((startTime >= existingStartTime && startTime < existingEndTime) ||
                    (endTime > existingStartTime && endTime <= existingEndTime) ||
                    (startTime <= existingStartTime && endTime >= existingEndTime)) {
                    alert(`جلسة ${sessionNumber} مشغولة بالفعل في الوقت المحدد.`);
                    return;
                }
            }
        }

        const futureSessionElement = document.createElement('div');
        futureSessionElement.className = 'session';
        futureSessionElement.innerHTML = `<h2>${sessionName}</h2>
                                          <div>اسم الزبون: ${customerName}</div>
                                          <div>التاريخ: ${startTime.toLocaleDateString()}</div>
                                          <div>الوقت: ${startTime.toLocaleTimeString()}</div>`;
        futureReservations.appendChild(futureSessionElement);

        saveFutureSessionToLocalStorage(sessionNumber, {
            customerName: customerName,
            startTime: startTime,
            endTime: endTime,
            sessionNumber: sessionNumber
        });
    });

    function saveSessionToLocalStorage(sessionNumber, sessionData) {
        const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
        sessions[sessionNumber] = sessionData;
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }

    function saveFutureSessionToLocalStorage(sessionNumber, sessionData) {
        const futureSessions = JSON.parse(localStorage.getItem('futureSessions')) || {};
        futureSessions[sessionNumber] = sessionData;
        localStorage.setItem('futureSessions', JSON.stringify(futureSessions));
    }

    function removeSessionFromLocalStorage(sessionNumber) {
        const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
        delete sessions[sessionNumber];
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }

    function loadSessionsFromLocalStorage() {
        const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
        for (const sessionNumber in sessions) {
            const sessionData = sessions[sessionNumber];
            const startTime = new Date(sessionData.startTime);
            const endTime = new Date(sessionData.endTime);
            const customerName = sessionData.customerName;
            const sessionName = `جلسة ${sessionNumber}`;
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session';
            sessionElement.id = `session-${sessionNumber}`;
            sessionElement.innerHTML = `<h2>${sessionName}</h2><div id="countdown-${sessionNumber}"></div>
                                        <div>اسم الزبون: ${customerName}</div>
                                        <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                        <button class="extend">تمديد الجلسة</button>
                                        <button class="cancel">إلغاء الجلسة</button>`;
            document.getElementById('notifications').appendChild(sessionElement);
            updateCountdown();
            const countdownInterval = setInterval(updateCountdown, 1000);

            function updateCountdown() {
                const now = new Date().getTime();
                const distance = endTime - now;
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                document.getElementById(`countdown-${sessionNumber}`).innerHTML = `الوقت المتبقي: ${minutes} دقيقة و ${seconds} ثانية`;

                if (distance < 0) {
                    clearInterval(countdownInterval);
                    document.getElementById(`countdown-${sessionNumber}`).innerHTML = "انتهى الوقت!";
                    if ('speechSynthesis' in window) {
                        const message = `جلسة ${sessionNumber} انتهى وقتهم`;
                        const utterance = new SpeechSynthesisUtterance(message);
                        speechSynthesis.speak(utterance);
                    } else {
                        alert("خاصية النطق غير مدعومة في هذا المتصفح.");
                    }
                    alert(`جلسة ${sessionNumber} انتهى وقتهم`);
                    setTimeout(() => {
                        notifications.removeChild(sessionElement);
                        const recordElement = document.createElement('div');
                        recordElement.className = 'session';
                        recordElement.innerHTML = `<h2>${sessionName}</h2>
                                                   <div>الزبون: ${customerName}</div>
                                                   <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                                   <div>وقت الانتهاء: ${endTime.toLocaleTimeString()}</div>`;
                        sessionRecords.appendChild(recordElement);
                        removeSessionFromLocalStorage(sessionNumber);
                    }, 60000); // إزالة العنصر بعد دقيقة واحدة
                }
            }

            sessionElement.querySelector('.cancel').addEventListener('click', () => {
                clearInterval(countdownInterval);
                notifications.removeChild(sessionElement);
                removeSessionFromLocalStorage(sessionNumber);
            });

            sessionElement.querySelector('.extend').addEventListener('click', () => {
                const additionalTime = parseInt(prompt('أدخل وقت التمديد (بالدقائق):'), 10);
                if (!isNaN(additionalTime) && additionalTime > 0) {
                    endTime = new Date(endTime.getTime() + additionalTime * 60000);
                    saveSessionToLocalStorage(sessionNumber, {
                        customerName: customerName,
                        startTime: startTime,
                        endTime: endTime
                    });
                }
            });

            updateCountdown();
        }
    }

    function loadFutureSessionsFromLocalStorage() {
        const futureSessions = JSON.parse(localStorage.getItem('futureSessions')) || {};
        for (const sessionNumber in futureSessions) {
            const sessionData = futureSessions[sessionNumber];
            const startTime = new Date(sessionData.startTime);
            const customerName = sessionData.customerName;
            const sessionName = `جلسة ${sessionNumber}`;
            const futureSessionElement = document.createElement('div');
            futureSessionElement.className = 'session';
            futureSessionElement.innerHTML = `<h2>${sessionName}</h2>
                                              <div>اسم الزبون: ${customerName}</div>
                                              <div>التاريخ: ${startTime.toLocaleDateString()}</div>
                                              <div>الوقت: ${startTime.toLocaleTimeString()}</div>`;
            document.getElementById('futureReservations').appendChild(futureSessionElement);
        }
    }

    loadSessionsFromLocalStorage();
    loadFutureSessionsFromLocalStorage();
});
