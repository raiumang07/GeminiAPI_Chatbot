const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");



let userMessage = null;

let isResponseGenerating = false;


//API configuration
const API_KEY = "AIzaSyBlXKVvh_aGfoUCiV7V-aMfUTXmtA-tgSQ";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;




const loadLocalStorageData = () => {
    //load data from local storage
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = localStorage.getItem("themeColor") === "light_mode";
    //apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);//scroll to bottom
}

loadLocalStorageData();

//create a new message element and return it 
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(" ");
    let currentWordIndex = 0;
    const typingInterval = setInterval(() => {
        // append each wordto the textelement one by one
        textElement.innerText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            //revert copy icon 
            localStorage.setItem("savedChats", chatList.innerHTML);
            // chatlist content will be stored in local storage
        }
        chatList.scrollTo(0, chatList.scrollHeight);//scroll to bottom
    }, 75);
}


//fetch response from th API based on your message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    // send a POST request to the API URL with the user's message
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error.message);
        // console.log(data);
        //get the apiResponse text and remove the asterisks from it
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        // console.log(apiResponse);
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }
    finally {
        incomingMessageDiv.classList.remove("loading");
    }

}


// show a loading while waiting for the API response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="Gemini" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>          
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight);//scroll to bottom

    generateAPIResponse(incomingMessageDiv);
}



//copy message to the clipboard
const copyMessage = (copyIcon) => {
    const MessageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(MessageText);
    copyIcon.innerText = "done";//show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000);
    //revert icon after 1s
}


//handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; //Exit

    isResponseGenerating = true;
    const html = `<div class="message-content">
                <img src="images/user.jpg" alt="User" class="avatar">
                <p class="text"></p>
            </div>`;
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();
    chatList.scrollTo(0, chatList.scrollHeight);//scroll to bottom
    document.body.classList.add("hide-header");//hide header once chat start
    setTimeout(showLoadingAnimation, 500);
}

//set userMessage and handle outgoing chat when asuggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

//toggle theme button light and dark mode
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// delete chat button to delete all chat history
deleteChatButton.addEventListener("click", () => {
    if (!confirm("Are you sure you want to delete all chat history?")) return;
    chatList.innerHTML = "";
    localStorage.removeItem("savedChats");
    loadLocalStorageData();
});


//prevent default form submission and handle outgoing chat 
typingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleOutgoingChat();
});