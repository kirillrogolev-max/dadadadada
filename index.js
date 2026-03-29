const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

let users = {};

function getBalance(id) {
    if (!users[id]) users[id] = { balance: 100 };
    return users[id].balance;
}

bot.on('message', (msg) => {
    const id = msg.from.id;

    if (msg.text === '/start') {
        bot.sendMessage(id, `Твой баланс: ${getBalance(id)}`);
    }

    if (msg.text === 'плюс') {
        users[id].balance += 10;
        bot.sendMessage(id, `Баланс: ${users[id].balance}`);
    }
});

console.log("Бот запущен");
