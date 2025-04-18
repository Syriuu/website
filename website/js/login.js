document.addEventListener("DOMContentLoaded", function () {
    function createStars() {
        const starsContainer = document.querySelector('.stars');
        if (!starsContainer) return;

        for (let i = 0; i < 50; i++) {
            let star = document.createElement('div');
            star.classList.add('star');
            star.style.top = Math.random() * 100 + 'vh';
            star.style.left = Math.random() * 100 + 'vw';
            star.style.animationDuration = (Math.random() * 2 + 1) + 's';
            starsContainer.appendChild(star);
        }
    }

    createStars();

    window.showForm = function (formId) {
        document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));
        document.getElementById(formId).classList.add('active');
    };
});

