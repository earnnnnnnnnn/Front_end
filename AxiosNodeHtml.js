const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer  = require('multer');

const base_url = "http://localhost:3000";

app.set("views", path.join(__dirname, "/public/views"));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(__dirname + '/public'));

// [PAGE] list guitar -> shops
app.get("/", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/users");
        res.render("users", { users: response.data});
        // res.render("users", { users: response.data, level: req.cookies.level, username: req.cookies.username });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error list users')
    }
}); 


