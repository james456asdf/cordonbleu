const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Datenbankverbindung
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "restaurant_reviews",
});

db.connect((err) => {
    if (err) {
        console.error("Datenbankverbindung fehlgeschlagen:", err);
        return;
    }
    console.log("Datenbank verbunden.");
});

// Route: Bewertung speichern und Durchschnitt aktualisieren
app.post("/submit-review", (req, res) => {
    const { restaurantName, price, appearance, taste, size, value } = req.body;

    if (!restaurantName || !price || !appearance || !taste || !size || !value) {
        return res.status(400).send("Alle Bewertungsdaten sind erforderlich.");
    }

    // Schritt 1: Überprüfen, ob das Restaurant existiert
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
                    "INSERT INTO restaurants (name) VALUES (?)",
                    [restaurantName],
                    (err) => {
                        if (err) {
                            console.error("Fehler beim Einfügen des Restaurants:", err);
                            return res.status(500).send("Serverfehler.");
                        }
                    }
                );
            }

            // Schritt 2: Durchschnittswerte aktualisieren
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
    );
});

// Route: Durchschnittswerte eines Restaurants abrufen
app.get("/averages/:restaurantName", (req, res) => {
    const { restaurantName } = req.params;

    db.query(
        "SELECT * FROM restaurants WHERE name = ?",
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
app.listen(3000, () => {
    console.log("Server läuft auf Port 3000.");
});
