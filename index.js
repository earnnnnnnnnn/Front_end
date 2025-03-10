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

// อันที่ได้
// app.get("/cart", async (req, res) => {
//     try {
//         // ตรวจสอบว่า session มีข้อมูลของ USER หรือไม่
//         const UID = req.session.USER;
//         if (!UID || !UID.userId) {
//             return res.status(400).send('User is not logged in or no userId found in session');
//         }

//         // ดึงข้อมูลจาก API /rental
//         const cartResponse = await axios.get(base_url + '/rental');
//         // console.log(cartResponse.data);  // ตรวจสอบข้อมูลที่ได้จาก API     
//         // ตรวจสอบว่าใน cart มีข้อมูลหรือไม่
//         const cartItems = cartResponse.data.filter(user => user.users_id == UID.userId);  // ค้นหาผู้ใช้ที่ตรงกับ userId
//         console.log(cartItems);  // ตรวจสอบข้อมูลที่ได้จาก API
//         // ถ้าไม่พบ cart items สำหรับผู้ใช้
//         if (!cartItems) {
//             return res.status(404).send('No cart items found for this user');
//         }
//         // ดึงข้อมูลกล้องจาก API /camera
//         const cameraResponse = await axios.get(base_url + '/camera');      
//         // ตรวจสอบว่า camera มีข้อมูลหรือไม่
//         if (!cameraResponse.data || cameraResponse.data.length === 0) {
//             return res.status(404).send('No camera data found');
//         }
//         // console.log(cartItems);  // ตรวจสอบข้อมูลใน cartItems
//         // console.log(cameraResponse.data);  // ตรวจสอบข้อมูลใน camera
//         // ส่งข้อมูลที่ดึงมาจาก API ไปแสดงใน view
//         res.render("cart", { 
//             cartItems: cartItems,  // ข้อมูลตะกร้าของผู้ใช้
//             cameras: cameraResponse.data  // ข้อมูลกล้องทั้งหมด
//         });
//     } catch (err) {
//         console.error('Error fetching cart data:', err);
//         // ส่งข้อความ error ไปยัง Frontend
//         res.render("cart", { cartItems: [], error: 'Error fetching cart data' });
//     }
// });











//ของฟ้าที่ทำไว้
// app.get("/cart", (req, res) => {
//     try {
//         const cart = req.session.cart || [];  // Assuming the cart is stored in the session
//         const loginSession = req.session.USER;  // ตรวจสอบว่า session.USER มีค่าหรือไม่ (หมายถึงผู้ใช้ล็อกอิน)

//         // ถ้าผู้ใช้ไม่ได้ล็อกอิน, รีไดเร็กต์ไปยังหน้า login
//         if (!loginSession) {
//             return res.redirect('/login');  // ถ้ายังไม่ได้ล็อกอิน ให้ไปที่หน้า login
//         }

//         // คำนวณราคาทั้งหมดจากตะกร้า
//         const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.rental_price_per_day), 0);

//         // ส่งข้อมูลไปที่หน้า cart.ejs
//         res.render("cart", { cart, totalPrice, loginSession });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Error');
//     }
// });




// app.post('/cart', (req, res) => {
//     const { camera_id, cameraname, rental_price_per_day, cameraimg } = req.body;

//     if (!req.session.cart) {
//         req.session.cart = [];  
//     }

//     const existingItem = req.session.cart.find(item => item.camera_id === camera_id);
//     if (!existingItem) {
       
//         req.session.cart.push({ camera_id, cameraname, rental_price_per_day, cameraimg });
//     }

   
//     res.redirect('/cart');
// });

// app.post("/removeFromCart", (req, res) => {
//     try {
//         const { camera_id } = req.body;

//         // ลบสินค้าออกจากตะกร้าใน session โดยใช้ camera_id
//         req.session.cart = req.session.cart.filter(item => item.camera_id !== camera_id);

//         // รีไดเร็กต์กลับไปที่หน้า cart
//         res.redirect("/cart");
//     } catch (err) {
//         console.error("Error removing item from cart:", err);
//         res.status(500).send("Error removing item from cart");
//     }
// });
// app.post("/updateCart", (req, res) => {
//     try {
//         const { camera_id, quantity } = req.body;

//         const user = req.session.USER;
//         if (!user) {
//             return res.status(401).json({ error: 'User not logged in' });
//         }
//         // ค้นหาสินค้าในตะกร้าที่มี camera_id ตรงกัน
//         const cartItem = req.session.cart.find(item => item.camera_id === camera_id);

//         if (cartItem) {
//             // อัปเดตจำนวนสินค้าในตะกร้า
//             cartItem.rental_days = parseInt(quantity);  // อัปเดตจำนวน
//             cartItem.total_price = cartItem.rental_price_per_day * cartItem.rental_days;  // คำนวณราคาทั้งหมด
//         }

//         // คำนวณราคาใหม่ทั้งหมด
//         const totalPrice = req.session.cart.reduce((sum, item) => sum + (item.total_price || 0), 0);

//         // ส่งข้อมูลกลับไปที่ frontend
//         res.json({ success: true, totalPrice });
//     } catch (err) {
//         console.error("Error updating cart:", err);
//         res.status(500).send("Error updating cart");
//     }
// });



















// อันที่ได้
// app.get("/cart", async (req, res) => {
//     try {
//         // ตรวจสอบว่า session มีข้อมูลของ USER หรือไม่
//         const UID = req.session.USER;
//         if (!UID || !UID.userId) {
//             return res.status(400).send('User is not logged in or no userId found in session');
//         }

//         // ดึงข้อมูลจาก API /rental
//         const cartResponse = await axios.get(base_url + '/rental');
//         // ตรวจสอบว่าใน cart มีข้อมูลหรือไม่
//         const cart = cartResponse.data.filter(user => user.users_id == UID.userId);  // ค้นหาผู้ใช้ที่ตรงกับ userId
        
//         // ถ้าไม่พบ cart items สำหรับผู้ใช้
//         if (!cart || cart.length === 0) {
//             return res.status(404).send('No cart items found for this user');
//         }

//         // คำนวณ totalPrice
//         const totalPrice = cart.reduce((sum, item) => sum + (item.rental_price_per_day * item.rental_days), 0);  // คำนวณราคาทั้งหมด
        
//         // ดึงข้อมูลกล้องจาก API /camera
//         const cameraResponse = await axios.get(base_url + '/camera');
        
//         // ตรวจสอบว่า camera มีข้อมูลหรือไม่
//         if (!cameraResponse.data || cameraResponse.data.length === 0) {
//             return res.status(404).send('No camera data found');
//         }

//         // ส่งข้อมูลที่ดึงมาจาก API ไปแสดงใน view
//         res.render("cart", { 
//             cart: cart,  // ข้อมูลตะกร้าของผู้ใช้
//             cameras: cameraResponse.data,  // ข้อมูลกล้องทั้งหมด
//             totalPrice: totalPrice  // ส่ง totalPrice ไปยัง ejs
//         });
//     } catch (err) {
//         console.error('Error fetching cart data:', err);
//         // ส่งข้อความ error ไปยัง Frontend
//         res.render("cart", { cart: [], error: 'Error fetching cart data' });
//     }
// });



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



app.get("/users/:id", async (req, res) => {
    try{
        const response = await axios.get(base_url + '/users/' + req.params.id);
        res.render("paymentfrom", { book: response.data });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});


app.post('/paymentfrom', (req, res) => {
    res.render('paymentfrom', { message: 'Proceed to payment' });
});

// app.get('/payment', (req, res) => {
//     // ตรวจสอบว่า req.session.USER มีข้อมูลหรือไม่
//     console.log('User in session:', req.session.USER);  // ลองพิมพ์ค่าของ USER ในคอนโซล
//     const user = req.session.USER;

//     if (user) {
//         // ส่งข้อมูล User ไปยัง paymentfrom.ejs
//         res.render('paymentfrom', { User: user });
//     } else {
//         // ถ้าไม่มีข้อมูลใน session รีไดเร็กต์ไปที่หน้า login
//         res.redirect('/login');
//     }
// });




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