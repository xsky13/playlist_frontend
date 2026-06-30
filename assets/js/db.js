function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("Main", 3);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("song")) {
                db.createObjectStore("song", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("file")) {
                db.createObjectStore("file", { keyPath: "songId" });
            }
        };
    });
}
