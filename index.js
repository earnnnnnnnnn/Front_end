//Description: Node.js HTML client
//request: npm install express ejs axios body-parser

const express = require('express');
const axios = require('axios');
const app = express();
var bodyParser = require('body-parser');
const path = require("path");
// const { check } = require('prettier');
const session = require("express-session");
const { log } = require('console');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


//Base URL for the API
//const base_url = "https://api.example.com";
const base_url = "http://localhost:3000";
app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

//Serve static files
app.use(express.static(__dirname + '/public'));

app.get("/", async (req, res) => {
    try{
        const loginSession = req.session.USER;

        console.log(loginSession);
        

        const cameraname = await axios.get(base_url + '/camera');
        res.render("head", { cameraname: cameraname.data, loginSession });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});

// เส้นทางเพื่อดึงข้อมูลกล้องตาม camera_id
app.get("/detail", async (req, res) => {
    try {
        const cameraId = req.query.camera_id;  // รับ camera_id จาก query
        console.log("Camera ID:", cameraId);  // เช็คว่าได้ค่า camera_id มาหรือไม่
        
        if (!cameraId) {
            return res.status(400).send("Camera ID is required");
        }

        // ดึงข้อมูลกล้องจากฐานข้อมูลหรือ API
        const cameraResponse = await axios.get(`${base_url}/camera/${cameraId}`);
        const camera = cameraResponse.data;

        res.render("detail", { camera });  // ส่งข้อมูลกล้องไปยังหน้า detail
    } catch (err) {
        console.error("Error fetching camera details:", err);
        res.status(500).send("Error fetching camera details");
    }
});
app.get('/detail', (req, res) => {
    const cameraId = req.query.camera_id; // ดึงค่า camera_id จาก query string
    
    res.render('detail', { cameraId: cameraId });
  });
  




// app.get("/cart", async (req, res) => {
//     try{
//         const camera = await axios.get(base_url + '/camera');
//         const cameraId = req.query;
//         console.log (cameraId)
//         res.render("cart", {});
//     }catch(err){
//         console.error(err);
//         res.status(500).send('Error');
//     }
// });



app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
        const response = await axios.get(base_url + '/users');
        const users = response.data;

        // ค้นหาผู้ใช้จาก email ที่กรอกมา
        const user = users.find(user => user.email === email);

        // ถ้าไม่มีผู้ใช้หรือรหัสผ่านไม่ตรง
        if (!user || password !== user.password) {
            return res.render("login", { errorMessage: "Invalid email or password. Please try again." });
        }
        
        req.session.USER = { userId: user.users_id };
        
        if (req.session.USER)
            res.redirect("/");  // ทำการ redirect ไปยังหน้าแรก
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});


// หน้า Register
app.get("/register", (req, res) => {
    res.render("register");
});

// ลงทะเบียน
app.post("/signup", async (req, res) => {
    const { username, email, password, phone } = req.body;

    // ตรวจสอบว่า email ซ้ำในฐานข้อมูลหรือไม่
    try {
        const response = await axios.get(base_url + '/users');
        const users = response.data;

        // ถ้า email ซ้ำ
        if (users.some(user => user.email === email)) {
            return res.status(400).send("Email already exists.");
        }

        // ตรวจสอบรหัสผ่านให้มีความยาว 8 ตัวและเป็นตัวเลข
        if (password.length !== 8 || isNaN(password)) {
            return res.status(400).send("Password must be 8 digits and numeric.");
        }

        // หากไม่ใช้ bcrypt ก็ไม่ต้องทำการเข้ารหัสรหัสผ่าน
        // แค่ส่งข้อมูลรหัสผ่านตรงๆ ไปยัง backend
        await axios.post(base_url + '/users', {
            username,
            email,
            password, // ส่งรหัสผ่านตรง ๆ โดยไม่เข้ารหัส
            phone_number: phone
        });

        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});




app.get("/Edit_information", async (req, res) => {
    try {
        const UID = req.session.USER;
        console.log(UID)
        const Users = await axios.get(base_url + '/users');
        const User = Users.data.find(Users => Users.users_id == UID.userId);
        console.log(User)
        res.render("Edit_information",{ User: User})

    } catch (err) {
        console.error('API error:', err);
        res.status(500).send('Error fetching data');
    }
});





// ลงทะเบียนหรืออัพเดตข้อมูลผู้ใช้
app.post("/updateuser", async (req, res) => {
    const { username, email, password, phone } = req.body;
    const UID = req.session.USER;

    try {
        // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
        const response = await axios.get(base_url + '/users');
        const users = response.data;

        // ตรวจสอบว่า email ซ้ำในฐานข้อมูลหรือไม่
        const userExist = users.find(user => user.email === email && user.id !== UID.userId);
        if (userExist) {
            return res.status(400).send("Email already exists.");
        }

        // ตรวจสอบรหัสผ่านให้มีความยาว 8 ตัวและเป็นตัวเลข
        if (password.length !== 8 || isNaN(password)) {
            return res.status(400).send("Password must be 8 digits and numeric.");
        }

        // ใช้ PUT แทน POST เพื่ออัพเดตข้อมูลผู้ใช้ที่มีอยู่แล้ว
        await axios.put(base_url + `/users/${UID.userId}`, {
            username,
            email,
            password, // ส่งรหัสผ่านตรงๆ (ถ้าไม่เข้ารหัสรหัสผ่านต้องมั่นใจ)
            phone_number: phone
        });

        res.redirect("/Edit_information"); // รีไดเรกต์ไปยังหน้าที่มีการแก้ไขข้อมูล
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating data');
    }
});


// app.get("/report", async (req, res) => {
//     try {
//         // ดึงข้อมูลจากตาราง user, rental, และ return
//         const users = await User.findAll(); // สมมติว่า User เป็นโมเดลที่เชื่อมกับตาราง user
//         const rentals = await Rental.findAll(); // สมมติว่า Rental เป็นโมเดลที่เชื่อมกับตาราง rental
//         const returns = await Return.findAll(); // สมมติว่า Return เป็นโมเดลที่เชื่อมกับตาราง return

//         // ส่งข้อมูลไปยังหน้า report.ejs
//         res.render("report", { users, rentals, returns });
//     } catch (err) {
//         console.error("Error fetching report data:", err);
//         res.status(500).send('Error fetching report data');
//     }
// });



// เส้นทาง GET สำหรับดูข้อมูลใน cart
app.get("/cart", async (req, res) => {
    try {
        // ดึงข้อมูลจาก Cart ในฐานข้อมูล
        const cartItems = await Cart.findAll(); // สมมติว่า `Cart` เป็นโมเดลที่ถูกต้อง
        // ส่งข้อมูลที่ดึงมาจากฐานข้อมูลไปแสดงใน view
        res.render("cart", { cartItems: cartItems, error: null }); // ส่ง `cartItems` และ `error: null` เมื่อไม่มีข้อผิดพลาด
        console.log(cartItems);  // เช็คว่ามีข้อมูลหรือไม่

    } catch (err) {
        console.error('Error fetching cart data:', err);
        // ส่งข้อความ error ไปยัง Frontend
        res.render("cart", { cartItems: [], error: 'Error fetching cart data' });
    }
});




app.get("/users/:id", async (req, res) => {
    try{
        const response = await axios.get(base_url + '/users/' + req.params.id);
        res.render("rentalProcess", { book: response.data });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});

app.get("/create", (req, res) => {
    res.render("create");
});

app.get("/paymentfrom", (req, res) => {
    res.render("paymentfrom");
});
app.get("/users/:id", async (req, res) => {
    try{
        const response = await axios.get(base_url + '/users/' + req.params.id);
        res.render("paymentfrom", { book: response.data });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});




// app.get("/cart", async (req, res) => {
//     const loginSession = req.session.USER;
    
//     const cameras = await axios.get(base_url + '/camera')
//     const rentals = await axios.get(base_url + '/rental')
//     const cartItems = rentals.data.filter(rental => rental.users_id == loginSession.userId)
    
//     res.render("cart", {cameras: cameras.data, cartItems: cartItems});  
// });




app.get("/rentalProcess", (req, res) => {
    res.render("rentalProcess");  
});

app.get("/head", async (req, res) => {
    try{
        const response = await axios.get(
        base_url + '/books/' + req.params.id);
        res.render("update", { book: response.data });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});

// app.get("/update/:id", async (req, res) => {
//     try{
//         const response = await axios.get(
//         base_url + '/books/' + req.params.id);
//         res.render("update", { book: response.data });
//     }catch(err){
//         console.error(err);
//         res.status(500).send('Error');
//     }
// });

// app.post("/update/:id", async (req, res) => {
//     try{
//         const data = {title: req.body.title, author: req.body.author };
//         await axios.put(base_url + '/books/' + req.params.id, data);
//         res.redirect("/");
//     }catch(err){
//         console.error(err);
//         res.status(500).send('Error');
//     }
// });

// app.get("/delete/:id", async (req, res) => {
//     try{
//         await axios.delete(base_url + '/books/' + req.params.id);
//             res.redirect("/");
//     }catch(err){
//         console.error(err);
//         res.status(500).send('Error');
//     }
// });

app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
    });