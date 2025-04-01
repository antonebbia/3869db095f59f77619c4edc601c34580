const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

const users = {};

app.get("/", (req, res) => {
    res.send("El bot está funcionando.");
});

app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post("/webhook", (req, res) => {
    let body = req.body;

    if (body.object === "page") {
        body.entry.forEach(entry => {
            let webhookEvent = entry.messaging[0];
            let senderId = webhookEvent.sender.id;

            if (webhookEvent.message && webhookEvent.message.text) {
                let messageText = webhookEvent.message.text.toLowerCase();
                
                if (messageText.includes("ruleta") || messageText.includes("girar")) {
                    startRuleta(senderId);
                }
            }
        });

        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

function startRuleta(senderId) {
    if (users[senderId] && (Date.now() - users[senderId]) < 24 * 60 * 60 * 1000) {
        sendMessage(senderId, "¡Oops! Ya has jugado una vez. ¡Espera 24 horas para volver a girar!");
        return;
    }

    users[senderId] = Date.now();

    let message = {
        text: "¡Genial🎉 Has activado la RULETA DE LA FORTUNA! ¡Dale un giro para ver qué premio te toca! Recuerda que solo puedes jugar una vez ¡Buena suerte!",
        quick_replies: [
            {
                content_type: "text",
                title: "GIRAR",
                payload: "GIRAR_RULETA"
            }
        ]
    };
    sendMessage(senderId, message);
}

function handleSpin(senderId) {
    sendGif(senderId);
    setTimeout(() => {
        let prize = spinWheel();
        sendMessage(senderId, `¡FELICIDADES!🎉 Has ganado ${prize} fichas gratis. ¡A jugar! \n\nPara reclamar tus fichas, entra a nuestro WhatsApp y carga un mínimo de $1000 o más. ¡Nos vemos allí!\n\nhttps://wa.me/3873362953`);
    }, 3000);
}

function sendGif(senderId) {
    const gifResponse = {
        attachment: {
            type: "image",
            payload: {
                url: "https://tenor.com/bE5Dm.gif",
                is_reusable: true
            }
        }
    };
    sendMessage(senderId, gifResponse);
}

function spinWheel() {
    let random = Math.random();
    if (random < 0.60) return "150";
    if (random < 0.85) return "250";
    if (random < 0.95) return "350";
    return "400";
}

function sendMessage(senderId, message) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    axios.post(`https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: senderId },
        message: message
    }).catch(error => {
        console.error("Error enviando mensaje:", error.response ? error.response.data : error);
    });
}

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
});


