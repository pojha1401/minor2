import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import cors from "cors";
import fetch from "node-fetch";



const app = express();
const port = 3000;
const saltRounds = 10;
const __dirname = path.resolve();
// const FLASK_ENDPOINT = 'http://localhost:5000/prediction';
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://ojhapranav14:UKGs8VAUO3J25BCy@cluster0.soarpjf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a mongoose schema for user
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// Create a mongoose model based on the schema
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../Login/login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../Login/signup.html"));
});

app.get("/form", (req, res) => {
  res.redirect("http://localhost:5000/")
});

app.get("/result", (req, res) => {
  const premium = req.query.premium;
  res.sendFile(path.join(__dirname, "../Login/result.html"), { premium });
});
app.options('/predict', cors());


// app.post("/predict", async (req, res) => {
//   try {
//     // Extract input data from request body
//     const { age, sex, bmi, children, smoker, region } = req.body;

//     // Make request to Flask backend
//     const response = await fetch(FLASK_ENDPOINT, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Access-Control-Allow-Origin': '*'
//       },
//       body: JSON.stringify({ age, sex, bmi, children, smoker, region })
//     });

//     // Parse the response from Flask backend
//     const result = await response.json();

//     // Return the prediction result to the client
//     res.json(result);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.post("/signup", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      res.send("Email already exists. Try logging in.");
    } else {
      // Hash the password and save it in the database
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new User({
        email: email,
        password: hashedPassword,
      });
      await newUser.save();
      res.sendFile(path.join(__dirname, "../Login/login.html"));
    }
  } catch (err) {
    console.log(err);
    res.send("Error registering user.");
  }
});

app.post("/login", async (req, res) => {
  if (req.body.username) {
    const email = req.body.username;
    const loginPassword = req.body.password;

    try {
      console.log("Attempting login with email:", email);

      // Find user by email
      const user = await User.findOne({ email: email });
      if (user) {
        // Compare passwords
        const passwordMatch = await bcrypt.compare(
          loginPassword,
          user.password
        );
        if (passwordMatch) {
          // Redirect to form.html upon successful login
          res.status(200).json({ redirectTo: "/form" });
        } else {
          res.status(401).json({ error: "Incorrect password" });
        }
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (err) {
      console.error("Error logging in:", err);
      res.status(500).json({ error: "Error logging in" });
    }
  } else {
    res.status(400).json({ error: "Username not provided" });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});