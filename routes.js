const passport = require('passport');


module.exports = function (app, myDataBase) {
// Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
      res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });
  ////////////////////////////////////
  // Route for login (POST request)
  app.post('/login', passport.authenticate('local', { 
  failureRedirect: '/' // Redirect to home page on failure
}), (req, res) => {
  // Successful authentication, redirect to profile
  console.log(`User ${req.user.username} logged in successfully.`);
  res.redirect('/profile'); // Redirect to the profile page
});
//////////////////////////////////////////////////////

/////////////////////////////github authentication
app.route('/auth/github').get(passport.authenticate('github'))

app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {
  req.session.user_id = req.user.id
  res.redirect('/chat');
  })




///////////////////////////////////////////////

//middleware function
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    
    return next();// if true move to the next function
  }
  console.log("not auntincated")
  res.redirect('/');
};

app.get('/profile', ensureAuthenticated, (req, res) => {
  // Check if user is authenticated
  if (req.isAuthenticated()) {
    res.render('profile', {
      title: 'User Profile',
      user: req.user,
      username: req.user.username// Pass the authenticated user to the view
    });
  } else {
    res.redirect('/'); // Redirect to home if not authenticated
  }
});

///////////////////////////////////////

//logout//////////////////////////////////////
app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
});
///////////////////////////////

app.route('/register')
  .post((req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.insertOne({
          username: req.body.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );
////chat
app.route('/chat').get(ensureAuthenticated, (req, res) => {
  res.render('chat', { user: req.user })
})


}