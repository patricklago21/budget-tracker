let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;

    db.createObjectStore('new_deposit', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if(navigator.onLine) {
        uploadDeposit();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_deposit'], 'readwrite');

    const depositObjectStore = transaction.objectStore('new_deposit');

    depositObjectStore.add(record);
}

function uploadDeposit() {
    const transaction = db.transaction(['new_deposit'], 'readwrite');

    const depositObjectStore = transaction.objectStore('new_deposit');

    const getAll = depositObjectStore.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_deposit'], 'readwrite');
                    // access the new_pizza object store
                    const depositObjectStore = transaction.objectStore('new_deposit');
                    // clear all items in your store
                    depositObjectStore.clear();

                    alert('All saved deposits have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', uploadDeposit);