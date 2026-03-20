const REVIEW_STORAGE_KEY = "yubusLiveReviews";
const reviewForm = document.getElementById("reviewForm");
const reviewName = document.getElementById("reviewName");
const reviewEmail = document.getElementById("reviewEmail");
const reviewRoute = document.getElementById("reviewRoute");
const reviewTag = document.getElementById("reviewTag");
const reviewMessage = document.getElementById("reviewMessage");
const reviewStatus = document.getElementById("reviewStatus");
const reviewStars = Array.from(document.querySelectorAll(".review-star"));

let selectedReviewRating = 5;

function setReviewStatus(message, tone = "") {
    if (!reviewStatus) {
        return;
    }

    reviewStatus.textContent = message;
    reviewStatus.classList.remove("error");
    if (tone) {
        reviewStatus.classList.add(tone);
    }
}

function updateReviewStars(rating) {
    selectedReviewRating = rating;
    reviewStars.forEach((button) => {
        const starValue = Number(button.dataset.rating || "0");
        button.classList.toggle("active", starValue <= rating);
    });
}

function getStoredReviews() {
    try {
        const parsed = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveReview(review) {
    const reviews = getStoredReviews();
    const nextReviews = [review, ...reviews].slice(0, 20);
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(nextReviews));
}

function preloadReviewForm() {
    if (reviewName) {
        reviewName.value = localStorage.getItem("userName") || "";
    }

    if (reviewEmail) {
        reviewEmail.value = localStorage.getItem("userEmail") || localStorage.getItem("userIdentity") || "";
    }
}

reviewStars.forEach((button) => {
    button.addEventListener("click", () => {
        updateReviewStars(Number(button.dataset.rating || "5"));
    });
});

if (reviewForm) {
    reviewForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const author = String(reviewName?.value || "").trim();
        const email = String(reviewEmail?.value || "").trim();
        const route = String(reviewRoute?.value || "").trim();
        const tag = String(reviewTag?.value || "").trim();
        const text = String(reviewMessage?.value || "").trim();

        if (!author || !route || !text) {
            setReviewStatus("Fill your name, route, and review before submitting.", "error");
            return;
        }

        saveReview({
            author,
            email,
            route,
            tag: tag || "Recent review",
            text,
            rating: selectedReviewRating,
            createdAt: new Date().toISOString()
        });

        setReviewStatus("Review submitted successfully. Opening the homepage live reviews...");
        window.setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    });
}

preloadReviewForm();
updateReviewStars(selectedReviewRating);
