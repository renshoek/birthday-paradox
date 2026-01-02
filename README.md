# Birthday Paradox Visualizer

A dynamic, web-based simulation of the **Birthday Paradox** (or Birthday Problem) built with vanilla JavaScript and the HTML5 Canvas API.

**[🔴 Live Demo](https://renshoek.github.io/birthday-paradox/)**

## 🎂 What is this?

The Birthday Paradox is a probability theory which states that in a set of randomly chosen people, some pair of them will have the same birthday with a surprisingly high probability. For example, in a group of just 23 people, there is a **50%** chance that two people share a birthday.

This project visualizes that math using a particle simulation.

## ✨ Features

* **Particle Simulation:** Each node represents a person. Their color corresponds to their birthday (mapped to a 360° hue).
* **Social Physics:** Nodes interact based on their birthdays!
    * **Attraction:** Nodes with similar birth dates attract each other.
    * **Repulsion:** Nodes with different birth dates repel if they get too crowded.
* **Visual Matching:** When two nodes share the exact same birthday, a glowing cyan line connects them.
* **Real-time Stats:** Compares the mathematical probability vs. the actual matches found in the current simulation.
* **Debug Panel:** A collapsible panel that allows you to tweak the physics engine (Attraction Force, Repulsion Range, etc.) in real-time.

## 🚀 How to Run

Since this is a static web project with no dependencies, you can run it directly:

1.  Clone the repository:
    ```bash
    git clone [https://github.com/renshoek/birthday-paradox.git](https://github.com/renshoek/birthday-paradox.git)
    ```
2.  Navigate to the folder:
    ```bash
    cd birthday-paradox
    ```
3.  Open `index.html` in your web browser.

## 🛠️ Configuration

You can interact with the simulation using the UI controls:

* **Room Size:** Change the number of people (nodes) in the simulation (2 to 100).
* **Physics Debug:** Use the sliders in the top-right corner to change how the particles move and interact.

## 📂 Project Structure

* `index.html`: The main structure and UI layout.
* `script.js`: Handles the Canvas drawing, physics logic (`updatePhysics`), and probability math.
* `styles.css`: Dark-themed styling with neon accents.

## 🧮 The Math

The mathematical probability is calculated in `script.js` using the standard formula:

```javascript
// Probability of NO match
let probNoMatch = 1;
for (let i = 0; i < n; i++) {
    probNoMatch *= (365 - i) / 365;
}
// Probability of AT LEAST one match
let result = (1 - probNoMatch) * 100;
