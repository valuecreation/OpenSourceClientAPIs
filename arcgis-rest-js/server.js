require("cross-fetch/polyfill");
require("isomorphic-form-data");

const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const app = express();

const { geocode, bulkGeocode } = require("@esri/arcgis-rest-geocoding");
const { UserSession } = require("@esri/arcgis-rest-auth");
const { ApiKey } = require('@esri/arcgis-rest-auth');
const { CLIENT_ID, SESSION_SECRET, ENCRYPTION_KEY, REDIRECT_URI } = require("./config.json");

const credentials = {
  clientId: CLIENT_ID,
  redirectUri: REDIRECT_URI
};

// API キー
const apiKey = new ApiKey({key: ""});

// セッションを保存する
app.use(
  session({
    name: "ArcGIS REST JS server authentication tutorial",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 2592000000 // 30 days in milliseconds
    },
    // サーバー上のセッションをファイルとして保存するためのFileStoreを作成し、config.jsonファイルで設定したENCRYPTION_KEYでシークレットを設定
    store: new FileStore({
      ttl: 2592000000 / 1000, // 30 days in seconds
      retries: 1,
      secret: ENCRYPTION_KEY,
      // 暗号化されてディスクに保存される前にセッションオブジェクトをシリアライズするために、sessionObj にエンコーダオプションを設定
      encoder: (sessionObj) => {
        // sessionObj is an object or string representing the session information
        if (typeof sessionObj.userSession !== "string") {
          sessionObj.userSession = sessionObj.userSession.serialize();
        }
        return JSON.stringify(sessionObj);
      },
      // デコーダーは、ユーザーが指定した暗号化キーを使ってsessionContentをデコード
      decoder: (sessionContents) => {
        // sessionContents is the full content of the session on
        if (!sessionContents) {
          return { userSession: null };
        }

        const sessionObj = typeof sessionContents === "string" ? JSON.parse(sessionContents) : sessionContents;
        
        if (typeof sessionObj.userSession === "string") {
          sessionObj.userSession = UserSession.deserialize(sessionObj.userSession);
        }

        return sessionObj;
      }
    })
  })
);

app.get("/sign-in", (req, res) => {
  UserSession.authorize(credentials, res);
});

app.get("/sign-out", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/authenticate", async (req, res) => {
  req.session.userSession = await UserSession.exchangeAuthorizationCode(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI
    },
    req.query.code //The code from the redirect: exchange code for a token in instaniated user session.
  );

  req.session.save((err) => {
    res.redirect("/");
  });

});

app.get("/", (req, res) => {
  //Redirect to homepage.
  if (req.session.userSession) {
    res.send(`
    <h1>Hi ${req.session.userSession.username}<h1>
    <pre><code>${JSON.stringify(req.session.userSession, null, 2)}</code></pre>
    <a href="/addressSearch">住所検索のテスト（東京都千代田区丸の内１丁目で住所検索）<a>
    <br/>
    <a href="/sign-out">Sign Out<a>
  `);
  } else {
    res.send(`<a href="/sign-in">Sign In<a>`);
  }
});

app.get("/addressSearch", (req, res) => {

  if (req.session.userSession) {

    /****** ジオコーディング  
     * https://esri.github.io/arcgis-rest-js/api/geocoding/geocode/
     * Geocode (non-stored) 20,000 Geocodes free then $0.5 per 1,000 Geocodes
    */
    geocode({
      address: "東京都千代田区丸の内１丁目",
      //authentication: req.session.userSession // OAuth 2.0 の場合
      authentication: apiKey // API キーの場合
    })
      .then((response) => {
        console.log("---------------result-------------")
        console.log(JSON.stringify(response));
        res.send(`${JSON.stringify(response)}`);
        //response.candidates[1].location; // => { x: -77.036533, y: 38.898719, spatialReference: ... }
      });

    /****** バッチジオコーディング  
     * https://esri.github.io/arcgis-rest-js/api/geocoding/bulkGeocode/
     * Geocode (stored) $4 per 1,000 Geocodes 
    */
    /*
    const addresses = [
      { "OBJECTID": 1, "address": "東京都千代田区丸の内１丁目" },
      { "OBJECTID": 2, "address": "東京都世田谷区北沢2-36-14" }
    ];

    bulkGeocode({
      addresses, 
      // authentication: req.session.userSession  // OAuth 2.0 の場合
      authentication: apiKey // API キーの場合
    })
      .then((response) => {
        console.log("---------------result-------------")
        console.log(JSON.stringify(response));
        res.send(`${JSON.stringify(response)}`);
        //response.locations[0].location; // => { x: -117, y: 34, spatialReference: { wkid: 4326 } }
      });
    */
  }

});

app.listen(3000, () => {
  console.log(`Visit http://localhost:3000/ to get started!`);
});
