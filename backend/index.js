const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
var serviceAccount = require("./r-and-d-induction-firebase-adminsdk-pf2gf-d8e0622e57.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());

app.use(async (req, res, next) => {
    const { authtoken } = req.headers;
  
    if (authtoken) {
      try {
        req.user = await admin.auth().verifyIdToken(authtoken);
      } catch (e) {
        return res.sendStatus(400);
      }
    } else {
      return res.sendStatus(401);
    }
  
    req.user = req.user || {};
    next();
  });

app.get("/users", async (req, res) => {
    try {
      const users = [];
      const listUsersResult = await admin.auth().listUsers();
      listUsersResult.users.forEach((userRecord) => {
        users.push({
          uid: userRecord.uid,
          email: userRecord.email,
        });
      });
      
      res.json(users);     
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send(error);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});