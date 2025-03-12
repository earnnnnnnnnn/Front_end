const express = require('express');
const axios = require('axios');
const app = express();
var bodyParser = require('body-parser');
const path = require("path");
const session = require("express-session");
const { log } = require('console');


app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


const base_url = "http://localhost:3000";
app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));


app.use(express.static(__dirname + '/public'));

app.get("/", async (req, res) => {
    try{
        const loginSession = req.session.USER;
        const cameraname = await axios.get(base_url + '/camera');

        const cartCount = req.session.cart ? req.session.cart.length : 0;
        

        
        res.render("head", { cameraname: cameraname.data, loginSession, cartCount });
    }catch(err){
        console.error(err);
        res.status(500).send('Error');
    }
});


app.get("/detail", async (req, res) => {
    try {
        const cameraId = req.query.camera_id;  
        if (!cameraId) {
            return res.status(400).send("Camera ID is required");
        }

        const cameraResponse = await axios.get(`${base_url}/camera/${cameraId}`);
        const camera = cameraResponse.data;

        res.render("detail", { camera });  
    } catch (err) {
        console.error("Error fetching camera details:", err);
        res.status(500).send("Error fetching camera details");
    }
});
app.get('/detail', (req, res) => {
    const cameraId = req.query.camera_id; 
    
    res.render('detail', { cameraId: cameraId });
  });




app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await axios.get(base_url + '/users');
        const users = response.data;

        const user = users.find(user => user.email === email);

        if (!user || password !== user.password) {
            return res.render("login", { errorMessage: "Invalid email or password. Please try again." });
        }
        
        req.session.USER = { userId: user.users_id };
        
        if (req.session.USER)
            res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});



app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Failed to log out");
        }
      
        res.redirect('/login');
    });
});



app.get("/register", (req, res) => {
    res.render("register");
});


app.post("/signup", async (req, res) => {
    const { username, email, password, phone } = req.body;

    try {
        const response = await axios.get(base_url + '/users');
        const users = response.data;

        if (users.some(user => user.email === email)) {
            return res.status(400).send("Email already exists.");
        }

        if (password.length !== 8 || isNaN(password)) {
            return res.status(400).send("Password must be 8 digits and numeric.");
        }

        await axios.post(base_url + '/users', {
            username,
            email,
            password,
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
        const Users = await axios.get(base_url + '/users');
        const User = Users.data.find(Users => Users.users_id == UID.userId);
        
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
        const response = await axios.get(base_url + '/users');
        const users = response.data;

        const userExist = users.find(user => user.email === email && user.id !== UID.userId);
        if (userExist) {
            return res.status(400).send("Email already exists.");
        }

        if (password.length !== 8 || isNaN(password)) {
            return res.status(400).send("Password must be 8 digits and numeric.");
        }

        await axios.put(base_url + `/users/${UID.userId}`, {
            username,
            email,
            password,
            phone_number: phone
        });

        res.redirect("/Edit_information"); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating data');
    }
});



app.get("/cart", async (req, res) => {
    try {
        const UID = req.session.USER;

        if (!UID || !UID.userId) {
            res.redirect('/login')
        }

        const cartResponse = await axios.get(base_url + '/Cart');
        const cart = cartResponse.data.filter(item => item.users_id === UID.userId);

        if (!cart.length) {
            return res.render("cart", { cart: [], totalPrice: 0, error: 'No items in cart' });
        }

        

        const cameraResponse = await axios.get(base_url + '/camera');
        const cameraData = cameraResponse.data;

        if (!cameraData.length) {
            return res.render("cart", { cart: [], totalPrice: 0, error: 'No camera data available' });
        }

        const enrichedCart = cart.map(item => {
            const camera = cameraData.find(c => c.camera_id === item.camera_id);
            return {
                ...item,
                cameraname: camera ? camera.cameraname : "Unknown Camera",
                cameraimg: camera ? camera.cameraimg : "default.jpg",
                rental_price_per_day: camera ? camera.rental_price_per_day : 0,
            };
        });
        console.log(enrichedCart);

        res.render("cart", {
            cart: enrichedCart,
            
        });
    } catch (err) {
        console.error('Error fetching cart data:', err);
        res.render("cart", { cart: [], totalPrice: 0, error: 'Error fetching cart data' });
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
           
            await axios.post(base_url + '/Cart', {
                users_id: UID.userId,
                camera_id: camera_id,
            });
        } catch (error) {
            console.error("Error adding item to the database:", error.response ? error.response.data : error.message);
            return res.status(500).send("Error adding item to the database");
        }
    }

    
    res.redirect('/cart');
});



app.post("/removeFromCart", async (req, res) => {
    try {
        const { camera_id } = req.body;
        const userId = req.session.USER.userId

        await axios.delete(base_url + `/Cart/${camera_id}/${userId}`);

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

        const cartItem = req.session.cart.find(item => item.camera_id === camera_id);

        if (cartItem) {
            cartItem.rental_days = parseInt(quantity);  
            cartItem.total_price = cartItem.rental_price_per_day * cartItem.rental_days;  
        }

        const totalPrice = req.session.cart.reduce((sum, item) => sum + (item.total_price || 0), 0);

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

        const UserId = req.session.USER.userId;

        const cartResponse = await axios.get(base_url + '/Cart');
        const cameraRes = await axios.get(base_url + '/camera');

        const myCart = cartResponse.data.filter(item => item.users_id == UserId);

        let totalPrice = 0;
        for (const item of myCart) {
            const camera = cameraRes.data.find(camera => camera.camera_id == item.camera_id);
            totalPrice += camera.rental_price_per_day;
        }

        const today = new Date();
        today.setDate(today.getDate() + 3);
        const endDate = today.toISOString().split('T')[0]; // แปลงเป็น YYYY-MM-DD

        // สร้างการชำระเงิน
        const payment = await axios.post(base_url + '/payment', {
            users_id: UserId,
            totalPrice,
            endDate: endDate // ส่ง end_date ไปพร้อมกับข้อมูลการชำระเงิน
        });

        for (const item of myCart) {
            const payload = {
                payment_id: payment.data.payment_id,
                user_id: UserId,
                camera_id: item.camera_id,
            };

            await axios.post(base_url + '/Order', payload);
            await axios.delete(base_url + `/Cart/${item.camera_id}/${UserId}`)
        }        

        res.redirect('/receipt/' + payment.data.payment_id)
    } catch (error) {
        console.error("❌ Error placing order:", error);
        res.status(500).send("Internal Server Error");
    }
});




app.get('/receipt/:paymetId', async (req, res) => {
    try {
        const { paymetId } = req.params
        const userId = req.session.USER.userId



        const userRes = await axios.get(base_url + '/users')
        const paymentRes = await axios.get(base_url + '/payment')
        const orderRes = await axios.get(base_url + '/Order')
        const camera = await axios.get(base_url + '/camera')

        const user = userRes.data.find(user => user.users_id == userId)
        
        const payment = paymentRes.data.find(payment => payment.payment_id == paymetId)


        const order = orderRes.data.filter(orders => orders.payment_id == paymetId)
       
        
        res.render('receipt', { user, payment, order:order, camera: camera.data });

    } catch (error) {
        console.error("Error fetching receipt data:", error);
        res.status(500).send("Error fetching receipt data");
    }
})


app.get('/orderList', async (req, res) => {
    try {
        const userId = req.session.USER.userId

        const paymentRes = await axios.get(base_url + '/payment')
        const payment = paymentRes.data.filter(payment => payment.users_id == userId)

        res.render('order', { payment })
    } catch (error) {
        console.error("Error fetching Order:", error);
        res.status(500).send("Error fetching order");
    }
})



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



const PORT = 5000;

const { execSync } = require('child_process');

const clearPort = (port) => {
    try {
        const result = execSync(`netstat -ano | findstr :${port}`).toString();
        const lines = result.trim().split('\n');
        
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
        
            execSync(`taskkill /PID ${pid} /F`);
            console.log(`\x1b[32mSuccessfully killed process on port ${port} (PID: ${pid})\x1b[0m`);
        });
    } 
    catch (error) {
        console.error(`\x1b[31m[ERROR]\x1b[0m Failed to clear port ${port}`);
    }
};


clearPort(PORT);

app.listen(PORT, () => {
    console.log(`\x1b[45mWebpage running on http://localhost:${PORT}\x1b[0m`);
});