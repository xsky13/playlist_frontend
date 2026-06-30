const dialogOpener = document.getElementById("dialog-opener");
const dialogCloser = document.getElementById("dialog-closer");
const dialog = document.getElementById("dialog");
const overlay = document.getElementById("overlay");

const openUrlButton = document.getElementById("openUrl");
const searchYtButton = document.getElementById("searchYt");

const searchYtSection = document.getElementById("searchYtSection");

const globalSpinner = document.getElementById("global-loader");
const showGlobalSpinner = () =>  globalSpinner.style.display = "flex";
const hideGlobalSpinner = () => globalSpinner.style.display = "none";

const searchResultsDiv = document.getElementsByClassName("search-results")[0];

const hideDialog = () => {
    dialog.classList.remove("open");
    dialog.classList.add("closed");
}

const hideOverlay = () => {
    overlay.classList.remove("open");
    overlay.classList.add("closed");
}

dialogOpener.addEventListener('click', () => {
    dialog.classList.add("open");
    dialog.classList.remove("closed");

    overlay.classList.add("open");
    overlay.classList.remove("closed");
})

const closeDialog = () => {
    hideDialog();

    hideOverlay();

    openUrlButton.classList.add("active");
    searchYtButton.classList.remove("active");

    openUrlSection.classList.remove("closed");
    searchYtSection.classList.add("closed");
    searchResultsDiv.style.display = "none";

    // clear search results section
    searchResultsDiv.innerHTML = "";
}

document.addEventListener('click', e => {
    // click outside the dialog
    if (e.target != dialogOpener && !(e.target == dialog || dialog.contains(e.target))) {
        closeDialog();
    }
})

const addItemServer = async (video) => {
    const result = await fetch("http://localhost:8080/extract", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: video })
    }).then(res => {
        return res.json();
    });

    const response = await fetch(`http://localhost:8080/extract/${result.id}`);
    const total = result.filesize;

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        received += value.length;

        // const percent = Math.round((received / total) * 100);
        const percent = Math.round(received / total * 100);
        document.getElementById("progress").textContent = percent + "%";
    }

    const blob = new Blob(chunks, { type: "audio/mpeg" });

    hideGlobalSpinner();
    hideOverlay();

    document.getElementById("progress").textContent = "";

    document.querySelector(".playlist").innerHTML += `
        <div class="playlist-item">
            <div class="playlist-start">
                <img src="./assets/images/play.png" width="50" />
                <div class="details">
                    <h3>${result.title}</h3>
                    <span class="subtitle">${(received / 1024 / 1024).toFixed(1)}MB</span>
                </div>
            </div>
            <div>
                <span class="subtitle">${result.duration}</span>
            </div>
        </div>
    `;
}


// submit the inputted url
const openUrlSection = document.getElementById("openUrlSection");
openUrlSection.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get("url");
    if (url == "") {
        alert("Url is empty")
        return;
    }
    const videoId = url.split("=")[1];
    hideDialog();
    showGlobalSpinner();

    addItemServer("https://www.youtube.com/watch?v=" + videoId);
});


// search youtube
const performSearchYtButton = document.getElementById("searchYtBtn")
const searchInput = document.getElementById("searchInput")
const loadingImg = document.querySelector(".searchYtSection img");
performSearchYtButton.addEventListener('click', async e => {
    if (searchInput.value.length == 0) return;

    // start loading
    loadingImg.classList.add("loading");
    const searchResult = await fetch("http://localhost:8080/search?term=" + searchInput.value)
        .then(res => {
            // stop loading
            searchResultsDiv.style.display = "flex";
            loadingImg.classList.remove("loading");
            return res.json();
        })
        .catch(_ => {
            loadingImg.classList.remove("loading");
            alert("Hubo un error")
        })

    searchResult.results.items.forEach(item => {
        console.log(item);
        searchResultsDiv.innerHTML += `
        <div class="playlist-item" onClick="javascript:downloadVideo(\`${item.id.videoId}\`, \`${item.snippet.title}\`)">
            <div class="playlist-start search">
                <img src="${item.snippet.thumbnails.high.url}" class="search-img" width="75" />
                <div class="details">
                    <h3>${item.snippet.title}</h3>
                    <span class="subtitle">${item.snippet.channelTitle}</span>
                </div>
            </div>
        </div>
        `;
    });
    // alert(searchInput.value)
})

const downloadVideo = async (videoId, title) => {
    if (confirm(`You wanna add ${title}?`)) {
        hideDialog();
        showGlobalSpinner();

        addItemServer("https://www.youtube.com/watch?v=" + videoId);
    }
}




/** TABS */

openUrlButton.addEventListener('click', () => {
    openUrlButton.classList.add("active");
    searchYtButton.classList.remove("active");

    openUrlSection.classList.remove("closed");
    searchYtSection.classList.add("closed");
})

searchYtButton.addEventListener('click', () => {
    openUrlButton.classList.remove("active");
    searchYtButton.classList.add("active");

    openUrlSection.classList.add("closed");
    searchYtSection.classList.remove("closed");
})
