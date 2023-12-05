const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Book = require('./models/Book');
const authenticateUser = require("./middlewares/authenticateUser");

const app = express();

// Database connection setup
require("./startup/db")();

// Middleware setup
require("./startup/middleware")(app);

// Session middleware
app.use(
  session({
    secret: "randomStringASyoulikehjudfsajk",
    resave: false,
    saveUninitialized: false,
  })
);

// for admin data
let admin_data = {
  email: "admin",
  password: "123",
};


// Routes
app.get("/", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/home");
  } else {
    res.render("login");
  }
});
  // for adminhome
app.get("/login", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/adminhome");
  } else {
    res.render("login");
  }
});

app.post("/", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/adminhome");
  } else if (
    req.body.email === admin_data.email &&
    req.body.password === admin_data.password
  ) {
    req.session.username = admin_data.email;
    req.session.isLoggedIn = true;
    res.redirect("/adminhome");
  } else {
    res.render("login", { error: "Invalid username and password" });
  }
});



app.get("/adminhome", async (req, res) => {
  if (req.session.isLoggedIn ) {
    try {
      const message = req.session.username
      const users = await User.find({});

      const books =  await Book.find({})  
      res.render("adminhome", { message, users,books });
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  } else {
    res.render("login", { error: null });
  }
});
// user_edit


app.get("/views/edit_user", async (req, res) => {
  try {
    const id = req.query.id;
    const userdata = await User.findById({ _id:id });
    if (userdata) {
      res.render("edit_user", { user: userdata });
    } else {
      res.redirect('/adminhome');
    }
  } catch (err) {
    console.error(err);
  }
});


// edit book

app.get("/views/editBook", async (req, res) => {
  try {
    const id = req.query.id;
    const book = await Book.findById(id);
    if (book) {
      res.render("editBook", { book: book });
    } else {
      res.redirect('/home');
    }
  } catch (err) {
    console.error(err);
  }
});
app.post("/editBook", async (req, res) => {
  const { id, title, story, publishedYear } = req.body;

  try {
    // Find the book by its ID and update its fields
    await Book.findByIdAndUpdate(id, {
      title: title,
      story: story,
      publishedYear: publishedYear
    });

    // Check if the user is an admin
    if (req.session.isLoggedIn && req.session.username === "admin") {
      // Redirect to the admin home page
      res.redirect("/adminhome");
    } else {
      // Redirect to the regular user home page
      res.redirect("/home");
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});




// update user book
app.post("/views/editBook", async (req, res) => {
  try {
    const id = req.body.id;
    const updatedBook = {
      title: req.body.title,
      story: req.body.story,
      publishedYear: req.body.publishedYear
    };
    await Book.findByIdAndUpdate(id, updatedBook);
    res.redirect('/home');
  } catch (err) {
    console.error(err);
  }
});



app.post("/editBook", async (req, res) => {
  const { id, title, story, publishedYear } = req.body;

  try {
    // Find the book by its ID and update its fields
    const book = await Book.findByIdAndUpdate(id, {
      title: title,
      story: story,
      publishedYear: publishedYear
    });

    // Redirect to the home page
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// submit userdata

app.post('/edit_user', async (req, res) => {
  try {
    const userdata = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          email: req.body.gmail,
          valu: req.body.name,
          number: req.body.number,
          __v: req.body.verify 
        }
      }
    );
    res.redirect('/adminhome');
  } catch (err) {
    console.error(err);
  }
});

// detelte book

app.get("/home/delete/:_id", async (req, res) => {
  const bookId = req.params._id
 
  try {
    await Book.findByIdAndRemove(bookId);


    if (req.session.isLoggedIn && req.session.username === "admin") {
      // Redirect to the admin home page
      res.redirect("/adminhome");
    } else {
      // Redirect to the regular user home page
      res.redirect("/home");
    }

    
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


// delete user

app.post("/removeUser", async (req, res) => {
  const userId = req.body.userId;
  

  try {
    const user=await User.findByIdAndRemove(userId)
    await Book.deleteMany({ userId: user._id });
    res.redirect("/adminhome");
  } catch (err) {
    console.error(err);
   
  }
});
   





app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});




app.get("/home", authenticateUser, async(req, res) => {

  const books=await Book.find({userId: req.session.userId})
  res.render("home", { user: req.session.user,books });
});

app.get("/login", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/home");
  } else {
    res.render("login");
  }
});

app.get("/register", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/home");
  } else {
    res.render("register", { error: null });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Check for missing fields
  if (!email || !password) {
    return res.render("login", { error: "Please enter all the fields" });
  }

  if (email === admin_data.email && password === admin_data.password) {
    req.session.username = email;
    req.session.isLoggedIn = true;
    return res.redirect("/adminhome");
  }

  try {
    const user = await User.findOne({ email });
   

    if (!user) {
      return res.render("login", { error: "Invalid username and password" });
    }

    const doesPasswordMatch = await bcrypt.compare(password, user.password);

    if (!doesPasswordMatch) {
      return res.render("login", { error: "Invalid username and password" });
    }

    // Create session and store user information
    req.session.user = user;
    req.session.isLoggedIn = true;
    req.session.userId=user._id
    res.redirect("/home");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error in login");
  }
});


app.get('/adminViewBooks/view/:userId', async (req, res) => {
  
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    const books = await Book.find({ userId: user._id });
    res.render('adminViewBooks', { user, bookCollection: books });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


// book 
app.post("/postdata", async (req, res) => {
  const title = req.body.title;
  const story = req.body.story;
  const publishedYear = req.body.publishedYear;

  try {
    const book = new Book({
      title: title,
      story: story,
      publishedYear: publishedYear,
      userId:req.session.userId
    });

    await book.save();
    res.redirect("/home"); // Redirect back to the home page
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});





//  fech book data to user home 

app.get("/home", authenticateUser, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.session.userId});
    res.render("home", { user: req.session.user, books: books });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});
app.get("/adminhome", authenticateUser, async (req, res) => {
  try {
    const books = await Book.find({});
    res.render("adminhome", { user: req.session.user, books: books });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});





app.post("/register", async (req, res) => {
  const { email, password ,number,valu} = req.body;

  // Check for missing fields
  if (!email || !password) {
    return res.render("register", { error: "Please enter all the fields" });
  }

  const doesUserExistAlready = await User.findOne({ valu });

  if (doesUserExistAlready) {
    return res.render("register", {
      error: "A user with that email already exists, please try another one!",
    });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 8);
  const newUser = new User({ email,number, password: hashedPassword,valu });

  try {
    await newUser.save();
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error in registration");
  }
});

app.get("/logout", authenticateUser, (req, res) => {
  // Destroy the session and clear the session cookie
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});


// Server config
const PORT = process.env.PORT || 3012;
app.listen(PORT, () => {
  console.log(`Server started listening on port: ${PORT}`);
});
