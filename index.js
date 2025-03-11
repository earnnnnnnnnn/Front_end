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





app.post('/cart', async (req, res) => {
    const { camera_id, cameraname, rental_price_per_day, cameraimg } = req.body;
    const UID = req.session.USER;  // ใช้ข้อมูลจาก session
    console.log(UID);
    
    const Users = await axios.get(base_url + '/users');
    const User = Users.data.find(user => user.users_id === UID.userId);  // ใช้ UID.userId
    console.log(User);
    
    if (!req.session.cart) {
        req.session.cart = [];  
    }

    // ตรวจสอบว่ามีกล้องนี้ในตะกร้าแล้วหรือไม่
    const existingItem = req.session.cart.find(item => item.camera_id === camera_id);
    if (!existingItem) {
        req.session.cart.push({ camera_id, cameraname, rental_price_per_day, cameraimg });

        // เพิ่มข้อมูลการเช่ากล้องลงในฐานข้อมูลผ่าน API ภายนอก
        try {
            const response = await axios.post(base_url + '/rental', {
                start_date: new Date(),
                end_date: new Date(),
                total_price: rental_price_per_day,
                status: 'available',
                users_id: UID.userId,  // ใช้ UID.userId แทน
                camera_id: camera_id
            });
            console.log('Item added to the database via external API:', response.data);
        } catch (error) {
            console.error("Error adding to external API:", error.response ? error.response.data : error.message);
            return res.status(500).send("Error adding item to the database");
        }
    }

    // รีไดเร็กต์ไปที่หน้า cart
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

app.post('/updateCart', async (req, res) => {
    const { camera_id, quantity } = req.body;
    const UID = req.session.USER;

    if (!UID || !UID.userId) {
        return res.status(400).json({ error: 'User not logged in' });
    }

    try {
        const response = await axios.patch(base_url + `/rental/${camera_id}`, { rental_days: quantity });
        res.json({ success: true });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ error: "Failed to update cart" });
    }
});



// Route to remove item from the cart
app.post('/removeFromCart', async (req, res) => {
    const { camera_id } = req.body;
    const UID = req.session.USER;

    console.log("Received camera_id:", camera_id);  // ตรวจสอบว่าได้รับ camera_id จาก client หรือไม่
    console.log("User session:", UID.userId);  // ตรวจสอบ session ของผู้ใช้

    // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
    if (!UID || !UID.userId) {
        return res.status(400).json({ error: 'User not logged in' });
    }

    try {
        // ดึงข้อมูลจาก API ที่จัดการกับตะกร้า
        const cartResponse = await axios.get(base_url + '/rental');
        const cart = cartResponse.data;

        console.log("Cart data:", cart);  // แสดงข้อมูลที่ได้รับจาก API

        // ตรวจสอบว่ามีสินค้าในตะกร้าที่ตรงกับ camera_id ที่ต้องการลบหรือไม่
        const itemToDelete = cart.filter(item => item.camera_id == camera_id);


        if (!itemToDelete) {
            console.log('Item not found in cart');
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        console.log("\n\nItem to delete:", itemToDelete);  // แสดงข้อมูลที่พบจากการค้นหา

        // ลบข้อมูลจากฐานข้อมูล
        const deletedRental = await axios.delete(base_url + '/rental/' + camera_id + "/" + UID.userId);

        if (deletedRental.deletedCount === 0) {
            return res.status(404).json({ error: 'Item not found in rental' });
        }

        // ส่งคำตอบกลับไปว่า การลบสำเร็จ
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing item from rental:', error);
        res.status(500).json({ error: 'Failed to remove item from rental' });
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


app.get("/order", (req, res) => {
    res.render("order");
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



app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
    });