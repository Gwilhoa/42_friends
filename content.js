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

function addTooltipOnHover(element, title) {
    // Créer le tooltip (mais ne pas l'ajouter directement au DOM)
    const tooltip = document.createElement("div");
    tooltip.textContent = title;
    tooltip.style.position = "absolute";
    tooltip.style.padding = "4px 8px";
    tooltip.style.backgroundColor = "black";
    tooltip.style.color = "white";
    tooltip.style.borderRadius = "4px";
    tooltip.style.fontSize = "12px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.zIndex = "1000";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);
  
    // Positionner le tooltip lors du hover
    const onMouseEnter = (e) => {
      tooltip.style.display = "block";
      const rect = element.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 6}px`;
    };
  
    const onMouseLeave = () => {
      tooltip.style.display = "none";
    };
  
    const onMouseMove = (e) => {
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
    };
  
    // Ajouter les listeners sans supprimer les autres
    element.addEventListener("mouseenter", onMouseEnter);
    element.addEventListener("mouseleave", onMouseLeave);
    element.addEventListener("mousemove", onMouseMove);

    return tooltip
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

async function displayFriend(content, friend, date_range, today) {
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
        item.style = "display:flex;align-items:center;gap:10px;margin-bottom:.5rem;cursor:pointer;transition:background 0.2s ease;padding: 5px; border-radius: 10px;";
        item.addEventListener("mouseover", () => item.style.background = "#15181e");
        item.addEventListener("mouseout", () => item.style.background = "transparent");
        item.addEventListener("click", () => window.open(URL, "_blank"));

        const photo = document.createElement("div");
        photo.className = "user-profile-picture visible-sidebars";
        photo.style = `
            background-image: url(${friend_object.image.link});
            background-size: cover;
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

        const optionContainer = document.createElement("div");
        optionContainer.style = `margin-left: auto; display: flex;`;


        const connectionPellet = document.createElement("div");
        connectionPellet.style = `width: 20px; aspect-ratio: 1/1; background-color: ${friend_object.location ? "green" : "red"}; border-radius: 50%;`;

        addTooltipOnHover(connectionPellet, friend_object.location ? "Connected at " + friend_object.location : "Disconected")
        if (friend_object) {

            connectionPellet.onclick = (event) => {
                event.stopPropagation()
                
                window.open("https://meta.intra.42.fr/clusters#" + friend_object.location, "_blank")
            }
        }

        const gapDiv = document.createElement("div");
        gapDiv.style = "height: 100%; width: 0; transition: all .5s;"

        const deleteFriend = document.createElement("div");
        deleteFriend.style = `
          width: 0;
          height: 20px;
          border-radius: 50%;
          margin-right: 1rem;
          transition: all .5s;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: transparent;
          cursor: pointer;
        `;
        
        const crossSVG = `
        <svg fill="white" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_iconCarrier">
            <path d="M18.8,16l5.5-5.5c0.8-0.8,0.8-2,0-2.8l0,0C24,7.3,23.5,7,23,7c-0.5,0-1,0.2-1.4,0.6L16,13.2l-5.5-5.5 c-0.8-0.8-2.1-0.8-2.8,0C7.3,8,7,8.5,7,9.1s0.2,1,0.6,1.4l5.5,5.5l-5.5,5.5C7.3,21.9,7,22.4,7,23c0,0.5,0.2,1,0.6,1.4 C8,24.8,8.5,25,9,25c0.5,0,1-0.2,1.4-0.6l5.5-5.5l5.5,5.5c0.8,0.8,2.1,0.8,2.8,0c0.8-0.8,0.8-2.1,0-2.8L18.8,16z"></path>
          </g>
        </svg>
        `;
        
        deleteFriend.innerHTML = crossSVG;
        const deleteFriendTooltip = addTooltipOnHover(deleteFriend, "Delete Friend")
        deleteFriend.onclick = (event) => {
            event.stopPropagation();
        
            if (!confirm(`Are you sure you want to delete ${friend} from your friend list?`)) return;
        
            const updatedList = getFriendList().filter(val => val !== friend);
            saveFriendList(updatedList);
        
            deleteFriendTooltip.remove()
            item.remove();
        
            if (updatedList.length === 0) {
                const content = item.parentElement;
                const noFriendContainer = document.createElement("div")
                noFriendContainer.style = "width: 100%; height: 100%; padding: 3rem;"
        
                const noFriend = document.createElement("div")
                noFriend.style = "width: 100%; height: 100%; border: 5px #f2f2f2 dashed; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #f2f2f2; font-family: arial; font-size: 20px"
                noFriend.textContent = "Add friends to show them here"
        
                noFriendContainer.appendChild(noFriend)
                content.appendChild(noFriendContainer)
            }
        };

        optionContainer.addEventListener("mouseenter", () => {
            gapDiv.style.width = "10px";
            deleteFriend.style.width = "20px";
        });

        optionContainer.addEventListener("mouseleave", () => {
            gapDiv.style.width = "0";
            deleteFriend.style.width = "0";
        });

        item.appendChild(photo);
        item.appendChild(login);
        item.appendChild(dailyLogtime);
        item.appendChild(weeklyLogtime);
        optionContainer.appendChild(deleteFriend)
        optionContainer.appendChild(gapDiv)
        optionContainer.appendChild(connectionPellet)
        item.appendChild(optionContainer);
        content.appendChild(item);
    } catch (error) {
        console.warn(`Failed to load data for ${friend}:`, error);
    }
}

async function displayFriends() {
    const FRIEND_LIST = getFriendList();

    const photoElement = document.getElementsByClassName("container-inner-item profile-item-top profile-banner home-banner flex flex-direction-row")[0]

    photoElement.style = "padding-bottom: 100px; align-items: center"

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
    const dropDownInput = document.createElement("input");
    dropDownTitle.onclick = () => {setTimeout(() => dropDownInput.focus(), 10)}

    const dropDownContent = document.createElement("div");
    dropDownContent.setAttribute("aria-labelledby", "dropdownMenuFriend");
    dropDownContent.className = "dropdown-menu pull-right";
    dropDownContent.style = "top: 21px; padding: .25rem; min-width: 150px; font-size: unset";

    const dropDownContentInner = document.createElement("div");
    dropDownContentInner.className = "event_search_form ul";
    dropDownContentInner.style = "display: flex; flex-direction: column; align-items: center;";

    dropDownInput.setAttribute("autofocus", true)
    dropDownInput.placeholder = "Enter login";
    dropDownInput.style = "margin: 5px; padding: 5px; width: 80%; color: white; outline: none; background-color: #373c48; border: none; ";

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
    content.style = "width: 100%; height: 100%;"

    const today = new Date().toISOString().split('T')[0];
    const { monday, sunday } = getMondayAndSunday(today);
    const date_range = getDateRange(monday, sunday);

    for (const friend of FRIEND_LIST) {
        await displayFriend(content, friend, date_range, today)
    }

    if (!FRIEND_LIST.length) {
        const noFriendContainer = document.createElement("div")
        noFriendContainer.style = "width: 100%; height: 100%; padding: 3rem;"
        
        const noFriend = document.createElement("div")
        noFriend.style = "width: 100%; height: 100%; border: 5px #f2f2f2 dashed; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #f2f2f2; font-family: arial; font-size: 20px"
        noFriend.textContent = "Add friends to show them here"
        
        noFriendContainer.appendChild(noFriend)
        content.appendChild(noFriendContainer)
    }

    inner.appendChild(title);
    inner.appendChild(content);
    friendContainer.appendChild(inner);

    rowElem.firstElementChild.insertBefore(friendContainer, rowElem.firstElementChild.firstChild);
}

function betterDisplay() {
    setTimeout(() => {

        const elements = document.getElementsByClassName("improved-intra-banner customized")
        console.log(elements)
        if (elements.length) {
            elements[0].style.setProperty("height", "100vh", "important");
        } else {
            const elements = document.getElementsByClassName("container-inner-item profile-item-top profile-banner home-banner flex flex-direction-row")
            elements[0].style.setProperty("background-image", "unset", "important");
            elements[0].style.setProperty("background-color", "transparent", "important");
            document.getElementsByClassName("container-item profile-item full-width")[0].style.setProperty("background-color", "transparent", "important")
            console.log(document.getElementsByClassName("page-content page-content-fluid")[0])
            document.getElementsByClassName("page-content page-content-fluid")[0].style = "background-image: url(https://profile.intra.42.fr/assets/background_login-a4e0666f73c02f025f590b474b394fd86e1cae20e95261a6e4862c2d0faa1b04.jpg)"
        }
        const container = document.getElementsByClassName("container-fullsize full-width fixed-height")[0];
        document.getElementsByTagName("footer")[0].style = "z-index: 999;"

        console.log(container.firstElementChild)

        container.style.setProperty("position", "relative", "important");
        container.style.setProperty("z-index", "2", "important");
        // rowElement.style.position = "relative"
        // blurContainer.style.zIndex = "2";

        // Create the progressive blur container
        const blurContainer = document.createElement("div");
        blurContainer.className = "progressive-blur-container";
        blurContainer.style.position = "fixed";
        blurContainer.style.left = "0";
        blurContainer.style.bottom = "0";
        blurContainer.style.right = "0";
        blurContainer.style.width = "100%";
        blurContainer.style.height = "70%";
        blurContainer.style.pointerEvents = "none";
        blurContainer.style.zIndex = "-1";

        // Blur filter definitions
        const blurLayers = [
        { blur: "1px", mask: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,1) 10%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 40%)" },
        { blur: "2px", mask: "linear-gradient(rgba(0,0,0,0) 10%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 50%)" },
        { blur: "4px", mask: "linear-gradient(rgba(0,0,0,0) 15%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 60%)" },
        { blur: "8px", mask: "linear-gradient(rgba(0,0,0,0) 20%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 70%)" },
        { blur: "16px", mask: "linear-gradient(rgba(0,0,0,0) 40%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 90%)" },
        { blur: "32px", mask: "linear-gradient(rgba(0,0,0,0) 60%, rgba(0,0,0,1) 80%)" },
        ];

        blurLayers.forEach(({ blur, mask }) => {
        const layer = document.createElement("div");
        layer.className = "blur-filter";
        layer.style.position = "absolute";
        layer.style.top = "0";
        layer.style.left = "0";
        layer.style.bottom = "0";
        layer.style.right = "0";
        layer.style.backdropFilter = `blur(${blur})`;
        layer.style.webkitMaskImage = mask;
        layer.style.maskImage = mask;
        layer.style.maskSize = "100% 100%";
        layer.style.webkitMaskSize = "100% 100%";
        blurContainer.appendChild(layer);
        });

        // Gradient overlay
        const gradient = document.createElement("div");
        gradient.className = "gradient";
        gradient.style.position = "absolute";
        gradient.style.top = "0";
        gradient.style.left = "0";
        gradient.style.right = "0";
        gradient.style.bottom = "0";
        gradient.style.background = "linear-gradient(transparent, transparent)";
        blurContainer.appendChild(gradient);

        container.appendChild(blurContainer);

        const rowElement = document.getElementsByClassName("col-lg-4 col-md-6 col-xs-12 fixed-height")
        for (const element of rowElement) {
            element.firstElementChild.style = "border-radius: 30px; "
        }
        
    }, 2000)
}

displayLogtime();
displayFriends();
betterDisplay();
