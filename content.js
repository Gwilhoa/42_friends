function displayLogtime(depth = 0) {
    const container = document.getElementById("user-locations");
    if (!container) return;

    const element = container.children.item(container.children.length - 1);
    const logtimeValue = element?.getAttribute("data-original-title");

    if (depth < 10 && (!element || logtimeValue === "0h00 (0h00)" || logtimeValue === "0h00")) {
        setTimeout(() => displayLogtime(depth + 1), 1000);
        return;
    }

    const displayContainer = document.getElementsByClassName("user-data").item(0);
    if (!displayContainer) return;

    const displayDiv = document.createElement("div");
    displayDiv.classList.add("user-header-box", "location");

    const logtimeText = document.createElement("div");
    logtimeText.textContent = "Current Logtime";

    const logTimeValue = document.createElement("div");
    logTimeValue.textContent = logtimeValue || "N/A";

    displayDiv.appendChild(logtimeText);
    displayDiv.appendChild(logTimeValue);
    displayContainer.appendChild(displayDiv);
}

function getMondayAndSunday(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d) => d.toISOString().split('T')[0];

    return {
        monday: format(monday),
        sunday: format(sunday),
    };
}

function getDateRange(startDate, endDate) {
    const dateArray = [];
    let currentDate = new Date(startDate);

    while (currentDate <= new Date(endDate)) {
        dateArray.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
}

function getFriendList() {
    const stored = localStorage.getItem("friend_list");
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse friend list from localStorage");
        }
    }
    return [];
}

function saveFriendList(list) {
    localStorage.setItem("friend_list", JSON.stringify(list));
}

async function displayFriends() {
    const FRIEND_LIST = getFriendList();

    const rowElem = document.querySelector(".container-fullsize.full-width.fixed-height");
    if (!rowElem) return;

    const friendContainer = document.createElement("div");
    friendContainer.className = "col-lg-4 col-md-6 col-xs-12 fixed-height";

    const inner = document.createElement("div");
    inner.className = "container-inner-item boxed agenda-container";

    const title = document.createElement("h4");
    title.className = "profile-title";
    title.textContent = "Friends";

    const menu = document.createElement("span");
    menu.className = "pull-right";

    const dropDown = document.createElement("span");
    dropDown.className = "dropdown event_search_dropdown";

    const dropDownTitle = document.createElement("a");
    dropDownTitle.className = "dropdown-toggle btn simple-link";
    dropDownTitle.setAttribute("data-toggle", "dropdown");
    dropDownTitle.href = "#";
    dropDownTitle.id = "dropdownMenuFriend";
    dropDownTitle.role = "button";
    dropDownTitle.setAttribute("aria-expanded", "false");
    dropDownTitle.textContent = "Add friend ▾";

    const dropDownContent = document.createElement("div");
    dropDownContent.setAttribute("aria-labelledby", "dropdownMenuFriend");
    dropDownContent.className = "dropdown-menu pull-right";
    dropDownContent.style = "top: 21px; padding: .25rem; min-width: 150px; font-size: unset";

    const dropDownContentInner = document.createElement("div");
    dropDownContentInner.className = "event_search_form ul";
    dropDownContentInner.style = "display: flex; flex-direction: column; align-items: center;";

    const dropDownInput = document.createElement("input");
    dropDownInput.placeholder = "Enter login";
    dropDownInput.style = "margin: 5px; padding: 5px; width: 80%;";

    // ✅ Add friend on Enter key
    dropDownInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const newFriend = dropDownInput.value.trim().toLowerCase();
            if (newFriend && !FRIEND_LIST.includes(newFriend)) {
                FRIEND_LIST.push(newFriend);
                saveFriendList(FRIEND_LIST);
                location.reload();
            }
        }
    });

    dropDownContentInner.appendChild(dropDownInput);
    dropDownContent.appendChild(dropDownContentInner);
    dropDown.appendChild(dropDownTitle);
    dropDown.appendChild(dropDownContent);
    menu.appendChild(dropDown);
    title.appendChild(menu);

    const content = document.createElement("div");
    content.className = "overflowable-item";

    const today = new Date().toISOString().split('T')[0];
    const { monday, sunday } = getMondayAndSunday(today);
    const date_range = getDateRange(monday, sunday);

    for (const friend of FRIEND_LIST) {
        try {
            const URL = "https://profile.intra.42.fr/users/" + friend;

            const friend_object = await fetch(URL, {
                credentials: "include",
            }).then(res => res.json());

            if (!Object.keys(friend_object).length) {
                const new_friend_list = FRIEND_LIST.filter(val => val != friend);
                saveFriendList(new_friend_list);
                location.reload();
            }

            const log_time_object = await fetch(`https://translate.intra.42.fr/users/${friend}/locations_stats.json`, {
                credentials: "include",
            }).then(res => res.json());

            const totalMs = date_range.reduce((sum, date) => {
                if (log_time_object[date]) {
                    const [h, m, s] = log_time_object[date].split(':');
                    const [sec, ms = '0'] = s.split('.');
                    const timeMs =
                        parseInt(h) * 3600000 +
                        parseInt(m) * 60000 +
                        parseInt(sec) * 1000 +
                        parseInt(ms.padEnd(3, '0').slice(0, 3));
                    return sum + timeMs;
                }
                return sum;
            }, 0);

            const hours = Math.floor(totalMs / 3600000);
            const minutes = Math.floor((totalMs % 3600000) / 60000);

            const item = document.createElement("div");
            item.style = "display:flex;gap:10px;align-items:center;margin-bottom:.5rem;cursor:pointer;transition:background 0.2s ease;";
            item.addEventListener("mouseover", () => item.style.background = "#111111");
            item.addEventListener("mouseout", () => item.style.background = "transparent");
            item.addEventListener("click", () => window.open(URL, "_blank"));

            const photo = document.createElement("div");
            photo.className = "user-profile-picture visible-sidebars";
            photo.style = `
                background-image: url(${friend_object.image.link});
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-position: 50% 50%;
            `;

            const login = document.createElement("div");
            login.textContent = friend;

            const dailyLogtime = document.createElement("div");
            if (log_time_object[today]) {
                const [dailyHours, dailyMinutes] = log_time_object[today].split(':');
                dailyLogtime.textContent = "" + dailyHours + "h" + (dailyMinutes || "00");
            } else {
                dailyLogtime.textContent = "0h00";
            }

            const weeklyLogtime = document.createElement("div");
            weeklyLogtime.textContent = "(" + hours + "h" + minutes + ")";

            const connectionPellet = document.createElement("div");
            connectionPellet.style = `width: 20px; aspect-ratio: 1/1; background-color: ${friend_object.location ? "green" : "red"}; border-radius: 50%; margin-left: auto;`;

            const deleteFriend = document.createElement("div");
            connectionPellet.style = `width: 20px; height: 20px; background-color: ${friend_object.location ? "green" : "red"}; border-radius: 50%; margin-right: 1rem;`;

            item.appendChild(photo);
            item.appendChild(login);
            item.appendChild(dailyLogtime);
            item.appendChild(weeklyLogtime);
            item.appendChild(connectionPellet);
            content.appendChild(item);
        } catch (error) {
            console.warn(`Failed to load data for ${friend}:`, error);
        }
    }


    inner.appendChild(title);
    inner.appendChild(content);
    friendContainer.appendChild(inner);

    rowElem.firstElementChild.insertBefore(friendContainer, rowElem.firstElementChild.firstChild);
}

displayLogtime();
displayFriends();
