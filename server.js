const express = require('express');
const session = require('express-session');
const passport = require('passport');
const ShopifyStrategy = require('passport-shopify').Strategy;
const crypto = require('crypto');
const Shopify = require('shopify-api-node');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const cors = require('cors');
const axios = require('axios');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(
    cors({
      origin: 'http://localhost:3001',
      credentials: true, // Allow cookies and other credentials to be sent
    })
  );
// Function to update a product image
const updateProductImage = async (productId, imageId, imageSrc) => {
  try {
    // Retrieve the product
    const shopify = new Shopify({
      shopName: 'quick-start-c38d6d9a.myshopify.com',
      accessToken: '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',
    });
    const product = await shopify.product.get(productId);

    const newImage = await shopify.productImage.create(productId, {
      src: imageSrc,
    });

    product.images.unshift(newImage);

    const updatedProduct = await shopify.product.update(product.id, product);
      // Return the updated product
      return updatedProduct;
  } catch (error) {
    console.error('Failed to update product image:', error);
    throw error;
  }
};




app.get('/update-prodcut', (req, res) => {
      // Usage example
    const productId = 8281036652841;
    const imageId = 41328263135529;
    const newImageSrc = 'https://cdn.shopify.com/s/files/1/0670/5135/6456/files/2023-jones-dream-weaver-women-s-demo-snowboard-snwdrcd.jpg?v=1684772180';

    updateProductImage(productId, imageId, newImageSrc)
      .then((product) => {
        const htmlResponse = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
        }
        img {
          border: 1px solid #ccc;
          border-radius: 5px;
          margin-bottom: 10px;
        }
        p {
          color: #666;
          margin: 0;
        }
        .product-details {
          background-color: #fff;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div class="product-details">
        <h1>Product Details</h1>
        ${product.images
          .map(
            (image) =>
              `<img src="${image.src}" alt="${product.title}" width="200" height="200">`
          )
          .join('')}
        <p>Title: ${product.title}</p>
        <p>Price: $${product.variants[0].price}</p>
      </div>
    </body>
  </html>
`;

        res.send(htmlResponse);
      })
      .catch((error) => {
        console.error('Error updating product image:', error);
    });
});






// Set up session support
app.use(
  session({
    secret: 'sdsohsaudyoasiuydih',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Configure serialization and deserialization of user object
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});


app.get(
  '/auth/shopify',
  (req, res, next) => {
    const { shop } = req.query;

    if (shop && typeof shop === 'string'){
      req.session.shop = shop;
      next();
    } else {
      res.status(400).send('Missing shop parameter');
    }
    passport.use(
      new ShopifyStrategy(
        {
          clientID: '9689184c0efeb44437793c7e6cd39a15',
          clientSecret: 'd365ad347135df87630ce3be4e67d9bc',
          callbackURL: 'http://localhost:3000/auth/shopify/callback',
          shopifyShop: true,
          shop:req.session.shop
    
        },
        (accessToken, refreshToken, profile, done) => {
          const user = {
            shop: profile._json.shop_domain,
            accessToken: accessToken,
            profile,
            // Add other user details if needed
          };
          return done(null, user);
        }
      )
    );
  },
    
  (req, res, next) => {
    console.log('----shopify----')
    passport.authenticate('shopify', {
      scope: ['read_products','write_products','write_recurring_application_charges'],
    })(req, res, next);
  }
);

app.get(
  '/auth/shopify/callback',
  passport.authenticate('shopify', { failureRedirect: '/login' }),
  (req, res) => {
  console.log('---here---')
    res.redirect(`http://localhost:3001?data=${JSON.stringify(req.user)}`);

    // Successful authentication, redirect to the desired page
  }
);

app.get('/profile', (req, res) => {
  console.log(req.user.profile.profileURL)
  // Access the authenticated user through req.user
  res.redirect(`http://localhost:3001?username=${req.user.profile.username}&shop=${req.user.profile.profileURL}&token=${req.user.accessToken}`);
});

app.get('/product-details',async (req, res) => {
  const {id,shop } = req.query;

  // Verify the request authenticity
  // const isAuthentic = verifyRequest(req.query);
  // if (!isAuthentic) {
  //   res.status(401).send('Unauthorized');
  //   return;
  // }

 
  // Create a new Shopify instance
  const shopify = new Shopify({
    shopName: shop,
    accessToken: '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',
  });

  try {
    // Retrieve product details from Shopify
    const product = await shopify.product.get(id);
    // res.redirect('/product');
    // Render the product details page using the retrieved product information
    const htmlResponse = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
        }
        img {
          border: 1px solid #ccc;
          border-radius: 5px;
          margin-bottom: 10px;
        }
        p {
          color: #666;
          margin: 0;
        }
        .product-details {
          background-color: #fff;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div class="product-details">
        <h1>Product Details</h1>
        ${product.images
          .map(
            (image) =>
              `<img src="${image.src}" alt="${product.title}" width="200" height="200">`
          )
          .join('')}
        <p>Title: ${product.title}</p>
        <p>Price: $${product.variants[0].price}</p>
      </div>
    </body>
  </html>
`;

    res.send(htmlResponse);
  } catch (error) {
    console.error('Failed to fetch product details:', error);
    res.status(500).send('Error retrieving product details');
  }
});

app.post('/product',async (req, res) => {
 console.log(req.body)
  // Create a new Shopify instance
  const shopify = new Shopify({
    shopName: req.body.shop,
    accessToken: req.body.accessToken,
  });

  try {
    // Retrieve product details from Shopify
    const product = await shopify.product.get(req.body.id)

    res.json({product});
  } catch (error) {
    console.error('Failed to fetch product details:', error);
    res.status(500).send('Error retrieving product details');
  }
});

app.get('http://localhost:3000/product', (req, res) => {

  // Render the product details page using the retrieved product information
  res.send(`Product ID:`);
});



app.get('/billing', async (req, res) => {
  const shop = "quick-start-c38d6d9a.myshopify.com"
  const plan =1;
  const shopify = new Shopify({
    shopName: shop,
    accessToken: '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',
  });
  try {
    // Create a recurring application charge
    const recurringCharge = await shopify.recurringApplicationCharge.create({
      name: 'Your Billing Plan',
      price: 10.0,
      return_url: `http://localhost:3000/billing/activate`,
      test: true, // Set to false for a real charge
    });

    // Redirect the merchant to the billing confirmation page
    res.redirect(recurringCharge.confirmation_url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating recurring charge');
  }
});

// Endpoint to handle activation after successful billing
app.get('/billing/activate', async (req, res) => {
  const { charge_id } = req.query;
  const shop = "quick-start-c38d6d9a.myshopify.com"
  const plan =1;
  const shopify = new Shopify({
    shopName: shop,
    accessToken: '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',
  });
  try {
    // Activate the recurring application charge
    const activatedCharge = await shopify.recurringApplicationCharge.activate(charge_id);

    // Do any additional processing here (e.g., update user's subscription status)

    // Redirect the merchant to the desired page
    res.redirect('/thank-you');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error activating recurring charge');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
