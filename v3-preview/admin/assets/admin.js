document.addEventListener("DOMContentLoaded", function () {

    console.log("PM Knowledge Admin initialized");

    fetch("../api/status.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("status api unavailable");
            }
            return response.json();
        })
        .then(data => {

            console.log("System Status:", data);

            document.querySelectorAll("[data-status-value]")
                .forEach(element => {
                    const key = element.dataset.statusValue;
                    if (data[key] !== undefined) {
                        element.textContent = data[key];
                    }
                });

        })
        .catch(error => {
            console.error("API loading failed", error);
        });

});
