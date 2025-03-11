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
        const cameraname = await axios.get(base_url + '/camera');

        console.log(loginSession);
        const cartCount = req.session.cart ? req.session.cart.length : 0;
        

        
        res.render("head", { cameraname: cameraname.data, loginSession, cartCount });
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
        // console.log(User)
        res.render("Edit_information",{ User: User})

    } catch (err) {
        console.error('API error:', err);
        res.status(500).send('Error fetching data');
    }
});




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




app.post('/cart', async (req, res) => {
    const { camera_id, cameraname, rental_price_per_day, cameraimg } = req.body;
    const UID = req.session.USER;

    if (!UID || !UID.userId) {
        return res.status(401).send('User not logged in');
    }

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingItem = req.session.cart.find(item => item.camera_id === camera_id);
    if (!existingItem) {
        req.session.cart.push({ camera_id, cameraname, rental_price_per_day, cameraimg });

        try {
            const startDate = new Date();
            startDate.setHours(12, 0, 0, 0);   // ใช้เวลาปัจจุบันจริง ๆ
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 3); // บวกไป 3 วัน
            
            const formattedStartDate = startDate.toISOString().replace('T', ' ').split('.')[0];
            const formattedEndDate = endDate.toISOString().replace('T', ' ').split('.')[0];

            await axios.post(base_url + '/rental', {
                start_date: formattedStartDate,
                end_date: formattedEndDate,
                total_price: rental_price_per_day * 3,
                status: 'available',
                users_id: UID.userId,
                camera_id: camera_id
            });

            console.log('Item added to database:', formattedStartDate, formattedEndDate);
        } catch (error) {
            console.error("Error adding item to the database:", error.response ? error.response.data : error.message);
            return res.status(500).send("Error adding item to the database");
        }
    }

    res.redirect('/cart');
});






app.get("/cart", async (req, res) => {
    try {
        const UID = req.session.USER;

        if (!UID || !UID.userId) {
            return res.status(400).send('User is not logged in or no userId found in session');
        }

        // ดึงข้อมูลจาก API /rental เฉพาะของผู้ใช้
        const cartResponse = await axios.get(base_url + '/rental');
        const cart = cartResponse.data.filter(item => item.users_id === UID.userId);

        // ถ้าไม่พบ cart items สำหรับผู้ใช้
        if (!cart.length) {
            return res.render("cart", { cart: [], totalPrice: 0, error: 'No items in cart' });
        }

        // คำนวณ totalPrice
        const totalPrice = cart.reduce((sum, item) => sum + (item.total_price), 0);

        // ดึงข้อมูลกล้องจาก API /camera
        const cameraResponse = await axios.get(base_url + '/camera');
        const cameraData = cameraResponse.data;

        if (!cameraData.length) {
            return res.render("cart", { cart: [], totalPrice: 0, error: 'No camera data available' });
        }

        // ผูกข้อมูลกล้องเข้ากับ cart
        const enrichedCart = cart.map(item => {
            const camera = cameraData.find(c => c.camera_id === item.camera_id);
            return {
                ...item,
                cameraname: camera ? camera.cameraname : "Unknown Camera",
                cameraimg: camera ? camera.cameraimg : "default.jpg"
            };
        });

        res.render("cart", {
            cart: enrichedCart,
            totalPrice: totalPrice
        });
    } catch (err) {
        console.error('Error fetching cart data:', err);
        res.render("cart", { cart: [], totalPrice: 0, error: 'Error fetching cart data' });
    }
});

app.post('/cart', (req, res) => {
    const { camera_id, cameraname, rental_price_per_day, cameraimg } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];  
    }

    const existingItem = req.session.cart.find(item => item.camera_id === camera_id);
    if (!existingItem) {
       
        req.session.cart.push({ camera_id, cameraname, rental_price_per_day, cameraimg });
    }

    
    res.redirect('/cart');
});

app.post("/removeFromCart", (req, res) => {
    try {
        const { camera_id } = req.body;

        // ลบสินค้าออกจากตะกร้าใน session โดยใช้ camera_id
        req.session.cart = req.session.cart.filter(item => item.camera_id !== camera_id);

        // รีไดเร็กต์กลับไปที่หน้า cart
        res.redirect("/cart");
    } catch (err) {
        console.error("Error removing item from cart:", err);
        res.status(500).send("Error removing item from cart");
    }
});
app.post("/updateCart", (req, res) => {
    try {
        const { camera_id, quantity } = req.body;

        const user = req.session.USER;
        if (!user) {
            return res.status(401).json({ error: 'User not logged in' });
        }
        // ค้นหาสินค้าในตะกร้าที่มี camera_id ตรงกัน
        const cartItem = req.session.cart.find(item => item.camera_id === camera_id);

        if (cartItem) {
            // อัปเดตจำนวนสินค้าในตะกร้า
            cartItem.rental_days = parseInt(quantity);  // อัปเดตจำนวน
            cartItem.total_price = cartItem.rental_price_per_day * cartItem.rental_days;  // คำนวณราคาทั้งหมด
        }

        // คำนวณราคาใหม่ทั้งหมด
        const totalPrice = req.session.cart.reduce((sum, item) => sum + (item.total_price || 0), 0);

        // ส่งข้อมูลกลับไปที่ frontend
        res.json({ success: true, totalPrice });
    } catch (err) {
        console.error("Error updating cart:", err);
        res.status(500).send("Error updating cart");
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


app.post("/order", async (req, res) => {
    try {
        // Fetch data for users, rentals, and returns
        const usersResponse = await axios.get(base_url + '/users');
        const rentalsResponse = await axios.get(base_url + '/rentals');
        const returnsResponse = await axios.get(base_url + '/returns');
        
        const users = usersResponse.data;
        const rentals = rentalsResponse.data;
        const returns = returnsResponse.data;

        // Pass the data to the 'order' view
        res.render("order", { users, rentals, returns });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching data for the order report');
    }
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

// Route สำหรับ Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Failed to log out");
        }
        // รีไดเร็กต์ผู้ใช้ไปที่หน้า login หลังจากออกจากระบบ
        res.redirect('/login');
    });
});




















// // เส้นทางสำหรับ Checkout
// app.post('/checkout', async (req, res) => {
//     const { end_date } = req.body;  // รับค่า end_date ที่ผู้ใช้เลือกจากฟอร์ม
    
//     const UID = req.session.USER;  // ตรวจสอบว่า session ผู้ใช้มีข้อมูลหรือไม่

//     if (!UID || !UID.userId) {
//         return res.status(400).send('User not logged in');
//     }

//     try {
//         // ส่งข้อมูลไปยัง API หรือฐานข้อมูลเพื่ออัปเดต end_date ในตาราง Rentals
//         const response = await axios.patch(base_url + `/rental/updateEndDate/${UID.userId}`, {
//             end_date: end_date  // ส่งค่า end_date ไปยัง API
//         });

//         // ถ้าการอัปเดตสำเร็จ
//         res.redirect('/order-success');  // หรือหน้า success ที่ต้องการ
//     } catch (error) {
//         console.error('Error updating end date in Rentals:', error);
//         res.status(500).send('Error updating end date');
//     }
// });


// app.put('/rental', async (req, res) => {
//     const { userId } = req.params;
//     const { end_date } = req.body;  // รับข้อมูล end_date จากฟอร์ม

//     try {
//         const conn = await db.getConnection();  // ใช้คำสั่งนี้สำหรับการเชื่อมต่อฐานข้อมูล
//         const query = "UPDATE Rentals SET end_date = ? WHERE users_id = ?";  // คำสั่ง SQL สำหรับอัปเดต
//         await conn.execute(query, [end_date, userId]);

//         res.json({ success: true });  // ส่งคำตอบว่าอัปเดตสำเร็จ
//     } catch (error) {
//         console.error('Error updating end date:', error);
//         res.status(500).json({ error: 'Failed to update end date' });
//     }
// });
















app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
    });