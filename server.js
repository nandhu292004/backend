const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nandhini#1729",
    database: "library_management",
});

db.connect((err) => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

//login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
      'SELECT * FROM students WHERE email = ? AND password = ?',
      [email, password],
      (err, results) => {
          if (err) return res.status(500).json({ error: 'Database error' });

          if (results.length > 0) {
              res.json({ message: 'Login successful', student_id: results[0].id });
          } else {
              res.status(401).json({ error: 'Invalid credentials' });
          }
      }
  );
});


app.get("/books", (req, res) => {
    db.query("SELECT * FROM books WHERE available = TRUE", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

app.post("/borrow", (req, res) => {
    const { student_id, book_id } = req.body;
    const borrow_date = new Date();
    const due_date = new Date();
    due_date.setDate(borrow_date.getDate() + 14);
    // ✅ Correct
    console.log("Student ID:", student_id);
    console.log("Book ID:", book_id);

    db.query(
        "INSERT INTO borrow_records (student_id, book_id, borrow_date, due_date, returned) VALUES (?, ?, ?, ?, 0)",
        [student_id, book_id, borrow_date, due_date],
        (err, result) => {
            if (err) {
                console.error("Error inserting borrow record:", err);
                return res.status(500).json({ message: "Database error" });
            }
            res.json({ message: "Book borrowed successfully" });
        }
    );
});


//borrowed book details
app.get("/borrowed-books", (req, res) => {
    const query = `
      SELECT borrow_records.id, 
             students.name AS student_name, 
             students.email, 
             books.title AS book_title, 
             books.author, 
             borrow_records.borrow_date, 
             borrow_records.due_date, 
             borrow_records.returned
      FROM borrow_records
      JOIN students ON borrow_records.student_id = students.id
      JOIN books ON borrow_records.book_id = books.id
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message
        });
      }
  
      // ✅ Check that results is an array
      if (!Array.isArray(results)) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: "Database query result is not an array."
        });
      }
  
      res.json(results);
    });
  });
  // Return a book
app.post("/return", (req, res) => {
    const { borrow_id, book_id } = req.body;

    const updateBorrowQuery = `
      UPDATE borrow_records 
      SET returned = 1 
      WHERE id = ?
    `;

    const updateBookQuery = `
      UPDATE books 
      SET available = TRUE 
      WHERE id = ?
    `;

    // First update borrow_records
    db.query(updateBorrowQuery, [borrow_id], (err, result) => {
        if (err) {
            console.error("Error updating borrow record:", err);
            return res.status(500).json({ message: "Failed to update borrow record" });
        }

        // Then update books
        db.query(updateBookQuery, [book_id], (err, result2) => {
            if (err) {
                console.error("Error updating book availability:", err);
                return res.status(500).json({ message: "Failed to update book status" });
            }

            res.json({ message: "Book returned successfully" });
        });
    });
});

// Get total books (all books)
app.get("/all-books", (req, res) => {
    db.query("SELECT * FROM books", (err, result) => {
      if (err) {
        console.error("Error fetching all books:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json(result);
    });
  });
  
  // Get borrowed books count
  app.get("/borrowed-count", (req, res) => {
    db.query("SELECT COUNT(*) AS borrowedCount FROM borrow_records WHERE returned = 0", (err, result) => {
      if (err) {
        console.error("Error fetching borrowed count:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json(result[0]); // { borrowedCount: X }
    });
  });
  
app.listen(5000, () => {
    console.log("Server is running on port 5000");
});