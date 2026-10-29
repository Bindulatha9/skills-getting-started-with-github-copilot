document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(availabilityLabel, `${spotsLeft} spots left`);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";
        participantsHeading.textContent = "Participants";

        const participantCount = document.createElement("span");
        participantCount.className = "participant-count";
        participantCount.textContent = details.participants.length;
        participantsHeading.append(participantCount);

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";

        if (details.participants.length === 0) {
          const emptyState = document.createElement("li");
          emptyState.className = "empty-participant";
          emptyState.textContent = "No participants yet";
          participantsList.appendChild(emptyState);
        } else {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant-button";
            removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
            removeButton.title = `Remove ${email}`;

            const removeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            removeIcon.setAttribute("viewBox", "0 0 24 24");
            removeIcon.setAttribute("fill", "none");
            removeIcon.setAttribute("stroke", "currentColor");
            removeIcon.setAttribute("stroke-width", "1.8");
            removeIcon.setAttribute("stroke-linecap", "round");
            removeIcon.setAttribute("stroke-linejoin", "round");
            removeIcon.setAttribute("aria-hidden", "true");

            const lid = document.createElementNS("http://www.w3.org/2000/svg", "path");
            lid.setAttribute("d", "M3 6h18M8 6V4h8v2");
            const bin = document.createElementNS("http://www.w3.org/2000/svg", "path");
            bin.setAttribute("d", "M5 6l1 14h12l1-14M10 11v5M14 11v5");
            removeIcon.append(lid, bin);
            removeButton.appendChild(removeIcon);

            removeButton.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                await fetchActivities();
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
              } catch (error) {
                messageDiv.textContent = error.message || "Failed to unregister participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            participant.append(participantEmail, removeButton);
            participantsList.appendChild(participant);
          });
        }

        participantsSection.append(participantsHeading, participantsList);
        activityCard.append(title, description, schedule, availability, participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
