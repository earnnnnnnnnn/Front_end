//Description: Node.js HTML client
//request: npm install express ejs axios body-parser

const express = require('express');
const axios = require('axios');
const app = express();
var bodyParser = require('body-parser');
const path = require("path");
const { check } = require('prettier');


//Base URL for the API
//const base_url = "https://api.example.com";
const base_url = "http://localhost:3000";
app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");

//Set the template engine
app.set("views" , path.join(__dirname, "/public/views"));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

//Serve static files
app.use(express.static(__dirname + '/public'));

app.get("/", async (req, res) => {
    try{
        const cameraname = await axios.get(base_url + '/camera');
        res.render("head", { cameraname: cameraname.data });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});

app.get("/detail", async (req, res) => {
    try{
        const camera = await axios.get(base_url + '/camera');
        const cameraId = req.query;
        console.log (cameraId)
        res.render("detail", {});
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});
app.get("/cart", async (req, res) => {
    try{
        const camera = await axios.get(base_url + '/camera');
        const cameraId = req.query;
        console.log (cameraId)
        res.render("cart", {});
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});


<<<<<<< HEAD
=======
// หน้า Login
>>>>>>> f5b2d67588268385a45e263ca75fda3218fd2f07
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

        // ถ้ารหัสผ่านถูกต้อง จะเก็บข้อมูลผู้ใช้ใน session
        req.session.user = user;
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




app.get("/detail", async (req, res) => {
    try{
        const camera = await axios.get(base_url + '/camera');
        const cameraId = req.query;
        console.log (cameraId)
        res.render("detail", {});
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});
app.get("/cart", async (req, res) => {
    try{
        const camera = await axios.get(base_url + '/camera');
        const cameraId = req.query;
        console.log (cameraId)
        res.render("cart", {});
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});




app.get("/users/:id", async (req, res) => {
    try{
        const response = await axios.get(base_url + '/users/' + req.params.id);
        res.render("cart", { book: response.data });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
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
app.get('/detail', (req, res) => {
    res.render('detail');
});




















// app.post("/create", async (req, res) => {
//     try{
//         const data = {username: req.body.username, password:req.body.password, email: req.body.email, phone: req.body.phone};
        
//         await axios.post(base_url + '/users', data);

//         res.redirect("/");
//     }catch(err){
//         console.error(err);
//         res.status(500).send('Error');
//     }
// });




// app.post("/login", async (req, res) => {
//     try{
//         const data = { email: req.body.email,password:req.body.password};
        
//         await axios.post(base_url + '/users', data);

//         res.redirect("/");
//     }catch(err){
//         console.error(err);
//         res.status(500).send('Error');
//     }
// });


// // const Users = require('../models/User'); // ตรวจสอบว่า path ถูกต้อง
// app.post("/users", async (req, res) => {
//     try {
//         const { username, password, email, phone } = req.body;

//         // ตรวจสอบข้อมูลที่ได้รับ
//         if (!username || !password || !email || !phone) {
//             return res.status(400).send('กรุณากรอกข้อมูลให้ครบถ้วน');
//         }

//         // แฮชรหัสผ่านก่อนที่จะบันทึก
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // สร้างผู้ใช้ใหม่
//         const newUser   = await Users.create({
//             username,
//             password: hashedPassword,
//             email,
//             phone_number: phone
//         });

//         // เปลี่ยนไปที่หน้าเข้าสู่ระบบหลังจากลงทะเบียนสำเร็จ
//         res.redirect("/login");
//     } catch (err) {
//         console.error("เกิดข้อผิดพลาดระหว่างการลงทะเบียน:", err);
//         res.status(500).send('เกิดข้อผิดพลาดระหว่างการลงทะเบียน');
//     }
// });


// app.get("/register", (req, res) => {
//     res.render("register");  
// });
app.get("/cart", (req, res) => {
    res.render("cart");  
});
app.get("/head", (req, res) => {
    res.render("head");  
});
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
