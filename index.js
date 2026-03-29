const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

let users = {};
let state = {};

function getBalance(id) {
  if (!users[id]) users[id] = { balance: 100 };
  return users[id].balance;
}

function setBalance(id, amount) {
  users[id].balance = amount;
}

function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        ["🎰 Слоты", "🎲 Кости"],
        ["🃏 Риск", "🎯 Рулетка"],
        ["💶 Баланс", "💳 Пополнить"],
        ["💸 Вывод"]
      ],
      resize_keyboard: true
    }
  };
}

function betMenu() {
  return {
    reply_markup: {
      keyboard: [
        ["1€","5€","10€"],
        ["20€","50€","100€"],
        ["🔙 Назад"]
      ],
      resize_keyboard: true
    }
  };
}

function playAgain(game) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔄 Играть ещё", callback_data: game }]
      ]
    }
  };
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🎰 CASINO 777 PRO\nВыбери игру 👇", mainMenu());
});

bot.on("message", async (msg) => {
  const id = msg.from.id;
  const text = msg.text;

  if (text === "🎰 Слоты") {
    state[id] = "slot";
    return bot.sendMessage(msg.chat.id, "💰 Выбери ставку", betMenu());
  }

  if (text === "🎲 Кости") {
    state[id] = "dice";
    return bot.sendMessage(msg.chat.id, "💰 Выбери ставку", betMenu());
  }

  if (text === "🃏 Риск") {
    state[id] = "risk";
    return bot.sendMessage(msg.chat.id, "💰 Выбери ставку", betMenu());
  }

  if (text === "🎯 Рулетка") {
    state[id] = "roulette";
    return bot.sendMessage(msg.chat.id, "💰 Выбери ставку", betMenu());
  }

  if (text === "💶 Баланс") {
    return bot.sendMessage(msg.chat.id, `💶 Баланс: ${getBalance(id)}€`);
  }

  if (text === "💳 Пополнить") {
    setBalance(id, getBalance(id) + 50);
    return bot.sendMessage(msg.chat.id, "💳 Баланс пополнен +50€");
  }

  if (text === "💸 Вывод") {
    return bot.sendMessage(msg.chat.id, "💸 Минимум 10€ для вывода");
  }

  if (text === "🔙 Назад") {
    return bot.sendMessage(msg.chat.id, "Меню", mainMenu());
  }

  if (text.includes("€")) {
    let bet = parseInt(text);
    let balance = getBalance(id);

    if (balance < bet) return bot.sendMessage(msg.chat.id, "❌ Недостаточно денег");

    balance -= bet;

    // 🎰 СЛОТЫ
    if (state[id] === "slot") {
      let symbols = ["🍒","🍋","💎","7️⃣"];
      let roll = [
        symbols[Math.floor(Math.random()*4)],
        symbols[Math.floor(Math.random()*4)],
        symbols[Math.floor(Math.random()*4)]
      ];

      let win = roll[0] === roll[1] && roll[1] === roll[2];

      if (win) {
        balance += bet * 5;
        bot.sendMessage(msg.chat.id, `🎰 ${roll.join(" | ")}\n💥 ДЖЕКПОТ!`, playAgain("🎰 Слоты"));
      } else {
        bot.sendMessage(msg.chat.id, `🎰 ${roll.join(" | ")}\n😢 Проигрыш`, playAgain("🎰 Слоты"));
      }
    }

    // 🎲 КОСТИ
    if (state[id] === "dice") {
      let dice = await bot.sendDice(msg.chat.id);
      setTimeout(() => {
        if (dice.dice.value >= 4) {
          balance += bet * 2;
          bot.sendMessage(msg.chat.id, "🎉 Победа!", playAgain("🎲 Кости"));
        } else {
          bot.sendMessage(msg.chat.id, "💀 Проигрыш", playAgain("🎲 Кости"));
        }
      }, 3000);
    }

    // 🃏 РИСК
    if (state[id] === "risk") {
      let colors = ["🔴","🟢"];
      let spin = await bot.sendMessage(msg.chat.id, "🃏 Крутим...");

      for (let i=0;i<10;i++) {
        let c = colors[Math.floor(Math.random()*2)];
        await new Promise(r=>setTimeout(r,200));
        bot.editMessageText(`🃏 ${c}`, {chat_id: msg.chat.id, message_id: spin.message_id});
      }

      let result = colors[Math.floor(Math.random()*2)];

      if (result === "🟢") {
        balance += bet * 2;
        bot.editMessageText("🟢 Победа x2!", {
          chat_id: msg.chat.id,
          message_id: spin.message_id,
          reply_markup: playAgain("🃏 Риск")
        });
      } else {
        bot.editMessageText("🔴 Проигрыш", {
          chat_id: msg.chat.id,
          message_id: spin.message_id,
          reply_markup: playAgain("🃏 Риск")
        });
      }
    }

    // 🎯 РУЛЕТКА
    if (state[id] === "roulette") {
      let spin = await bot.sendMessage(msg.chat.id, "🎯 Крутим...");

      for (let i=0;i<15;i++) {
        let row = Array.from({length:6}, ()=>Math.floor(Math.random()*36));
        await new Promise(r=>setTimeout(r,120));
        bot.editMessageText(`🎯 ${row.join(" ")}`, {chat_id: msg.chat.id, message_id: spin.message_id});
      }

      let num = Math.floor(Math.random()*36);

      if (num === 0) {
        balance += bet * 10;
        bot.editMessageText(`🟢 0\n💥 ДЖЕКПОТ x10`, {
          chat_id: msg.chat.id,
          message_id: spin.message_id,
          reply_markup: playAgain("🎯 Рулетка")
        });
      } else if (num % 2 === 0) {
        balance += bet * 2;
        bot.editMessageText(`🔴 ${num}\nПобеда x2`, {
          chat_id: msg.chat.id,
          message_id: spin.message_id,
          reply_markup: playAgain("🎯 Рулетка")
        });
      } else {
        bot.editMessageText(`⚫ ${num}\nПроигрыш`, {
          chat_id: msg.chat.id,
          message_id: spin.message_id,
          reply_markup: playAgain("🎯 Рулетка")
        });
      }
    }

    setBalance(id, balance);
    state[id] = null;
  }
});

bot.on("callback_query", (q) => {
  const id = q.from.id;
  state[id] = q.data.includes("Слоты") ? "slot" :
              q.data.includes("Кости") ? "dice" :
              q.data.includes("Риск") ? "risk" :
              "roulette";

  bot.sendMessage(id, "💰 Выбери ставку", betMenu());
  bot.answerCallbackQuery(q.id);
});{
  "name": "casino-bot",
  "version": "1.0.0",
  "description": "Telegram casino bot",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "telegraf": "^4.12.2"
  }
}Commit changes
