const express = require("express")
const axios = require("axios")
const cors = require("cors")
const Redis = require("redis");

const DEFAULT_EXPIRATION = 3600;

const redisClient = Redis.createClient({
    port: 6379
});

redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch((err) => console.error('Redis connection error:', err));
redisClient.on('error', err => console.log('Redis Client Error', err));


const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/photos", async (req, res) => {
    const albumId = req.query.albumId;
    const cacheId =  `photos?albumId=${albumId}`;

    const photos = await getOrSetCache(cacheId, async () => {
        const { data } = await axios.get(
            "https://jsonplaceholder.typicode.com/photos",
            { params: { albumId } }
        );

        return data
    });

    res.json(photos);
});

app.get("/photos/:id", async (req, res) => {
    const albumId = req.params.id;
    const cacheId =  `photos?albumId=${albumId}`;

    const photos = await getOrSetCache(cacheId, async () => {
        const { data } = await axios.get(
            `https://jsonplaceholder.typicode.com/photos/${albumId}`
        );

        return data
    });

    res.json(photos);
})

async function getOrSetCache(key, cb) {
    return new Promise(async (resolve, reject) => {
        data = await redisClient.get(key);
        if(data) {
            return resolve(JSON.parse(data))
        }

        const freshData = await cb();
        redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));

        resolve(freshData);
    } )
}



app.listen(3000);
