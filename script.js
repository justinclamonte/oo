
const form = document.getElementById("question-form");
const questionList = document.getElementById("question-list");

const STORAGE_KEY = "academicHubQuestions";

/**
 * @typedef {Object} Reply
 * @property {string} text
 * @property {string} date
 */

/**
 * @typedef {Object} Question
 * @property {string} title
 * @property {string} subject
 * @property {string} details
 * @property {Reply[]} replies
 */

/**
 * @returns {Question[]}
 */

function getQuestions() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return [];

        const data = JSON.parse(saved);

        if (!Array.isArray(data)) return [];

        let needsMigration = false;

        const questions = data.map(function(question, index) {
            if (!question.id) needsMigration = true;

            if (
                !question.votes ||
                !Number.isFinite(question.votes.up) ||
                !Number.isFinite(question.votes.down)
            ) {
                needsMigration = true;
            }

            const questionId = String(
                question.id ||
                ("q-" + Date.now() + "-" + index + "-" +
                    Math.random().toString(36).slice(2, 7))
            );

            const questionVotes = {
                up: Math.max(0, Number(question.votes?.up) || 0),
                down: Math.max(0, Number(question.votes?.down) || 0)
            };

            const replies = Array.isArray(question.replies)
                ? question.replies
                    .filter(function(reply) {
                        return reply &&
                            typeof reply.text === "string";
                    })
                    .map(function(reply, replyIndex) {
                        if (!reply.id) needsMigration = true;

                        if (
                            !reply.votes ||
                            !Number.isFinite(reply.votes.up) ||
                            !Number.isFinite(reply.votes.down)
                        ) {
                            needsMigration = true;
                        }

                        return {
                            id: String(
                                reply.id ||
                                ("r-" + Date.now() + "-" + index +
                                    "-" + replyIndex + "-" +
                                    Math.random().toString(36).slice(2, 7))
                            ),
                            text: reply.text,
                            date: reply.date || "",
                            votes: {
                                up: Math.max(
                                    0, Number(reply.votes?.up) || 0
                                ),
                                down: Math.max(
                                    0, Number(reply.votes?.down) || 0
                                )
                            }
                        };
                    })
                : [];

            return {
                id: questionId,
                title: String(question.title || ""),
                subject: String(question.subject || "Other"),
                details: String(question.details || ""),
                votes: questionVotes,
                replies: replies
            };
        });

        // Save generated IDs so they remain stable after refresh.
        if (needsMigration) {
            saveQuestions(questions);
        }

        return questions;
    } catch (error) {
        console.error("Loading error:", error);
        return [];
    }
}

/* ===== ACADEMIC HUB VOTING ===== */

const VOTES_STORAGE_KEY = "academicHubVotes";

function getSavedVotes() {
    try {
        const saved = localStorage.getItem(VOTES_STORAGE_KEY);
        const votes = saved ? JSON.parse(saved) : {};

        if (!votes || typeof votes !== "object" || Array.isArray(votes)) {
            return {};
        }

        return votes;
    } catch (error) {
        console.error("Vote loading error:", error);
        return {};
    }
}

function createVoteControls(item, questionId, replyId) {
    const controls = document.createElement("div");
    controls.className = "vote-controls";

    const voteKey = replyId
        ? "reply:" + questionId + ":" + replyId
        : "question:" + questionId;

    const savedVotes = getSavedVotes();
    const currentVote = savedVotes[voteKey];

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "vote-button";
    upButton.textContent = "▲ " + item.votes.up;
    upButton.setAttribute("aria-label", "Upvote");
    upButton.setAttribute("aria-pressed", String(currentVote === "up"));

    if (currentVote === "up") {
        upButton.classList.add("is-selected");
    }

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "vote-button";
    downButton.textContent = "▼ " + item.votes.down;
    downButton.setAttribute("aria-label", "Downvote");
    downButton.setAttribute("aria-pressed", String(currentVote === "down"));

    if (currentVote === "down") {
        downButton.classList.add("is-selected");
    }

    upButton.addEventListener("click", function() {
        handleVote(questionId, replyId, "up");
    });

    downButton.addEventListener("click", function() {
        handleVote(questionId, replyId, "down");
    });

    controls.appendChild(upButton);
    controls.appendChild(downButton);

    return controls;
}

function handleVote(questionId, replyId, choice) {
    const questions = getQuestions();

    const question = questions.find(function(item) {
        return item.id === questionId;
    });

    if (!question) {
        alert("This question could not be found.");
        return;
    }

    let target = question;

    if (replyId) {
        target = question.replies.find(function(reply) {
            return reply.id === replyId;
        });

        if (!target) {
            alert("This reply could not be found.");
            return;
        }
    }

    if (!target.votes) {
        target.votes = { up: 0, down: 0 };
    }

    const voteKey = replyId
        ? "reply:" + questionId + ":" + replyId
        : "question:" + questionId;

    const savedVotes = getSavedVotes();
    const previousVote = savedVotes[voteKey];

    // Tapping the same vote again removes it.
    if (previousVote === choice) {
        target.votes[choice] = Math.max(
            0, target.votes[choice] - 1
        );

        delete savedVotes[voteKey];
    } else {
        // Switching votes removes the previous count first.
        if (previousVote === "up" || previousVote === "down") {
            target.votes[previousVote] = Math.max(
                0, target.votes[previousVote] - 1
            );
        }

        target.votes[choice] += 1;
        savedVotes[voteKey] = choice;
    }

    if (!saveQuestions(questions)) {
        alert("Could not save the vote. Please try again.");
        return;
    }

    try {
        localStorage.setItem(
            VOTES_STORAGE_KEY,
            JSON.stringify(savedVotes)
        );
    } catch (error) {
        console.error("Vote saving error:", error);
        alert("The vote count was saved, but your vote choice could not be saved.");
    }

    renderQuestions();
}


/**
 * @param {Question[]} questions
 * @returns {boolean}
 */
function saveQuestions(questions) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(questions)
        );
        return true;
    } catch (error) {
        console.error("Saving error:", error);
        alert("Could not save changes in this browser.");
        return false;
    }
}

/**
 * @param {string} tag
 * @param {string} text
 * @param {string} className
 * @returns {HTMLElement}
 */
function createTextElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
}

/**
 * @param {Question} question
 * @param {number} index
 * @returns {HTMLElement}
 */

function createQuestionCard(question, index) {
    const card = document.createElement("article");
    card.className = "posted-question";

    card.appendChild(
        createTextElement("h4", question.title, "")
    );

    card.appendChild(
        createTextElement(
            "p",
            "Subject: " + question.subject,
            ""
        )
    );

    card.appendChild(
        createTextElement("p", question.details, "")
    );

    // Delete button for testing before account ownership is added.
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Post";
    deleteButton.className = "delete-post-button";

    deleteButton.addEventListener("click", function() {
        const confirmed = confirm(
            "Are you sure you want to delete this question and all its replies?"
        );

        if (!confirmed) {
            return;
        }

        const questions = getQuestions();

        // Find the question by its stable ID, not its filtered index.
        const questionIndex = questions.findIndex(function(item) {
            return item.id === question.id;
        });

        if (questionIndex === -1) {
            alert("This question could not be found.");
            return;
        }

        questions.splice(questionIndex, 1);

        if (saveQuestions(questions)) {
            renderQuestions();
        }
    });

    card.appendChild(deleteButton);

    // Voting controls for the question.
    card.appendChild(
        createVoteControls(question, question.id, null)
    );

    const replyHeading = createTextElement(
        "h5",
        "Replies (" + question.replies.length + ")",
        ""
    );

    card.appendChild(replyHeading);

    const replyList = document.createElement("div");
    replyList.className = "reply-list";

    if (question.replies.length === 0) {
        replyList.appendChild(
            createTextElement(
                "p",
                "No replies yet. Start the discussion!",
                ""
            )
        );
    } else {
        question.replies.forEach(function(reply) {
            const replyCard = document.createElement("div");
            replyCard.className = "reply-card";

            replyCard.appendChild(
                createTextElement("p", reply.text, "")
            );

            if (reply.date) {
                replyCard.appendChild(
                    createTextElement("small", reply.date, "")
                );
            }

            // Voting controls for this reply.
            replyCard.appendChild(
                createVoteControls(reply, question.id, reply.id)
            );

            replyList.appendChild(replyCard);
        });
    }

    card.appendChild(replyList);

    const replyForm = document.createElement("form");
    replyForm.className = "reply-form";

    const replyInput = document.createElement("textarea");
    replyInput.placeholder = "Write a helpful reply...";
    replyInput.rows = 2;
    replyInput.required = true;
    replyInput.maxLength = 1000;
    replyInput.setAttribute(
        "aria-label",
        "Reply to " + question.title
    );

    const replyButton = document.createElement("button");
    replyButton.type = "submit";
    replyButton.textContent = "Post Reply";

    replyForm.appendChild(replyInput);
    replyForm.appendChild(replyButton);

    replyForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const replyText = replyInput.value.trim();

        if (!replyText) {
            alert("Please write a reply first.");
            return;
        }

        const questions = getQuestions();

        if (!questions[index]) {
            alert("This question could not be found.");
            return;
        }

        questions[index].replies.push({
            text: replyText,
            date: new Date().toLocaleString()
        });

        if (saveQuestions(questions)) {
            renderQuestions();
            awardExp("reply");
        }
    });

    card.appendChild(replyForm);

    return card;
}



function renderQuestions() {
    if (!questionList) {
        console.error("Question list was not found.");
        return;
    }

    questionList.innerHTML = "";

    questionList.appendChild(
        createTextElement("h3", "Recent Questions", "")
    );

    const questions = getQuestions();

    const searchInput =
        document.getElementById("question-search");

    const subjectFilter =
        document.getElementById("subject-filter");

    const countDisplay =
        document.getElementById("discussion-count");

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedSubject = subjectFilter
        ? subjectFilter.value
        : "all";

    if (questions.length === 0) {
        questionList.appendChild(
            createTextElement(
                "p",
                "No questions yet. Be the first to ask!",
                ""
            )
        );

        if (countDisplay) {
            countDisplay.textContent = "0 questions";
        }

        return;
    }

    let displayedCount = 0;

    questions.forEach(function(question, index) {
        const title = String(question.title || "");
        const details = String(question.details || "");
        const subject = String(question.subject || "Other");

        const replyText = Array.isArray(question.replies)
            ? question.replies.map(function(reply) {
                return String(reply.text || "");
            }).join(" ")
            : "";

        const searchableText = (
            title + " " + details + " " +
            subject + " " + replyText
        ).toLowerCase();

        const matchesSearch =
            searchableText.includes(searchText);

        const matchesSubject =
            selectedSubject === "all" ||
            subject === selectedSubject;

        if (matchesSearch && matchesSubject) {
            // Keep the ORIGINAL index so replies save correctly.
            questionList.appendChild(
                createQuestionCard(question, index)
            );

            displayedCount++;
        }
    });

    if (countDisplay) {
        countDisplay.textContent =
            "Showing " + displayedCount +
            " of " + questions.length + " questions";
    }

    if (displayedCount === 0) {
        questionList.appendChild(
            createTextElement(
                "p",
                "No matching questions found. Try another search or subject.",
                ""
            )
        );
    }
}

/* ===== DISCUSSION SEARCH EVENTS ===== */

const questionSearch =
    document.getElementById("question-search");

const subjectFilter =
    document.getElementById("subject-filter");

if (questionSearch) {
    questionSearch.addEventListener("input", function() {
        renderQuestions();
    });
}

if (subjectFilter) {
    subjectFilter.addEventListener("change", function() {
        renderQuestions();
    });
}

if (form && questionList) {
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const titleInput =
            document.getElementById("question-title");
        const subjectInput =
            document.getElementById("question-subject");
        const detailsInput =
            document.getElementById("question-details");

        if (!titleInput || !subjectInput || !detailsInput) {
            alert("The form fields could not be found.");
            return;
        }

        const title = titleInput.value.trim();
        const subject = subjectInput.value;
        const details = detailsInput.value.trim();

        if (!title || !subject || !details) {
            alert("Please complete all fields.");
            return;
        }

        const questions = getQuestions();

        questions.unshift({
            title: title,
            subject: subject,
            details: details,
            replies: []
        });

if (saveQuestions(questions)) {
    form.reset();
    renderQuestions();
    awardExp("question");
    alert("Your question has been posted!");
} else {
    alert("Your question could not be saved. Please try again.");
}

        
    });

    renderQuestions();
} else {
    console.error(
        "Academic Hub could not find the form or question list."
    );
}

/* =================================
   ACADEMIC HUB RPG PROFILE
================================= */

const PROFILE_STORAGE_KEY = "academicHubProfile";

const scholarRanks = [
    { level: 1, title: "Novice Scholar", exp: 0, avatar: "📚" },
    { level: 2, title: "Apprentice", exp: 100, avatar: "📘" },
    { level: 3, title: "Knowledge Seeker", exp: 250, avatar: "🔎" },
    { level: 4, title: "Adept Scholar", exp: 450, avatar: "🪶" },
    { level: 5, title: "Expert", exp: 700, avatar: "📖" },
    { level: 6, title: "Master Scholar", exp: 1000, avatar: "🔮" },
    { level: 7, title: "Grand Scholar", exp: 1400, avatar: "🏅" },
    { level: 8, title: "Sage", exp: 1900, avatar: "🌟" },
    { level: 9, title: "Grand Sage", exp: 2500, avatar: "💎" },
    { level: 10, title: "Legendary Scholar", exp: 3200, avatar: "👑" }
];

function getPlayerProfile() {
    try {
        const saved = localStorage.getItem(
            PROFILE_STORAGE_KEY
        );

        if (!saved) {
            return { exp: 0 };
        }

        const profile = JSON.parse(saved);

        if (
            !profile ||
            !Number.isFinite(profile.exp) ||
            profile.exp < 0
        ) {
            return { exp: 0 };
        }

        return profile;
    } catch (error) {
        console.error("Profile loading error:", error);
        return { exp: 0 };
    }
}

function savePlayerProfile(profile) {
    try {
        localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(profile)
        );

        return true;
    } catch (error) {
        console.error("Profile saving error:", error);
        return false;
    }
}

function renderPlayerProfile() {
    const titleElement =
        document.getElementById("player-title");
    const levelElement =
        document.getElementById("player-level");
    const expElement =
        document.getElementById("player-exp");
    const avatarElement =
        document.getElementById("player-avatar");
    const progressLabel =
        document.getElementById("exp-progress-label");
    const progressNumbers =
        document.getElementById("exp-progress-numbers");
    const progressFill =
        document.getElementById("exp-bar-fill");

    if (
        !titleElement ||
        !levelElement ||
        !expElement ||
        !avatarElement ||
        !progressLabel ||
        !progressNumbers ||
        !progressFill
    ) {
        return;
    }

    const profile = getPlayerProfile();
    const exp = Math.floor(profile.exp);

    let currentRank = scholarRanks[0];
    let nextRank = null;

    for (let i = 0; i < scholarRanks.length; i++) {
        if (exp >= scholarRanks[i].exp) {
            currentRank = scholarRanks[i];
        } else {
            nextRank = scholarRanks[i];
            break;
        }
    }

    titleElement.textContent = currentRank.title;
    levelElement.textContent =
        "Level " + currentRank.level;
    expElement.textContent = exp + " EXP";
    avatarElement.textContent = currentRank.avatar;

    if (nextRank) {
        const earnedThisLevel = exp - currentRank.exp;
        const neededThisLevel =
            nextRank.exp - currentRank.exp;

        const percentage =
            (earnedThisLevel / neededThisLevel) * 100;

        progressLabel.textContent =
            "Progress to " + nextRank.title;

        progressNumbers.textContent =
            earnedThisLevel + " / " +
            neededThisLevel + " EXP";

        progressFill.style.width =
            Math.min(100, percentage) + "%";
    } else {
        progressLabel.textContent =
            "Maximum title milestone reached!";

        progressNumbers.textContent = exp + " EXP";
        progressFill.style.width = "100%";
    }
}

// Display the saved profile when the page opens.
renderPlayerProfile();

/* ===== ACADEMIC HUB EXP REWARDS ===== */

function awardExp(action) {
    const rewards = {
        question: { amount: 5, limit: 3, field: "dailyQuestions" },
        reply: { amount: 5, limit: 5, field: "dailyReplies" },
        vote: { amount: 5, limit: 10, field: "dailyVotes" },
        helpful: { amount: 15, limit: 2, field: "dailyHelpful" }
    };

    const reward = rewards[action];

    if (!reward) return false;

    const profile = getPlayerProfile();
    const today = new Date().toLocaleDateString();

    if (profile.dailyDate !== today) {
        profile.dailyDate = today;
        profile.dailyQuestions = 0;
        profile.dailyReplies = 0;
        profile.dailyVotes = 0;
        profile.dailyHelpful = 0;
    }

    if (!Number.isFinite(profile[reward.field])) {
        profile[reward.field] = 0;
    }

    if (profile[reward.field] >= reward.limit) {
        savePlayerProfile(profile);
        alert("Daily EXP limit reached. Try again tomorrow!");
        return false;
    }

    profile[reward.field] += 1;
    profile.exp = Math.max(0, Number(profile.exp) || 0);
    profile.exp += reward.amount;

    if (savePlayerProfile(profile)) {
        renderPlayerProfile();
        alert("+" + reward.amount + " EXP earned!");
        return true;
    }

    return false;
}



