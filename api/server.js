const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Ermöglicht CORS für alle Ursprünge

// MySQL-Datenbankverbindung
const db = mysql.createConnection({
    host: "localhost", // Ersetze durch deinen Host
    user: "root", // Ersetze durch deinen Benutzernamen
    password: "password", // Ersetze durch dein Passwort
    database: "restaurant_reviews", // Ersetze durch deinen Datenbanknamen
});

db.connect((err) => {
    if (err) {
        console.error("Datenbankverbindung fehlgeschlagen:", err);
        return;
    }
    console.log("Datenbank verbunden.");
});

// Tabelle für Restaurants initialisieren (falls noch nicht vorhanden)
const initTableQuery = `
CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    avg_price FLOAT DEFAULT 0,
    avg_appearance FLOAT DEFAULT 0,
    avg_taste FLOAT DEFAULT 0,
    avg_size FLOAT DEFAULT 0,
    avg_value FLOAT DEFAULT 0,
    total_reviews INT DEFAULT 0
);
`;

db.query(initTableQuery, (err) => {
    if (err) {
        console.error("Fehler beim Initialisieren der Tabelle:", err);
        process.exit(1);
    }
    console.log("Tabelleninitialisierung erfolgreich.");
});

// Route: Bewertung speichern und Durchschnittswerte aktualisieren
app.post("/submit-review", (req, res) => {
    const { restaurantName, price, appearance, taste, size, value } = req.body;

    if (!restaurantName || !price || !appearance || !taste || !size || !value) {
        return res.status(400).send("Alle Bewertungsdaten sind erforderlich.");
    }

    // Überprüfen, ob das Restaurant existiert
    db.query(
        "SELECT * FROM restaurants WHERE name = ?",
        [restaurantName],
        (err, results) => {
            if (err) {
                console.error("Fehler bei der Abfrage:", err);
                return res.status(500).send("Serverfehler.");
            }

            if (results.length === 0) {
                // Restaurant hinzufügen, falls es nicht existiert
                db.query(
                    "INSERT INTO restaurants (name, total_reviews) VALUES (?, 0)",
                    [restaurantName],
                    (err) => {
                        if (err) {
                            console.error("Fehler beim Einfügen des Restaurants:", err);
                            return res.status(500).send("Serverfehler.");
                        }
                        updateAverages(restaurantName, price, appearance, taste, size, value, res);
                    }
                );
            } else {
                updateAverages(restaurantName, price, appearance, taste, size, value, res);
            }
        }
    );
});

// Funktion: Durchschnittswerte aktualisieren
function updateAverages(restaurantName, price, appearance, taste, size, value, res) {
    db.query(
        `UPDATE restaurants
         SET avg_price = (avg_price * total_reviews + ?) / (total_reviews + 1),
             avg_appearance = (avg_appearance * total_reviews + ?) / (total_reviews + 1),
             avg_taste = (avg_taste * total_reviews + ?) / (total_reviews + 1),
             avg_size = (avg_size * total_reviews + ?) / (total_reviews + 1),
             avg_value = (avg_value * total_reviews + ?) / (total_reviews + 1),
             total_reviews = total_reviews + 1
         WHERE name = ?`,
        [price, appearance, taste, size, value, restaurantName],
        (err) => {
            if (err) {
                console.error("Fehler beim Aktualisieren der Durchschnittswerte:", err);
                return res.status(500).send("Serverfehler.");
            }
            res.send("Bewertung erfolgreich gespeichert.");
        }
    );
}

// Route: Durchschnittswerte eines Restaurants abrufen
app.get("/averages/:restaurantName", (req, res) => {
    const { restaurantName } = req.params;

    db.query(
        "SELECT name, avg_price, avg_appearance, avg_taste, avg_size, avg_value, total_reviews FROM restaurants WHERE name = ?",
        [restaurantName],
        (err, results) => {
            if (err) {
                console.error("Fehler bei der Abfrage:", err);
                return res.status(500).send("Serverfehler.");
            }

            if (results.length === 0) {
                return res.status(404).send("Restaurant nicht gefunden.");
            }

            res.json(results[0]);
        }
    );
});

// Server starten
const PORT = 3000; // Ersetze mit deinem gewünschten Port
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}.`);
});
